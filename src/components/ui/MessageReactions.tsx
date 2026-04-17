"use client";
// src/components/ui/MessageReactions.tsx
// Thumbs-up / thumbs-down under AI messages. Persists to localStorage via
// @/lib/reactions. Two-way binding so reactions shown in Dashboard chat also
// appear in the FloatingAIWidget for the same message id.

import { useSyncExternalStore } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { getReaction, setReaction, subscribeReactions, type Reaction } from "@/lib/reactions";

function useReaction(msgId: string): Reaction {
  return useSyncExternalStore(
    subscribeReactions,
    () => getReaction(msgId),
    () => null,
  );
}

export default function MessageReactions({ msgId }: { msgId: string }) {
  const current = useReaction(msgId);

  const handle = (next: "up" | "down") => {
    const result = setReaction(msgId, next);
    if (result === "up")   toast.success("Dobrá odpoveď — ďakujem za feedback", { duration: 1500 });
    if (result === "down") toast("Zaznamenané — AI sa učí", { duration: 1500 });
  };

  const btnBase = "p-1 rounded-md transition-all";

  return (
    <div className="flex gap-1">
      <button
        onClick={() => handle("up")}
        className={btnBase}
        aria-label="Dobrá odpoveď"
        aria-pressed={current === "up"}
        title="Dobrá odpoveď"
        style={{
          background: current === "up" ? "rgba(16,185,129,0.18)" : "rgba(99,102,241,0.12)",
          border: `1px solid ${current === "up" ? "rgba(16,185,129,0.4)" : "rgba(99,102,241,0.2)"}`,
        }}
      >
        <ThumbsUp className="w-3 h-3" style={{ color: current === "up" ? "#34d399" : "#94a3b8" }} />
      </button>
      <button
        onClick={() => handle("down")}
        className={btnBase}
        aria-label="Zlá odpoveď"
        aria-pressed={current === "down"}
        title="Zlá odpoveď"
        style={{
          background: current === "down" ? "rgba(239,68,68,0.18)" : "rgba(99,102,241,0.12)",
          border: `1px solid ${current === "down" ? "rgba(239,68,68,0.4)" : "rgba(99,102,241,0.2)"}`,
        }}
      >
        <ThumbsDown className="w-3 h-3" style={{ color: current === "down" ? "#f87171" : "#94a3b8" }} />
      </button>
    </div>
  );
}
