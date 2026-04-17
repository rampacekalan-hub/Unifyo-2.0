"use client";
// src/components/ui/FloatingAIWidget.tsx
// Shared-state AI widget — reads/writes the SAME conversation as /dashboard chat
// via chatStore, so the active conversation stays alive across every module.

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Loader2, Sparkles, Square } from "lucide-react";
import GuidedCard, { type GuidedDraft } from "@/components/ui/GuidedCard";
import ChatHistory from "@/components/ui/ChatHistory";
import { chatActions, useChatStore } from "@/lib/chatStore";
import { sendChat } from "@/lib/chatEngine";
import { toast } from "sonner";

type AIModule = "dashboard" | "calendar" | "email" | "crm" | "calls";

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

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, draft, isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await sendChat(text, { module, conversationId });
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
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
        style={{
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          boxShadow: "0 0 30px rgba(99,102,241,0.5)",
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
            className="fixed bottom-24 right-6 z-50 w-[400px] max-h-[640px] rounded-2xl flex flex-col overflow-hidden"
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-10 h-10 mx-auto mb-2" style={{ color: D.indigo }} />
                  <p className="text-sm" style={{ color: D.muted }}>
                    Som s tebou na každej stránke.<br />Ako ti môžem pomôcť?
                  </p>
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
                    <div
                      className="max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap"
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
                        msg.content
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

            {/* Input */}
            <div className="p-3 flex-shrink-0" style={{ borderTop: `1px solid ${D.indigoBorder}` }}>
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}` }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
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
