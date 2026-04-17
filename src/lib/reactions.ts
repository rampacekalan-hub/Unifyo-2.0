// src/lib/reactions.ts
// Local-first message reactions. Keyed by message id → "up" | "down" | null.
// Persisted to localStorage for now; a DB-backed version will replace this when
// we start aggregating feedback for prompt tuning.

export type Reaction = "up" | "down" | null;

const KEY = "unifyo.reactions.v1";

type ReactionMap = Record<string, Exclude<Reaction, null>>;

function readAll(): ReactionMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch { return {}; }
}

function writeAll(map: ReactionMap): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch { /* quota */ }
}

export function getReaction(msgId: string): Reaction {
  return readAll()[msgId] ?? null;
}

// Toggle — clicking the same one unsets; clicking the other swaps.
export function setReaction(msgId: string, next: Exclude<Reaction, null>): Reaction {
  const map = readAll();
  const current = map[msgId] ?? null;
  if (current === next) {
    delete map[msgId];
    writeAll(map);
    emit();
    return null;
  }
  map[msgId] = next;
  writeAll(map);
  emit();
  return next;
}

// Tiny pub/sub so open UIs reflect changes made elsewhere (other tab etc.).
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }

export function subscribeReactions(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// Cross-tab sync via storage event.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) emit();
  });
}
