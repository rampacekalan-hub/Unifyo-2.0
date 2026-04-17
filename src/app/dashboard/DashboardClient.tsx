"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Bot, Send, Loader2, AlertTriangle, X, Check } from "lucide-react";
import NeuralBackground from "@/components/ui/NeuralBackground";
import Sidebar from "@/components/layout/Sidebar";
import GuidedCard, { type GuidedDraft } from "@/components/ui/GuidedCard";
import ChatHistory from "@/components/ui/ChatHistory";
import { getSiteConfig } from "@/config/site-settings";
import { useChatStore, chatActions } from "@/lib/chatStore";
import { sendChat } from "@/lib/chatEngine";

const config = getSiteConfig();
const { dashboard } = config.texts;

interface DashboardClientProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
    credits?: number;
    role: string;
  };
}

// ── Indigo-first palette ─────────────────────────────────────
const D = {
  indigo:       "#6366f1",
  indigoDim:    "rgba(99,102,241,0.10)",
  indigoBorder: "rgba(99,102,241,0.20)",
  indigoGlow:   "rgba(99,102,241,0.28)",
  violet:       "#8b5cf6",
  sky:          "#38bdf8",
  text:         "#eef2ff",
  muted:        "#6b7280",
};

// ── Neural Thinking Indicator ─────────────────────────────────
function SmartThinkingUI() {
  return (
    <div
      className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-2xl"
      style={{
        background: "rgba(99,102,241,0.08)",
        border: "1px solid rgba(99,102,241,0.22)",
        boxShadow: "0 0 14px rgba(99,102,241,0.15)",
      }}
    >
      <span className="flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#8b5cf6" }}
            animate={{
              y: [0, -3, 0],
              opacity: [0.35, 1, 0.35],
              boxShadow: [
                "0 0 0px rgba(139,92,246,0.0)",
                "0 0 8px rgba(139,92,246,0.7)",
                "0 0 0px rgba(139,92,246,0.0)",
              ],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </span>
      <motion.span
        className="text-[0.7rem] font-medium tracking-wide"
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(90deg,#a78bfa,#38bdf8,#a78bfa)",
          backgroundSize: "200% 100%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Premýšľam…
      </motion.span>
    </div>
  );
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const displayName = user.name ?? user.email.split("@")[0];
  const { messages, draft, loading, conversationId } = useChatStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Live toggles from admin store ────────────────────────────
  const [liveToggles, setLiveToggles] = useState<Record<string, boolean> | null>(null);

  // ── Broadcast banner ──────────────────────────────────────────
  const [broadcast, setBroadcast] = useState<{ text: string; id: string } | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.addEventListener("init", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      if (d.toggles) setLiveToggles(d.toggles);
      if (d.broadcast) setBroadcast(d.broadcast);
    });
    es.addEventListener("toggles", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      if (d.toggles) setLiveToggles(d.toggles);
    });
    es.addEventListener("broadcast", (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setBroadcast(d);
    });
    es.addEventListener("broadcast_clear", () => {
      setBroadcast(null);
    });
    return () => es.close();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, draft]);

  // ── Send wrapper ────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await sendChat(text, { module: "dashboard", conversationId });
  }, [input, loading, conversationId]);

  // ── Guided draft: save both entities ────────────────────────
  const handleDraftConfirm = useCallback(async () => {
    if (!draft) return;
    const promises: Promise<Response>[] = [];
    const hasContact = Object.values(draft.contact).some((v) => v && v.trim());
    const hasTask    = Object.values(draft.task).some((v) => v && v.trim());

    if (hasContact) {
      promises.push(
        fetch("/api/crm/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draft.contact["Meno"] || "Nový kontakt",
            email: draft.contact["Email"] || undefined,
            phone: draft.contact["Telefón"] || undefined,
            company: draft.contact["Firma"] || undefined,
          }),
        }),
      );
    }
    if (hasTask) {
      const date = draft.task["Dátum"] || new Date().toISOString().split("T")[0];
      promises.push(
        fetch("/api/calendar/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: draft.task["Úloha"] || "Nová úloha",
            date,
            time: draft.task["Čas"] || undefined,
            description: draft.task["Poznámka"] || undefined,
          }),
        }),
      );
    }
    try {
      const results = await Promise.all(promises);
      const allOk = results.every((r) => r.ok);
      if (allOk) {
        toast.success(
          hasContact && hasTask ? "Kontakt aj termín uložené."
          : hasContact ? "Kontakt uložený do CRM."
          : "Termín pridaný do Kalendára.",
        );
        chatActions.clearDraft();
      } else {
        toast.error("Niektorá časť sa neuložila.");
      }
    } catch {
      toast.error("Ukladanie zlyhalo.");
    }
  }, [draft]);

  const handleDraftChange = useCallback((next: GuidedDraft) => {
    chatActions.setDraft(next);
  }, []);

  const handleDraftDismiss = useCallback(() => {
    chatActions.clearDraft();
  }, []);

  // Empty-state greeting (not persisted, just visual)
  const showGreeting = messages.length === 0;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#05070f", color: "#eef2ff" }}>
      <NeuralBackground themeEngine={config.branding.themeEngine} />

      {/* ── SIDEBAR (shared) ── */}
      <Sidebar user={user} liveToggles={liveToggles} />

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden z-10">

        {/* Broadcast banner */}
        <AnimatePresence>
          {broadcast && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="relative overflow-hidden flex-shrink-0 z-20"
              style={{
                background: "linear-gradient(90deg, rgba(99,102,241,0.12) 0%, rgba(239,68,68,0.10) 50%, rgba(99,102,241,0.12) 100%)",
                borderBottom: "1px solid rgba(239,68,68,0.22)",
                backdropFilter: "blur(20px)",
              }}>
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      animate={{ boxShadow: ["0 0 4px #ef4444", "0 0 12px #ef4444", "0 0 4px #ef4444"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      style={{ background: "#ef4444" }}
                    />
                  </div>
                  <span className="text-[0.65rem] font-bold tracking-widest uppercase" style={{ color: "#f87171" }}>Systémové oznámenie</span>
                  <span className="text-xs" style={{ color: "#fca5a5" }}>{broadcast.text}</span>
                </div>
                <button onClick={() => setBroadcast(null)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                  style={{ color: "#6b7280" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Topbar */}
        <header className="h-16 flex items-center justify-between pl-16 md:pl-6 pr-4 md:pr-6 flex-shrink-0"
          style={{ borderBottom: `1px solid ${D.indigoBorder}`, background: "rgba(5,7,15,0.55)", backdropFilter: "blur(24px)" }}>
          <div>
            <p className="text-[0.6rem] font-medium tracking-widest uppercase" style={{ color: "#10b981" }}>
              ● {dashboard.systemsOnline}
            </p>
            <h1 className="text-sm font-bold mt-0.5">
              Vitaj späť,{" "}
              <span style={{ background: `linear-gradient(90deg,${D.violet},${D.sky})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {displayName}
              </span>
            </h1>
          </div>
          <ChatHistory />
        </header>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
            {showGreeting && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mr-2.5 mt-0.5"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 0 10px rgba(124,58,237,0.3)" }}>
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                  style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.15)", color: "#c4b5fd" }}>
                  {dashboard.aiReady}
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}>
                  <div className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role !== "user" && (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mr-2.5 mt-0.5"
                        style={msg.role === "error"
                          ? { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }
                          : msg.role === "integration"
                          ? { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }
                          : msg.role === "thinking"
                          ? { background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)" }
                          : { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 0 10px rgba(124,58,237,0.3)" }
                        }>
                        {msg.role === "error"
                          ? <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#f87171" }} />
                          : msg.role === "integration"
                          ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                          : msg.role === "thinking"
                          ? <Bot className="w-3.5 h-3.5 text-indigo-300" />
                          : <Bot className="w-3.5 h-3.5 text-white" />
                        }
                      </div>
                    )}
                    <div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                      style={msg.role === "user"
                        ? { background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.3))", border: "1px solid rgba(124,58,237,0.3)", color: "#eef2ff" }
                        : msg.role === "error"
                        ? { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }
                        : msg.role === "integration"
                        ? { background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#6ee7b7" }
                        : msg.role === "thinking"
                        ? { background: "transparent", border: "none" }
                        : { background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.15)", color: "#c4b5fd" }
                      }>
                      {msg.role === "thinking" ? <SmartThinkingUI /> : msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Guided draft — sticky above input */}
          <AnimatePresence>
            {draft && (
              <div className="px-4 sm:px-6 pb-2 pt-1 flex-shrink-0">
                <GuidedCard
                  draft={draft}
                  onChange={handleDraftChange}
                  onConfirm={handleDraftConfirm}
                  onDismiss={handleDraftDismiss}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Input bar */}
          <div className="px-4 sm:px-6 pb-5 pt-3 flex-shrink-0" style={{ borderTop: `1px solid ${D.indigoBorder}` }}>
            <div className="flex items-center gap-2 rounded-2xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${D.indigoBorder}` }}>
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={dashboard.chatPlaceholder}
                disabled={loading}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "#eef2ff", caretColor: "#8b5cf6" }} />
              <button onClick={handleSend} disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 disabled:opacity-40"
                style={{ background: `linear-gradient(135deg,${D.indigo},#4f46e5)`, boxShadow: `0 0 14px ${D.indigoGlow}` }}>
                {loading
                  ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  : <Send className="w-3.5 h-3.5 text-white" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
