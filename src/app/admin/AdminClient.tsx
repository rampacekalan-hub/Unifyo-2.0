"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users, Activity, ToggleLeft, ToggleRight,
  Terminal, LogOut, ShieldAlert, Zap, TrendingUp,
  ChevronRight, Circle, Megaphone, X, Plus, Minus, Loader2, Trash2,
  Brain, Pencil, Check, FileText, BarChart2, ClipboardList, Download,
  Square, CheckSquare, ArrowUpDown, Filter, AlertTriangle,
} from "lucide-react";
import NeuralBackground, { type NeuralBackgroundHandle } from "@/components/ui/NeuralBackground";
import { getSiteConfig } from "@/config/site-settings";
import type { AdminLogEntry } from "@/lib/admin-store";

const config = getSiteConfig();

// ── Polaris Drive palette ──────────────────────────────────────
const P = {
  bg:            "#0f172a",
  surface:       "rgba(15,23,42,0.92)",
  cyan:          "#22d3ee",
  cyanGlow:      "rgba(34,211,238,0.18)",
  cyanBorder:    "rgba(34,211,238,0.25)",
  cyanDim:       "rgba(34,211,238,0.07)",
  violet:        "#a78bfa",
  violetGlow:    "rgba(167,139,250,0.18)",
  violetBorder:  "rgba(167,139,250,0.25)",
  violetDim:     "rgba(167,139,250,0.07)",
  amber:         "#f59e0b",
  amberBorder:   "rgba(245,158,11,0.30)",
  amberDim:      "rgba(245,158,11,0.08)",
  red:           "#ef4444",
  redGlow:       "rgba(239,68,68,0.20)",
  redBorder:     "rgba(239,68,68,0.25)",
  redDim:        "rgba(239,68,68,0.07)",
  text:          "#f8fafc",
  muted:         "#94a3b8",
  faint:         "#334155",
};

// Keep A as alias for backward compat with existing sections
const A = {
  crimson:       P.red,
  crimsonGlow:   P.redGlow,
  crimsonBorder: P.redBorder,
  crimsonDim:    P.redDim,
  crimsonSoft:   "rgba(239,68,68,0.12)",
  gold:          P.cyan,
  goldGlow:      P.cyanGlow,
  goldBorder:    P.cyanBorder,
  goldDim:       P.cyanDim,
  cream:         "#e0f2fe",
  bg:            P.bg,
};

const GLASS: React.CSSProperties = {
  background: "rgba(15,23,42,0.80)",
  border: `1px solid ${P.cyanBorder}`,
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
};

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${P.cyanBorder}`,
  borderRadius: "0.875rem",
  color: P.text,
  outline: "none",
};

const DATETIME_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${P.cyanBorder}`,
  borderRadius: "0.875rem",
  color: P.cyan,
  outline: "none",
  colorScheme: "dark" as const,
  padding: "0.5rem 0.75rem",
  fontSize: "0.75rem",
  width: "100%",
};

// TODO: add admin analytics view — query AnalyticsEvent counts (24h/7d/30d)
// and distinct-userId "active users" stats. Skipped in this pass because the
// admin dashboard is large and a focused Analytics tab deserves its own PR.
type NavSection = "overview" | "users" | "toggles" | "logs" | "neural" | "governance" | "sandbox" | "policy" | "roi" | "audit" | "explorer" | "plans" | "identity";
type MembershipTier = "BASIC" | "PREMIUM" | "ENTERPRISE";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  membershipTier: MembershipTier;
  todayUsage: number;
  createdAt: Date | string;
  _count: { aiRequests: number };
}

interface NeuralMemoryEntry {
  id: string;
  userId: string | null;
  module: string;
  role: string;
  anonymizedContent: string | null;
  summary: string | null;
  context: string;
  confidenceScore: number;
  importance: number;
  isEdited: boolean;
  createdAt: string;
}

interface GovernanceState {
  temperature: number;
  safetyLevel: number;
  persona: string;
}

interface NeuralStats {
  totalMemories: number;
  recentMemories: number;
  editedMemories: number;
  lowConfidence: number;
  personalCount: number;
  workCount: number;
  topUsers: { userId: string; _count: { id: number } }[];
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
  { id: "overview",   icon: TrendingUp,    label: "Overview"        },
  { id: "users",      icon: Users,         label: "Používatelia"    },
  { id: "toggles",    icon: Zap,           label: "Sys Toggles"     },
  { id: "neural",     icon: Brain,         label: "Neural Insight"  },
  { id: "governance", icon: ShieldAlert,   label: "AI Governance"   },
  { id: "policy",     icon: FileText,      label: "Policy Engine"   },
  { id: "sandbox",    icon: Activity,      label: "Brain Sandbox"   },
  { id: "roi",        icon: BarChart2,     label: "ROI Dashboard"   },
  { id: "audit",      icon: ClipboardList, label: "Audit Trail"     },
  { id: "explorer",   icon: Users,         label: "User Explorer"   },
  { id: "plans",      icon: BarChart2,     label: "Membership Plans" },
  { id: "identity",   icon: Brain,         label: "Identity Hub"    },
  { id: "logs",       icon: Terminal,      label: "Event Log"       },
];

interface MembershipPlan {
  id: string; tier: string; label: string;
  dailyRequests: number | null; memorySlots: number;
  contextWindow: number; userPolicies: number;
  price: number; description: string;
}

interface ExplorerUser {
  id: string; email: string; name: string | null; role: string;
  plan: string; membershipTier: string; lastActiveAt: string | null;
  createdAt: string; requestCount: number; memoryCount: number;
}

interface UserInsights {
  userId: string; totalMemories: number; totalRequests: number;
  totalTokens: number; minutesSaved: number;
  toneBreakdown: { tone: string; count: number }[];
  contextBreakdown: { context: string; count: number }[];
  dailyBuckets: Record<string, number>;
}

const TIER_COLORS: Record<MembershipTier, { bg: string; border: string; text: string }> = {
  BASIC:      { bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)",  text: "#94a3b8" },
  PREMIUM:    { bg: P.cyanDim,                border: P.cyanBorder,            text: P.cyan    },
  ENTERPRISE: { bg: P.violetDim,              border: P.violetBorder,          text: P.violet  },
};

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

  // ── Tier modal (replaces credits modal) ────────────────────────
  const [creditModal, setCreditModal] = useState<{ user: (typeof initUsers)[0] } | null>(null);
  const [selectedTier, setSelectedTier] = useState<MembershipTier>("BASIC");
  const [creditLoading, setCreditLoading] = useState(false);

  // ── Neural Insight ────────────────────────────────────────
  const [neuralStats, setNeuralStats] = useState<NeuralStats | null>(null);
  const [thoughtStream, setThoughtStream] = useState<NeuralMemoryEntry[]>([]);
  const [neuralLoading, setNeuralLoading] = useState(false);
  const [editingMemory, setEditingMemory] = useState<string | null>(null);
  const [editSummary, setEditSummary] = useState("");
  const [editImportance, setEditImportance] = useState(0.5);
  const [editSaving, setEditSaving] = useState(false);
  const [streamFilter, setStreamFilter] = useState<"all" | "personal" | "work" | "low">("all");

  // ── Governance ────────────────────────────────────────────
  const [governance, setGovernanceState] = useState<GovernanceState>({
    temperature: 0.7, safetyLevel: 0.7,
    persona: "Si Personal Neural OS pre život a prácu. Si diskrétny, empatický a zameraný na výsledky.",
  });
  const [govSaving, setGovSaving] = useState(false);
  const [govSaved, setGovSaved] = useState(false);
  const [purgeUserId, setPurgeUserId] = useState("");
  const [purging, setPurging] = useState(false);
  const [mapPulse, setMapPulse] = useState<"idle" | "active" | "error">("idle");

  // ── Brain Sandbox ───────────────────────────────────────────
  const [sbInput, setSbInput] = useState("");
  const [sbResponse, setSbResponse] = useState("");
  const [sbModule, setSbModule] = useState("sandbox");
  const [sbUserId, setSbUserId] = useState("");
  const [sbRunning, setSbRunning] = useState(false);
  const [sbPipelineStep, setSbPipelineStep] = useState(-1); // -1 = idle
  const [sbSimCount, setSbSimCount] = useState(0); // for system load HUD
  interface SandboxResult {
    id: string;
    anonymizedInput: string;
    anonymizedResponse: string;
    context: string;
    emotionalTone: string;
    confidenceScore: number;
    relevanceTTL: string | null;
  }
  interface MindReaderSuggestion {
    id: string;
    label: string;
    context: string;
    emotionalTone: string;
    confidence: number;
    module: string;
    date: string;
  }
  const [sbResult, setSbResult] = useState<SandboxResult | null>(null);
  const [sbError, setSbError] = useState<string | null>(null);
  const [sbSuggestions, setSbSuggestions] = useState<MindReaderSuggestion[]>([]);
  const [sbSugLoading, setSbSugLoading] = useState(false);

  // ── System Load (for Governance HUD) ────────────────────────
  const [systemLoad, setSystemLoad] = useState(0); // 0-1

  // ── Policy Engine ────────────────────────────────────────────
  interface NeuralPolicy {
    id: string; name: string; rule: string;
    severity: "low" | "medium" | "high" | "critical";
    context: "all" | "personal" | "work";
    isActive: boolean; createdBy: string | null; createdAt: string;
  }
  const [policies, setPolicies] = useState<NeuralPolicy[]>([]);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyForm, setPolicyForm] = useState<{ name: string; rule: string; severity: "low"|"medium"|"high"|"critical"; context: "all"|"personal"|"work"; isActive: boolean }>({ name: "", rule: "", severity: "medium", context: "all", isActive: true });
  const [policyEditing, setPolicyEditing] = useState<string | null>(null);
  const [policySaving, setPolicySaving] = useState(false);

  // ── ROI Dashboard ────────────────────────────────────────────
  interface RoiData {
    totalTokens: number; totalRequests: number;
    minutesSaved: number; costSaved: number;
    dailyBuckets: Record<string, number>;
  }
  const [roiData, setRoiData] = useState<RoiData | null>(null);
  const [roiLoading, setRoiLoading] = useState(false);

  // ── Audit Trail ──────────────────────────────────────────────
  interface AuditEntry {
    id: string; adminEmail: string; action: string;
    targetId: string | null; before: unknown; after: unknown;
    metadata: unknown; createdAt: string;
  }
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState("");

  // ── Bulk Actions (Thought Stream) ────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"delete" | "archive" | "importance" | "recategorize">("delete");
  const [bulkValue, setBulkValue] = useState<string>("");
  const [bulkRunning, setBulkRunning] = useState(false);

  // ── System Health ────────────────────────────────────────────
  const [systemHealth, setSystemHealth] = useState<{ db: "ok" | "warn" | "error"; api: "ok" | "warn" | "error"; memory: number }>({ db: "ok", api: "ok", memory: 0 });

  // ── Membership Plans ─────────────────────────────────────────
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansSaving, setPlansSaving] = useState<string | null>(null);
  const [plansEdit, setPlansEdit] = useState<Record<string, Partial<MembershipPlan>>>({});
  const [plansError, setPlansError] = useState<string | null>(null);

  // ── User Explorer ────────────────────────────────────────────
  const [explorerUsers, setExplorerUsers] = useState<ExplorerUser[]>([]);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [explorerSort, setExplorerSort] = useState<{ key: keyof ExplorerUser; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });
  const [explorerFilter, setExplorerFilter] = useState("");
  const [insightsUser, setInsightsUser] = useState<ExplorerUser | null>(null);
  const [insightsData, setInsightsData] = useState<UserInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // ── Identity Hub ─────────────────────────────────────────
  interface IntentEntry { id: string; pattern: string; note: string; taskTitle: string; }
  const DEFAULT_INTENTS: IntentEntry[] = [
    { id: "1", pattern: "hypo",        note: "Záujem o hypotéku",    taskTitle: "Konzultácia: Hypotéka"   },
    { id: "2", pattern: "poistenie",   note: "Záujem o poistenie",   taskTitle: "Konzultácia: Poistenie"  },
    { id: "3", pattern: "ponuka",      note: "Záujem o ponuku",     taskTitle: "Príprava ponuky"         },
    { id: "4", pattern: "zmluva",      note: "Riešenie zmluvy",     taskTitle: "Príprava zmluvy"         },
    { id: "5", pattern: "investicia",  note: "Záujem o investíciu",  taskTitle: "Konzultácia: Investície" },
    { id: "6", pattern: "úver",         note: "Záujem o úver",       taskTitle: "Konzultácia: Úver"       },
    { id: "7", pattern: "dane",        note: "Daňové poradenstvo",  taskTitle: "Konzultácia: Dane"       },
  ];
  const [intents, setIntents] = useState<IntentEntry[]>(DEFAULT_INTENTS);
  const [newIntent, setNewIntent] = useState<Omit<IntentEntry, "id">>({ pattern: "", note: "", taskTitle: "" });
  const [identityPrompt, setIdentityPrompt] = useState(config.ai.systemPrompts.base);
  const [identitySaved, setIdentitySaved] = useState(false);
  const [meshDensity, setMeshDensity] = useState(config.branding.themeEngine.particleDensity);
  const [meshSpeed, setMeshSpeed] = useState(config.branding.themeEngine.particleSpeed);
  const [meshOpacity, setMeshOpacity] = useState(config.branding.themeEngine.particleOpacity);
  const neuralBgRef = useRef<NeuralBackgroundHandle>(null);

  // ── Broadcast ────────────────────────────────────────────
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

  // ── Load neural data when section changes ──────────────────
  useEffect(() => {
    if (section !== "neural") return;
    setNeuralLoading(true);
    fetch("/api/admin/neural")
      .then((r) => r.json())
      .then((d) => { setNeuralStats(d.stats); setThoughtStream(d.stream); })
      .catch(() => {})
      .finally(() => setNeuralLoading(false));
  }, [section]);

  // ── Load Policy Engine data ────────────────────────────────────
  useEffect(() => {
    if (section !== "policy") return;
    setPolicyLoading(true);
    fetch("/api/admin/policy")
      .then((r) => r.json())
      .then((d) => { if (d.policies) setPolicies(d.policies); })
      .catch(() => {})
      .finally(() => setPolicyLoading(false));
  }, [section]);

  // ── Load ROI data ──────────────────────────────────────────────
  useEffect(() => {
    if (section !== "roi") return;
    setRoiLoading(true);
    fetch("/api/admin/neural?roi=1")
      .then((r) => r.json())
      .then((d) => { if (d.roi) setRoiData(d.roi); })
      .catch(() => {})
      .finally(() => setRoiLoading(false));
  }, [section]);

  // ── Load Audit Trail ───────────────────────────────────────────
  useEffect(() => {
    if (section !== "audit") return;
    setAuditLoading(true);
    fetch("/api/admin/neural?audit=1")
      .then((r) => r.json())
      .then((d) => { if (d.logs) setAuditLogs(d.logs); })
      .catch(() => {})
      .finally(() => setAuditLoading(false));
  }, [section]);

  // ── Load Membership Plans ──────────────────────────────────────
  useEffect(() => {
    if (section !== "plans") return;
    setPlansLoading(true);
    setPlansError(null);
    fetch("/api/admin/membership-plans")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) { setPlansError(d.error ?? `HTTP ${r.status}`); return; }
        if (d.plans && d.plans.length > 0) {
          setMembershipPlans(d.plans);
          const init: Record<string, Partial<MembershipPlan>> = {};
          for (const p of d.plans as MembershipPlan[]) init[p.tier] = { ...p };
          setPlansEdit(init);
        } else {
          setPlansError("Žiadne plány v DB — seed zlyhal.");
        }
      })
      .catch((e) => setPlansError(String(e)))
      .finally(() => setPlansLoading(false));
  }, [section]);

  // ── Load User Explorer data ────────────────────────────────────
  useEffect(() => {
    if (section !== "explorer") return;
    setExplorerLoading(true);
    fetch("/api/admin/user-explorer")
      .then((r) => r.json())
      .then((d) => { if (d.users) setExplorerUsers(d.users); })
      .catch(() => {})
      .finally(() => setExplorerLoading(false));
  }, [section]);

  // ── System Health ping (every 30s) ─────────────────────────────
  useEffect(() => {
    async function ping() {
      try {
        const start = Date.now();
        const r = await fetch("/api/admin/neural?governance=1");
        const latency = Date.now() - start;
        const memoryMB = (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize
          ? Math.round((performance as { memory?: { usedJSHeapSize: number } }).memory!.usedJSHeapSize / 1048576)
          : 0;
        setSystemHealth({
          db: r.ok ? "ok" : "error",
          api: latency < 400 ? "ok" : latency < 1200 ? "warn" : "error",
          memory: memoryMB,
        });
      } catch {
        setSystemHealth((h) => ({ ...h, db: "error", api: "error" }));
      }
    }
    ping();
    const id = setInterval(ping, 30_000);
    return () => clearInterval(id);
  }, []);

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

  // ── Tier submit ────────────────────────────────────────────────
  async function submitTier() {
    if (!creditModal) return;
    setCreditLoading(true);
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: creditModal.user.id, membershipTier: selectedTier }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) =>
          u.id === creditModal.user.id ? { ...u, membershipTier: data.membershipTier } : u
        ));
        setCreditModal(null);
      }
    } finally {
      setCreditLoading(false);
    }
  }

  // ── Memory edit submit ──────────────────────────────────────
  async function saveMemoryEdit(id: string) {
    setEditSaving(true);
    try {
      const res = await fetch("/api/admin/neural", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, summary: editSummary, importance: editImportance }),
      });
      if (res.ok) {
        setThoughtStream((prev) => prev.map((m) =>
          m.id === id ? { ...m, summary: editSummary, importance: editImportance, isEdited: true } : m
        ));
        setEditingMemory(null);
      }
    } finally {
      setEditSaving(false);
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

      {/* ── Polaris ambient glow ── */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div style={{
          position: "absolute", top: 0, left: 0, width: 520, height: 520,
          background: "radial-gradient(ellipse at top left, rgba(34,211,238,0.08) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: 0, right: 0, width: 520, height: 520,
          background: "radial-gradient(ellipse at bottom right, rgba(167,139,250,0.07) 0%, transparent 70%)",
        }} />
      </div>

      <NeuralBackground
        ref={neuralBgRef}
        themeEngine={{
          ...config.branding.themeEngine,
          particleDensity: meshDensity,
          particleSpeed: meshSpeed,
          particleOpacity: meshOpacity,
        }}
      />

      {/* ── SIDEBAR ── */}
      <aside className="w-16 md:w-64 flex-shrink-0 flex flex-col h-full z-10"
        style={{ background: "rgba(15,23,42,0.90)", borderRight: `1px solid ${P.cyanBorder}`, backdropFilter: "blur(28px)" }}>

        {/* Logo */}
        <div className="h-16 flex items-center px-4 md:px-6 gap-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${P.cyanBorder}` }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg,${P.cyan},#0e7490)`, boxShadow: `0 0 20px ${P.cyanGlow}` }}>
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-black tracking-widest uppercase" style={{ color: P.cyan }}>
              ADMIN CORE
            </p>
            <p className="text-[0.6rem] tracking-widest" style={{ color: P.faint }}>Polaris Drive</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV.map(({ id, icon: Icon, label }) => {
            const active = section === id;
            return (
              <button key={id} onClick={() => setSection(id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200"
                style={{
                  background: active ? P.cyanDim : "transparent",
                  border: active ? `1px solid ${P.cyanBorder}` : "1px solid transparent",
                  boxShadow: active ? `0 0 16px ${P.cyanGlow}` : "none",
                }}>
                <Icon className="w-4 h-4 flex-shrink-0"
                  style={{ color: active ? P.cyan : P.faint, filter: active ? `drop-shadow(0 0 6px ${P.cyan})` : "none" }} />
                <span className="text-xs font-semibold hidden md:block"
                  style={{ color: active ? P.text : P.muted }}>{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto hidden md:block" style={{ color: P.cyan }} />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: `1px solid ${P.cyanBorder}` }}>
          <p className="text-[0.6rem] hidden md:block mb-2 truncate" style={{ color: P.faint }}>{adminEmail}</p>
          <Link href="/admin/errors"
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl transition-all duration-200 mb-1"
            style={{ color: P.muted }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = "#a78bfa";
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(124,58,237,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = P.muted;
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            }}>
            <span className="text-xs hidden md:block">⚠ Error log</span>
          </Link>
          <Link href="/dashboard"
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl transition-all duration-200"
            style={{ color: P.muted }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = P.cyan;
              (e.currentTarget as HTMLAnchorElement).style.background = P.cyanDim;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = P.muted;
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
        <header className="h-16 flex items-center justify-between px-6 flex-shrink-0"
          style={{
            borderBottom: `1px solid ${P.cyanBorder}`,
            background: "rgba(15,23,42,0.85)",
            backdropFilter: "blur(16px)",
          }}>
          <div className="flex items-center gap-3">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="flex items-center gap-1.5 text-[0.65rem] font-bold tracking-widest uppercase"
              style={{ color: P.cyan }}>
              <Circle className="w-1.5 h-1.5 fill-current"
                style={{ filter: `drop-shadow(0 0 6px ${P.cyan})` }} />
              NEURAL OS ONLINE
            </motion.span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {/* System Health */}
            <div className="hidden sm:flex items-center gap-2">
              {[
                { label: "DB",  status: systemHealth.db  },
                { label: "API", status: systemHealth.api },
              ].map(({ label, status }) => {
                const c = status === "ok" ? P.cyan : status === "warn" ? P.amber : P.red;
                return (
                  <div key={label} className="flex items-center gap-1">
                    <motion.span
                      animate={{ opacity: status === "ok" ? [1,0.4,1] : 1, scale: status === "error" ? [1,1.3,1] : 1 }}
                      transition={{ duration: status === "ok" ? 2 : 0.6, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: c, boxShadow: `0 0 6px ${c}` }}
                    />
                    <span className="text-[0.6rem] font-bold" style={{ color: c }}>{label}</span>
                  </div>
                );
              })}
              {systemHealth.memory > 0 && (
                <span className="text-[0.6rem]" style={{ color: P.faint }}>{systemHealth.memory}MB</span>
              )}
              <span style={{ color: P.faint }}>·</span>
            </div>
            <span style={{ color: P.cyan, fontWeight: 700 }}>{stats.totalUsers}</span>
            <span style={{ color: P.faint }}>používateľov</span>
            <span style={{ color: P.faint }}>·</span>
            <span style={{ color: P.violet, fontWeight: 700 }}>{stats.totalRequests}</span>
            <span style={{ color: P.faint }}>AI requestov</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ background: P.bg }}>
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
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-full text-[0.6rem] font-bold"
                                  style={{ background: TIER_COLORS[u.membershipTier].bg, border: `1px solid ${TIER_COLORS[u.membershipTier].border}`, color: TIER_COLORS[u.membershipTier].text }}>
                                  {u.membershipTier}
                                </span>
                                <button onClick={() => { setCreditModal({ user: u }); setSelectedTier(u.membershipTier); }}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
                                  style={{ background: A.goldDim, border: `1px solid ${A.goldBorder}`, color: A.gold }}
                                  title="Zmeniť tier">
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span style={{ color: u.todayUsage > 40 ? A.crimson : u.todayUsage > 20 ? "#fb923c" : A.gold }}>
                                {u.todayUsage}
                              </span>
                              <span style={{ color: "#44202a", fontSize: "0.6rem" }}> dnes</span>
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

            {/* ── NEURAL INSIGHT ── */}
            {section === "neural" && (
              <motion.div key="neural"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}>

                <div className="flex items-center gap-3 mb-6">
                  <Brain className="w-5 h-5" style={{ color: A.gold, filter: `drop-shadow(0 0 8px ${A.goldGlow})` }} />
                  <h1 className="text-xl font-black tracking-tight" style={{ color: "#f1f5f9" }}>
                    Neural <span style={{ color: A.gold }}>Insight</span>
                  </h1>
                  <button onClick={() => { setNeuralLoading(true); fetch("/api/admin/neural").then(r => r.json()).then(d => { setNeuralStats(d.stats); setThoughtStream(d.stream); }).finally(() => setNeuralLoading(false)); }}
                    className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{ background: A.goldDim, border: `1px solid ${A.goldBorder}`, color: A.gold }}>
                    {neuralLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "↺ Refresh"}
                  </button>
                </div>

                {/* Neural Map SVG HUD */}
                <div className="rounded-2xl overflow-hidden mb-6" style={GLASS}>
                  <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${P.cyanBorder}`, background: P.cyanDim }}>
                    <Brain className="w-3.5 h-3.5" style={{ color: P.cyan }} />
                    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: P.cyan }}>Neural Map — Data Flow</span>
                    <motion.span animate={{ opacity: [1,0.3,1] }} transition={{ duration:1.8, repeat:Infinity }}
                      className="ml-auto w-2 h-2 rounded-full" style={{ background: mapPulse === "error" ? P.red : P.cyan,
                        boxShadow: `0 0 8px ${mapPulse === "error" ? P.red : P.cyan}` }} />
                  </div>
                  <div className="px-6 py-6">
                    <svg viewBox="0 0 700 120" className="w-full" style={{ overflow: "visible" }}>
                      {/* Connection lines */}
                      {[[130,60,210,60],[290,60,370,60],[450,60,530,60],[610,60,680,60]].map(([x1,y1,x2,y2],i) => (
                        <g key={i}>
                          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={P.faint} strokeWidth="1.5" strokeDasharray="4 3" />
                          <motion.circle r="4" fill={mapPulse==="error" ? P.red : P.cyan}
                            style={{ filter: `drop-shadow(0 0 4px ${mapPulse==="error" ? P.red : P.cyan})` }}
                            animate={{ cx: [x1, x2] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.35, ease: "linear" }} />
                        </g>
                      ))}
                      {/* Nodes */}
                      {[
                        { cx:65,  label:"INPUT",       sub:"Vstup",       color:"#f8fafc",  r:42 },
                        { cx:250, label:"ANONYMIZER",  sub:"GDPR Shield",  color:P.amber,   r:42 },
                        { cx:410, label:"NEURAL CORE", sub:"GPT Bridge",   color:P.cyan,    r:48 },
                        { cx:570, label:"MEMORY BANK", sub:"Personal/Work",color:P.violet,  r:42 },
                        { cx:690, label:"OUTPUT",      sub:"Response",     color:P.cyan,    r:36 },
                      ].map(({ cx, label, sub, color, r }) => (
                        <g key={label}>
                          <circle cx={cx} cy={60} r={r} fill="rgba(15,23,42,0.9)"
                            stroke={color} strokeWidth="1.5"
                            style={{ filter: `drop-shadow(0 0 8px ${color}44)` }} />
                          <text x={cx} y={54} textAnchor="middle" fill={color}
                            fontSize="8" fontWeight="700" fontFamily="monospace" letterSpacing="1">{label}</text>
                          <text x={cx} y={68} textAnchor="middle" fill={P.muted}
                            fontSize="7" fontFamily="sans-serif">{sub}</text>
                        </g>
                      ))}
                      {/* Personal/Work branches from Memory Bank */}
                      <line x1={570} y1={88} x2={570} y2={110} stroke={P.faint} strokeWidth="1" />
                      <line x1={540} y1={110} x2={600} y2={110} stroke={P.faint} strokeWidth="1" />
                      <text x={535} y={120} fill={P.violet} fontSize="7" fontFamily="monospace">personal</text>
                      <text x={575} y={120} fill={P.cyan} fontSize="7" fontFamily="monospace">work</text>
                    </svg>
                    <p className="text-[0.6rem] text-center mt-3 tracking-widest" style={{ color: P.faint }}>
                      {mapPulse === "error" ? "⚠ Posledná inferencja zlyhala — skontroluj OPENAI_API_KEY" :
                       mapPulse === "active" ? "↯ Aktívna inferencia" : "● Systém v pohotovosti"}
                    </p>
                  </div>
                </div>

                {/* Stats grid */}
                {neuralStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                    {[
                      { label: "Celkom",     value: neuralStats.totalMemories,  color: P.cyan   },
                      { label: "24h",        value: neuralStats.recentMemories, color: P.cyan   },
                      { label: "Upravené",   value: neuralStats.editedMemories, color: P.violet },
                      { label: "Nízka conf.",value: neuralStats.lowConfidence,  color: P.red    },
                      { label: "Personal",   value: neuralStats.personalCount,  color: P.violet },
                      { label: "Work",       value: neuralStats.workCount,      color: P.cyan   },
                    ].map((s) => (
                      <div key={s.label} className="rounded-2xl p-4 text-center" style={GLASS}>
                        <p className="text-2xl font-black" style={{ color: s.color, textShadow: `0 0 12px ${s.color}55` }}>{s.value}</p>
                        <p className="text-[0.6rem] mt-1 tracking-widest uppercase" style={{ color: P.faint }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Thought Stream */}
                <div className="rounded-2xl overflow-hidden" style={GLASS}>
                  <div className="px-5 py-3 flex items-center gap-2 flex-wrap" style={{ borderBottom: `1px solid ${P.cyanBorder}`, background: P.cyanDim }}>
                    <Brain className="w-3.5 h-3.5" style={{ color: P.cyan }} />
                    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: P.cyan }}>Thought Stream</span>
                    <div className="flex gap-1.5 ml-3">
                      {(["all","personal","work","low"] as const).map((f) => (
                        <button key={f} onClick={() => setStreamFilter(f)}
                          className="px-2 py-0.5 rounded-full text-[0.6rem] font-bold transition-all"
                          style={{
                            background: streamFilter===f ? (f==="personal" ? P.violetDim : f==="low" ? P.redDim : P.cyanDim) : "transparent",
                            border: `1px solid ${streamFilter===f ? (f==="personal" ? P.violetBorder : f==="low" ? P.redBorder : P.cyanBorder) : P.faint}`,
                            color: streamFilter===f ? (f==="personal" ? P.violet : f==="low" ? P.red : P.cyan) : P.muted,
                          }}>{f}</button>
                      ))}
                    </div>
                    <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                      className="ml-auto w-2 h-2 rounded-full" style={{ background: P.cyan }} />
                  </div>
                  {/* Bulk Actions toolbar */}
                  {selectedIds.size > 0 && (
                    <div className="px-5 py-2.5 flex items-center gap-3 flex-wrap" style={{ background: P.amberDim, borderBottom: `1px solid ${P.amberBorder}` }}>
                      <span className="text-[0.65rem] font-bold" style={{ color: P.amber }}>{selectedIds.size} vybraných</span>
                      <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value as typeof bulkAction)}
                        className="px-2 py-1 rounded-lg text-[0.65rem] outline-none" style={{ background: "rgba(15,23,42,0.9)", border: `1px solid ${P.amberBorder}`, color: P.text }}>
                        <option value="delete">🗑 Vymazať</option>
                        <option value="archive">📦 Archivovať</option>
                        <option value="importance">⭐ Nastaviť dôležitosť</option>
                        <option value="recategorize">🏷 Preklasifikovať</option>
                      </select>
                      {bulkAction === "importance" && (
                        <input type="number" min={0} max={1} step={0.1} value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}
                          placeholder="0.0–1.0" className="w-20 px-2 py-1 rounded-lg text-[0.65rem] outline-none"
                          style={{ background: "rgba(15,23,42,0.9)", border: `1px solid ${P.amberBorder}`, color: P.text }} />
                      )}
                      {bulkAction === "recategorize" && (
                        <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}
                          className="px-2 py-1 rounded-lg text-[0.65rem] outline-none" style={{ background: "rgba(15,23,42,0.9)", border: `1px solid ${P.amberBorder}`, color: P.text }}>
                          <option value="work">work</option>
                          <option value="personal">personal</option>
                        </select>
                      )}
                      <button onClick={async () => {
                        if (bulkAction === "delete" && !confirm(`Vymazať ${selectedIds.size} memories?`)) return;
                        setBulkRunning(true);
                        try {
                          const body: Record<string, unknown> = { bulk: true, action: bulkAction, ids: Array.from(selectedIds) };
                          if (bulkValue) body.value = bulkAction === "importance" ? parseFloat(bulkValue) : bulkValue;
                          const res = await fetch("/api/admin/neural", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                          const d = await res.json();
                          if (d.success) {
                            if (bulkAction === "delete") setThoughtStream(prev => prev.filter(m => !selectedIds.has(m.id)));
                            setSelectedIds(new Set());
                          }
                        } finally { setBulkRunning(false); }
                      }} disabled={bulkRunning}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[0.65rem] font-bold disabled:opacity-40"
                        style={{ background: bulkAction === "delete" ? P.red : P.amber, color: "#fff" }}>
                        {bulkRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Vykonať
                      </button>
                      <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-[0.65rem]" style={{ color: P.faint }}>✕ Zrušiť výber</button>
                    </div>
                  )}
                  <div className="divide-y max-h-[55vh] overflow-y-auto" style={{ borderColor: P.faint }}>
                    {neuralLoading && (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin" style={{ color: A.gold }} />
                      </div>
                    )}
                    {!neuralLoading && thoughtStream.length === 0 && (
                      <p className="text-xs text-center py-12" style={{ color: P.faint }}>// Zatiaľ žiadne memories. Začni chatovať v dashboarde.</p>
                    )}
                    {thoughtStream
                      .filter((m) => {
                        if (streamFilter === "personal") return m.context === "personal";
                        if (streamFilter === "work")     return m.context === "work";
                        if (streamFilter === "low")      return m.confidenceScore < 0.3;
                        return true;
                      })
                      .map((m, i) => (
                      <motion.div key={m.id}
                        initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.015 }}
                        className="px-5 py-3 flex items-start gap-2"
                        style={{ background: selectedIds.has(m.id) ? "rgba(245,158,11,0.05)" : undefined }}>
                        <button onClick={() => setSelectedIds(prev => { const n = new Set(prev); n.has(m.id) ? n.delete(m.id) : n.add(m.id); return n; })}
                          className="flex-shrink-0 mt-1 w-4 h-4 rounded flex items-center justify-center transition-all"
                          style={{ border: `1px solid ${selectedIds.has(m.id) ? P.amber : P.faint}`, background: selectedIds.has(m.id) ? P.amberDim : "transparent" }}>
                          {selectedIds.has(m.id) && <Check className="w-2.5 h-2.5" style={{ color: P.amber }} />}
                        </button>
                        <div className="flex-1 min-w-0">
                        {editingMemory === m.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[0.6rem] font-bold tracking-widest uppercase" style={{ color: A.gold }}>Manual Intervention</span>
                              <button onClick={() => setEditingMemory(null)} style={{ color: "#44202a", marginLeft: "auto" }}>
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <textarea value={editSummary} onChange={(e) => setEditSummary(e.target.value)} rows={3}
                              className="w-full text-xs px-3 py-2 rounded-xl outline-none resize-none"
                              style={{ ...INPUT_STYLE, caretColor: A.gold }} />
                            <div className="flex items-center gap-3">
                              <label className="text-[0.6rem] tracking-widest uppercase" style={{ color: "#44202a" }}>Dôležitosť: {editImportance.toFixed(2)}</label>
                              <input type="range" min={0} max={1} step={0.05} value={editImportance}
                                onChange={(e) => setEditImportance(parseFloat(e.target.value))}
                                className="flex-1 accent-amber-400" />
                            </div>
                            <button onClick={() => saveMemoryEdit(m.id)} disabled={editSaving || !editSummary.trim()}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold disabled:opacity-40"
                              style={{ background: A.goldDim, border: `1px solid ${A.goldBorder}`, color: A.gold }}>
                              {editSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Uložiť opravenú spomienku
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  background: m.role === "assistant" ? A.goldDim : A.crimsonDim,
                                  color: m.role === "assistant" ? A.gold : A.crimson,
                                  border: `1px solid ${m.role === "assistant" ? A.goldBorder : A.crimsonBorder}`,
                                }}>
                                {m.role === "assistant" ? "AI" : "USER"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs leading-relaxed" style={{ color: m.isEdited ? P.cyan : P.muted }}>
                                {m.summary ?? (m.anonymizedContent ?? "").slice(0, 200)}{(m.anonymizedContent ?? "").length > 200 && !m.summary ? "…" : ""}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-[0.6rem]" style={{ color: P.faint }}>
                                  {new Date(m.createdAt).toLocaleString("sk-SK", { dateStyle: "short", timeStyle: "short" })}
                                </span>
                                <span className="text-[0.6rem]" style={{ color: P.faint }}>modul: {m.module}</span>
                                <span className="px-1.5 py-0.5 rounded text-[0.55rem] font-bold"
                                  style={{
                                    background: m.context === "personal" ? P.violetDim : P.cyanDim,
                                    color: m.context === "personal" ? P.violet : P.cyan,
                                    border: `1px solid ${m.context === "personal" ? P.violetBorder : P.cyanBorder}`,
                                  }}>
                                  {m.context}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[0.55rem] font-bold"
                                  style={{
                                    background: m.confidenceScore < 0.3 ? P.redDim : P.amberDim,
                                    color: m.confidenceScore < 0.3 ? P.red : P.amber,
                                    border: `1px solid ${m.confidenceScore < 0.3 ? P.redBorder : P.amberBorder}`,
                                  }}>
                                  conf: {m.confidenceScore.toFixed(2)}
                                </span>
                                <span className="text-[0.6rem]" style={{ color: P.faint }}>imp: {m.importance.toFixed(2)}</span>
                                {m.isEdited && <span className="text-[0.6rem] font-bold" style={{ color: P.cyan }}>✎ upravené</span>}
                              </div>
                            </div>
                            <button onClick={() => { setEditingMemory(m.id); setEditSummary(m.summary ?? (m.anonymizedContent ?? "")); setEditImportance(m.importance); }}
                              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                              style={{ background: A.goldDim, border: `1px solid ${A.goldBorder}`, color: A.gold }}>
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        </div>
                      </motion.div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── GOVERNANCE ── */}
            {section === "governance" && (
              <motion.div key="governance"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}>

                <h1 className="text-xl font-black mb-2 tracking-tight" style={{ color: P.text }}>
                  AI <span style={{ color: P.violet }}>Governance</span>
                </h1>
                <p className="text-xs mb-6" style={{ color: P.muted }}>Nastavenie globálnych parametrov Neural OS. Zmeny sú aktívne okamžite bez restartu.</p>

                {/* System Load HUD */}
                <div className="rounded-2xl p-5 mb-6" style={{
                  background: `linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.7))`,
                  border: `1px solid ${systemLoad > 0.6 ? P.redBorder : systemLoad > 0.3 ? P.amberBorder : P.cyanBorder}`,
                  boxShadow: `0 0 ${20 + systemLoad * 40}px ${systemLoad > 0.6 ? P.redGlow : systemLoad > 0.3 ? "rgba(251,146,60,0.15)" : P.cyanGlow}`,
                  transition: "all 0.8s ease",
                }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1 + systemLoad * 0.4, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: Math.max(0.4, 2 - systemLoad * 1.5), repeat: Infinity, ease: "easeInOut" }}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          background: systemLoad > 0.6 ? P.red : systemLoad > 0.3 ? "#fb923c" : P.cyan,
                          boxShadow: `0 0 ${8 + systemLoad * 16}px ${systemLoad > 0.6 ? P.red : systemLoad > 0.3 ? "#fb923c" : P.cyan}`,
                        }}
                      />
                      <span className="text-xs font-bold tracking-widest uppercase"
                        style={{ color: systemLoad > 0.6 ? P.red : systemLoad > 0.3 ? "#fb923c" : P.cyan }}>
                        System Load — Neural Brain
                      </span>
                    </div>
                    <span className="text-lg font-black tabular-nums"
                      style={{ color: systemLoad > 0.6 ? P.red : systemLoad > 0.3 ? "#fb923c" : P.cyan }}>
                      {(systemLoad * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Load bar */}
                  <div className="h-2.5 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <motion.div
                      animate={{ width: `${systemLoad * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background: systemLoad > 0.6
                          ? `linear-gradient(90deg, #ef4444, #dc2626)`
                          : systemLoad > 0.3
                          ? `linear-gradient(90deg, #fb923c, #f59e0b)`
                          : `linear-gradient(90deg, ${P.cyan}, #0891b2)`,
                        boxShadow: `0 0 8px ${systemLoad > 0.6 ? P.red : systemLoad > 0.3 ? "#fb923c" : P.cyan}`,
                      }}
                    />
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: "Simulácie", value: sbSimCount,                          color: P.cyan   },
                      { label: "Teplota",   value: governance.temperature.toFixed(1),   color: systemLoad > 0.5 ? "#fb923c" : P.muted },
                      { label: "Safety",    value: `${(governance.safetyLevel*100).toFixed(0)}%`, color: P.violet },
                    ].map((m) => (
                      <div key={m.label} className="rounded-xl py-2" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <p className="text-sm font-black tabular-nums" style={{ color: m.color }}>{m.value}</p>
                        <p className="text-[0.6rem] tracking-widest uppercase mt-0.5" style={{ color: P.faint }}>{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[0.6rem] text-center mt-2" style={{ color: P.faint }}>
                    {systemLoad > 0.7 ? "⚠ Vysoké zaťaženie — Brain Sandbox aktívny" :
                     systemLoad > 0.3 ? "↯ Stredné zaťaženie" :
                     "● Systém v pokoji"}
                  </p>
                </div>

                {/* Sliders panel */}
                <div className="rounded-2xl p-6 mb-6 space-y-7" style={GLASS}>

                  {/* Cognitive Heat */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold" style={{ color: P.text }}>🔥 Cognitive Heat</p>
                        <p className="text-xs" style={{ color: P.muted }}>Teplota — kreativita vs. presnosť (0 = deterministický, 2 = maximálne kreatívny)</p>
                      </div>
                      <span className="text-lg font-black ml-6" style={{ color: P.cyan }}>{governance.temperature.toFixed(2)}</span>
                    </div>
                    <input type="range" min={0} max={2} step={0.05} value={governance.temperature}
                      onChange={(e) => setGovernanceState(g => ({ ...g, temperature: parseFloat(e.target.value) }))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: P.cyan }} />
                    <div className="flex justify-between text-[0.6rem] mt-1" style={{ color: P.faint }}>
                      <span>0 — Presný</span><span>1 — Vyvážený</span><span>2 — Kreatívny</span>
                    </div>
                  </div>

                  {/* Ethical Dampers */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold" style={{ color: P.text }}>🛡 Ethical Dampers</p>
                        <p className="text-xs" style={{ color: P.muted }}>Bezpečnostné mantinely — ako prísne AI odmieta problematické požiadavky</p>
                      </div>
                      <span className="text-lg font-black ml-6" style={{ color: P.violet }}>{governance.safetyLevel.toFixed(2)}</span>
                    </div>
                    <input type="range" min={0} max={1} step={0.05} value={governance.safetyLevel}
                      onChange={(e) => setGovernanceState(g => ({ ...g, safetyLevel: parseFloat(e.target.value) }))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: P.violet }} />
                    <div className="flex justify-between text-[0.6rem] mt-1" style={{ color: P.faint }}>
                      <span>0 — Voľný</span><span>0.5 — Štandardný</span><span>1 — Striktný</span>
                    </div>
                  </div>

                  {/* System Persona */}
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color: P.text }}>🧬 System Persona</p>
                    <p className="text-xs mb-3" style={{ color: P.muted }}>Základná identita AI — čo je, ako premýšľa, aké má hodnoty</p>
                    <textarea value={governance.persona} rows={4}
                      onChange={(e) => setGovernanceState(g => ({ ...g, persona: e.target.value }))}
                      className="w-full text-sm px-4 py-3 rounded-2xl outline-none resize-none leading-relaxed"
                      style={{ ...INPUT_STYLE, caretColor: P.violet }} />
                  </div>

                  {/* Save button */}
                  <div className="flex justify-end">
                    <button
                      onClick={async () => {
                        setGovSaving(true);
                        try {
                          const res = await fetch("/api/admin/neural", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ governance }),
                          });
                          if (res.ok) { setGovSaved(true); setTimeout(() => setGovSaved(false), 3000); }
                        } finally { setGovSaving(false); }
                      }}
                      disabled={govSaving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg,${P.violet},#7c3aed)`, color: "#fff",
                        boxShadow: `0 0 20px ${P.violetGlow}` }}>
                      {govSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : govSaved ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                      {govSaved ? "Uložené!" : "Aplikovať zmeny"}
                    </button>
                  </div>
                </div>

                {/* Manual Override */}
                <div className="rounded-2xl p-6" style={GLASS}>
                  <p className="text-sm font-bold mb-1" style={{ color: P.red }}>⚡ Manual Override</p>
                  <p className="text-xs mb-5" style={{ color: P.muted }}>Núdzové nástroje pre správu vedomostí. Nezvratné operácie.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    {[
                      { label: "↺ Refresh Neural Data", action: () => { setSection("neural"); }, color: P.cyan, bg: P.cyanDim, border: P.cyanBorder },
                      { label: "🔍 Audit Low-Confidence", action: () => { setSection("neural"); setStreamFilter("low"); }, color: P.amber, bg: P.amberDim, border: P.amberBorder },
                      { label: "↩ Reset Persona", action: () => setGovernanceState(g => ({ ...g, persona: "Si Personal Neural OS pre život a prácu. Si diskrétny, empatický a zameraný na výsledky." })), color: P.violet, bg: P.violetDim, border: P.violetBorder },
                    ].map(({ label, action, color, bg, border }) => (
                      <button key={label} onClick={action}
                        className="px-4 py-3 rounded-2xl text-xs font-bold transition-all"
                        style={{ background: bg, border: `1px solid ${border}`, color }}>
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: P.redDim, border: `1px solid ${P.redBorder}` }}>
                    <p className="text-xs font-bold mb-3" style={{ color: P.red }}>🚨 Emergency Purge — zmaže VŠETKY memories daného užívateľa</p>
                    <div className="flex gap-3">
                      <input
                        value={purgeUserId}
                        onChange={(e) => setPurgeUserId(e.target.value)}
                        placeholder="User ID (cuid)…"
                        className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                        style={{ ...INPUT_STYLE, border: `1px solid ${P.redBorder}` }} />
                      <button
                        onClick={async () => {
                          if (!purgeUserId.trim() || !confirm(`Zmazať VŠETKY memories pre ${purgeUserId}? Táto akcia je nezvratná!`)) return;
                          setPurging(true);
                          try {
                            const res = await fetch("/api/admin/neural", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ purge: true, userId: purgeUserId }),
                            });
                            const d = await res.json();
                            if (d.success) { toast.success(`Zmazaných ${d.deleted} memories.`); setPurgeUserId(""); }
                            else { toast.error(d.error ?? "Mazanie zlyhalo"); }
                          } finally { setPurging(false); }
                        }}
                        disabled={purging || !purgeUserId.trim()}
                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-2"
                        style={{ background: P.red, color: "#fff", boxShadow: `0 0 12px ${P.redGlow}` }}>
                        {purging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Purge
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── BRAIN SANDBOX ── */}
            {section === "sandbox" && (
              <motion.div key="sandbox"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}>

                <h1 className="text-xl font-black mb-2 tracking-tight" style={{ color: P.text }}>
                  🧪 Brain <span style={{ color: P.cyan }}>Sandbox</span>
                </h1>
                <p className="text-xs mb-8" style={{ color: P.muted }}>
                  Simuluj reálnu interakciu cez celý Neural Core pipeline (GDPR anonymizácia, context tagging,
                  emotionalTone, confidenceScore, TTL) bez míňania GPT tokenov. Výsledok sa uloží do NeuralMemory s <code style={{ color: P.violet }}>isSimulated=true</code>.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

                  {/* Input form */}
                  <div className="rounded-2xl p-6 space-y-4" style={GLASS}>
                    <p className="text-xs font-bold tracking-widest uppercase" style={{ color: P.cyan }}>Vstup simulácie</p>

                    {/* Module + User ID */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[0.65rem] mb-1.5 tracking-widest uppercase" style={{ color: P.muted }}>Modul</label>
                        <input value={sbModule} onChange={(e) => setSbModule(e.target.value)}
                          placeholder="sandbox"
                          className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                          style={INPUT_STYLE} />
                      </div>
                      <div>
                        <label className="block text-[0.65rem] mb-1.5 tracking-widest uppercase" style={{ color: P.muted }}>User ID (voliteľné)</label>
                        <input value={sbUserId} onChange={(e) => setSbUserId(e.target.value)}
                          placeholder="cuid... (default: admin)"
                          className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                          style={INPUT_STYLE} />
                      </div>
                    </div>

                    {/* Fake user input */}
                    <div>
                      <label className="block text-[0.65rem] mb-1.5 tracking-widest uppercase" style={{ color: P.muted }}>
                        Fiktívny vstup užívateľa
                      </label>
                      <textarea value={sbInput}
                        onChange={(e) => {
                          setSbInput(e.target.value);
                          // Mind-Reader: debounce suggestions fetch
                          setSbSuggestions([]);
                          const v = e.target.value.trim();
                          if (v.length < 10) return;
                          setSbSugLoading(true);
                          const params = new URLSearchParams({ query: v, ...(sbUserId.trim() ? { userId: sbUserId.trim() } : {}) });
                          fetch(`/api/admin/sandbox?${params}`)
                            .then((r) => r.json())
                            .then((d) => { if (d.suggestions) setSbSuggestions(d.suggestions); })
                            .catch(() => {})
                            .finally(() => setSbSugLoading(false));
                        }}
                        rows={4} placeholder="Napr: Mám zajtra stretko s klientom a bojím sa toho..."
                        className="w-full text-sm px-4 py-3 rounded-2xl outline-none resize-none"
                        style={{ ...INPUT_STYLE, caretColor: P.cyan }} />

                      {/* Mind-Reader suggestions */}
                      {(sbSuggestions.length > 0 || sbSugLoading) && (
                        <div className="mt-2 rounded-2xl overflow-hidden" style={{ background: "rgba(167,139,250,0.06)", border: `1px solid ${P.violetBorder}` }}>
                          <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${P.violetBorder}`, background: P.violetDim }}>
                            <Brain className="w-3 h-3" style={{ color: P.violet }} />
                            <span className="text-[0.6rem] font-bold tracking-widest uppercase" style={{ color: P.violet }}>Mind-Reader — súvisiace spomienky</span>
                            {sbSugLoading && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: P.violet }} />}
                          </div>
                          {sbSuggestions.length === 0 && !sbSugLoading && (
                            <p className="text-xs px-3 py-2" style={{ color: P.faint }}>Nenašli sa relevantné spomienky.</p>
                          )}
                          {sbSuggestions.map((s, i) => (
                            <motion.div key={s.id}
                              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.06 }}
                              className="px-3 py-2 border-b last:border-0 cursor-pointer hover:bg-violet-500/5 transition-all"
                              style={{ borderColor: P.violetBorder }}
                              onClick={() => setSbResponse((prev) => prev ? prev + "\n\n[Kontext zo spomienky: " + s.label + "]" : s.label)}>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[0.6rem] font-bold" style={{ color: s.context === "personal" ? P.violet : P.cyan }}>{s.context}</span>
                                <span className="text-[0.6rem]" style={{ color: P.amber }}>{s.emotionalTone}</span>
                                <span className="text-[0.6rem] ml-auto" style={{ color: P.faint }}>{new Date(s.date).toLocaleDateString("sk-SK")}</span>
                              </div>
                              <p className="text-xs leading-snug" style={{ color: P.muted }}>{s.label}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fake AI response */}
                    <div>
                      <label className="block text-[0.65rem] mb-1.5 tracking-widest uppercase" style={{ color: P.muted }}>
                        Fiktívna odpoveď AI
                      </label>
                      <textarea value={sbResponse} onChange={(e) => setSbResponse(e.target.value)}
                        rows={5} placeholder="Napr: Rozumiem, toto stretko je dôležité. Skús si zapamätať čo ti pomáhalo na predchdzúcom..."
                        className="w-full text-sm px-4 py-3 rounded-2xl outline-none resize-none"
                        style={{ ...INPUT_STYLE, caretColor: P.violet }} />
                    </div>

                    <button
                      onClick={async () => {
                        if (!sbInput.trim() || !sbResponse.trim()) return;
                        setSbRunning(true);
                        setSbResult(null);
                        setSbError(null);
                        setSbPipelineStep(0);

                        // Animate through steps with delays
                        const steps = [0,1,2,3,4];
                        for (const s of steps) {
                          await new Promise((r) => setTimeout(r, 320));
                          setSbPipelineStep(s);
                        }

                        try {
                          const res = await fetch("/api/admin/sandbox", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              userInput: sbInput,
                              aiResponse: sbResponse,
                              module: sbModule || "sandbox",
                              ...(sbUserId.trim() ? { userId: sbUserId.trim() } : {}),
                            }),
                          });
                          const text = await res.text();
                          let d: Record<string, unknown>;
                          try { d = JSON.parse(text); } catch {
                            setSbError(`Server error (${res.status}): ${text.slice(0,200)}`);
                            return;
                          }
                          if (d.success) {
                            setSbResult(d.result as SandboxResult);
                            setSbSimCount((c) => c + 1);
                            setSystemLoad((l) => Math.min(1, l + 0.15));
                            setTimeout(() => setSystemLoad((l) => Math.max(0, l - 0.08)), 8000);
                          } else {
                            setSbError((d.detail as string) ?? (d.error as string) ?? "Pipeline failed");
                          }
                        } catch (e) {
                          setSbError(e instanceof Error ? e.message : "Sieťová chyba — skontroluj pripojenie");
                        } finally {
                          setSbRunning(false);
                          setSbPipelineStep(-1);
                        }
                      }}
                      disabled={sbRunning || !sbInput.trim() || !sbResponse.trim()}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-40"
                      style={{ background: `linear-gradient(135deg,${P.cyan},#0e7490)`, color: "#fff",
                        boxShadow: `0 0 20px ${P.cyanGlow}` }}>
                      {sbRunning
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Spracúvam pipeline...</>
                        : <><Activity className="w-4 h-4" /> Spustiť cez Neural Core</>}
                    </button>
                  </div>

                  {/* Results panel */}
                  <div className="rounded-2xl p-6" style={GLASS}>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold tracking-widest uppercase" style={{ color: P.violet }}>Výsledok pipeline</p>
                      {sbSimCount > 0 && (
                        <span className="text-[0.6rem] px-2 py-0.5 rounded-full font-bold"
                          style={{ background: P.cyanDim, border: `1px solid ${P.cyanBorder}`, color: P.cyan }}>
                          {sbSimCount} simulácií
                        </span>
                      )}
                    </div>

                    {!sbResult && !sbError && !sbRunning && (
                      <div className="flex flex-col items-center justify-center h-48 text-center">
                        <Activity className="w-10 h-10 mb-3 opacity-20" style={{ color: P.cyan }} />
                        <p className="text-xs" style={{ color: P.faint }}>Zadaj vstup a spusti simuláciu.</p>
                      </div>
                    )}

                    {/* Live pipeline progress */}
                    {sbRunning && (
                      <div className="space-y-2 py-2">
                        {[
                          { icon: "🛡", label: "Scanning for PII...",         sub: "GDPR Privacy Shield" },
                          { icon: "🏷", label: "Categorizing context...",      sub: "personal / work tagger" },
                          { icon: "🎭", label: "Reading emotional tone...",    sub: "anxious / excited / neutral" },
                          { icon: "📊", label: "Evaluating confidence...",     sub: "0–1 self-score" },
                          { icon: "💾", label: "Synthesizing memory...",       sub: "writing to NeuralMemory" },
                        ].map((step, i) => {
                          const isActive  = sbPipelineStep === i;
                          const isDone    = sbPipelineStep > i;
                          const isPending = sbPipelineStep < i;
                          return (
                            <motion.div key={step.label}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: isPending ? 0.25 : 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                              style={{
                                background: isActive ? P.cyanDim : "transparent",
                                border: `1px solid ${isActive ? P.cyanBorder : "transparent"}`,
                              }}>
                              <span className="text-base w-5 text-center flex-shrink-0">
                                {isDone ? "✓" : isActive ? (
                                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                    style={{ display: "inline-block" }}>◦</motion.span>
                                ) : step.icon}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold" style={{ color: isDone ? P.cyan : isActive ? P.text : P.faint }}>{step.label}</p>
                                <p className="text-[0.6rem]" style={{ color: P.faint }}>{step.sub}</p>
                              </div>
                              {isDone && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: P.cyan }} />}
                              {isActive && <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" style={{ color: P.cyan }} />}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {sbError && (
                      <div className="rounded-2xl p-4 space-y-2" style={{ background: P.redDim, border: `1px solid ${P.redBorder}` }}>
                        <p className="text-xs font-bold" style={{ color: P.red }}>⚠ Pipeline zlyhal</p>
                        <p className="text-xs font-mono break-all" style={{ color: P.muted }}>{sbError}</p>
                        <p className="text-[0.65rem]" style={{ color: P.faint }}>Skontroluj: DATABASE_URL, Prisma migráciu, konzolóvý log servera.</p>
                      </div>
                    )}

                    {sbResult && (
                      <div className="space-y-4">
                        {/* Pipeline badges */}
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: "context",   value: sbResult.context,    color: sbResult.context === "personal" ? P.violet : P.cyan },
                            { label: "tone",      value: sbResult.emotionalTone, color: P.amber },
                            { label: "confidence",value: `${(sbResult.confidenceScore * 100).toFixed(0)}%`, color: sbResult.confidenceScore < 0.3 ? P.red : P.cyan },
                            { label: "isSimulated", value: "true", color: P.violet },
                          ].map(({ label, value, color }) => (
                            <span key={label} className="px-2.5 py-1 rounded-full text-[0.65rem] font-bold"
                              style={{ background: color + "15", border: `1px solid ${color}44`, color }}>
                              {label}: {value}
                            </span>
                          ))}
                        </div>

                        {/* TTL */}
                        <div className="text-[0.65rem] space-y-1" style={{ color: P.muted }}>
                          <p><span style={{ color: P.faint }}>Memory ID: </span><span className="font-mono" style={{ color: P.text }}>{sbResult.id}</span></p>
                          <p><span style={{ color: P.faint }}>TTL: </span>
                            <span style={{ color: sbResult.relevanceTTL ? P.amber : P.cyan }}>
                              {sbResult.relevanceTTL ? new Date(sbResult.relevanceTTL).toLocaleDateString("sk-SK") : "∞ permanentné"}
                            </span>
                          </p>
                        </div>

                        {/* Anonymized versions */}
                        <div>
                          <p className="text-[0.65rem] font-bold mb-1.5" style={{ color: P.faint }}>GDPR anonymizovaný vstup:</p>
                          <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(34,211,238,0.06)", border: `1px solid ${P.cyanBorder}`, color: P.muted }}>
                            {sbResult.anonymizedInput}
                          </div>
                        </div>
                        <div>
                          <p className="text-[0.65rem] font-bold mb-1.5" style={{ color: P.faint }}>GDPR anonymizovaná odpoveď:</p>
                          <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(167,139,250,0.06)", border: `1px solid ${P.violetBorder}`, color: P.muted }}>
                            {sbResult.anonymizedResponse}
                          </div>
                        </div>

                        <button onClick={() => { setSbResult(null); setSbInput(""); setSbResponse(""); }}
                          className="w-full py-2 rounded-xl text-xs font-bold transition-all"
                          style={{ background: P.cyanDim, border: `1px solid ${P.cyanBorder}`, color: P.cyan }}>
                          ↺ Nová simulácia
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info note */}
                <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: P.violetDim, border: `1px solid ${P.violetBorder}` }}>
                  <Brain className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: P.violet }} />
                  <p className="text-xs" style={{ color: P.muted }}>
                    Simulované záznamy sú v Thought Streame označené <strong style={{ color: P.violet }}>isSimulated</strong> a môžu byť
                    odfiltrované. Ideálne pre testovanie pipeline bez spotreby API kreditov alebo reálneho zásahu do produkčných dát.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── POLICY ENGINE ── */}
            {section === "policy" && (
              <motion.div key="policy"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }} className="space-y-6">

                <div>
                  <h1 className="text-xl font-black mb-1 tracking-tight" style={{ color: P.text }}>
                    Neural <span style={{ color: P.violet }}>Policy Engine</span>
                  </h1>
                  <p className="text-xs" style={{ color: P.muted }}>Top-priority AI directives injected before system prompt. Critical policies override all other instructions.</p>
                </div>

                {/* New / Edit form */}
                <div className="rounded-2xl p-6 space-y-4" style={GLASS}>
                  <p className="text-xs font-bold tracking-widest uppercase" style={{ color: P.violet }}>
                    {policyEditing ? "✏ Upraviť politiku" : "+ Nová politika"}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.65rem] mb-1 tracking-widest uppercase" style={{ color: P.muted }}>Názov</label>
                      <input value={policyForm.name} onChange={(e) => setPolicyForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Napr: No financial advice"
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={INPUT_STYLE} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[0.65rem] mb-1 tracking-widest uppercase" style={{ color: P.muted }}>Závažnosť</label>
                        <select value={policyForm.severity} onChange={(e) => setPolicyForm(f => ({ ...f, severity: e.target.value as "low"|"medium"|"high"|"critical" }))}
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={INPUT_STYLE}>
                          {["low","medium","high","critical"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[0.65rem] mb-1 tracking-widest uppercase" style={{ color: P.muted }}>Kontext</label>
                        <select value={policyForm.context} onChange={(e) => setPolicyForm(f => ({ ...f, context: e.target.value as "all"|"personal"|"work" }))}
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={INPUT_STYLE}>
                          {["all","personal","work"].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[0.65rem] mb-1 tracking-widest uppercase" style={{ color: P.muted }}>Pravidlo (injected do system prompt)</label>
                    <textarea value={policyForm.rule} onChange={(e) => setPolicyForm(f => ({ ...f, rule: e.target.value }))}
                      rows={3} placeholder="Napr: Never provide specific financial, legal or medical advice. Redirect users to certified professionals."
                      className="w-full text-sm px-3 py-2 rounded-xl outline-none resize-none" style={INPUT_STYLE} />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!policyForm.name.trim() || !policyForm.rule.trim()) return;
                        setPolicySaving(true);
                        try {
                          const url = "/api/admin/policy";
                          const method = policyEditing ? "PATCH" : "POST";
                          const body = policyEditing
                            ? { id: policyEditing, ...policyForm }
                            : policyForm;
                          const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                          const d = await res.json();
                          if (d.success) {
                            if (policyEditing) {
                              setPolicies(prev => prev.map(p => p.id === policyEditing ? d.policy : p));
                            } else {
                              setPolicies(prev => [d.policy, ...prev]);
                            }
                            setPolicyForm({ name: "", rule: "", severity: "medium", context: "all", isActive: true });
                            setPolicyEditing(null);
                          }
                        } finally { setPolicySaving(false); }
                      }}
                      disabled={policySaving || !policyForm.name.trim() || !policyForm.rule.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                      style={{ background: `linear-gradient(135deg,${P.violet},#7c3aed)`, color: "#fff", boxShadow: `0 0 16px ${P.violetGlow}` }}>
                      {policySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {policyEditing ? "Uložiť zmeny" : "Vytvoriť politiku"}
                    </button>
                    {policyEditing && (
                      <button onClick={() => { setPolicyEditing(null); setPolicyForm({ name: "", rule: "", severity: "medium", context: "all", isActive: true }); }}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: P.redDim, border: `1px solid ${P.redBorder}`, color: P.red }}>
                        Zrušiť
                      </button>
                    )}
                  </div>
                </div>

                {/* Policy list */}
                {policyLoading ? (
                  <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin" style={{ color: P.violet }} /></div>
                ) : policies.length === 0 ? (
                  <div className="rounded-2xl p-8 text-center" style={GLASS}>
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: P.violet }} />
                    <p className="text-xs" style={{ color: P.faint }}>Žiadne politiky. Vytvor prvú pravidlo vyššie.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {policies.map((pol) => {
                      const sevColor = pol.severity === "critical" ? P.red : pol.severity === "high" ? P.amber : pol.severity === "medium" ? P.violet : P.muted;
                      const sevBg = pol.severity === "critical" ? P.redDim : pol.severity === "high" ? P.amberDim : pol.severity === "medium" ? P.violetDim : "rgba(100,116,139,0.08)";
                      return (
                        <motion.div key={pol.id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          className="rounded-2xl p-4" style={{ background: "rgba(15,23,42,0.80)", border: `1px solid ${pol.isActive ? sevColor + "44" : P.faint + "33"}`, opacity: pol.isActive ? 1 : 0.5 }}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-bold" style={{ color: pol.isActive ? P.text : P.muted }}>{pol.name}</span>
                                <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-bold" style={{ background: sevBg, color: sevColor }}>{pol.severity}</span>
                                <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-bold" style={{ background: P.cyanDim, color: P.cyan }}>{pol.context}</span>
                                {!pol.isActive && <span className="px-2 py-0.5 rounded-full text-[0.6rem]" style={{ background: P.redDim, color: P.red }}>INACTIVE</span>}
                              </div>
                              <p className="text-xs leading-relaxed" style={{ color: P.muted }}>{pol.rule}</p>
                              <p className="text-[0.6rem] mt-1" style={{ color: P.faint }}>
                                {pol.createdBy && `by ${pol.createdBy} · `}{new Date(pol.createdAt).toLocaleDateString("sk-SK")}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button onClick={async () => {
                                await fetch("/api/admin/policy", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pol.id, isActive: !pol.isActive }) });
                                setPolicies(prev => prev.map(p => p.id === pol.id ? { ...p, isActive: !p.isActive } : p));
                              }} className="p-1.5 rounded-lg transition-all" style={{ background: pol.isActive ? P.cyanDim : P.redDim, color: pol.isActive ? P.cyan : P.red }}>
                                {pol.isActive ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => {
                                setPolicyEditing(pol.id);
                                setPolicyForm({ name: pol.name, rule: pol.rule, severity: pol.severity, context: pol.context, isActive: pol.isActive });
                              }} className="p-1.5 rounded-lg transition-all" style={{ background: P.violetDim, color: P.violet }}>
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={async () => {
                                if (!confirm("Vymazať túto politiku?")) return;
                                await fetch("/api/admin/policy", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pol.id }) });
                                setPolicies(prev => prev.filter(p => p.id !== pol.id));
                              }} className="p-1.5 rounded-lg transition-all" style={{ background: P.redDim, color: P.red }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── ROI DASHBOARD ── */}
            {section === "roi" && (
              <motion.div key="roi"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }} className="space-y-6">

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-black mb-1 tracking-tight" style={{ color: P.text }}>
                      Advanced <span style={{ color: P.cyan }}>ROI Dashboard</span>
                    </h1>
                    <p className="text-xs" style={{ color: P.muted }}>Tokens vs. hodnota · Ušetrený čas · Activity heatmap</p>
                  </div>
                  <button onClick={() => {
                    if (!roiData) return;
                    const csv = [
                      "Date,Requests",
                      ...Object.entries(roiData.dailyBuckets).map(([d,c]) => `${d},${c}`)
                    ].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                    a.download = `unifyo-roi-${new Date().toISOString().slice(0,10)}.csv`; a.click();
                  }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: P.cyanDim, border: `1px solid ${P.cyanBorder}`, color: P.cyan }}>
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                </div>

                {roiLoading ? (
                  <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin" style={{ color: P.cyan }} /></div>
                ) : !roiData ? (
                  <div className="rounded-2xl p-8 text-center" style={GLASS}>
                    <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: P.cyan }} />
                    <p className="text-xs" style={{ color: P.faint }}>Žiadne dáta.</p>
                  </div>
                ) : (
                  <>
                    {/* KPI cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Celkové tokeny",    value: roiData.totalTokens.toLocaleString(), color: P.cyan,   icon: "⚡" },
                        { label: "AI requestov",       value: roiData.totalRequests.toLocaleString(), color: P.violet, icon: "🧠" },
                        { label: "Minút ušetrených",  value: `${roiData.minutesSaved.toLocaleString()} min`, color: P.amber, icon: "⏱" },
                        { label: "Odhadovaná úspora", value: `€${roiData.costSaved.toFixed(2)}`, color: "#4ade80", icon: "💶" },
                      ].map(({ label, value, color, icon }) => (
                        <div key={label} className="rounded-2xl p-5" style={{ background: "rgba(15,23,42,0.80)", border: `1px solid ${color}33` }}>
                          <p className="text-2xl mb-1">{icon}</p>
                          <p className="text-xl font-black tabular-nums" style={{ color }}>{value}</p>
                          <p className="text-[0.65rem] mt-1 tracking-widest uppercase" style={{ color: P.faint }}>{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Time saved explainer */}
                    <div className="rounded-2xl p-5" style={{ background: P.cyanDim, border: `1px solid ${P.cyanBorder}` }}>
                      <p className="text-xs font-bold mb-1" style={{ color: P.cyan }}>📐 Metodológia výpočtu</p>
                      <p className="text-xs" style={{ color: P.muted }}>
                        <strong style={{ color: P.text }}>1 AI request ≈ 2 minúty ušetreného času</strong> (priemerný čas vyhľadávania, formulácie a odpovede). Náklady vypočítané podľa GPT-4o-mini ceny <strong style={{ color: P.text }}>$0.002/1K tokenov</strong>.
                        {roiData.minutesSaved >= 60 && <> Celkovo: <strong style={{ color: P.cyan }}>{Math.floor(roiData.minutesSaved/60)}h {roiData.minutesSaved%60}min</strong> ušetrených.</>}
                      </p>
                    </div>

                    {/* Activity heatmap */}
                    <div className="rounded-2xl p-6" style={GLASS}>
                      <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: P.violet }}>Activity Heatmap — posledných 30 dní</p>
                      {Object.keys(roiData.dailyBuckets).length === 0 ? (
                        <p className="text-xs text-center py-8" style={{ color: P.faint }}>Žiadna aktivita za posledných 30 dní.</p>
                      ) : (() => {
                        const entries = Object.entries(roiData.dailyBuckets).sort(([a],[b]) => a.localeCompare(b));
                        const maxVal = Math.max(...entries.map(([,v]) => v), 1);
                        return (
                          <div className="space-y-3">
                            {/* Bar chart */}
                            <div className="flex items-end gap-1 h-24">
                              {entries.map(([date, count]) => {
                                const pct = count / maxVal;
                                const col = pct > 0.7 ? P.cyan : pct > 0.3 ? P.violet : P.faint;
                                return (
                                  <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
                                    <div className="w-full rounded-t-sm transition-all" style={{ height: `${Math.max(4, pct * 88)}px`, background: col, boxShadow: pct > 0.5 ? `0 0 8px ${col}` : "none" }} />
                                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
                                      <div className="px-2 py-1 rounded-lg text-[0.6rem] font-bold whitespace-nowrap" style={{ background: "rgba(15,23,42,0.95)", border: `1px solid ${P.cyanBorder}`, color: P.text }}>
                                        {date}<br />{count} req
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {/* Date labels */}
                            <div className="flex gap-1">
                              {entries.map(([date]) => (
                                <div key={date} className="flex-1 text-center text-[0.45rem]" style={{ color: P.faint }}>
                                  {date.slice(5)}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ── AUDIT TRAIL ── */}
            {section === "audit" && (
              <motion.div key="audit"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }} className="space-y-6">

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-black mb-1 tracking-tight" style={{ color: P.text }}>
                      Audit <span style={{ color: P.amber }}>Trail</span>
                    </h1>
                    <p className="text-xs" style={{ color: P.muted }}>Immutable log všetkých admin akcií — kto, kedy, čo zmenil.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const csv = ["Time,Admin,Action,TargetId",
                        ...auditLogs.map(l => `${l.createdAt},${l.adminEmail},${l.action},${l.targetId ?? ""}`)
                      ].join("\n");
                      const blob = new Blob([csv], { type: "text/csv" });
                      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                      a.download = `unifyo-audit-${new Date().toISOString().slice(0,10)}.csv`; a.click();
                    }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                      style={{ background: P.amberDim, border: `1px solid ${P.amberBorder}`, color: P.amber }}>
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                  </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-3">
                  <Filter className="w-4 h-4 flex-shrink-0" style={{ color: P.muted }} />
                  <input value={auditFilter} onChange={(e) => setAuditFilter(e.target.value)}
                    placeholder="Filtrovať podľa akcie, admin emailu, memory ID..."
                    className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={INPUT_STYLE} />
                </div>

                {/* Table */}
                {auditLoading ? (
                  <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin" style={{ color: P.amber }} /></div>
                ) : (
                  <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${P.amberBorder}` }}>
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[0.6rem] font-bold tracking-widest uppercase"
                      style={{ background: P.amberDim, color: P.amber }}>
                      <div className="col-span-3">Čas</div>
                      <div className="col-span-3">Admin</div>
                      <div className="col-span-2">Akcia</div>
                      <div className="col-span-4">Detail</div>
                    </div>
                    {(() => {
                      const filtered = auditLogs.filter(l =>
                        !auditFilter || [l.action, l.adminEmail, l.targetId ?? ""].join(" ").toLowerCase().includes(auditFilter.toLowerCase())
                      );
                      if (filtered.length === 0) return (
                        <div className="py-12 text-center">
                          <p className="text-xs" style={{ color: P.faint }}>Žiadne záznamy.</p>
                        </div>
                      );
                      return filtered.map((log, i) => {
                        const actionColor = log.action.includes("DELETE") || log.action.includes("PURGE") ? P.red
                          : log.action.includes("EDIT") || log.action.includes("UPDATE") ? P.cyan
                          : log.action.includes("CREATE") ? "#4ade80"
                          : P.amber;
                        return (
                          <div key={log.id}
                            className="grid grid-cols-12 gap-2 px-4 py-3 text-xs border-t transition-all hover:bg-white/[0.02]"
                            style={{ borderColor: "rgba(255,255,255,0.04)", background: i % 2 === 0 ? "rgba(15,23,42,0.80)" : "rgba(15,23,42,0.60)" }}>
                            <div className="col-span-3 font-mono" style={{ color: P.faint }}>
                              {new Date(log.createdAt).toLocaleString("sk-SK")}
                            </div>
                            <div className="col-span-3 truncate" style={{ color: P.muted }}>{log.adminEmail}</div>
                            <div className="col-span-2">
                              <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-bold" style={{ background: actionColor + "18", color: actionColor }}>
                                {log.action}
                              </span>
                            </div>
                            <div className="col-span-4 font-mono text-[0.65rem] truncate" style={{ color: P.faint }}>
                              {log.targetId && <span style={{ color: P.muted }}>{log.targetId.slice(0,16)}…</span>}
                              {Boolean(log.metadata) && <span> · {JSON.stringify(log.metadata as Record<string, unknown>).slice(0,60)}</span>}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── MEMBERSHIP PLANS ── */}
            {section === "plans" && (
              <motion.div key="plans"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }} className="space-y-5">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-black mb-1 tracking-tight" style={{ color: P.text }}>
                      Membership <span style={{ color: P.violet }}>Plans</span>
                    </h1>
                    <p className="text-xs" style={{ color: P.muted }}>
                      Zoradené podľa ceny. Každý riadok je editovateľný — zmeny sa prejavia okamžite v systéme bez reštartu.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl flex-shrink-0"
                    style={{ background: P.cyanDim, border: `1px solid ${P.cyanBorder}` }}>
                    <Activity className="w-3 h-3" style={{ color: P.cyan }} />
                    <span className="text-[0.65rem] font-bold" style={{ color: P.cyan }}>LIVE</span>
                  </div>
                </div>

                {/* Error */}
                {plansError && (
                  <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: P.redDim, border: `1px solid ${P.redBorder}` }}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: P.red }} />
                    <p className="text-xs flex-1" style={{ color: P.red }}>{plansError}</p>
                    <button onClick={() => {
                      setPlansError(null); setPlansLoading(true);
                      fetch("/api/admin/membership-plans").then(async r => {
                        const d = await r.json();
                        if (d.plans?.length) {
                          setMembershipPlans(d.plans);
                          const init: Record<string, Partial<MembershipPlan>> = {};
                          for (const p of d.plans as MembershipPlan[]) init[p.tier] = { ...p };
                          setPlansEdit(init);
                        } else setPlansError(d.error ?? "Prázdna odpoveď");
                      }).catch(e => setPlansError(String(e))).finally(() => setPlansLoading(false));
                    }} className="text-xs px-3 py-1 rounded-lg flex-shrink-0"
                      style={{ background: P.redDim, color: P.red, border: `1px solid ${P.redBorder}` }}>
                      Skúsiť znovu
                    </button>
                  </div>
                )}

                {plansLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-7 h-7 animate-spin" style={{ color: P.violet }} />
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid rgba(255,255,255,0.07)` }}>

                    {/* Table header */}
                    <div className="grid text-[0.6rem] font-bold tracking-widest uppercase px-4 py-2.5"
                      style={{
                        gridTemplateColumns: "110px 1fr 90px 90px 90px 80px 80px 100px",
                        background: "rgba(255,255,255,0.03)",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        color: P.muted,
                      }}>
                      <span>Tier</span>
                      <span>Popis</span>
                      <span className="text-right">Cena €/mes</span>
                      <span className="text-right">Requesty/deň</span>
                      <span className="text-right">Memory Slots</span>
                      <span className="text-right">Context</span>
                      <span className="text-right">Policies</span>
                      <span className="text-right">Akcia</span>
                    </div>

                    {/* Table rows */}
                    {membershipPlans.map((plan, rowIdx) => {
                      const e = plansEdit[plan.tier] ?? plan;
                      const tc = plan.tier === "ENTERPRISE"
                        ? { col: P.violet, border: P.violetBorder, dim: P.violetDim }
                        : plan.tier === "PREMIUM"
                        ? { col: P.cyan, border: P.cyanBorder, dim: P.cyanDim }
                        : { col: P.muted, border: "rgba(100,116,139,0.25)", dim: "rgba(100,116,139,0.06)" };

                      const isDirty = JSON.stringify(e) !== JSON.stringify(plan);

                      function numInput(
                        key: "price" | "dailyRequests" | "memorySlots" | "contextWindow" | "userPolicies",
                        step = 1,
                        nullable = false
                      ) {
                        const val = e[key];
                        if (nullable && val === null) {
                          return (
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-xs font-black" style={{ color: "#4ade80" }}>∞</span>
                              <button onClick={() => setPlansEdit(s => ({ ...s, [plan.tier]: { ...s[plan.tier], [key]: 100 } }))}
                                className="text-[0.5rem] px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: P.muted }}>
                                limit
                              </button>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center justify-end gap-0.5">
                            <input type="number" min={0} step={step}
                              value={String(val ?? "")}
                              onChange={ev => {
                                const n = step < 1 ? parseFloat(ev.target.value) : parseInt(ev.target.value);
                                setPlansEdit(s => ({ ...s, [plan.tier]: { ...s[plan.tier], [key]: isNaN(n) ? null : n } }));
                              }}
                              className="bg-transparent outline-none text-right tabular-nums text-sm font-bold w-full"
                              style={{ color: tc.col }} />
                            {nullable && (
                              <button onClick={() => setPlansEdit(s => ({ ...s, [plan.tier]: { ...s[plan.tier], [key]: null } }))}
                                className="text-[0.5rem] px-1 py-0.5 rounded flex-shrink-0"
                                style={{ background: "rgba(255,255,255,0.06)", color: P.muted }}>∞</button>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div key={plan.tier}
                          className="grid items-center px-4 py-3 gap-2 transition-all"
                          style={{
                            gridTemplateColumns: "110px 1fr 90px 90px 90px 80px 80px 100px",
                            background: isDirty ? `${tc.dim}` : rowIdx % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                            borderBottom: rowIdx < membershipPlans.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                            borderLeft: isDirty ? `2px solid ${tc.col}` : "2px solid transparent",
                          }}>

                          {/* Tier badge + label edit */}
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[0.6rem] font-black flex-shrink-0"
                              style={{ background: tc.dim, border: `1px solid ${tc.border}`, color: tc.col }}>
                              {plan.tier[0]}
                            </span>
                            <input value={e.label ?? plan.label}
                              onChange={ev => setPlansEdit(s => ({ ...s, [plan.tier]: { ...s[plan.tier], label: ev.target.value } }))}
                              className="bg-transparent outline-none text-xs font-bold w-full border-b border-transparent hover:border-current focus:border-current transition-colors"
                              style={{ color: tc.col }} />
                          </div>

                          {/* Description */}
                          <input value={e.description ?? plan.description}
                            onChange={ev => setPlansEdit(s => ({ ...s, [plan.tier]: { ...s[plan.tier], description: ev.target.value } }))}
                            placeholder="Popis…"
                            className="bg-transparent outline-none text-xs w-full border-b border-transparent hover:border-current focus:border-current transition-colors"
                            style={{ color: P.muted }} />

                          {/* Numeric cells */}
                          {numInput("price", 0.01)}
                          {numInput("dailyRequests", 1, true)}
                          {numInput("memorySlots", 100)}
                          {numInput("contextWindow", 1)}
                          {numInput("userPolicies", 1)}

                          {/* Save */}
                          <div className="flex justify-end">
                            <button
                              onClick={async () => {
                                setPlansSaving(plan.tier);
                                try {
                                  const res = await fetch("/api/admin/membership-plans", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ tier: plan.tier, ...e }),
                                  });
                                  const d = await res.json();
                                  if (d.success) {
                                    setMembershipPlans(prev => prev.map(p => p.tier === plan.tier ? d.plan : p));
                                    setPlansEdit(s => ({ ...s, [plan.tier]: { ...d.plan } }));
                                  } else {
                                    setPlansError(d.error ?? "Chyba uloženia");
                                  }
                                } catch { setPlansError("Sieťová chyba"); }
                                finally { setPlansSaving(null); }
                              }}
                              disabled={plansSaving === plan.tier || !isDirty}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.65rem] font-bold transition-all disabled:opacity-30"
                              style={{
                                background: isDirty ? `${tc.col}22` : "transparent",
                                border: `1px solid ${isDirty ? tc.border : "rgba(255,255,255,0.07)"}`,
                                color: isDirty ? tc.col : P.muted,
                              }}>
                              {plansSaving === plan.tier
                                ? <><Loader2 className="w-3 h-3 animate-spin" /> Ukladám</>
                                : <><Check className="w-3 h-3" /> Uložiť</>}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Legend */}
                <div className="grid grid-cols-3 gap-3 text-[0.6rem]" style={{ color: P.muted }}>
                  {[
                    { label: "Requesty/deň", desc: "null / ∞ = neobmedzené" },
                    { label: "Memory Slots",  desc: "Max spomienok uložených v DB" },
                    { label: "Context",       desc: "Počet spomienok posielaných do promptu" },
                  ].map(({ label, desc }) => (
                    <div key={label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <p className="font-bold mb-0.5" style={{ color: P.text }}>{label}</p>
                      <p>{desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── USER EXPLORER ── */}
            {section === "explorer" && (
              <motion.div key="explorer"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }} className="space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-xl font-black mb-1 tracking-tight" style={{ color: P.text }}>
                      User <span style={{ color: P.cyan }}>Explorer</span>
                    </h1>
                    <p className="text-xs" style={{ color: P.muted }}>Prehľad všetkých používateľov · Štatistiky · GDPR-safe Insights</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 flex-shrink-0" style={{ color: P.muted }} />
                      <input value={explorerFilter} onChange={(e) => setExplorerFilter(e.target.value)}
                        placeholder="Hľadaj email / meno / tier..."
                        className="px-3 py-2 rounded-xl text-sm outline-none w-56" style={INPUT_STYLE} />
                    </div>
                  </div>
                </div>

                {/* User Insights modal */}
                {insightsUser && (
                  <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl p-6 space-y-5" style={{ background: "rgba(15,23,42,0.95)", border: `1px solid ${P.violetBorder}`, boxShadow: `0 0 40px ${P.violetGlow}` }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: P.violet }}>View Insights — GDPR-safe</p>
                        <p className="text-sm font-bold" style={{ color: P.text }}>{insightsUser.name ?? insightsUser.email}</p>
                        <p className="text-xs" style={{ color: P.muted }}>{insightsUser.email} · {insightsUser.membershipTier}</p>
                      </div>
                      <button onClick={() => { setInsightsUser(null); setInsightsData(null); }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: P.redDim, color: P.red }}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {insightsLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: P.violet }} /></div>
                    ) : insightsData && (
                      <>
                        {/* KPI row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: "Spomienky",    val: insightsData.totalMemories,                     color: P.cyan   },
                            { label: "AI requesty",  val: insightsData.totalRequests,                     color: P.violet },
                            { label: "Tokeny",       val: insightsData.totalTokens.toLocaleString(),      color: P.amber  },
                            { label: "Min. ušetr.",  val: `${insightsData.minutesSaved} min`,             color: "#4ade80" },
                          ].map(({ label, val, color }) => (
                            <div key={label} className="rounded-xl p-3 text-center" style={{ background: "rgba(15,23,42,0.7)", border: `1px solid ${color}22` }}>
                              <p className="text-lg font-black" style={{ color }}>{val}</p>
                              <p className="text-[0.6rem] mt-0.5 tracking-widest uppercase" style={{ color: P.faint }}>{label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Tone + Context breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Tone */}
                          <div className="rounded-xl p-4" style={GLASS}>
                            <p className="text-[0.65rem] font-bold tracking-widest uppercase mb-3" style={{ color: P.muted }}>Emocionálny tón</p>
                            <div className="space-y-2">
                              {insightsData.toneBreakdown.map((r) => {
                                const total = insightsData.toneBreakdown.reduce((s, x) => s + x.count, 0) || 1;
                                const pct = r.count / total;
                                const col = r.tone === "positive" ? "#4ade80" : r.tone === "negative" ? P.red : r.tone === "anxious" ? P.amber : r.tone === "excited" ? P.violet : P.muted;
                                return (
                                  <div key={r.tone}>
                                    <div className="flex justify-between mb-0.5">
                                      <span className="text-[0.65rem]" style={{ color: P.muted }}>{r.tone}</span>
                                      <span className="text-[0.65rem] font-bold" style={{ color: col }}>{r.count}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full" style={{ background: P.faint + "44" }}>
                                      <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: col, boxShadow: `0 0 6px ${col}` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          {/* Context */}
                          <div className="rounded-xl p-4" style={GLASS}>
                            <p className="text-[0.65rem] font-bold tracking-widest uppercase mb-3" style={{ color: P.muted }}>Kontext</p>
                            <div className="space-y-2">
                              {insightsData.contextBreakdown.map((r) => {
                                const total = insightsData.contextBreakdown.reduce((s, x) => s + x.count, 0) || 1;
                                const pct = r.count / total;
                                const col = r.context === "personal" ? P.violet : P.cyan;
                                return (
                                  <div key={r.context}>
                                    <div className="flex justify-between mb-0.5">
                                      <span className="text-[0.65rem]" style={{ color: P.muted }}>{r.context}</span>
                                      <span className="text-[0.65rem] font-bold" style={{ color: col }}>{r.count}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full" style={{ background: P.faint + "44" }}>
                                      <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: col, boxShadow: `0 0 6px ${col}` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Activity heatmap */}
                        {Object.keys(insightsData.dailyBuckets).length > 0 && (() => {
                          const entries = Object.entries(insightsData.dailyBuckets).sort(([a],[b]) => a.localeCompare(b));
                          const maxV = Math.max(...entries.map(([,v]) => v), 1);
                          return (
                            <div className="rounded-xl p-4" style={GLASS}>
                              <p className="text-[0.65rem] font-bold tracking-widest uppercase mb-3" style={{ color: P.muted }}>Aktivita 30 dní</p>
                              <div className="flex items-end gap-0.5 h-12">
                                {entries.map(([d, c]) => {
                                  const pct = c / maxV;
                                  const col = pct > 0.7 ? P.cyan : pct > 0.3 ? P.violet : P.faint;
                                  return <div key={d} className="flex-1 rounded-t-sm" style={{ height: `${Math.max(3, pct*44)}px`, background: col }} title={`${d}: ${c}`} />;
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        <p className="text-[0.6rem] text-center" style={{ color: P.faint }}>
                          🔒 Raw obsah správ nie je zobrazený — len agregované štatistiky. GDPR compliant.
                        </p>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Users table */}
                {explorerLoading ? (
                  <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: P.cyan }} /></div>
                ) : (
                  <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${P.cyanBorder}` }}>
                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[0.6rem] font-bold tracking-widest uppercase"
                      style={{ background: P.cyanDim, color: P.cyan }}>
                      {([["email","Email",3],["membershipTier","Tier",1],["memoryCount","Spomienky",1],["requestCount","Requesty",1],["lastActiveAt","Posl. aktivita",2],["createdAt","Registrácia",2]] as [keyof ExplorerUser, string, number][])
                        .map(([key, label, span]) => (
                          <button key={key} onClick={() => setExplorerSort(s => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))}
                            className={`col-span-${span} flex items-center gap-1 text-left`} style={{ color: explorerSort.key === key ? P.cyan : P.muted }}>
                            {label}
                            <ArrowUpDown className="w-2.5 h-2.5" />
                          </button>
                        ))}
                      <div className="col-span-2 text-right">Akcie</div>
                    </div>

                    {/* Rows */}
                    {explorerUsers
                      .filter(u => !explorerFilter || [u.email, u.name ?? "", u.membershipTier, u.role].join(" ").toLowerCase().includes(explorerFilter.toLowerCase()))
                      .sort((a, b) => {
                        const k = explorerSort.key;
                        const va = a[k] ?? ""; const vb = b[k] ?? "";
                        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
                        return explorerSort.dir === "asc" ? cmp : -cmp;
                      })
                      .map((u, i) => {
                        const tierC = u.membershipTier === "ENTERPRISE" ? P.violet : u.membershipTier === "PREMIUM" ? P.cyan : P.muted;
                        const tierBg = u.membershipTier === "ENTERPRISE" ? P.violetDim : u.membershipTier === "PREMIUM" ? P.cyanDim : "rgba(100,116,139,0.08)";
                        return (
                          <div key={u.id}
                            className="grid grid-cols-12 gap-2 px-4 py-3 text-xs border-t transition-all hover:bg-white/[0.02]"
                            style={{ borderColor: "rgba(255,255,255,0.04)", background: i % 2 === 0 ? "rgba(15,23,42,0.80)" : "rgba(15,23,42,0.60)" }}>
                            <div className="col-span-3 truncate">
                              <p className="font-medium" style={{ color: P.text }}>{u.name ?? "—"}</p>
                              <p className="text-[0.6rem] truncate" style={{ color: P.muted }}>{u.email}</p>
                            </div>
                            <div className="col-span-1 flex items-center">
                              <span className="px-1.5 py-0.5 rounded-full text-[0.55rem] font-bold" style={{ background: tierBg, color: tierC }}>{u.membershipTier}</span>
                            </div>
                            <div className="col-span-1 flex items-center font-bold tabular-nums" style={{ color: P.cyan }}>{u.memoryCount}</div>
                            <div className="col-span-1 flex items-center font-bold tabular-nums" style={{ color: P.violet }}>{u.requestCount}</div>
                            <div className="col-span-2 flex items-center text-[0.6rem]" style={{ color: u.lastActiveAt ? P.muted : P.faint }}>
                              {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString("sk-SK") : "—"}
                            </div>
                            <div className="col-span-2 flex items-center text-[0.6rem]" style={{ color: P.faint }}>
                              {new Date(u.createdAt).toLocaleDateString("sk-SK")}
                            </div>
                            <div className="col-span-2 flex items-center justify-end gap-2">
                              <button onClick={async () => {
                                setInsightsUser(u);
                                setInsightsData(null);
                                setInsightsLoading(true);
                                try {
                                  const r = await fetch(`/api/admin/user-explorer?insights=${u.id}`);
                                  const d = await r.json();
                                  if (d.insights) setInsightsData(d.insights);
                                } finally { setInsightsLoading(false); }
                              }} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.65rem] font-bold transition-all"
                                style={{ background: P.violetDim, border: `1px solid ${P.violetBorder}`, color: P.violet }}>
                                <TrendingUp className="w-3 h-3" /> Insights
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
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

            {/* ── IDENTITY HUB ── */}
            {section === "identity" && (
              <motion.div key="identity" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                className="space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: P.violetDim, border: `1px solid ${P.violetBorder}` }}>
                    <Brain className="w-4.5 h-4.5" style={{ color: P.violet }} />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-widest uppercase" style={{ color: P.violet }}>Identity Hub</h2>
                    <p className="text-[0.65rem]" style={{ color: P.muted }}>Správca osobnosti AI, intent mapovania a Neural Mesh</p>
                  </div>
                </div>

                {/* 1. Intent Map Table */}
                <div className="rounded-2xl p-5" style={{ ...GLASS, border: `1px solid ${P.violetBorder}` }}>
                  <h3 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: P.violet }}>Zoznam Intentov</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid rgba(167,139,250,0.15)` }}>
                          {["Klúčové slovo", "Poznámka do CRM", "Názov úlohy", ""].map(h => (
                            <th key={h} className="text-left pb-2 pr-4" style={{ color: P.muted, fontWeight: 600, letterSpacing: "0.08em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {intents.map(entry => (
                          <tr key={entry.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                            <td className="py-2 pr-4">
                              <span className="px-2 py-0.5 rounded-lg text-[0.68rem] font-bold" style={{ background: P.violetDim, color: P.violet, border: `1px solid ${P.violetBorder}` }}>
                                {entry.pattern}
                              </span>
                            </td>
                            <td className="py-2 pr-4" style={{ color: P.text }}>{entry.note}</td>
                            <td className="py-2 pr-4" style={{ color: P.cyan }}>{entry.taskTitle}</td>
                            <td className="py-2">
                              <button onClick={() => setIntents(prev => prev.filter(e => e.id !== entry.id))}
                                className="p-1 rounded-lg transition-opacity opacity-30 hover:opacity-80">
                                <Trash2 className="w-3 h-3" style={{ color: P.red }} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Add new intent */}
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    {(["pattern", "note", "taskTitle"] as const).map((field, fi) => (
                      <input key={field}
                        placeholder={["Klúčové slovo (napr. hypo)", "Poznámka do CRM", "Názov úlohy"][fi]}
                        value={newIntent[field]}
                        onChange={e => setNewIntent(prev => ({ ...prev, [field]: e.target.value }))}
                        className="flex-1 min-w-0 px-3 py-1.5 text-xs rounded-xl"
                        style={{ ...INPUT_STYLE, minWidth: 120 }}
                      />
                    ))}
                    <button
                      onClick={() => {
                        if (!newIntent.pattern.trim()) return;
                        setIntents(prev => [...prev, { ...newIntent, id: Date.now().toString() }]);
                        setNewIntent({ pattern: "", note: "", taskTitle: "" });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: P.violetDim, border: `1px solid ${P.violetBorder}`, color: P.violet }}>
                      <Plus className="w-3 h-3" /> Pridať
                    </button>
                  </div>
                </div>

                {/* 2. System Prompt Editor */}
                <div className="rounded-2xl p-5" style={{ ...GLASS, border: `1px solid ${P.cyanBorder}` }}>
                  <h3 className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: P.cyan }}>System Prompt Editor</h3>
                  <p className="text-[0.65rem] mb-3" style={{ color: P.muted }}>Upravte osobnosť AI, pravidlá správania a formát výstupov. Zmeny sa premietnu po uložení (vyžaduje reštart API).</p>
                  <textarea
                    rows={16}
                    value={identityPrompt}
                    onChange={e => { setIdentityPrompt(e.target.value); setIdentitySaved(false); }}
                    className="w-full px-4 py-3 text-xs rounded-xl font-mono resize-none"
                    style={{ ...INPUT_STYLE, lineHeight: 1.6, color: P.text }}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[0.6rem]" style={{ color: P.muted }}>{identityPrompt.length} znakov</p>
                    <button
                      onClick={() => setIdentitySaved(true)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: identitySaved ? "rgba(34,197,94,0.15)" : P.cyanDim, border: `1px solid ${identitySaved ? "rgba(34,197,94,0.3)" : P.cyanBorder}`, color: identitySaved ? "#4ade80" : P.cyan }}>
                      {identitySaved ? <><Check className="w-3 h-3" /> Uložené</> : <><Pencil className="w-3 h-3" /> Uložiť</>}
                    </button>
                  </div>
                </div>

                {/* 3. Neural Mesh Sliders */}
                <div className="rounded-2xl p-5" style={{ ...GLASS, border: `1px solid rgba(99,102,241,0.25)` }}>
                  <h3 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#818cf8" }}>Neural Mesh Ovládanie</h3>
                  {[
                    { label: "Hustota bodičiek", value: meshDensity,  set: setMeshDensity,  min: 20, max: 200, step: 5,   unit: "" },
                    { label: "Rýchlosť pohybu",   value: meshSpeed,   set: setMeshSpeed,   min: 0.1, max: 5, step: 0.1, unit: "x" },
                    { label: "Priezračnosť",       value: meshOpacity, set: setMeshOpacity, min: 0.05, max: 1, step: 0.05, unit: "" },
                  ].map(({ label, value, set, min, max, step, unit }) => (
                    <div key={label} className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs" style={{ color: P.muted }}>{label}</span>
                        <span className="text-xs font-bold" style={{ color: "#818cf8" }}>{Number(value).toFixed(step < 1 ? 2 : 0)}{unit}</span>
                      </div>
                      <input type="range" min={min} max={max} step={step} value={value}
                        onChange={e => set(parseFloat(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: "#818cf8" }}
                      />
                    </div>
                  ))}
                  <p className="text-[0.62rem] mt-2" style={{ color: P.muted }}>Zmeny sa prejavia okamžite pri nasledujúcej štárt novej session.</p>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Tier Modal ── */}
      <AnimatePresence>
        {creditModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            onClick={(e) => e.target === e.currentTarget && setCreditModal(null)}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-sm"
              style={{ background: "rgba(6,0,4,0.98)", border: `1px solid ${A.goldBorder}`, boxShadow: `0 0 40px ${A.crimsonGlow}` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black tracking-widest uppercase" style={{ color: A.gold }}>Membership Tier</h3>
                <button onClick={() => setCreditModal(null)} style={{ color: "#44202a" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs mb-1" style={{ color: "#64748b" }}>{creditModal.user.email}</p>
              <p className="text-xs mb-5" style={{ color: "#44202a" }}>
                Aktuálny tier: <span style={{ color: TIER_COLORS[creditModal.user.membershipTier].text, fontWeight: 700 }}>{creditModal.user.membershipTier}</span>
              </p>
              <div className="space-y-2 mb-5">
                {(["BASIC", "PREMIUM", "ENTERPRISE"] as MembershipTier[]).map((tier) => {
                  const tc = TIER_COLORS[tier];
                  const tierInfo = config.membership.tiers[tier];
                  const isSelected = selectedTier === tier;
                  return (
                    <button key={tier} onClick={() => setSelectedTier(tier)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all"
                      style={{
                        background: isSelected ? tc.bg : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isSelected ? tc.border : "rgba(255,255,255,0.05)"}`,
                        boxShadow: isSelected ? `0 0 14px ${tc.bg}` : "none",
                      }}>
                      <div className="text-left">
                        <p className="text-sm font-bold" style={{ color: tc.text }}>{tierInfo.label}</p>
                        <p className="text-[0.6rem] mt-0.5" style={{ color: "#44202a" }}>
                          {tierInfo.dailyRequests === null ? "Unlimited" : tierInfo.dailyRequests} req/deň · {tierInfo.contextWindow} ctx
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4" style={{ color: tc.text }} />}
                    </button>
                  );
                })}
              </div>
              <button onClick={submitTier} disabled={creditLoading || selectedTier === creditModal.user.membershipTier}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: `linear-gradient(135deg,${A.crimson},#7f1d1d)`, color: "#fff", boxShadow: `0 0 16px ${A.crimsonGlow}` }}>
                {creditLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Zmeniť Tier"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
