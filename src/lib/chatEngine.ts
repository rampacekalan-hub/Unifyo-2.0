"use client";
// src/lib/chatEngine.ts
// Shared send-to-AI engine used by DashboardClient + FloatingAIWidget.
// Writes to the singleton chatStore so both UIs stay in sync, and persists
// messages to /api/conversations so history survives navigation + reloads.

import { getSiteConfig } from "@/config/site-settings";
import {
  extractActionCards,
  maskActionCardBlocks,
  stripActionCardBlocks,
} from "@/lib/extraction-engine";
import { chatActions, extractUserFacts, msgId, type ChatMessage } from "@/lib/chatStore";

const { errorStates } = getSiteConfig().texts;

async function ensureConversation(currentId: string | null, firstUserText: string): Promise<string | null> {
  if (currentId) return currentId;
  try {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: firstUserText.slice(0, 60) }),
    });
    if (!res.ok) return null;
    const conv = await res.json();
    if (conv?.id) {
      chatActions.setConversationId(conv.id);
      return conv.id as string;
    }
  } catch { /* ignore */ }
  return null;
}

async function persistMessage(conversationId: string | null, role: ChatMessage["role"], content: string, tokens?: number) {
  if (!conversationId) return;
  try {
    await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: role === "ai" ? "assistant" : role,
        content,
        tokens: tokens ?? 0,
      }),
    });
  } catch { /* fire-and-forget */ }
}

export async function sendChat(
  text: string,
  opts: { module: "dashboard" | "calendar" | "email" | "crm" | "calls"; conversationId: string | null },
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const userMsg: ChatMessage = {
    id: msgId(),
    role: "user",
    content: trimmed,
    createdAt: Date.now(),
  };
  const thinkingMsg: ChatMessage = {
    id: msgId(),
    role: "thinking",
    content: "",
    createdAt: Date.now(),
  };

  chatActions.addMessage(userMsg);
  chatActions.addMessage(thinkingMsg);
  chatActions.setLoading(true);

  // Regex-scan the user's message for phone/email and update draft immediately.
  // This keeps the sprievodca robust even when the LLM fails to echo the fact.
  const facts = extractUserFacts(trimmed);
  if (facts.phone || facts.email) {
    chatActions.patchContact({
      Telefón: facts.phone ?? "",
      Email:   facts.email ?? "",
    });
  }

  // Ensure we have a conversation id (creates on first message).
  const convId = await ensureConversation(opts.conversationId, trimmed);
  void persistMessage(convId, "user", trimmed);

  // Make the stream cancellable — user-initiated Stop or navigation can abort.
  const abortController = new AbortController();
  chatActions.setAbortController(abortController);

  try {
    const res = await fetch("/api/ai/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed, module: opts.module }),
      signal: abortController.signal,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errMsg =
        res.status === 429 ? errorStates.rateLimited :
        res.status === 402 ? errorStates.noCredits :
        res.status === 401 ? errorStates.sessionExpired :
        res.status >= 500  ? errorStates.aiUnavailable :
        (data.error ?? errorStates.aiUnavailable);

      chatActions.patchMessage(thinkingMsg.id, { role: "error", content: errMsg });
      chatActions.setLoading(false);
      return;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let tokensUsed = 0;
    let isDone = false;
    // IMPORTANT: SSE events can split across TCP chunks. We MUST buffer until
    // we see a newline before parsing, otherwise partial `data: {...}` lines
    // get silently dropped and random characters disappear from the stream.
    let buffer = "";

    if (!reader) {
      chatActions.patchMessage(thinkingMsg.id, { role: "error", content: errorStates.aiUnavailable });
      chatActions.setLoading(false);
      return;
    }

    const processLine = (rawLine: string) => {
      const line = rawLine.trim();
      if (!line || !line.startsWith("data: ")) return;
      const data = line.slice(6).trim();
      if (data === "[DONE]") { isDone = true; return; }
      try {
        const parsed = JSON.parse(data);
        if (typeof parsed.delta === "string") {
          fullContent += parsed.delta;
          const displayText = maskActionCardBlocks(fullContent);
          chatActions.patchMessage(thinkingMsg.id, { role: "ai", content: displayText });
        }
        if (parsed.done) {
          isDone = true;
          if (parsed.tokens) tokensUsed = parsed.tokens;
        }
      } catch { /* skip malformed chunks */ }
    };

    while (!isDone) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Only process up to the LAST complete newline — keep remainder buffered.
      let nlIdx = buffer.indexOf("\n");
      while (nlIdx !== -1) {
        const line = buffer.slice(0, nlIdx);
        buffer = buffer.slice(nlIdx + 1);
        processLine(line);
        if (isDone) break;
        nlIdx = buffer.indexOf("\n");
      }
    }
    // Flush anything left in the buffer.
    if (buffer.trim()) processLine(buffer);

    // Extract cards from combined user + AI response (regex fallback tolerance).
    const extractionInput = `${trimmed}\n---\n${fullContent}`;
    const cards = extractActionCards(extractionInput);
    const cleanText = stripActionCardBlocks(fullContent).trim();

    const finalText =
      cleanText ||
      (cards.length > 0
        ? "Pripravil som návrh — polia dopĺňame v karte nižšie. Čo doplníš?"
        : "Rozumiem.");

    chatActions.patchMessage(thinkingMsg.id, {
      role: "ai",
      content: finalText,
      tokens: tokensUsed,
    });

    if (cards.length > 0) {
      chatActions.mergeDraft(cards);
    }

    void persistMessage(convId, "ai", finalText, tokensUsed);
  } catch (err: unknown) {
    // AbortError = user clicked Stop or switched conversations — show a neutral
    // note instead of a scary red error bubble.
    const isAbort = (err as { name?: string } | null)?.name === "AbortError";
    if (isAbort) {
      chatActions.patchMessage(thinkingMsg.id, { role: "ai", content: "⏹ Zastavené používateľom." });
    } else {
      chatActions.patchMessage(thinkingMsg.id, { role: "error", content: errorStates.networkError });
    }
  } finally {
    chatActions.setAbortController(null);
    chatActions.setLoading(false);
  }
}
