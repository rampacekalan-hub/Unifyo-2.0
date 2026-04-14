"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users, Activity, ToggleLeft, ToggleRight,
  Terminal, LogOut, ShieldAlert, Zap, TrendingUp,
  ChevronRight, Circle,
} from "lucide-react";
import NeuralBackground from "@/components/ui/NeuralBackground";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

// ── Event Horizon palette ──────────────────────────────────────
const A = {
  crimson:       "#ef4444",
  crimsonGlow:   "rgba(239,68,68,0.22)",
  crimsonBorder: "rgba(239,68,68,0.28)",
  crimsonDim:    "rgba(239,68,68,0.08)",
  gold:          "#f59e0b",
  goldGlow:      "rgba(245,158,11,0.22)",
  goldBorder:    "rgba(245,158,11,0.35)",
  goldDim:       "rgba(245,158,11,0.08)",
  cream:         "#fef3c7",
  bg:            "#070005",
};

const GLASS: React.CSSProperties = {
  background: "rgba(7,0,5,0.88)",
  border: `1px solid ${A.crimsonBorder}`,
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
  { id: "overview", icon: TrendingUp, label: "Overview"     },
  { id: "users",    icon: Users,      label: "Používatelia" },
  { id: "toggles",  icon: Zap,        label: "Sys Toggles"  },
  { id: "logs",     icon: Terminal,   label: "Event Log"    },
];

export default function AdminClient({ adminEmail, users, stats, recentRequests }: AdminClientProps) {
  const [section, setSection] = useState<NavSection>("overview");
  const [hoveredToggle, setHoveredToggle] = useState<string | null>(null);

  const [toggles, setToggles] = useState(
    Object.entries(config.modules).map(([key, mod]) => ({
      key,
      label: key,
      enabled: mod.enabled,
    }))
  );

  const planMap = Object.fromEntries(stats.planCounts.map((p) => [p.plan, p._count.plan]));

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: A.bg, color: "#f1f5f9" }}>

      {/* ── Corner crimson glow ── */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div style={{
          position: "absolute", top: 0, left: 0, width: 420, height: 420,
          background: "radial-gradient(ellipse at top left, rgba(239,68,68,0.13) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: 0, right: 0, width: 420, height: 420,
          background: "radial-gradient(ellipse at bottom right, rgba(239,68,68,0.10) 0%, transparent 70%)",
        }} />
      </div>

      <NeuralBackground themeEngine={config.branding.themeEngine} />

      {/* ── SIDEBAR ── */}
      <aside className="w-16 md:w-60 flex-shrink-0 flex flex-col h-full z-10"
        style={{ ...GLASS, borderRight: `1px solid ${A.crimsonBorder}` }}>

        {/* Logo */}
        <div className="h-14 flex items-center px-3 md:px-5 gap-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${A.crimsonBorder}` }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 relative"
            style={{ background: `linear-gradient(135deg,${A.crimson},#7f1d1d)`, boxShadow: `0 0 16px ${A.crimsonGlow}` }}>
            <ShieldAlert className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: A.gold }}>
              ADMIN CORE
            </p>
            <p className="text-[0.6rem] tracking-widest" style={{ color: "#44202a" }}>Event Horizon</p>
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
                  background: active ? A.crimsonDim : "transparent",
                  border: active ? `1px solid ${A.crimsonBorder}` : "1px solid transparent",
                  boxShadow: active ? `0 0 12px ${A.crimsonGlow}` : "none",
                }}>
                <Icon className="w-4 h-4 flex-shrink-0"
                  style={{ color: active ? A.crimson : "#4b2030" }} />
                <span className="text-xs font-medium hidden md:block"
                  style={{ color: active ? "#f1f5f9" : "#4b2030" }}>{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto hidden md:block" style={{ color: A.gold }} />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: `1px solid ${A.crimsonBorder}` }}>
          <p className="text-[0.6rem] hidden md:block mb-2 truncate" style={{ color: "#44202a" }}>{adminEmail}</p>
          <Link href="/dashboard"
            className="w-full flex items-center gap-2 px-2 py-2 rounded-xl transition-all duration-200"
            style={{ color: "#4b2030" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = A.gold;
              (e.currentTarget as HTMLAnchorElement).style.background = A.goldDim;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#4b2030";
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            }}>
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs hidden md:block">← Dashboard</span>
          </Link>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden z-10">

        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-6 flex-shrink-0"
          style={{
            borderBottom: `1px solid ${A.crimsonBorder}`,
            background: "rgba(7,0,5,0.75)",
            backdropFilter: "blur(16px)",
          }}>
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1.5 text-[0.65rem] font-bold tracking-widest uppercase"
              style={{ color: A.crimson }}>
              <Circle className="w-1.5 h-1.5 fill-current"
                style={{ filter: `drop-shadow(0 0 5px ${A.crimson})` }} />
              SYSTÉMY ONLINE
            </motion.span>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "#44202a" }}>
            <span style={{ color: A.gold }}>{stats.totalUsers}</span>
            <span style={{ color: "#44202a" }}>používateľov ·</span>
            <span style={{ color: A.gold }}>{stats.totalRequests}</span>
            <span style={{ color: "#44202a" }}>AI requestov</span>
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

                <h1 className="text-xl font-black mb-6 tracking-tight" style={{ color: "#f1f5f9" }}>
                  System <span style={{ color: A.gold }}>Overview</span>
                </h1>

                {/* Stats cards — gold border, crimson glow */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Celkom užívateľov",  value: stats.totalUsers,  icon: Users,      accent: A.gold    },
                    { label: "AI requesty",          value: stats.totalRequests, icon: Activity, accent: A.crimson },
                    { label: "Basic plán",           value: planMap["basic"] ?? 0, icon: Zap,    accent: A.gold    },
                    { label: "Pro / Enterprise",     value: (planMap["pro"] ?? 0) + (planMap["enterprise"] ?? 0), icon: TrendingUp, accent: A.crimson },
                  ].map(({ label, value, icon: Icon, accent }, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="rounded-2xl p-4"
                      style={{
                        background: "rgba(7,0,5,0.9)",
                        border: `1px solid ${A.goldBorder}`,
                        boxShadow: `0 0 24px ${A.crimsonGlow}, inset 0 1px 0 ${A.goldDim}`,
                        backdropFilter: "blur(20px)",
                      }}>
                      <div className="flex items-center justify-between mb-3">
                        <Icon className="w-4 h-4" style={{ color: accent, filter: `drop-shadow(0 0 4px ${accent})` }} />
                        <motion.span
                          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
                          className="text-[0.6rem] tracking-widest uppercase" style={{ color: A.crimson }}>
                          LIVE
                        </motion.span>
                      </div>
                      <p className="text-2xl font-black" style={{ color: "#f1f5f9" }}>{value}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#4b2030" }}>{label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="rounded-2xl overflow-hidden" style={GLASS}>
                  <div className="px-5 py-3 flex items-center gap-2"
                    style={{ borderBottom: `1px solid ${A.crimsonBorder}`, background: A.crimsonDim }}>
                    <Activity className="w-3.5 h-3.5" style={{ color: A.gold }} />
                    <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: A.gold }}>
                      Posledné AI requesty
                    </span>
                  </div>
                  <div>
                    {recentRequests.slice(0, 10).map((r) => (
                      <div key={r.id}
                        className="px-5 py-3 flex items-center justify-between text-xs transition-colors"
                        style={{ borderBottom: `1px solid rgba(239,68,68,0.06)` }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = A.crimsonDim)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                        <div className="flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: A.crimson, boxShadow: `0 0 6px ${A.crimson}` }} />
                          <span style={{ color: "#94a3b8" }}>{r.user.email}</span>
                          <span className="px-1.5 py-0.5 rounded text-[0.6rem]"
                            style={{ background: A.goldDim, color: A.gold, border: `1px solid ${A.goldBorder}` }}>
                            {r.module}
                          </span>
                        </div>
                        <span style={{ color: "#44202a" }}>{r.tokens} tok</span>
                      </div>
                    ))}
                    {recentRequests.length === 0 && (
                      <p className="px-5 py-6 text-xs text-center" style={{ color: "#44202a" }}>Žiadne requesty.</p>
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

                <h1 className="text-xl font-black mb-6 tracking-tight" style={{ color: "#f1f5f9" }}>
                  User <span style={{ color: A.gold }}>Management</span>
                  <span className="ml-3 text-sm font-normal" style={{ color: "#4b2030" }}>
                    {users.length} záznamov
                  </span>
                </h1>

                <div className="rounded-2xl overflow-hidden" style={GLASS}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${A.crimsonBorder}`, background: A.crimsonDim }}>
                          {["Email", "Meno", "Rola", "Plán", "Kredity", "Requesty", "Registrácia"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left font-bold tracking-widest uppercase"
                              style={{ color: A.gold }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, i) => (
                          <motion.tr key={u.id}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="transition-colors cursor-default"
                            style={{ borderBottom: `1px solid rgba(239,68,68,0.06)` }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = A.crimsonDim)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                            <td className="px-4 py-3" style={{ color: "#cbd5e1" }}>{u.email}</td>
                            <td className="px-4 py-3" style={{ color: "#64748b" }}>{u.name ?? "—"}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-bold"
                                style={u.role === "ADMIN" || u.role === "SUPERADMIN"
                                  ? { background: A.crimsonDim, color: A.crimson, border: `1px solid ${A.crimsonBorder}` }
                                  : { background: "rgba(255,255,255,0.03)", color: "#44202a", border: "1px solid rgba(255,255,255,0.06)" }}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-[0.6rem]"
                                style={{ background: A.goldDim, color: A.gold, border: `1px solid ${A.goldBorder}` }}>
                                {u.plan}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold"
                              style={{ color: u.credits > 20 ? A.gold : u.credits > 5 ? "#fb923c" : A.crimson }}>
                              {u.credits}
                            </td>
                            <td className="px-4 py-3" style={{ color: "#4b2030" }}>{u._count.aiRequests}</td>
                            <td className="px-4 py-3" style={{ color: "#44202a" }}>
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

                <h1 className="text-xl font-black mb-2 tracking-tight" style={{ color: "#f1f5f9" }}>
                  System <span style={{ color: A.gold }}>Toggles</span>
                </h1>
                <p className="text-xs mb-6" style={{ color: "#4b2030" }}>
                  Globálne prepínače modulov — napojené na site-settings.ts. Trvalé zmeny vyžadujú reštart servera.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {toggles.map((t, i) => {
                    const isHovered = hoveredToggle === t.key;
                    return (
                      <motion.div key={t.key}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="rounded-2xl p-5 flex items-center justify-between transition-all duration-300"
                        style={{
                          background: isHovered
                            ? "rgba(239,68,68,0.10)"
                            : t.enabled ? "rgba(245,158,11,0.06)" : "rgba(7,0,5,0.9)",
                          border: isHovered
                            ? `1px solid ${A.crimson}`
                            : t.enabled ? `1px solid ${A.goldBorder}` : `1px solid rgba(239,68,68,0.12)`,
                          boxShadow: isHovered
                            ? `0 0 28px ${A.crimsonGlow}, 0 0 8px ${A.crimsonGlow}`
                            : t.enabled ? `0 0 16px ${A.goldGlow}` : "none",
                          backdropFilter: "blur(20px)",
                        }}
                        onMouseEnter={() => setHoveredToggle(t.key)}
                        onMouseLeave={() => setHoveredToggle(null)}>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: isHovered ? "#f1f5f9" : "#cbd5e1" }}>
                            {t.label}
                          </p>
                          <p className="text-[0.65rem] mt-0.5 font-mono"
                            style={{ color: t.enabled ? A.gold : "#44202a" }}>
                            {t.enabled ? "▶ AKTÍVNY" : "■ VYPNUTÝ"}
                          </p>
                        </div>
                        <button
                          onClick={() => setToggles((prev) =>
                            prev.map((x) => x.key === t.key ? { ...x, enabled: !x.enabled } : x)
                          )}
                          className="transition-all duration-300 focus:outline-none"
                          style={{
                            color: isHovered ? A.crimson : t.enabled ? A.gold : "#44202a",
                            filter: isHovered
                              ? `drop-shadow(0 0 8px ${A.crimson}) drop-shadow(0 0 16px ${A.crimsonGlow})`
                              : t.enabled ? `drop-shadow(0 0 6px ${A.gold})` : "none",
                          }}>
                          {t.enabled
                            ? <ToggleRight className="w-9 h-9" />
                            : <ToggleLeft className="w-9 h-9" />
                          }
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── LOGS ── */}
            {section === "logs" && (
              <motion.div key="logs"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}>

                <h1 className="text-xl font-black mb-6 tracking-tight" style={{ color: "#f1f5f9" }}>
                  Event <span style={{ color: A.gold }}>Log</span>
                </h1>

                <div className="rounded-2xl overflow-hidden font-mono text-xs" style={GLASS}>
                  <div className="px-5 py-3 flex items-center gap-2"
                    style={{ borderBottom: `1px solid ${A.crimsonBorder}`, background: A.crimsonDim }}>
                    <Terminal className="w-3.5 h-3.5" style={{ color: A.crimson }} />
                    <span className="tracking-widest uppercase font-sans text-[0.6rem]" style={{ color: A.gold }}>
                      Stream — posledných 30 eventov
                    </span>
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }}
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ background: A.crimson, boxShadow: `0 0 6px ${A.crimson}` }} />
                  </div>
                  <div className="p-4 space-y-1.5 max-h-[60vh] overflow-y-auto"
                    style={{ background: "rgba(4,0,3,0.92)" }}>
                    {recentRequests.map((r, i) => (
                      <motion.div key={r.id}
                        initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-start gap-3 leading-relaxed">
                        <span style={{ color: "#44202a" }}>
                          {new Date(r.createdAt).toLocaleTimeString("sk-SK")}
                        </span>
                        <span style={{ color: A.crimson, textShadow: `0 0 8px ${A.crimsonGlow}` }}>
                          [AI/{r.module.toUpperCase()}]
                        </span>
                        <span style={{ color: A.cream }}>{r.user.email}</span>
                        <span style={{ color: A.gold }}>tokens={r.tokens}</span>
                      </motion.div>
                    ))}
                    {recentRequests.length === 0 && (
                      <p style={{ color: "#44202a" }}>// Žiadne udalosti.</p>
                    )}
                    <motion.div
                      animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                      className="flex items-center gap-2 mt-3">
                      <span style={{ color: A.crimson, textShadow: `0 0 6px ${A.crimson}` }}>▋</span>
                      <span style={{ color: "#44202a" }}>// čakám na ďalšie udalosti...</span>
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
