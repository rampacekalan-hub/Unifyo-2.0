"use client";
// src/components/ui/ChatHistory.tsx
// History popover — lists past conversations, lets user switch or delete.
// Uses shared chatStore so selection is visible everywhere (dashboard + widget).

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, History, Trash2, Check } from "lucide-react";
import { chatActions, useChatStore, type ConversationSummary } from "@/lib/chatStore";
import { toast } from "sonner";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  text:   "#eef2ff",
  muted:  "#94a3b8",
  mutedDark: "#475569",
  border: "rgba(99,102,241,0.22)",
  rose: "#f43f5e",
};

function timeago(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "teraz";
  if (m < 60) return `pred ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `pred ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `pred ${d} d`;
  return new Date(iso).toLocaleDateString("sk-SK", { day: "numeric", month: "short" });
}

export default function ChatHistory() {
  const { conversationId } = useChatStore();
  const [open, setOpen] = useState(false);
  const [convs, setConvs] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) setConvs(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const handleNew = () => {
    chatActions.newConversation();
    setOpen(false);
    toast.success("Nový rozhovor");
  };

  const handlePick = async (id: string) => {
    if (id === conversationId) { setOpen(false); return; }
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (!res.ok) throw new Error("load failed");
      const rows = await res.json();
      const mapped = rows.map((r: { id: string; role: string; content: string; tokens?: number; createdAt: string }) => ({
        id: r.id,
        role: r.role === "assistant" ? "ai" : (r.role as "user" | "ai"),
        content: r.content,
        tokens: r.tokens ?? 0,
        createdAt: new Date(r.createdAt).getTime(),
      }));
      chatActions.hydrateFromRemote(id, mapped);
      setOpen(false);
    } catch {
      toast.error("Nepodarilo sa načítať rozhovor");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/conversations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      if (id === conversationId) chatActions.newConversation();
      setConvs((prev) => prev.filter((c) => c.id !== id));
      toast.success("Rozhovor zmazaný");
    } catch {
      toast.error("Zmazanie zlyhalo");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[0.7rem] font-medium transition-colors"
        style={{
          background: open ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.06)",
          border: `1px solid ${D.border}`,
          color: D.text,
        }}
        aria-label="História rozhovorov"
      >
        <History className="w-3.5 h-3.5" style={{ color: D.indigo }} />
        <span>História</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              // Jemný scrim — kliknutie mimo zavrie dropdown a zároveň
              // vizuálne odsunie obsah do pozadia.
              style={{ background: "rgba(5,7,15,0.45)" }}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 mt-2 w-[320px] max-h-[70vh] rounded-2xl z-50 overflow-hidden flex flex-col"
              style={{
                // Plne nepriehľadné pozadie — backdrop-filter sám nestačí
                // (správy spod dropdownu presvitali cez alpha 0.95).
                background: "#0a0c18",
                border: `1px solid ${D.border}`,
                boxShadow: "0 20px 50px rgba(0,0,0,0.65), 0 0 24px rgba(99,102,241,0.22)",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                style={{ borderBottom: `1px solid ${D.border}` }}
              >
                <span className="text-[0.65rem] font-semibold uppercase tracking-widest" style={{ color: D.muted }}>
                  Rozhovory
                </span>
                <button
                  onClick={handleNew}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[0.65rem] font-medium"
                  style={{
                    background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
                    color: "white",
                    boxShadow: "0 0 10px rgba(99,102,241,0.35)",
                  }}
                >
                  <MessageSquarePlus className="w-3 h-3" />
                  Nový
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {loading && (
                  <div className="px-4 py-3 space-y-2.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="space-y-1.5"
                        initial={{ opacity: 0.4 }}
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                      >
                        <div className="h-3 rounded-md" style={{ background: "rgba(99,102,241,0.12)", width: "70%" }} />
                        <div className="h-2 rounded-md" style={{ background: "rgba(99,102,241,0.07)", width: "40%" }} />
                      </motion.div>
                    ))}
                  </div>
                )}
                {!loading && convs.length === 0 && (
                  <p className="px-4 py-8 text-xs text-center" style={{ color: D.muted }}>
                    Zatiaľ žiadne rozhovory.
                  </p>
                )}
                {!loading && convs.map((c) => {
                  const active = c.id === conversationId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handlePick(c.id)}
                      className="group flex items-start gap-2 px-4 py-2.5 cursor-pointer transition-colors"
                      style={{
                        background: active ? "rgba(99,102,241,0.10)" : "transparent",
                        borderBottom: `1px solid rgba(99,102,241,0.08)`,
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(99,102,241,0.05)"; }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: D.text }}>
                          {c.title || "Bez názvu"}
                        </p>
                        <p className="text-[0.65rem] mt-0.5" style={{ color: D.muted }}>
                          {timeago(c.updatedAt)}
                        </p>
                      </div>
                      {active && <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: D.indigo }} />}
                      <button
                        onClick={(e) => handleDelete(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity flex-shrink-0"
                        aria-label="Zmazať"
                      >
                        <Trash2 className="w-3 h-3" style={{ color: D.rose }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
