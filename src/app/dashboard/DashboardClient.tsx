"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  LogOut, Bot, Calendar, Mail, BarChart3,
  Phone, Zap, Lock, Send, Loader2, AlertTriangle, ChevronRight, ShieldAlert, X, Check,
} from "lucide-react";
import NeuralBackground from "@/components/ui/NeuralBackground";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();
const { errorStates, dashboard } = config.texts;

interface ChatMessage {
  role: "user" | "ai" | "error" | "integration" | "thinking";
  content: string;
  tokens?: number;
  integrationMeta?: { label: string; color: string; name: string };
  detectedEntities?: { person?: boolean; date?: boolean; intent?: boolean };
}

// Compact Smart Thinking UI - Eye Icon + Neural Pulse
interface SmartThinkingUIProps {
  detectedEntities?: { person?: boolean; date?: boolean; intent?: boolean };
}

function SmartThinkingUI({ detectedEntities }: SmartThinkingUIProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-sm">
      {/* Pulsing Eye Icon */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      </motion.div>

      {/* Neural Pulse Dots */}
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 h-1 rounded-full bg-indigo-400"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </span>
    </div>
  );
}

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

const MODULE_META: Record<string, { icon: React.ElementType; label: string }> = {
  dashboard:         { icon: Bot,       label: "AI Chat" },
  calendar:          { icon: Calendar,  label: "Kalendár" },
  email:             { icon: Mail,      label: "Email" },
  crm:               { icon: BarChart3, label: "CRM" },
  calls:             { icon: Phone,     label: "Hovory" },
  analytics:         { icon: Zap,       label: "Analytika" },
  automationBuilder: { icon: Zap,       label: "Automation" },
};

// ── Indigo-first palette ─────────────────────────────────────
const D = {
  indigo:       "#6366f1",
  indigoDim:    "rgba(99,102,241,0.10)",
  indigoBorder: "rgba(99,102,241,0.20)",
  indigoGlow:   "rgba(99,102,241,0.28)",
  violet:       "#8b5cf6",
  violetDim:    "rgba(139,92,246,0.10)",
  violetBorder: "rgba(139,92,246,0.22)",
  sky:          "#38bdf8",
  text:         "#eef2ff",
  muted:        "#6b7280",
  mutedDark:    "#374151",
};

const GLASS: React.CSSProperties = {
  background: "rgba(10,12,24,0.65)",
  border: `1px solid ${D.indigoBorder}`,
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
};

export default function DashboardClient({ user }: DashboardClientProps) {
  const displayName = user.name ?? user.email.split("@")[0];
  const [credits, setCredits] = useState(user.credits ?? 0);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", content: dashboard.aiReady },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Live toggles from admin store ────────────────────────────
  const [liveToggles, setLiveToggles] = useState<Record<string, boolean> | null>(null);

  // ── Broadcast banner ──────────────────────────────────────────
  const [broadcast, setBroadcast] = useState<{ text: string; id: string } | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/events");
    es.addEventListener("init", (e) => {
      const d = JSON.parse(e.data);
      if (d.toggles) setLiveToggles(d.toggles);
      if (d.broadcast) setBroadcast(d.broadcast);
    });
    es.addEventListener("toggles", (e) => {
      const d = JSON.parse(e.data);
      if (d.toggles) setLiveToggles(d.toggles);
    });
    es.addEventListener("broadcast", (e) => {
      const d = JSON.parse(e.data);
      setBroadcast(d);
    });
    es.addEventListener("broadcast_clear", () => {
      setBroadcast(null);
    });
    return () => es.close();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const allModules = Object.values(config.modules).filter((m) => m.path).map((m) => ({
    ...m,
    enabled: liveToggles ? (liveToggles[m.id] ?? m.enabled) : m.enabled,
  }));

  // ── Streaming AI Handler ─────────────────────────────────────
  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    
    // Add thinking message
    setMessages((prev) => [...prev, { role: "thinking", content: "" }]);

    try {
      const res = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, module: activeModule }),
      });

      if (!res.ok) {
        const data = await res.json();
        const errMsg =
          res.status === 429 ? errorStates.rateLimited :
          res.status === 402 ? errorStates.noCredits :
          res.status === 401 ? errorStates.sessionExpired :
          res.status >= 500  ? errorStates.aiUnavailable :
          (data.error ?? errorStates.aiUnavailable);
        
        setMessages((prev) => prev.filter(m => m.role !== "thinking").concat({ role: "error", content: errMsg }));
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let tokensUsed = 0;
      let isDone = false;

      if (!reader) {
        setMessages((prev) => prev.filter(m => m.role !== "thinking").concat({ role: "error", content: errorStates.aiUnavailable }));
        setLoading(false);
        return;
      }

      while (!isDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(l => l.trim());
        
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            isDone = true;
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            
            // Handle streaming delta content
            if (parsed.delta) {
              fullContent += parsed.delta;
            }
            
            // Handle final metadata
            if (parsed.done) {
              isDone = true;
              if (parsed.tokens) tokensUsed = parsed.tokens;
              if (parsed.creditsRemaining !== undefined) {
                setCredits(parsed.creditsRemaining);
              }
            }
          } catch {
            // Ignore parse errors for malformed chunks
          }
        }

        // Detect entities during streaming for Smart Thinking UI
        const hasPerson = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(fullContent) || 
                         /(?:Ing\.?|Mgr\.?|Dr\.?|pán|pani)\s+[A-Z]/.test(fullContent) ||
                         fullContent.toLowerCase().includes("klient");
        const hasDate = /\d{1,2}[./]\d{1,2}[./]\d{2,4}|\b(?:zajtra|dnes|pondelok|utorok|streda|štvrtok|piatok)\b/i.test(fullContent);
        const hasIntent = /\b(?:hypot[eé]k|sch[oó]dzk|stretnut|konzult[aá]ci|záujem|chce|riešiť)\b/i.test(fullContent);

        // Update thinking message with detected entities
        if (hasPerson || hasDate || hasIntent) {
          setMessages((prev) => {
            const withoutThinking = prev.filter(m => m.role !== "thinking");
            return [...withoutThinking, { 
              role: "thinking", 
              content: "",
              detectedEntities: { person: hasPerson, date: hasDate, intent: hasIntent }
            }];
          });
        }
      }

      // Clean content for display
      const cleanContent = fullContent.trim();

      // Replace thinking with final message
      setMessages((prev) => 
        prev.filter(m => m.role !== "thinking").concat({ 
          role: "ai", 
          content: cleanContent || "Rozumiem, spracoval som vašu požiadavku.",
          tokens: tokensUsed 
        })
      );
    } catch {
      setMessages((prev) => 
        prev.filter(m => m.role !== "thinking").concat({ role: "error", content: errorStates.networkError })
      );
    } finally {
      setLoading(false);
    }
  }

  // Legacy sendMessage function (alias for compatibility)
  async function sendMessage() {
    return handleSend();
  }

  const creditsColor = credits > 20 ? "#10b981" : credits > 5 ? "#f59e0b" : "#ef4444";
  const creditsPercent = Math.min(100, (credits / Math.max(user.credits ?? 1, 1)) * 100);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#05070f", color: "#eef2ff" }}>
      <NeuralBackground themeEngine={config.branding.themeEngine} />

      {/* ── SIDEBAR ── */}
      <aside className="w-16 md:w-60 flex-shrink-0 flex flex-col h-full z-10"
        style={{ ...GLASS, borderRight: `1px solid ${D.indigoBorder}` }}>

        {/* Logo */}
        <div className="h-16 flex items-center px-4 md:px-5 gap-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${D.indigoBorder}` }}>
          <div className="w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", boxShadow: `0 0 16px ${D.indigoGlow}` }}>
            <span className="text-white text-[11px] font-black">U</span>
          </div>
          <span className="font-bold text-sm hidden md:block" style={{ color: D.text }}>{config.name}</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {allModules.map((mod) => {
            const meta = MODULE_META[mod.id] ?? { icon: Zap, label: mod.id };
            const Icon = meta.icon;
            const isDisabled = !mod.enabled;
            const isActive = activeModule === mod.id && !isDisabled;
            const isPlanLocked = mod.enabled && mod.requiredPlan !== "all" && mod.requiredPlan !== user.plan;
            return (
              <Link key={mod.id}
                href={mod.id === "dashboard" ? "/dashboard" : mod.id === "crm" ? "/crm" : mod.id === "calendar" ? "/calendar" : mod.id === "email" ? "/email" : "/dashboard"}
                onClick={() => mod.id === "dashboard" && !isDisabled && setActiveModule(mod.id)}
                title={isDisabled ? "Coming Soon" : meta.label}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl mb-1.5 transition-all duration-200"
                style={{
                  background: isActive ? D.indigoDim : "transparent",
                  border: isActive ? `1px solid ${D.indigoBorder}` : "1px solid transparent",
                  boxShadow: isActive ? `0 0 14px ${D.indigoGlow}` : "none",
                  opacity: isDisabled ? 0.32 : 1,
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  pointerEvents: isDisabled ? "none" : "auto",
                }}>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? D.indigo : D.muted }} />
                <span className="text-xs font-medium hidden md:block flex-1 text-left"
                  style={{ color: isActive ? D.text : D.muted }}>{meta.label}</span>
                {isDisabled && <Lock className="w-3 h-3 ml-auto hidden md:block" style={{ color: D.mutedDark }} />}
                {isPlanLocked && !isDisabled && (
                  <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full ml-auto hidden md:block"
                    style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                    {mod.requiredPlan}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout only - credits removed */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${D.indigoBorder}` }}>
          {/* System Control — visible only to SUPERADMIN */}
          {user.role === "SUPERADMIN" && (
            <Link href="/admin"
              className="w-full flex items-center gap-2 px-2 py-2.5 rounded-xl mb-2 transition-all duration-200 relative overflow-hidden"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(245,158,11,0.45)",
                color: "#f59e0b",
                boxShadow: "0 0 10px rgba(239,68,68,0.15)",
              }}>
              <motion.div
                className="absolute inset-0 rounded-xl"
                animate={{ opacity: [0.08, 0.22, 0.08] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ background: "radial-gradient(ellipse at center, rgba(239,68,68,0.30) 0%, transparent 70%)" }}
              />
              <ShieldAlert className="w-4 h-4 flex-shrink-0 relative z-10"
                style={{ filter: "drop-shadow(0 0 5px #ef4444)" }} />
              <span className="text-xs font-bold hidden md:block relative z-10 tracking-widest uppercase"
                style={{ color: "#f59e0b", letterSpacing: "0.08em" }}>System Control</span>
            </Link>
          )}
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl transition-all duration-200"
              style={{ color: D.muted }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = D.text; (e.currentTarget as HTMLButtonElement).style.background = D.indigoDim; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = D.muted; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs hidden md:block">Odhlásiť</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden z-10">

        {/* Broadcast banner — elegant slide-down */}
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
        <header className="h-16 flex items-center justify-between px-6 flex-shrink-0"
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
          {/* Plan and credits removed */}
        </header>

        {/* Chat panel (dashboard only) */}
        {activeModule === "dashboard" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={"flex " + (msg.role === "user" ? "justify-end" : "justify-start")}>
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
                    <div className="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
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
                        <SmartThinkingUI detectedEntities={msg.detectedEntities} />
                      ) : (
                        <>
                          {msg.content}
                          {msg.tokens && msg.tokens > 0 && (
                            <span className="block mt-1 text-[0.62rem]" style={{ color: "#334155" }}>{msg.tokens} tokenov</span>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}


                {loading && !messages.some(m => m.role === "thinking") && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-2.5"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
                      style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.15)" }}>
                      {[0, 1, 2].map((d) => (
                        <motion.span key={d} className="w-1.5 h-1.5 rounded-full" style={{ background: "#7c3aed" }}
                          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="px-4 sm:px-6 pb-5 pt-3 flex-shrink-0" style={{ borderTop: `1px solid ${D.indigoBorder}` }}>
              <div className="flex items-center gap-2 rounded-2xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${D.indigoBorder}` }}>
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={dashboard.chatPlaceholder}
                  disabled={loading}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "#eef2ff", caretColor: "#8b5cf6" }} />
                <button onClick={sendMessage} disabled={loading || !input.trim()}
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
        ) : null}
      </div>
    </div>
  );
}
