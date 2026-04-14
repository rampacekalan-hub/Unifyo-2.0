"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { LogOut, Zap, Bot, Calendar, Mail, BarChart3, Settings, ChevronRight } from "lucide-react";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

interface DashboardClientProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
    credits: number;
  };
  welcomeMessage: string;
  aiReadyMessage: string;
}

const MODULE_ICONS: Record<string, React.ElementType> = {
  calendar: Calendar,
  email: Mail,
  crm: BarChart3,
  dashboard: Bot,
};

export default function DashboardClient({ user, welcomeMessage, aiReadyMessage }: DashboardClientProps) {
  const [typedText, setTypedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const displayName = user.name ?? user.email.split("@")[0];

  useEffect(() => {
    const full = aiReadyMessage;
    let i = 0;
    const timer = setInterval(() => {
      if (i < full.length) {
        setTypedText(full.slice(0, i + 1));
        i++;
      } else {
        setTypingDone(true);
        clearInterval(timer);
      }
    }, 35);
    return () => clearInterval(timer);
  }, [aiReadyMessage]);

  const enabledModules = Object.values(config.modules).filter(
    (m) => m.enabled && m.path
  );

  return (
    <div className="min-h-screen" style={{ background: "#05070f", color: "#eef2ff" }}>

      {/* Top bar */}
      <header style={{
        borderBottom: "1px solid rgba(139,92,246,0.12)",
        background: "rgba(5,7,15,0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 0 12px rgba(124,58,237,0.3)" }}>
              <span className="text-white text-[10px] font-black">U</span>
            </div>
            <span className="font-bold text-sm" style={{ color: "#eef2ff" }}>{config.name}</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-xs hidden sm:block" style={{ color: "#64748b" }}>
              <span style={{ color: "#8b5cf6" }}>{user.credits}</span> kreditov
            </span>
            <span className="text-xs px-2 py-1 rounded-full" style={{
              background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#c4b5fd",
            }}>
              {user.plan}
            </span>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: "#64748b" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#eef2ff")}
                onMouseLeave={e => (e.currentTarget.style.color = "#64748b")}>
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Odhlásiť</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-10 sm:py-14">

        {/* Welcome block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <p className="text-sm mb-2" style={{ color: "#64748b" }}>
            {welcomeMessage}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4" style={{ color: "#eef2ff" }}>
            Ahoj, <span style={{
              background: "linear-gradient(90deg,#a78bfa,#38bdf8)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>{displayName}</span> 👋
          </h1>

          {/* AI typing card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl p-5 flex items-start gap-4"
            style={{
              background: "rgba(139,92,246,0.06)",
              border: "1px solid rgba(139,92,246,0.2)",
              maxWidth: "600px",
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 0 16px rgba(124,58,237,0.35)" }}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs mb-1.5 font-semibold" style={{ color: "#8b5cf6" }}>Unifyo AI</p>
              <p className="text-sm leading-relaxed" style={{ color: "#c4b5fd" }}>
                {typedText}
                {!typingDone && (
                  <span className="inline-block w-0.5 h-4 ml-0.5 align-middle"
                    style={{ background: "#8b5cf6", animation: "blink 1s infinite" }} />
                )}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Modules grid */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <p className="text-xs font-semibold mb-4 tracking-widest uppercase" style={{ color: "#475569" }}>
            Moduly
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {enabledModules.map((mod, i) => {
              const Icon = MODULE_ICONS[mod.id] ?? Zap;
              const locked = mod.requiredPlan !== "all" && mod.requiredPlan !== user.plan;
              return (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.55 + i * 0.06 }}
                >
                  <Link
                    href={locked ? "/#pricing" : (mod.path ?? "#")}
                    className="flex flex-col gap-3 p-5 rounded-2xl group transition-all duration-300"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(139,92,246,0.1)",
                      opacity: locked ? 0.5 : 1,
                    }}
                    onMouseEnter={e => {
                      if (!locked) {
                        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(139,92,246,0.08)";
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(139,92,246,0.3)";
                        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                      }
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.02)";
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(139,92,246,0.1)";
                      (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                    }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
                      <Icon className="w-4 h-4" style={{ color: "#8b5cf6" }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold capitalize" style={{ color: "#eef2ff" }}>
                        {mod.id === "automationBuilder" ? "Automation" : mod.id}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" style={{ color: "#475569" }} />
                    </div>
                    {locked && (
                      <span className="text-[0.68rem] px-2 py-0.5 rounded-full self-start"
                        style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                        {mod.requiredPlan} plan
                      </span>
                    )}
                  </Link>
                </motion.div>
              );
            })}

            {/* Settings tile */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55 + enabledModules.length * 0.06 }}
            >
              <Link href="/dashboard/settings"
                className="flex flex-col gap-3 p-5 rounded-2xl transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(139,92,246,0.1)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(139,92,246,0.08)";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(139,92,246,0.3)";
                  (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.02)";
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(139,92,246,0.1)";
                  (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(100,116,139,0.1)", border: "1px solid rgba(100,116,139,0.2)" }}>
                  <Settings className="w-4 h-4" style={{ color: "#64748b" }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "#94a3b8" }}>Nastavenia</span>
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: "#475569" }} />
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
