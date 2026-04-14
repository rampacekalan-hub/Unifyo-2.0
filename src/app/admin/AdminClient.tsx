"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users, Activity, ToggleLeft, ToggleRight,
  Terminal, LogOut, Shield, Zap, TrendingUp,
  ChevronRight, Circle,
} from "lucide-react";
import NeuralBackground from "@/components/ui/NeuralBackground";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

// ── Accent: emerald green for "God Mode" ──────────────────────
const A = {
  glow:   "rgba(16,185,129,0.2)",
  border: "rgba(16,185,129,0.25)",
  bright: "#10b981",
  dim:    "#064e3b",
  text:   "#6ee7b7",
};

const GLASS: React.CSSProperties = {
  background: "rgba(2,10,18,0.82)",
  border: `1px solid ${A.border}`,
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
};

type NavSection = "overview" | "users" | "toggles" | "logs";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  credits: number;
  createdAt: Date | string;
  _count: { aiRequests: number };
}

interface PlanCount {
  plan: string;
  _count: { plan: number };
}

interface RecentRequest {
  id: string;
  module: string;
  tokens: number;
  createdAt: Date | string;
  user: { email: string };
}

interface AdminClientProps {
  adminEmail: string;
  users: User[];
  stats: { totalUsers: number; totalRequests: number; planCounts: PlanCount[] };
  recentRequests: RecentRequest[];
}

const NAV: { id: NavSection; icon: React.ElementType; label: string }[] = [
  { id: "overview", icon: TrendingUp, label: "Overview" },
  { id: "users",    icon: Users,      label: "Používatelia" },
  { id: "toggles",  icon: ToggleLeft, label: "Sys Toggles" },
  { id: "logs",     icon: Terminal,   label: "Event Log" },
];

export default function AdminClient({ adminEmail, users, stats, recentRequests }: AdminClientProps) {
  const [section, setSection] = useState<NavSection>("overview");

  // Module toggles — driven by site-settings (in-memory, restart needed for persist)
  const [toggles, setToggles] = useState(
    Object.entries(config.modules).map(([key, mod]) => ({
      key,
      label: key,
      enabled: mod.enabled,
    }))
  );

  const planMap = Object.fromEntries(stats.planCounts.map((p) => [p.plan, p._count.plan]));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#020a12", color: "#e2e8f0" }}>
      <NeuralBackground themeEngine={config.branding.themeEngine} />

      {/* ── SIDEBAR ── */}
      <aside className="w-16 md:w-60 flex-shrink-0 flex flex-col h-full z-10"
        style={{ ...GLASS, borderRight: `1px solid ${A.border}` }}>

        {/* Logo */}
        <div className="h-14 flex items-center px-3 md:px-5 gap-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${A.border}` }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg,${A.bright},#059669)`, boxShadow: `0 0 14px ${A.glow}` }}>
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: A.bright }}>
              ADMIN CORE
            </p>
            <p className="text-[0.6rem]" style={{ color: "#334155" }}>Command Center</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map(({ id, icon: Icon, label }) => {
            const active = section === id;
            return (
              <button key={id} onClick={() => setSection(id)}
                className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl mb-1 transition-all duration-200"
                style={{
                  background: active ? `rgba(16,185,129,0.12)` : "transparent",
                  border: active ? `1px solid rgba(16,185,129,0.3)` : "1px solid transparent",
                }}>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: active ? A.bright : "#475569" }} />
                <span className="text-xs font-medium hidden md:block"
                  style={{ color: active ? "#e2e8f0" : "#475569" }}>{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto hidden md:block" style={{ color: A.bright }} />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: `1px solid ${A.border}` }}>
          <p className="text-[0.6rem] hidden md:block mb-2 truncate" style={{ color: "#334155" }}>{adminEmail}</p>
          <Link href="/dashboard"
            className="w-full flex items-center gap-2 px-2 py-2 rounded-xl transition-colors"
            style={{ color: "#475569" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#e2e8f0"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#475569"; }}>
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs hidden md:block">← Dashboard</span>
          </Link>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden z-10">

        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-6 flex-shrink-0"
          style={{ borderBottom: `1px solid ${A.border}`, background: "rgba(2,10,18,0.6)", backdropFilter: "blur(16px)" }}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[0.65rem] font-medium tracking-widest uppercase"
              style={{ color: A.bright }}>
              <Circle className="w-1.5 h-1.5 fill-current" style={{ filter: `drop-shadow(0 0 4px ${A.bright})` }} />
              SYSTÉMY ONLINE
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "#334155" }}>
            <span>{stats.totalUsers} používateľov</span>
            <span>·</span>
            <span>{stats.totalRequests} AI requestov</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">

            {/* ── OVERVIEW ── */}
            {section === "overview" && (
              <motion.div key="overview"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}>

                <h1 className="text-xl font-black mb-6 tracking-tight" style={{ color: "#e2e8f0" }}>
                  System <span style={{ color: A.bright }}>Overview</span>
                </h1>

                {/* Stats cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Celkom užívateľov", value: stats.totalUsers, icon: Users },
                    { label: "AI requesty", value: stats.totalRequests, icon: Activity },
                    { label: "Basic plán", value: planMap["basic"] ?? 0, icon: Zap },
                    { label: "Pro / Enterprise", value: (planMap["pro"] ?? 0) + (planMap["enterprise"] ?? 0), icon: TrendingUp },
                  ].map(({ label, value, icon: Icon }, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="rounded-2xl p-4"
                      style={{ ...GLASS, boxShadow: `0 0 20px ${A.glow}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <Icon className="w-4 h-4" style={{ color: A.bright }} />
                        <span className="text-[0.6rem] tracking-widest uppercase" style={{ color: "#334155" }}>LIVE</span>
                      </div>
                      <p className="text-2xl font-black" style={{ color: "#e2e8f0" }}>{value}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="rounded-2xl overflow-hidden" style={GLASS}>
                  <div className="px-5 py-3 flex items-center gap-2"
                    style={{ borderBottom: `1px solid ${A.border}` }}>
                    <Activity className="w-3.5 h-3.5" style={{ color: A.bright }} />
                    <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: A.text }}>
                      Posledné AI requesty
                    </span>
                  </div>
                  <div className="divide-y" style={{ borderColor: A.border }}>
                    {recentRequests.slice(0, 10).map((r) => (
                      <div key={r.id} className="px-5 py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: A.bright, boxShadow: `0 0 6px ${A.bright}` }} />
                          <span style={{ color: "#94a3b8" }}>{r.user.email}</span>
                          <span className="px-1.5 py-0.5 rounded text-[0.6rem]"
                            style={{ background: `rgba(16,185,129,0.1)`, color: A.bright, border: `1px solid ${A.border}` }}>
                            {r.module}
                          </span>
                        </div>
                        <span style={{ color: "#334155" }}>{r.tokens} tok</span>
                      </div>
                    ))}
                    {recentRequests.length === 0 && (
                      <p className="px-5 py-6 text-xs text-center" style={{ color: "#334155" }}>Žiadne requesty.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── USERS ── */}
            {section === "users" && (
              <motion.div key="users"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}>

                <h1 className="text-xl font-black mb-6 tracking-tight" style={{ color: "#e2e8f0" }}>
                  User <span style={{ color: A.bright }}>Management</span>
                  <span className="ml-3 text-sm font-normal" style={{ color: "#475569" }}>
                    {users.length} záznamov
                  </span>
                </h1>

                <div className="rounded-2xl overflow-hidden" style={GLASS}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${A.border}` }}>
                          {["Email", "Meno", "Rola", "Plán", "Kredity", "Requesty", "Registrácia"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left font-semibold tracking-widest uppercase"
                              style={{ color: "#334155" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, i) => (
                          <motion.tr key={u.id}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="transition-colors"
                            style={{ borderBottom: `1px solid rgba(16,185,129,0.05)` }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,185,129,0.04)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                            <td className="px-4 py-3" style={{ color: "#94a3b8" }}>{u.email}</td>
                            <td className="px-4 py-3" style={{ color: "#64748b" }}>{u.name ?? "—"}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-bold"
                                style={u.role === "ADMIN" || u.role === "SUPERADMIN"
                                  ? { background: `rgba(16,185,129,0.15)`, color: A.bright, border: `1px solid ${A.border}` }
                                  : { background: "rgba(255,255,255,0.04)", color: "#475569", border: "1px solid rgba(255,255,255,0.08)" }}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[0.6rem]"
                                style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>
                                {u.plan}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold"
                              style={{ color: u.credits > 20 ? A.bright : u.credits > 5 ? "#f59e0b" : "#ef4444" }}>
                              {u.credits}
                            </td>
                            <td className="px-4 py-3" style={{ color: "#475569" }}>{u._count.aiRequests}</td>
                            <td className="px-4 py-3" style={{ color: "#334155" }}>
                              {new Date(u.createdAt).toLocaleDateString("sk-SK")}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── TOGGLES ── */}
            {section === "toggles" && (
              <motion.div key="toggles"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}>

                <h1 className="text-xl font-black mb-2 tracking-tight" style={{ color: "#e2e8f0" }}>
                  System <span style={{ color: A.bright }}>Toggles</span>
                </h1>
                <p className="text-xs mb-6" style={{ color: "#475569" }}>
                  Globálne prepínače modulov — napojené na site-settings.ts. Trvalé zmeny vyžadujú reštart servera.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {toggles.map((t, i) => (
                    <motion.div key={t.key}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="rounded-2xl p-5 flex items-center justify-between"
                      style={{ ...GLASS, boxShadow: t.enabled ? `0 0 16px ${A.glow}` : "none" }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{t.label}</p>
                        <p className="text-[0.65rem] mt-0.5" style={{ color: t.enabled ? A.bright : "#475569" }}>
                          {t.enabled ? "● Aktívny" : "○ Vypnutý"}
                        </p>
                      </div>
                      <button onClick={() => setToggles((prev) =>
                          prev.map((x) => x.key === t.key ? { ...x, enabled: !x.enabled } : x)
                        )}
                        className="transition-all duration-300"
                        style={{ color: t.enabled ? A.bright : "#334155" }}>
                        {t.enabled
                          ? <ToggleRight className="w-8 h-8" style={{ filter: `drop-shadow(0 0 6px ${A.bright})` }} />
                          : <ToggleLeft className="w-8 h-8" />
                        }
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── LOGS ── */}
            {section === "logs" && (
              <motion.div key="logs"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}>

                <h1 className="text-xl font-black mb-6 tracking-tight" style={{ color: "#e2e8f0" }}>
                  Event <span style={{ color: A.bright }}>Log</span>
                </h1>

                <div className="rounded-2xl overflow-hidden font-mono text-xs" style={GLASS}>
                  <div className="px-5 py-3 flex items-center gap-2"
                    style={{ borderBottom: `1px solid ${A.border}` }}>
                    <Terminal className="w-3.5 h-3.5" style={{ color: A.bright }} />
                    <span className="tracking-widest uppercase font-sans text-[0.6rem]" style={{ color: A.text }}>
                      Stream — posledných 30 eventov
                    </span>
                  </div>
                  <div className="p-4 space-y-1.5 max-h-[60vh] overflow-y-auto">
                    {recentRequests.map((r, i) => (
                      <motion.div key={r.id}
                        initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-start gap-3">
                        <span style={{ color: "#334155" }}>
                          {new Date(r.createdAt).toLocaleTimeString("sk-SK")}
                        </span>
                        <span style={{ color: A.bright }}>[AI/{r.module.toUpperCase()}]</span>
                        <span style={{ color: "#64748b" }}>{r.user.email}</span>
                        <span style={{ color: "#334155" }}>tokens={r.tokens}</span>
                      </motion.div>
                    ))}
                    {recentRequests.length === 0 && (
                      <p style={{ color: "#334155" }}>// Žiadne udalosti.</p>
                    )}
                    <motion.div
                      animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                      className="flex items-center gap-2 mt-2">
                      <span style={{ color: A.bright }}>▋</span>
                      <span style={{ color: "#334155" }}>// čakám na ďalšie udalosti...</span>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
