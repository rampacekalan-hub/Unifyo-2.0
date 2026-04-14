"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users, Activity, ToggleLeft, ToggleRight,
  Terminal, LogOut, ShieldAlert, Zap, TrendingUp,
  ChevronRight, Circle, Megaphone, X, Plus, Minus, Loader2, Trash2,
} from "lucide-react";
import NeuralBackground from "@/components/ui/NeuralBackground";
import { getSiteConfig } from "@/config/site-settings";
import type { AdminLogEntry } from "@/lib/admin-store";

const config = getSiteConfig();

// ── Event Horizon palette — refined ruby edition ────────────────
const A = {
  crimson:       "#dc2626",          // deep ruby — easier on eyes
  crimsonGlow:   "rgba(220,38,38,0.18)",
  crimsonBorder: "rgba(220,38,38,0.22)",
  crimsonDim:    "rgba(220,38,38,0.07)",
  crimsonSoft:   "rgba(220,38,38,0.12)",
  gold:          "#f59e0b",
  goldGlow:      "rgba(245,158,11,0.20)",
  goldBorder:    "rgba(245,158,11,0.30)",
  goldDim:       "rgba(245,158,11,0.07)",
  cream:         "#fef3c7",
  bg:            "#060004",
};

const GLASS: React.CSSProperties = {
  background: "rgba(6,0,4,0.82)",
  border: `1px solid ${A.crimsonBorder}`,
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
};

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: `1px solid ${A.crimsonBorder}`,
  borderRadius: "0.875rem",
  color: "#f1f5f9",
  outline: "none",
};

const DATETIME_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: `1px solid rgba(220,38,38,0.15)`,
  borderRadius: "0.875rem",
  color: A.gold,
  outline: "none",
  colorScheme: "dark" as const,
  padding: "0.5rem 0.75rem",
  fontSize: "0.75rem",
  width: "100%",
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

export default function AdminClient({ adminEmail, users: initUsers, stats, recentRequests }: AdminClientProps) {
  const [section, setSection] = useState<NavSection>("overview");
  const [hoveredToggle, setHoveredToggle] = useState<string | null>(null);

  // ── Toggles (live from store via SSE) ────────────────────────
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.entries(config.modules).map(([k, m]) => [k, m.enabled]))
  );
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  // ── Users with mutable credits ───────────────────────────────
  const [users, setUsers] = useState(initUsers);

  // ── Credits modal ────────────────────────────────────────────
  const [creditModal, setCreditModal] = useState<{ user: (typeof initUsers)[0] } | null>(null);
  const [creditDelta, setCreditDelta] = useState<string>("");
  const [creditLoading, setCreditLoading] = useState(false);

  // ── Broadcast ────────────────────────────────────────────────
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastStartsAt, setBroadcastStartsAt] = useState("");
  const [broadcastExpiresAt, setBroadcastExpiresAt] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [broadcastCancelling, setBroadcastCancelling] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState<{ text: string; expiresAt: string | null; startsAt: string | null } | null>(null);

  // ── Admin action log (live) ───────────────────────────────────
  const [adminLog, setAdminLog] = useState<AdminLogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // ── SSE connection ────────────────────────────────────────────
  useEffect(() => {
    const es = new EventSource("/api/events");

    es.addEventListener("init", (e) => {
      const d = JSON.parse(e.data);
      if (d.toggles) setToggles(d.toggles);
    });
    es.addEventListener("toggles", (e) => {
      const d = JSON.parse(e.data);
      if (d.toggles) setToggles(d.toggles);
    });
    es.addEventListener("admin_log", (e) => {
      const entry: AdminLogEntry = JSON.parse(e.data);
      setAdminLog((prev) => [entry, ...prev].slice(0, 200));
    });

    return () => es.close();
  }, []);

  useEffect(() => {
    fetch("/api/admin/log")
      .then((r) => r.json())
      .then((d) => { if (d.log) setAdminLog(d.log); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/admin/broadcast")
      .then((r) => r.json())
      .then((d) => { if (d.broadcast) setActiveBroadcast(d.broadcast); })
      .catch(() => {});
  }, []);

  const planMap = Object.fromEntries(stats.planCounts.map((p) => [p.plan, p._count.plan]));

  // ── Toggle handler ────────────────────────────────────────────
  async function handleToggle(key: string, current: boolean) {
    setToggleLoading(key);
    try {
      const res = await fetch("/api/admin/toggles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: key, enabled: !current }),
      });
      const data = await res.json();
      if (data.toggles) setToggles(data.toggles);
    } catch {
      // SSE will catch any server-side update
    } finally {
      setToggleLoading(null);
    }
  }

  // ── Credits submit ────────────────────────────────────────────
  async function submitCredits() {
    if (!creditModal) return;
    const delta = parseInt(creditDelta, 10);
    if (isNaN(delta) || delta === 0) return;
    setCreditLoading(true);
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: creditModal.user.id, delta }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) =>
          u.id === creditModal.user.id ? { ...u, credits: data.credits } : u
        ));
        setCreditModal(null);
        setCreditDelta("");
      }
    } finally {
      setCreditLoading(false);
    }
  }

  // ── Broadcast submit ──────────────────────────────────────────
  async function submitBroadcast() {
    if (!broadcastText.trim()) return;
    setBroadcastSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: broadcastText.trim(),
          startsAt: broadcastStartsAt ? new Date(broadcastStartsAt).toISOString() : null,
          expiresAt: broadcastExpiresAt ? new Date(broadcastExpiresAt).toISOString() : null,
        }),
      });
      if (res.ok) {
        setBroadcastSent(true);
        setActiveBroadcast({
          text: broadcastText.trim(),
          startsAt: broadcastStartsAt ? new Date(broadcastStartsAt).toISOString() : null,
          expiresAt: broadcastExpiresAt ? new Date(broadcastExpiresAt).toISOString() : null,
        });
        setBroadcastText("");
        setBroadcastStartsAt("");
        setBroadcastExpiresAt("");
        setTimeout(() => setBroadcastSent(false), 3000);
      }
    } finally {
      setBroadcastSending(false);
    }
  }

  async function cancelBroadcast() {
    setBroadcastCancelling(true);
    try {
      await fetch("/api/admin/broadcast", { method: "DELETE" });
      setActiveBroadcast(null);
    } finally {
      setBroadcastCancelling(false);
    }
  }

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
                            <th key={h} className="px-5 py-4 text-left font-bold tracking-widest uppercase"
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
                            style={{ borderBottom: `1px solid rgba(220,38,38,0.06)` }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = A.crimsonDim)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                            <td className="px-5 py-4" style={{ color: "#cbd5e1" }}>{u.email}</td>
                            <td className="px-5 py-4" style={{ color: "#64748b" }}>{u.name ?? "—"}</td>
                            <td className="px-5 py-4">
                              <span className="px-2.5 py-1 rounded-full text-[0.6rem] font-bold"
                                style={u.role === "ADMIN" || u.role === "SUPERADMIN"
                                  ? { background: A.crimsonSoft, color: A.crimson, border: `1px solid ${A.crimsonBorder}` }
                                  : { background: "rgba(255,255,255,0.03)", color: "#44202a", border: "1px solid rgba(255,255,255,0.06)" }}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="px-2.5 py-1 rounded-full text-[0.6rem]"
                                style={{ background: A.goldDim, color: A.gold, border: `1px solid ${A.goldBorder}` }}>
                                {u.plan}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <span className="font-bold" style={{ color: u.credits > 20 ? A.gold : u.credits > 5 ? "#fb923c" : A.crimson }}>
                                  {u.credits}
                                </span>
                                <button onClick={() => { setCreditModal({ user: u }); setCreditDelta(""); }}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                                  style={{ background: A.goldDim, border: `1px solid ${A.goldBorder}`, color: A.gold }}
                                  title="Upraviť kredity">
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="px-5 py-4" style={{ color: "#4b2030" }}>{u._count.aiRequests}</td>
                            <td className="px-5 py-4" style={{ color: "#44202a" }}>
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
                  {Object.entries(toggles).map(([key, enabled], i) => {
                    const isHovered = hoveredToggle === key;
                    const isLoading = toggleLoading === key;
                    return (
                      <motion.div key={key}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="rounded-2xl p-5 flex items-center justify-between transition-all duration-300"
                        style={{
                          background: isHovered ? "rgba(239,68,68,0.10)" : enabled ? "rgba(245,158,11,0.06)" : "rgba(7,0,5,0.9)",
                          border: isHovered ? `1px solid ${A.crimson}` : enabled ? `1px solid ${A.goldBorder}` : `1px solid rgba(239,68,68,0.12)`,
                          boxShadow: isHovered ? `0 0 28px ${A.crimsonGlow}` : enabled ? `0 0 16px ${A.goldGlow}` : "none",
                          backdropFilter: "blur(20px)",
                        }}
                        onMouseEnter={() => setHoveredToggle(key)}
                        onMouseLeave={() => setHoveredToggle(null)}>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: isHovered ? "#f1f5f9" : "#cbd5e1" }}>{key}</p>
                          <p className="text-[0.65rem] mt-0.5 font-mono" style={{ color: enabled ? A.gold : "#44202a" }}>
                            {enabled ? "▶ AKTÍVNY" : "■ VYPNUTÝ"}
                          </p>
                        </div>
                        <button onClick={() => handleToggle(key, enabled)} disabled={isLoading}
                          className="transition-all duration-300 focus:outline-none disabled:opacity-50"
                          style={{
                            color: isHovered ? A.crimson : enabled ? A.gold : "#44202a",
                            filter: isHovered ? `drop-shadow(0 0 8px ${A.crimson}) drop-shadow(0 0 16px ${A.crimsonGlow})` : enabled ? `drop-shadow(0 0 6px ${A.gold})` : "none",
                          }}>
                          {isLoading
                            ? <Loader2 className="w-7 h-7 animate-spin" />
                            : enabled ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />
                          }
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* ── Broadcast panel ── */}
                <div className="mt-6 rounded-2xl p-5 space-y-3" style={GLASS}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4" style={{ color: A.gold }} />
                      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: A.gold }}>Broadcast Message</span>
                    </div>
                    {activeBroadcast && (
                      <button onClick={cancelBroadcast} disabled={broadcastCancelling}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                        style={{ background: A.crimsonDim, border: `1px solid ${A.crimsonBorder}`, color: A.crimson }}>
                        {broadcastCancelling
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Trash2 className="w-3 h-3" />}
                        Zrušiť aktívny oznam
                      </button>
                    )}
                  </div>

                  {/* Active broadcast status */}
                  {activeBroadcast && (
                    <div className="rounded-xl px-3 py-2 text-xs space-y-1"
                      style={{ background: A.goldDim, border: `1px solid ${A.goldBorder}` }}>
                      <p style={{ color: A.gold }}>
                        <span style={{ opacity: 0.6 }}>Aktuálne vysielanie: </span>
                        <span className="font-bold">&ldquo;{activeBroadcast.text}&rdquo;</span>
                      </p>
                      {activeBroadcast.startsAt && (
                        <p style={{ color: A.gold, opacity: 0.75 }}>
                          Začínok: {new Date(activeBroadcast.startsAt).toLocaleString("sk-SK", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      )}
                      {activeBroadcast.expiresAt && (
                        <p style={{ color: A.gold, opacity: 0.75 }}>
                          Aktuálne vysielanie končí o: <span className="font-bold">{new Date(activeBroadcast.expiresAt).toLocaleString("sk-SK", { dateStyle: "short", timeStyle: "short" })}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Message input */}
                  <input
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Správa pre všetkých používateľov..."
                    className="w-full px-4 py-3 text-xs"
                    style={{ ...INPUT_STYLE, caretColor: A.gold }}
                  />

                  {/* Scheduling inputs — Event Horizon styled */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl p-3" style={{ background: A.crimsonDim, border: `1px solid ${A.crimsonBorder}` }}>
                      <label className="block text-[0.6rem] mb-2 tracking-widest uppercase font-semibold" style={{ color: A.gold, opacity: 0.7 }}>Začínok</label>
                      <input type="datetime-local"
                        value={broadcastStartsAt}
                        onChange={(e) => setBroadcastStartsAt(e.target.value)}
                        style={DATETIME_STYLE}
                      />
                      <p className="text-[0.55rem] mt-1.5" style={{ color: "#44202a" }}>Voliteľné — prázdne = okamžite</p>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: A.goldDim, border: `1px solid ${A.goldBorder}` }}>
                      <label className="block text-[0.6rem] mb-2 tracking-widest uppercase font-semibold" style={{ color: A.gold, opacity: 0.85 }}>Expirácia</label>
                      <input type="datetime-local"
                        value={broadcastExpiresAt}
                        onChange={(e) => setBroadcastExpiresAt(e.target.value)}
                        style={{ ...DATETIME_STYLE, border: `1px solid ${A.goldBorder}` }}
                      />
                      <p className="text-[0.55rem] mt-1.5" style={{ color: A.gold, opacity: 0.5 }}>Auto-zmazanie po expirácii</p>
                    </div>
                  </div>

                  {/* Expiry preview */}
                  {broadcastExpiresAt && (
                    <p className="text-[0.65rem]" style={{ color: A.gold, opacity: 0.8 }}>
                      Vysielanie končí o: <span className="font-bold">
                        {new Date(broadcastExpiresAt).toLocaleString("sk-SK", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </p>
                  )}

                  <button onClick={submitBroadcast} disabled={broadcastSending || !broadcastText.trim()}
                    className="w-full py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                    style={{ background: broadcastSent ? "rgba(16,185,129,0.2)" : `linear-gradient(135deg,${A.crimson},#7f1d1d)`, border: `1px solid ${broadcastSent ? "#10b981" : A.crimsonBorder}`, color: broadcastSent ? "#10b981" : "#fff", boxShadow: broadcastSent ? "none" : `0 0 12px ${A.crimsonGlow}` }}>
                    {broadcastSending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : broadcastSent ? "✓ Odoslané" : "Odoslať oznam"}
                  </button>
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
                    {/* Admin action log first */}
                    {adminLog.map((entry, i) => (
                      <motion.div key={entry.id}
                        initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.01 }}
                        className="flex items-start gap-3 leading-relaxed">
                        <span style={{ color: "#44202a" }}>{new Date(entry.ts).toLocaleTimeString("sk-SK")}</span>
                        <span style={{ color: A.gold, textShadow: `0 0 6px ${A.goldGlow}` }}>[ADMIN_ACTION]</span>
                        <span style={{ color: A.cream }}>{entry.detail}</span>
                      </motion.div>
                    ))}
                    {/* AI request log */}
                    {adminLog.length > 0 && recentRequests.length > 0 && (
                      <div className="my-2" style={{ borderTop: `1px solid rgba(239,68,68,0.1)` }} />
                    )}
                    {recentRequests.map((r, i) => (
                      <motion.div key={r.id}
                        initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.01 }}
                        className="flex items-start gap-3 leading-relaxed">
                        <span style={{ color: "#44202a" }}>{new Date(r.createdAt).toLocaleTimeString("sk-SK")}</span>
                        <span style={{ color: A.crimson, textShadow: `0 0 8px ${A.crimsonGlow}` }}>[AI/{r.module.toUpperCase()}]</span>
                        <span style={{ color: A.cream }}>{r.user.email}</span>
                        <span style={{ color: A.gold }}>tokens={r.tokens}</span>
                      </motion.div>
                    ))}
                    {adminLog.length === 0 && recentRequests.length === 0 && (
                      <p style={{ color: "#44202a" }}>// Žiadne udalosti.</p>
                    )}
                    <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                      className="flex items-center gap-2 mt-3">
                      <span style={{ color: A.crimson, textShadow: `0 0 6px ${A.crimson}` }}>▋</span>
                      <span style={{ color: "#44202a" }}>// čakám na ďalšie udalosti...</span>
                    </motion.div>
                    <div ref={logEndRef} />
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Credits Modal ── */}
      <AnimatePresence>
        {creditModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={(e) => e.target === e.currentTarget && setCreditModal(null)}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-sm"
              style={{ background: "rgba(7,0,5,0.97)", border: `1px solid ${A.goldBorder}`, boxShadow: `0 0 40px ${A.crimsonGlow}` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black tracking-widest uppercase" style={{ color: A.gold }}>Upraviť kredity</h3>
                <button onClick={() => setCreditModal(null)} style={{ color: "#44202a" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs mb-4" style={{ color: "#64748b" }}>{creditModal.user.email}</p>
              <p className="text-xs mb-1" style={{ color: "#4b2030" }}>Aktuálne: <span style={{ color: A.gold, fontWeight: 700 }}>{creditModal.user.credits}</span></p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setCreditDelta(String(parseInt(creditDelta || "0", 10) - 10))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: A.crimsonDim, border: `1px solid ${A.crimsonBorder}`, color: A.crimson }}>
                  <Minus className="w-4 h-4" />
                </button>
                <input type="number" value={creditDelta} onChange={(e) => setCreditDelta(e.target.value)}
                  placeholder="+500 alebo -50"
                  className="flex-1 rounded-xl px-3 py-2 text-sm text-center outline-none font-bold"
                  style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${A.goldBorder}`, color: A.gold, caretColor: A.gold }} />
                <button onClick={() => setCreditDelta(String(parseInt(creditDelta || "0", 10) + 10))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: A.goldDim, border: `1px solid ${A.goldBorder}`, color: A.gold }}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button onClick={submitCredits} disabled={creditLoading || !creditDelta || creditDelta === "0"}
                className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg,${A.crimson},#7f1d1d)`, color: "#fff", boxShadow: `0 0 16px ${A.crimsonGlow}` }}>
                {creditLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Potvrdiť zmenu"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
