"use client";
// src/components/ui/FloatingAIWidget.tsx
// Phase 2: správny payload, module detection, action card masking + extraction + render

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  extractActionCards,
  maskActionCardBlocks,
  stripActionCardBlocks,
} from "@/lib/extraction-engine";
import type { ActionCard } from "@/lib/extraction-engine";
import ActionCardUI from "@/components/ui/ActionCard";

// ── Module detection ──────────────────────────────────────────────
type AIModule = "dashboard" | "calendar" | "email" | "crm" | "calls";

function detectModule(pathname: string): AIModule {
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/email")) return "email";
  if (pathname.startsWith("/crm")) return "crm";
  if (pathname.startsWith("/calls")) return "calls";
  return "dashboard";
}

// ── Types ─────────────────────────────────────────────────────────
type MessageRole = "user" | "ai" | "thinking";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  cards?: ActionCard[];
}

// ── Colors ────────────────────────────────────────────────────────
const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  text: "#eef2ff",
  muted: "#94a3b8",
  indigoBorder: "rgba(99,102,241,0.22)",
  indigoDim: "rgba(99,102,241,0.08)",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Confirm card → persist to API ─────────────────────────────────
function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

async function persistCard(card: ActionCard, edited: Record<string, string>): Promise<boolean> {
  try {
    if (card.targetModule === "crm") {
      const res = await fetch("/api/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: edited["Meno"] || "Nový kontakt",
          email: edited["Email"] || undefined,
          phone: edited["Telefón"] || undefined,
          company: edited["Firma"] || undefined,
        }),
      });
      return res.ok;
    }

    if (card.targetModule === "calendar") {
      // date is required — fall back to today
      const date = edited["Dátum"] || todayISO();
      const res = await fetch("/api/calendar/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: edited["Úloha"] || "Nová úloha",
          date,
          time: edited["Čas"] || undefined,
          description: edited["Poznámka"] || undefined,
        }),
      });
      return res.ok;
    }

    return false;
  } catch {
    return false;
  }
}

// ── Main component ────────────────────────────────────────────────
export default function FloatingAIWidget() {
  const pathname = usePathname();
  const module = detectModule(pathname);
  const sessionId = useRef(`widget-${uid()}`);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Dismiss a card from a message ──────────────────────────────
  const handleDismiss = useCallback((msgId: string, cardId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? { ...m, cards: m.cards?.filter((c) => c.id !== cardId) }
          : m
      )
    );
  }, []);

  // ── Confirm card + persist ──────────────────────────────────────
  const handleConfirm = useCallback(
    async (msgId: string, card: ActionCard, edited: Record<string, string>) => {
      const ok = await persistCard(card, edited);
      if (ok) {
        toast.success(
          card.targetModule === "crm"
            ? "Kontakt uložený do CRM"
            : "Úloha pridaná do Kalendára"
        );
        handleDismiss(msgId, card.id);
      } else {
        toast.error("Nepodarilo sa uložiť. Skúste znova.");
      }
    },
    [handleDismiss]
  );

  // ── Send message ───────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");

    const userMsgId = uid();
    const aiMsgId = uid();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: userMsg },
      { id: aiMsgId, role: "thinking", content: "" },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          module,
          sessionId: sessionId.current,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.trim());

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.delta) {
              fullContent += parsed.delta;
              // Mask action-card blocks during streaming — show only clean text
              const displayText = maskActionCardBlocks(fullContent);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? { ...m, role: "ai" as MessageRole, content: displayText }
                    : m
                )
              );
            }
          } catch {
            /* skip malformed SSE chunks */
          }
        }
      }

      // Stream done — extract action cards, clean display text
      // Pass user prompt + AI response so regex fallback can recover
      // names/dates when AI emits malformed JSON.
      const extractionInput = `${userMsg}\n---\n${fullContent}`;
      const cards = extractActionCards(extractionInput);
      const cleanText = stripActionCardBlocks(fullContent).trim();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                role: "ai" as MessageRole,
                content: cleanText,
                cards: cards.length > 0 ? cards : undefined,
              }
            : m
        )
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Neznáma chyba";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, role: "ai" as MessageRole, content: `Prepáč, nastala chyba: ${msg}` }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
        style={{
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          boxShadow: "0 0 30px rgba(99,102,241,0.5)",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: [
            "0 0 20px rgba(99,102,241,0.4)",
            "0 0 40px rgba(99,102,241,0.6)",
            "0 0 20px rgba(99,102,241,0.4)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Sparkles className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[400px] max-h-[600px] rounded-2xl flex flex-col overflow-hidden"
            style={{
              background: "rgba(8,10,22,0.97)",
              border: `1px solid ${D.indigoBorder}`,
              backdropFilter: "blur(20px)",
              boxShadow: "0 0 40px rgba(99,102,241,0.2)",
            }}
          >
            {/* Header */}
            <div
              className="h-14 flex items-center justify-between px-4 flex-shrink-0"
              style={{
                borderBottom: `1px solid ${D.indigoBorder}`,
                background: "rgba(99,102,241,0.1)",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-sm" style={{ color: D.text }}>
                    Unifyo AI
                  </span>
                  <span
                    className="ml-2 text-[0.65rem] px-1.5 py-0.5 rounded-md font-medium"
                    style={{
                      background: "rgba(99,102,241,0.2)",
                      color: "#a5b4fc",
                      border: "1px solid rgba(99,102,241,0.3)",
                    }}
                  >
                    {module}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" style={{ color: D.muted }} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles
                    className="w-12 h-12 mx-auto mb-3"
                    style={{ color: D.indigo }}
                  />
                  <p className="text-sm" style={{ color: D.muted }}>
                    Ako ti môžem pomôcť?
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id}>
                  {/* Message bubble */}
                  <div
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role !== "user" && (
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center mr-2 flex-shrink-0 mt-1"
                        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                      >
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div
                      className="max-w-[80%] rounded-2xl px-3 py-2 text-sm"
                      style={
                        msg.role === "user"
                          ? {
                              background:
                                "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.3))",
                              border: "1px solid rgba(124,58,237,0.3)",
                              color: D.text,
                            }
                          : msg.role === "thinking"
                          ? { background: "transparent" }
                          : {
                              background: "rgba(139,92,246,0.1)",
                              border: "1px solid rgba(139,92,246,0.2)",
                              color: "#c4b5fd",
                            }
                      }
                    >
                      {msg.role === "thinking" ? (
                        <div className="flex items-center gap-2">
                          <Loader2
                            className="w-4 h-4 animate-spin"
                            style={{ color: D.indigo }}
                          />
                          <span className="text-xs" style={{ color: D.muted }}>
                            Rozmýšľam...
                          </span>
                        </div>
                      ) : (
                        msg.content || (msg.role === "ai" && !msg.cards ? null : null)
                      )}
                    </div>
                  </div>

                  {/* Action cards below message */}
                  {msg.cards && msg.cards.length > 0 && (
                    <div className="mt-3 space-y-2 pl-8">
                      {msg.cards.map((card) => (
                        <ActionCardUI
                          key={card.id}
                          card={card}
                          onConfirm={(c, edited) => handleConfirm(msg.id, c, edited)}
                          onDismiss={(id) => handleDismiss(msg.id, id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="p-3 flex-shrink-0"
              style={{ borderTop: `1px solid ${D.indigoBorder}` }}
            >
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  background: D.indigoDim,
                  border: `1px solid ${D.indigoBorder}`,
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Napíš správu..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: D.text }}
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="p-2 rounded-lg disabled:opacity-50 transition-opacity"
                  style={{ background: D.indigo }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
