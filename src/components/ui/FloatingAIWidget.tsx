"use client";
// src/components/ui/FloatingAIWidget.tsx
// Shared-state AI widget — reads/writes the SAME conversation as /dashboard chat
// via chatStore, so the active conversation stays alive across every module.

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Loader2, Sparkles, Square, Copy, RefreshCw, ArrowDown } from "lucide-react";
import GuidedCard, { type GuidedDraft } from "@/components/ui/GuidedCard";
import ChatHistory from "@/components/ui/ChatHistory";
import { chatActions, useChatStore } from "@/lib/chatStore";
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
import { toast } from "sonner";

type AIModule = "dashboard" | "calendar" | "email" | "crm" | "calls";

const SAMPLE_PROMPTS: Array<{ icon: string; label: string; prompt: string }> = [
  { icon: "👤", label: "Pridaj kontakt",       prompt: "Pridaj kontakt Peter Novák, tel 0950 312 387, záujem o hypotéku" },
  { icon: "📅", label: "Naplánuj stretnutie",  prompt: "Naplánuj stretnutie s Petrom Novákom zajtra o 14:00" },
  { icon: "📋", label: "Zhrň môj deň",          prompt: "Čo mám dnes naplánované?" },
];

function detectModule(pathname: string): AIModule {
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/email")) return "email";
  if (pathname.startsWith("/crm")) return "crm";
  if (pathname.startsWith("/calls")) return "calls";
  return "dashboard";
}

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  text: "#eef2ff",
  muted: "#94a3b8",
  indigoBorder: "rgba(99,102,241,0.22)",
  indigoDim: "rgba(99,102,241,0.08)",
};

export default function FloatingAIWidget() {
  const pathname = usePathname();
  const module = detectModule(pathname);

  const { messages, draft, loading, conversationId } = useChatStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastMsgCountRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    const grew = messages.length > lastMsgCountRef.current;
    lastMsgCountRef.current = messages.length;
    if (isAtBottom) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (grew) {
      setUnreadCount((n) => n + 1);
    }
  }, [messages, draft, isOpen, isAtBottom]);

  // Reset unread tracker when widget is re-opened.
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setIsAtBottom(true);
      lastMsgCountRef.current = messages.length;
    }
  }, [isOpen, messages.length]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance < 60;
    setIsAtBottom(atBottom);
    if (atBottom) setUnreadCount(0);
  };

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
  };

  // Slash command state
  const slashQuery = extractSlashQuery(input);
  const slashItems = slashQuery !== null ? matchCommands(slashQuery) : [];
  const slashOpen = slashQuery !== null && slashItems.length > 0;
  const [slashIdx, setSlashIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSlashIdx(0); }, [slashQuery]);

  const pickSlash = async (cmd: SlashCommand) => {
    if (cmd.prompt) {
      setInput("");
      await sendChat(cmd.prompt, { module, conversationId });
      return;
    }
    if (cmd.template) {
      setInput(cmd.template);
      queueMicrotask(() => {
        const el = inputRef.current;
        if (el) { el.focus(); const l = el.value.length; el.setSelectionRange(l, l); }
      });
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await sendChat(text, { module, conversationId });
  };

  const handleSample = async (prompt: string) => {
    if (loading) return;
    await sendChat(prompt, { module, conversationId });
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Skopírované");
    } catch {
      toast.error("Kopírovanie zlyhalo");
    }
  };

  // Currently streaming ai/thinking message — last one while loading.
  const streamingId = loading
    ? [...messages].reverse().find((m) => m.role === "ai" || m.role === "thinking")?.id
    : undefined;
  const lastAiId = !loading
    ? [...messages].reverse().find((m) => m.role === "ai" || m.role === "error")?.id
    : undefined;
  const handleRegenerate = async () => {
    if (loading) return;
    await regenerateLast({ module, conversationId, messages });
  };

  const handleDraftConfirm = async () => {
    if (!draft) return;
    const promises: Promise<Response>[] = [];
    const hasContact = Object.values(draft.contact).some((v) => v && v.trim());
    const hasTask    = Object.values(draft.task).some((v) => v && v.trim());
    if (hasContact) {
      promises.push(fetch("/api/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.contact["Meno"] || "Nový kontakt",
          email: draft.contact["Email"] || undefined,
          phone: draft.contact["Telefón"] || undefined,
          company: draft.contact["Firma"] || undefined,
        }),
      }));
    }
    if (hasTask) {
      const date = draft.task["Dátum"] || new Date().toISOString().split("T")[0];
      promises.push(fetch("/api/calendar/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.task["Úloha"] || "Nová úloha",
          date,
          time: draft.task["Čas"] || undefined,
          description: draft.task["Poznámka"] || undefined,
        }),
      }));
    }
    try {
      const results = await Promise.all(promises);
      if (results.every((r) => r.ok)) {
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
  };

  const handleDraftChange = (next: GuidedDraft) => chatActions.setDraft(next);
  const handleDraftDismiss = () => chatActions.clearDraft();

  // Unread count while widget is closed (messages added after last open).
  const unread = !isOpen && messages.length > 0
    ? messages.filter((m) => m.role === "ai" && m.content).length : 0;

  return (
    <>
      {/* Floating button — bottom-right; matched to feedback widget
          safe-area offset on mobile so both dodge the bottom-nav. */}
      <motion.button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
        style={{
          bottom: "calc(80px + env(safe-area-inset-bottom))",
          background: "var(--brand-gradient)",
          boxShadow: "0 0 30px rgba(139,92,246,0.5)",
        }}
        whileHover={{ scale: 1.06 }}
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
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
        {!isOpen && unread > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 rounded-full text-[0.65rem] font-bold flex items-center justify-center"
            style={{ background: "#22d3ee", color: "#083344", boxShadow: "0 0 10px rgba(34,211,238,0.6)" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed z-50 rounded-2xl flex flex-col overflow-hidden
              inset-2 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:max-h-[640px]"
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
              style={{ borderBottom: `1px solid ${D.indigoBorder}`, background: "rgba(99,102,241,0.1)" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                >
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-sm" style={{ color: D.text }}>Unifyo AI</span>
                  <span
                    className="ml-2 text-[0.6rem] px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}
                  >
                    {module}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <ChatHistory />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Zavrieť"
                >
                  <X className="w-5 h-5" style={{ color: D.muted }} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} onScroll={handleScroll} role="log" aria-live="polite" aria-relevant="additions text" aria-label="AI rozhovor" className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 relative">
              {messages.length === 0 && (
                <div className="py-4">
                  <div className="text-center mb-4">
                    <Sparkles className="w-10 h-10 mx-auto mb-2" style={{ color: D.indigo }} />
                    <p className="text-sm" style={{ color: D.muted }}>
                      Som s tebou na každej stránke.<br />Skús niečo z týchto:
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5 px-2">
                    {SAMPLE_PROMPTS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => handleSample(s.prompt)}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left transition-colors disabled:opacity-40"
                        style={{
                          background: "rgba(99,102,241,0.06)",
                          border: `1px solid ${D.indigoBorder}`,
                          color: D.text,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.14)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.06)")}
                      >
                        <span>{s.icon}</span>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id}>
                  <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role !== "user" && (
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center mr-2 flex-shrink-0 mt-1"
                        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
                      >
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="group relative max-w-[80%]">
                      <div
                        className="rounded-2xl px-3 py-2 text-sm"
                        style={
                          msg.role === "user"
                            ? { background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.3))", border: "1px solid rgba(124,58,237,0.3)", color: D.text }
                            : msg.role === "thinking"
                            ? { background: "transparent" }
                            : msg.role === "error"
                            ? { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)", color: "#fca5a5" }
                            : { background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#c4b5fd" }
                        }
                      >
                        {msg.role === "thinking" ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" style={{ color: D.indigo }} />
                            <span className="text-xs" style={{ color: D.muted }}>Premýšľam…</span>
                          </div>
                        ) : (
                          <>
                            {msg.role === "ai"
                              ? <MarkdownText source={msg.content} />
                              : <span className="whitespace-pre-wrap">{msg.content}</span>}
                            {msg.id === streamingId && msg.role === "ai" && (
                              <motion.span
                                className="inline-block w-1.5 h-3 ml-0.5 -mb-0.5 rounded-sm"
                                style={{ background: "#c4b5fd" }}
                                animate={{ opacity: [1, 0.2, 1] }}
                                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                              />
                            )}
                          </>
                        )}
                      </div>
                      {msg.role === "ai" && msg.content && msg.id !== streamingId && (
                        <div className="absolute -right-1 top-0.5 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                          <MessageReactions msgId={msg.id} />
                          {msg.id === lastAiId && (
                            <button
                              onClick={handleRegenerate}
                              className="p-1 rounded-md"
                              style={{ background: "rgba(99,102,241,0.14)", border: `1px solid ${D.indigoBorder}` }}
                              aria-label="Regenerovať"
                              title="Regenerovať"
                            >
                              <RefreshCw className="w-3 h-3" style={{ color: D.muted }} />
                            </button>
                          )}
                          <button
                            onClick={() => handleCopy(msg.content)}
                            className="p-1 rounded-md"
                            style={{ background: "rgba(99,102,241,0.14)", border: `1px solid ${D.indigoBorder}` }}
                            aria-label="Kopírovať"
                            title="Kopírovať"
                          >
                            <Copy className="w-3 h-3" style={{ color: D.muted }} />
                          </button>
                        </div>
                      )}
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
                </div>
              ))}

              {/* Guided draft */}
              {draft && (
                <GuidedCard
                  draft={draft}
                  onChange={handleDraftChange}
                  onConfirm={handleDraftConfirm}
                  onDismiss={handleDraftDismiss}
                />
              )}

              <div ref={endRef} />
            </div>

            {/* Scroll-to-bottom pill — shown when user scrolled up */}
            <AnimatePresence>
              {!isAtBottom && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  onClick={scrollToBottom}
                  aria-label={unreadCount > 0 ? `${unreadCount} nových správ — skoč dole` : "Skoč dole"}
                  className="absolute left-1/2 -translate-x-1/2 bottom-20 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: unreadCount > 0
                      ? `linear-gradient(135deg,${D.indigo},${D.violet})`
                      : "rgba(15,18,32,0.9)",
                    border: `1px solid ${D.indigoBorder}`,
                    color: unreadCount > 0 ? "#fff" : D.text,
                    boxShadow: unreadCount > 0
                      ? "0 0 18px rgba(99,102,241,0.45)"
                      : "0 4px 14px rgba(0,0,0,0.5)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <ArrowDown className="w-3 h-3" />
                  {unreadCount > 0
                    ? `${unreadCount} ${unreadCount === 1 ? "nová" : unreadCount < 5 ? "nové" : "nových"}`
                    : "Dole"}
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="p-3 flex-shrink-0 relative" style={{ borderTop: `1px solid ${D.indigoBorder}` }}>
              <SlashMenu
                open={slashOpen}
                items={slashItems}
                activeIdx={slashIdx}
                onHover={setSlashIdx}
                onSelect={pickSlash}
              />
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}` }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (slashOpen) {
                      if (e.key === "ArrowDown") { e.preventDefault(); setSlashIdx((i) => (i + 1) % slashItems.length); return; }
                      if (e.key === "ArrowUp")   { e.preventDefault(); setSlashIdx((i) => (i - 1 + slashItems.length) % slashItems.length); return; }
                      if (e.key === "Enter")     { e.preventDefault(); void pickSlash(slashItems[slashIdx]); return; }
                      if (e.key === "Tab")       { e.preventDefault(); void pickSlash(slashItems[slashIdx]); return; }
                      if (e.key === "Escape")    { e.preventDefault(); setInput(""); return; }
                    }
                    if (e.key === "Enter" && !e.shiftKey) handleSend();
                  }}
                  placeholder="Napíš správu…"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: D.text }}
                  disabled={loading}
                />
                {loading ? (
                  <button
                    onClick={() => chatActions.abortStream()}
                    className="p-2 rounded-lg transition-opacity"
                    style={{ background: "#f43f5e" }}
                    title="Zastaviť"
                    aria-label="Zastaviť"
                  >
                    <Square className="w-3.5 h-3.5 text-white fill-white" />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="p-2 rounded-lg disabled:opacity-50 transition-opacity"
                    style={{ background: D.indigo }}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
