"use client";
// src/lib/chatStore.ts
// Singleton chat store — shared state across /dashboard chat + FloatingAIWidget.
// Persists active conversation + draft to localStorage so nav between modules
// never drops the conversation. History lives on the server (/api/conversations).

import { useSyncExternalStore } from "react";
import type { ActionCard } from "@/lib/extraction-engine";
import type { GuidedDraft } from "@/components/ui/GuidedCard";

export interface ChatMessage {
  id: string;
  role: "user" | "ai" | "error" | "integration" | "thinking";
  content: string;
  tokens?: number;
  createdAt: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

interface StoreState {
  conversationId: string | null;
  messages: ChatMessage[];
  draft: GuidedDraft | null;
  loading: boolean;
}

const EMPTY_DRAFT: GuidedDraft = { contact: {}, task: {} };

// Normalise AI's task-title mistakes into a proper action title.
//   "S Peter Novák"                          → "Stretnutie: Peter Novák"
//   "Peter Novák zajtra 14:00 Auparku ..."   → "Stretnutie: Peter Novák"  (trims prose)
//   "s Peter"                                → "Stretnutie: Peter"
function fixTaskTitle(raw: string): string {
  let t = raw.trim();
  if (!t) return t;

  // Cut off any AI prose that leaked into the Úloha field:
  // stop at first sentence-ending punctuation or obvious trailing question-word.
  const stopIdx = t.search(/[.?!\n]|\s(?:môžeš|mozes|prosím|prosim|kde|aký|aka|máš)/i);
  if (stopIdx > 0) t = t.slice(0, stopIdx).trim();

  // Hard cap length — titles longer than this are never intentional.
  if (t.length > 60) t = t.slice(0, 60).replace(/\s+\S*$/, "").trim();

  // "ActionNoun: Name Surname [extra prose/datetime/location…]" — keep only
  // the action noun + up to 3 capitalised name tokens, drop everything else.
  const prefixed = t.match(
    /^((?:Stretnutie|Konzultácia|Telefonát|Hovor|Príprava|Úloha|Schôdzka)\s*:\s*[A-ZÁ-Ž][a-zá-ž]+(?:\s+[A-ZÁ-Ž][a-zá-ž]+){0,2})/
  );
  if (prefixed) return prefixed[1].trim();

  // Already starts with an action noun — leave untouched.
  if (/^(stretnutie|konzultácia|telefonát|hovor|príprava|úloha|schôdzka|meeting)/i.test(t)) {
    return t;
  }
  // "S [Name]" / "s [Name]" leading preposition.
  const prep = t.match(/^[sS]\s+(.+)$/);
  if (prep) return `Stretnutie: ${prep[1].trim()}`;
  // Bare capitalised name (First Last …) → default to Stretnutie.
  if (/^[A-ZÁ-Ž][a-zá-ž]+(?:\s+[A-ZÁ-Ž][a-zá-ž]+){0,3}/.test(t)) {
    const nameOnly = t.match(/^([A-ZÁ-Ž][a-zá-ž]+(?:\s+[A-ZÁ-Ž][a-zá-ž]+){0,2})/);
    return `Stretnutie: ${(nameOnly?.[1] ?? t).trim()}`;
  }
  return t;
}

// Scan the user's raw message for phone/email and auto-fill the draft — this
// makes the sprievodca robust even when the LLM fails to extract contact data.
export function extractUserFacts(text: string): { phone?: string; email?: string } {
  const phoneMatch = text.match(/(?:\+?\d[\d\s\u00a0]{7,15}\d)/);
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const out: { phone?: string; email?: string } = {};
  if (phoneMatch) {
    const cleaned = phoneMatch[0].replace(/\s+/g, " ").trim();
    // Only treat as phone if it has ≥9 digits.
    if ((cleaned.match(/\d/g) ?? []).length >= 9) out.phone = cleaned;
  }
  if (emailMatch) out.email = emailMatch[0];
  return out;
}

const INITIAL: StoreState = {
  conversationId: null,
  messages: [],
  draft: null,
  loading: false,
};

const STORAGE_KEY = "unifyo.chat.v1";

let state: StoreState = INITIAL;
const listeners = new Set<() => void>();

// ── hydrate from localStorage on first access (client only) ──
let hydrated = false;
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      state = {
        conversationId: parsed.conversationId ?? null,
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
        draft: parsed.draft ?? null,
        loading: false,
      };
    }
  } catch { /* ignore */ }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        conversationId: state.conversationId,
        messages: state.messages,
        draft: state.draft,
      }),
    );
  } catch { /* quota, ignore */ }
}

function emit() {
  for (const fn of listeners) fn();
  persist();
}

function getSnapshot(): StoreState {
  hydrate();
  return state;
}

function subscribe(fn: () => void): () => void {
  hydrate();
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// SSR snapshot — never crashes, never updates
function getServerSnapshot(): StoreState {
  return INITIAL;
}

// ── public actions ───────────────────────────────────────────
export const chatActions = {
  setMessages(next: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) {
    const nextMsgs = typeof next === "function" ? next(state.messages) : next;
    state = { ...state, messages: nextMsgs };
    emit();
  },
  addMessage(msg: ChatMessage) {
    state = { ...state, messages: [...state.messages, msg] };
    emit();
  },
  patchMessage(id: string, patch: Partial<ChatMessage>) {
    state = {
      ...state,
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    };
    emit();
  },
  setLoading(loading: boolean) {
    state = { ...state, loading };
    emit();
  },
  setConversationId(id: string | null) {
    state = { ...state, conversationId: id };
    emit();
  },
  setDraft(draft: GuidedDraft | null) {
    state = { ...state, draft };
    emit();
  },
  mergeDraft(cards: ActionCard[]) {
    // Merge extracted fields into draft; newer non-empty values override.
    const base: GuidedDraft = state.draft ?? {
      contact: { ...EMPTY_DRAFT.contact },
      task:    { ...EMPTY_DRAFT.task },
    };
    let touched = false;
    for (const c of cards) {
      const bucket = c.type === "task" ? "task" : "contact";
      for (const [k, v] of Object.entries(c.fields)) {
        let val = String(v ?? "").trim();
        if (!val) continue;
        // Reject literal placeholders like [NAME] or [MENO].
        if (/^\[[A-Z_]+\]$/.test(val)) continue;
        // Auto-fix common LLM mistake: task title "S Peter Novák" or bare name.
        if (bucket === "task" && k === "Úloha") val = fixTaskTitle(val);
        if (base[bucket][k] !== val) {
          base[bucket][k] = val;
          touched = true;
        }
      }
    }
    if (!touched && !state.draft) return; // nothing to do
    state = { ...state, draft: { contact: { ...base.contact }, task: { ...base.task } } };
    emit();
  },
  clearDraft() {
    state = { ...state, draft: null };
    emit();
  },
  // Patch contact fields directly (e.g. from regex-scanned user message).
  patchContact(patch: Partial<Record<string, string>>) {
    const base: GuidedDraft = state.draft ?? {
      contact: { ...EMPTY_DRAFT.contact },
      task:    { ...EMPTY_DRAFT.task },
    };
    let touched = false;
    const nextContact = { ...base.contact };
    for (const [k, v] of Object.entries(patch)) {
      const val = String(v ?? "").trim();
      if (!val) continue;
      if (nextContact[k] !== val) {
        nextContact[k] = val;
        touched = true;
      }
    }
    if (!touched) return;
    state = {
      ...state,
      draft: { contact: nextContact, task: { ...base.task } },
    };
    emit();
  },
  newConversation() {
    state = { ...state, conversationId: null, messages: [], draft: null };
    emit();
  },
  deleteCurrent() {
    state = { ...state, conversationId: null, messages: [], draft: null };
    emit();
  },
  hydrateFromRemote(id: string, messages: ChatMessage[]) {
    state = {
      ...state,
      conversationId: id,
      messages,
      draft: null, // drafts are ephemeral, do not restore across sessions
    };
    emit();
  },
};

// ── React hook ───────────────────────────────────────────────
export function useChatStore(): StoreState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ── helpers ──────────────────────────────────────────────────
export function msgId(): string {
  return Math.random().toString(36).slice(2, 10);
}
