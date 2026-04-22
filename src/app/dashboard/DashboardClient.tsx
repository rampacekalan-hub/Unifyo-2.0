"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Bot, Send, Loader2, AlertTriangle, X, Check, Square, Copy, Sparkles, RefreshCw, ArrowDown } from "lucide-react";
import NeuralBackground from "@/components/ui/NeuralBackground";
import Sidebar from "@/components/layout/Sidebar";
import GuidedCard, { type GuidedDraft } from "@/components/ui/GuidedCard";
import ChatHistory from "@/components/ui/ChatHistory";
import NotificationBell from "@/components/ui/NotificationBell";
import UsageChip from "@/components/ui/UsageChip";
import CommandPalette from "@/components/ui/CommandPalette";
import OnboardingChecklist from "@/components/ui/OnboardingChecklist";
import TodayWidget from "@/components/ui/TodayWidget";
import ActivityTimeline from "@/components/ui/ActivityTimeline";
import { getSiteConfig } from "@/config/site-settings";
import { useChatStore, chatActions } from "@/lib/chatStore";
import { sendChat, regenerateLast } from "@/lib/chatEngine";
import { MarkdownText } from "@/lib/markdown";
import MessageReactions from "@/components/ui/MessageReactions";
import SlashMenu from "@/components/ui/SlashMenu";
import { matchCommands, extractSlashQuery, type SlashCommand } from "@/lib/slashCommands";

function formatTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return "teraz";
  if (diff < 3600000) return `pred ${Math.floor(diff / 60000)} min`;
  const d = new Date(ts);
  const sameDay = new Date().toDateString() === d.toDateString();
  if (sameDay) return d.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("sk-SK", { day: "numeric", month: "short" }) + " " +
    d.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
}

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
  indigoBorder: "var(--app-border)",
  indigoGlow:   "rgba(99,102,241,0.28)",
  violet:       "#8b5cf6",
  sky:          "#38bdf8",
  text:         "var(--app-text)",
  muted:        "var(--app-text-muted)",
};

// ── Sample prompts on empty chat ──────────────────────────────
const SAMPLE_PROMPTS: Array<{ icon: string; text: string; prompt: string }> = [
  { icon: "👤", text: "Pridaj kontakt",       prompt: "Pridaj kontakt Peter Novák, telefón 0950 312 387, záujem o hypotéku" },
  { icon: "📅", text: "Naplánuj stretnutie",  prompt: "Naplánuj stretnutie s Petrom Novákom zajtra o 14:00 v kancelárii" },
  { icon: "✉️", text: "Navrhni email",        prompt: "Navrhni follow-up email pre klienta po stretnutí o hypotéke" },
  { icon: "📋", text: "Zhrň môj deň",          prompt: "Čo mám dnes naplánované? Zhrň moje úlohy a stretnutia." },
];

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
  const scrollRef = useRef<HTMLDivElement>(null);
  // Track whether user has scrolled away from the bottom. We suppress
  // auto-scroll in that case — forcing a jump is disruptive mid-read.
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastMsgCountRef = useRef(0);

  // ID of the currently-streaming AI message — the last ai/thinking one while loading.
  const streamingId = loading
    ? [...messages].reverse().find((m) => m.role === "ai" || m.role === "thinking")?.id
    : undefined;

  // ID of the last AI message — only this one shows the Regenerate button.
  const lastAiId = !loading
    ? [...messages].reverse().find((m) => m.role === "ai" || m.role === "error")?.id
    : undefined;

  const handleRegenerate = async () => {
    if (loading) return;
    await regenerateLast({ module: "dashboard", conversationId, messages });
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Skopírované");
    } catch {
      toast.error("Kopírovanie zlyhalo");
    }
  };

  const handleSampleClick = async (prompt: string) => {
    if (loading) return;
    await sendChat(prompt, { module: "dashboard", conversationId });
  };

  // ── `?prompt=` URL param — empty states on /crm and /calendar link here ──
  // When present, we auto-send it once and strip the param so reloads don't replay.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const p = params.get("prompt");
    if (!p) return;
    params.delete("prompt");
    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : "");
    window.history.replaceState({}, "", url);
    void sendChat(p, { module: "dashboard", conversationId });
    // Only run on first mount — conversationId will be stable enough by then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Auto-scroll only when user is already near the bottom. If they've scrolled
  // up to re-read, we leave them alone and surface a "new messages" pill instead.
  useEffect(() => {
    const grew = messages.length > lastMsgCountRef.current;
    lastMsgCountRef.current = messages.length;
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (grew) {
      setUnreadCount((n) => n + 1);
    }
  }, [messages, draft, isAtBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance < 80;
    setIsAtBottom(atBottom);
    if (atBottom) setUnreadCount(0);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
  }, []);

  // ── Slash commands ─────────────────────────────────────────
  const slashQuery = extractSlashQuery(input);
  const slashItems = slashQuery !== null ? matchCommands(slashQuery) : [];
  const slashOpen = slashQuery !== null && slashItems.length > 0;
  const [slashIdx, setSlashIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset highlighted item when the filtered list changes.
  useEffect(() => { setSlashIdx(0); }, [slashQuery]);

  const pickSlash = useCallback(async (cmd: SlashCommand) => {
    if (cmd.prompt) {
      // Pre-baked — send immediately, clear input.
      setInput("");
      await sendChat(cmd.prompt, { module: "dashboard", conversationId });
      return;
    }
    if (cmd.template) {
      // Insert template — focus stays in input so user can complete it.
      setInput(cmd.template);
      // Move caret to end after template inserts.
      queueMicrotask(() => {
        const el = inputRef.current;
        if (el) {
          el.focus();
          const len = el.value.length;
          el.setSelectionRange(len, len);
        }
      });
    }
  }, [conversationId]);

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
        const goto = hasContact ? "/crm" : "/calendar";
        const label = hasContact ? "Pozrieť v CRM" : "Pozrieť v Kalendári";
        toast.success(
          hasContact && hasTask ? "Kontakt aj termín uložené."
          : hasContact ? "Kontakt uložený do CRM."
          : "Termín pridaný do Kalendára.",
          {
            action: {
              label,
              onClick: () => { window.location.href = goto; },
            },
          },
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
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--app-bg)", color: "var(--app-text)" }}>
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
          style={{ borderBottom: `1px solid ${D.indigoBorder}`, background: "var(--app-surface-2)", backdropFilter: "blur(24px)" }}>
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
          <div className="flex items-center gap-2">
            <UsageChip />
            <ChatHistory />
            <NotificationBell />
          </div>
        </header>

        {/* Chat panel */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-label="AI rozhovor"
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 relative"
          >
            {/* Onboarding checklist — self-hides once all 5 steps complete or dismissed */}
            <OnboardingChecklist />
            {/* Today + 7-day activity — each widget self-hides while loading,
                so they never flash an empty shell. Side-by-side on md+, stacked on mobile. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TodayWidget />
              <ActivityTimeline />
            </div>
            {showGreeting && (
              <>
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

                {/* Sample prompt chips — visible only on empty chat */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex flex-wrap gap-2 ml-10 mt-2 max-w-[75%]"
                >
                  {SAMPLE_PROMPTS.map((s) => (
                    <button
                      key={s.text}
                      onClick={() => handleSampleClick(s.prompt)}
                      disabled={loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all disabled:opacity-40"
                      style={{
                        background: "rgba(99,102,241,0.06)",
                        border: `1px solid ${D.indigoBorder}`,
                        color: D.text,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.14)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.06)")}
                    >
                      <span>{s.icon}</span>
                      <span>{s.text}</span>
                    </button>
                  ))}
                </motion.div>

                <div className="flex items-center gap-1.5 ml-10 mt-1 opacity-60">
                  <Sparkles className="w-3 h-3" style={{ color: D.violet }} />
                  <span className="text-[0.65rem]" style={{ color: D.muted }}>
                    alebo napíš vlastnú správu nižšie
                  </span>
                </div>
              </>
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
                    <div className={"group relative " + (msg.role === "ai" ? "max-w-[82%]" : "max-w-[75%]")}>
                      <div className="rounded-2xl px-4 py-3 text-sm leading-[1.6]"
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
                        {msg.role === "thinking" ? (
                          <SmartThinkingUI />
                        ) : (
                          <>
                            {msg.role === "ai"
                              ? <MarkdownText source={msg.content} />
                              : <span className="whitespace-pre-wrap">{msg.content}</span>}
                            {msg.id === streamingId && msg.role === "ai" && (
                              <motion.span
                                className="inline-block w-1.5 h-3.5 ml-0.5 -mb-0.5 rounded-sm"
                                style={{ background: "#c4b5fd" }}
                                animate={{ opacity: [1, 0.2, 1] }}
                                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                              />
                            )}
                            {/* Email-draft CTA — if the AI's reply looks
                                like an email draft (Predmet: + body),
                                surface a one-click "Odoslať cez Gmail"
                                button that opens Compose pre-filled.
                                AI never actually sends on its own. */}
                            {msg.role === "ai" && msg.content && msg.id !== streamingId && (
                              <EmailDraftCTA aiText={msg.content} />
                            )}
                          </>
                        )}
                      </div>
                      {/* Hover actions — reactions + copy + regenerate (last AI only) */}
                      {msg.role === "ai" && msg.content && msg.id !== streamingId && (
                        <div className="absolute -right-1 top-1 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                          <MessageReactions msgId={msg.id} />
                          {msg.id === lastAiId && (
                            <button
                              onClick={handleRegenerate}
                              className="p-1 rounded-md"
                              style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${D.indigoBorder}` }}
                              aria-label="Regenerovať"
                              title="Regenerovať odpoveď"
                            >
                              <RefreshCw className="w-3 h-3" style={{ color: D.muted }} />
                            </button>
                          )}
                          <button
                            onClick={() => handleCopy(msg.content)}
                            className="p-1 rounded-md"
                            style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${D.indigoBorder}` }}
                            aria-label="Kopírovať"
                            title="Kopírovať správu"
                          >
                            <Copy className="w-3 h-3" style={{ color: D.muted }} />
                          </button>
                        </div>
                      )}
                      {/* Timestamp — appears under bubble on hover */}
                      {msg.role !== "thinking" && msg.createdAt && (
                        <time
                          dateTime={new Date(msg.createdAt).toISOString()}
                          className={`block text-[0.6rem] mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === "user" ? "text-right" : "text-left"}`}
                          style={{ color: D.muted }}
                        >
                          {formatTime(msg.createdAt)}
                        </time>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Scroll-to-bottom button — shown when user is scrolled up */}
          <AnimatePresence>
            {!isAtBottom && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                onClick={scrollToBottom}
                aria-label={unreadCount > 0 ? `${unreadCount} nových správ — skoč dole` : "Skoč dole"}
                className="absolute left-1/2 -translate-x-1/2 bottom-28 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: unreadCount > 0
                    ? `linear-gradient(135deg,${D.indigo},${D.violet})`
                    : "rgba(15,18,32,0.85)",
                  border: `1px solid ${D.indigoBorder}`,
                  color: unreadCount > 0 ? "#fff" : D.text,
                  boxShadow: unreadCount > 0
                    ? `0 0 20px ${D.indigoGlow}`
                    : "0 6px 20px rgba(0,0,0,0.4)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <ArrowDown className="w-3 h-3" />
                {unreadCount > 0 ? `${unreadCount} ${unreadCount === 1 ? "nová správa" : unreadCount < 5 ? "nové správy" : "nových správ"}` : "Najnovšie"}
              </motion.button>
            )}
          </AnimatePresence>

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
          <div className="px-4 sm:px-6 pb-5 pt-3 flex-shrink-0 relative" style={{ borderTop: `1px solid ${D.indigoBorder}` }}>
            <SlashMenu
              open={slashOpen}
              items={slashItems}
              activeIdx={slashIdx}
              onHover={setSlashIdx}
              onSelect={pickSlash}
            />
            <div className="flex items-center gap-2 rounded-2xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${D.indigoBorder}` }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (slashOpen) {
                    if (e.key === "ArrowDown") { e.preventDefault(); setSlashIdx((i) => (i + 1) % slashItems.length); return; }
                    if (e.key === "ArrowUp")   { e.preventDefault(); setSlashIdx((i) => (i - 1 + slashItems.length) % slashItems.length); return; }
                    if (e.key === "Enter")     { e.preventDefault(); void pickSlash(slashItems[slashIdx]); return; }
                    if (e.key === "Escape")    { e.preventDefault(); setInput(""); return; }
                    if (e.key === "Tab")       { e.preventDefault(); void pickSlash(slashItems[slashIdx]); return; }
                  }
                  if (e.key === "Enter" && !e.shiftKey) handleSend();
                }}
                placeholder={dashboard.chatPlaceholder}
                disabled={loading}
                aria-label="Správa pre AI"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--app-text)", caretColor: "#8b5cf6" }} />
              {loading ? (
                <button
                  onClick={() => chatActions.abortStream()}
                  className="w-8 h-8 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#f43f5e,#be123c)", boxShadow: "0 0 14px rgba(244,63,94,0.3)" }}
                  title="Zastaviť generovanie"
                  aria-label="Zastaviť"
                >
                  <Square className="w-3 h-3 text-white fill-white" />
                </button>
              ) : (
                <button onClick={handleSend} disabled={!input.trim()}
                  className="w-8 h-8 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg,${D.indigo},#4f46e5)`, boxShadow: `0 0 14px ${D.indigoGlow}` }}>
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </div>
            {/* Keyboard hints */}
            <div className="flex items-center justify-between mt-2 px-1 text-[0.6rem]" style={{ color: "rgba(148,163,184,0.6)" }}>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}` }}>↵</kbd>
                  odoslať
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}` }}>/</kbd>
                  príkazy
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}` }}>⌘K</kbd>
                rýchle akcie
              </span>
            </div>
          </div>
        </div>
      </div>

      <CommandPalette />
    </div>
  );
}

// ── Email-draft CTA ────────────────────────────────────────────────
// Heuristic parser for when the AI replies with an email draft.
// Looks for "Predmet:" + "Dobrý deň" / "Vážený" / "Ahoj" patterns —
// if we find them, render a "Otvoriť v Gmail Compose" button that
// deep-links to /email?compose=1&subject=…&body=… so the user can
// review and send. AI itself never sends the mail.
function EmailDraftCTA({ aiText }: { aiText: string }) {
  const draft = React.useMemo(() => parseEmailDraft(aiText), [aiText]);
  if (!draft) return null;
  const params = new URLSearchParams();
  if (draft.subject) params.set("subject", draft.subject);
  if (draft.body) params.set("body", draft.body);
  params.set("compose", "1");
  return (
    <div
      className="mt-3 p-3 rounded-xl flex items-center gap-2 flex-wrap"
      style={{
        background: "rgba(14,165,233,0.08)",
        border: "1px solid rgba(14,165,233,0.35)",
      }}
    >
      <span className="text-[11px] font-semibold" style={{ color: "#38bdf8" }}>
        ✉️ Návrh e-mailu
      </span>
      <span className="text-[11px]" style={{ color: "var(--app-text-muted)" }}>
        — otvor v Gmail Compose, skontroluj a pošli.
      </span>
      <a
        href={`/email?${params}`}
        className="ml-auto text-[11px] font-semibold px-3 py-1.5 rounded-lg"
        style={{
          background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
          color: "white",
        }}
      >
        Otvoriť v Compose →
      </a>
    </div>
  );
}

function parseEmailDraft(text: string): { subject: string; body: string } | null {
  // Quick reject — saves the regex work on every AI turn.
  if (!/predmet\s*[:：]/i.test(text) && !/subject\s*[:：]/i.test(text)) return null;
  const m = text.match(/(?:predmet|subject)\s*[:：]\s*(.+?)(?:\n|$)/i);
  const subject = m?.[1]?.trim() ?? "";
  // Body = everything after the subject line up to the next "Chcete…" style meta-question.
  const subjectIdx = m ? text.indexOf(m[0]) + m[0].length : 0;
  let body = text.slice(subjectIdx).trim();
  // Strip AI meta-question lines at the end ("Chcete aby som…", "Chceš ho poslať?")
  body = body.replace(/\n\s*(chce[sš]|chce[tť]e|mám|želáte)[^\n]*\??\s*$/gi, "").trim();
  if (!subject && body.length < 40) return null;
  return { subject: subject || "Bez predmetu", body };
}
