"use client";
// src/components/ui/FeedbackWidget.tsx
// Floating feedback button — bottom-left (bottom-right is taken by the
// floating AI widget / toast stack). Click → compact modal with 4
// categories, a message field, optional 1–5 rating. Submits to
// /api/feedback. Deliberately minimal friction; we'd rather take low-
// signal feedback than lose high-signal feedback to form fatigue.

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { MessageCircleHeart, Bug, Lightbulb, ThumbsUp, MessageSquare, X, Loader2, Send } from "lucide-react";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  border: "rgba(99,102,241,0.22)",
};

type Kind = "bug" | "idea" | "praise" | "general";

const KINDS: Array<{ id: Kind; label: string; Icon: React.ElementType; color: string }> = [
  { id: "bug",     label: "Bug",      Icon: Bug,          color: D.rose },
  { id: "idea",    label: "Nápad",    Icon: Lightbulb,    color: D.amber },
  { id: "praise",  label: "Chvála",   Icon: ThumbsUp,     color: D.emerald },
  { id: "general", label: "Ostatné",  Icon: MessageSquare, color: D.indigo },
];

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const msg = message.trim();
    if (msg.length < 3) {
      toast.error("Napíš aspoň pár slov.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, message: msg, rating }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "send_failed");
      }
      toast.success("Ďakujem — dočítam to čoskoro.");
      setMessage("");
      setRating(null);
      setKind("general");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Odoslanie zlyhalo");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating trigger — bottom-left so it doesn't collide with the
          AI widget (bottom-right) or the sonner toasts. */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Pošli nám feedback"
        className="fixed z-40 hidden md:flex items-center gap-2 rounded-full pl-3 pr-4 py-2.5 text-xs font-semibold transition"
        style={{
          bottom: 20,
          left: 20,
          background: "var(--app-surface)",
          color: D.text,
          border: `1px solid ${D.border}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 14px rgba(139,92,246,0.2)",
          backdropFilter: "blur(16px)",
        }}
      >
        <MessageCircleHeart className="w-4 h-4" style={{ color: D.violet }} />
        Feedback
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !sending && setOpen(false)}
              className="fixed inset-0 z-[100]"
              style={{ background: "rgba(3,4,10,0.65)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="fixed z-[101] left-1/2 -translate-x-1/2 bottom-10 sm:bottom-10 sm:left-8 sm:translate-x-0 w-[min(92vw,400px)] rounded-2xl p-5"
              style={{
                background: "var(--app-surface)",
                border: `1px solid ${D.border}`,
                boxShadow: "0 20px 60px rgba(0,0,0,0.55), 0 0 30px rgba(139,92,246,0.2)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: D.text }}>Daj mi vedieť</h3>
                  <p className="text-[0.7rem]" style={{ color: D.muted }}>
                    Každá správa príde priamo mne (Alan, zakladateľ).
                  </p>
                </div>
                <button
                  onClick={() => !sending && setOpen(false)}
                  className="p-1 rounded-md"
                  style={{ color: D.muted }}
                  aria-label="Zavrieť"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Kind selector */}
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {KINDS.map((k) => {
                  const active = kind === k.id;
                  const Icon = k.Icon;
                  return (
                    <button
                      key={k.id}
                      onClick={() => setKind(k.id)}
                      className="flex flex-col items-center gap-0.5 py-2 rounded-lg text-[0.65rem] transition"
                      style={{
                        background: active ? `${k.color}18` : "var(--app-surface-2)",
                        border: `1px solid ${active ? `${k.color}66` : D.border}`,
                        color: active ? D.text : D.muted,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: active ? k.color : D.muted }} />
                      {k.label}
                    </button>
                  );
                })}
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  kind === "bug"
                    ? "Čo sa pokazilo? Čo si robil(a) pred tým?"
                    : kind === "idea"
                    ? "Aký nápad máš?"
                    : kind === "praise"
                    ? "Čo sa ti páči?"
                    : "Čo chceš povedať?"
                }
                rows={4}
                disabled={sending}
                maxLength={5000}
                className="w-full px-3 py-2.5 rounded-lg text-xs outline-none resize-none"
                style={{
                  background: "var(--app-surface-2)",
                  border: `1px solid ${D.border}`,
                  color: D.text,
                }}
              />

              {/* Rating */}
              <div className="flex items-center gap-1.5 mt-3 mb-4">
                <span className="text-[0.65rem] mr-1" style={{ color: D.muted }}>
                  Celkový pocit:
                </span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(rating === n ? null : n)}
                    className="text-base transition"
                    style={{
                      opacity: rating === null || rating === n ? 1 : 0.35,
                      filter: rating === n ? "drop-shadow(0 0 4px rgba(245,158,11,0.5))" : "none",
                    }}
                  >
                    {["😡", "🙁", "😐", "🙂", "😍"][n - 1]}
                  </button>
                ))}
              </div>

              <button
                onClick={submit}
                disabled={sending}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
                  color: "white",
                  boxShadow: `0 0 18px ${D.violet}55`,
                }}
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Odoslať
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
