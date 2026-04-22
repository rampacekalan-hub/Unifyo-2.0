"use client";
// src/app/automation/page.tsx
// Automation Fáza A — 3 built-in recipes the user can enable and
// trigger manually. Cron-based runner lands later; for now the
// toggles persist to User.preferences and "Run now" hits the API so
// the user can see the automation actually do its thing.

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Zap, Mail, AlertTriangle, UserPlus, Play, Loader2, Check, Clock,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "var(--app-text-subtle)",
  border: "var(--app-border)",
};

type RuleId = "daily-digest" | "stale-deal" | "new-sender-to-crm";

interface Rule {
  id: RuleId;
  title: string;
  description: string;
  Icon: React.ElementType;
  color: string;
  runnable: boolean;
  runLabel: string;
}

const RULES: Rule[] = [
  {
    id: "daily-digest",
    title: "Ranný súhrn do e-mailu",
    description: "Každé ráno o 8:00 e-mail s dnešnými úlohami, otvorenými dealmi a novými kontaktmi.",
    Icon: Mail,
    color: D.violet,
    runnable: true,
    runLabel: "Poslať testovací súhrn",
  },
  {
    id: "stale-deal",
    title: "Upozornenie na zaseknutý deal",
    description: "Ak sa deal nehýbe 14 dní, dostaneš e-mail s tipom na ďalší krok.",
    Icon: AlertTriangle,
    color: D.amber,
    runnable: true,
    runLabel: "Skontrolovať hneď",
  },
  {
    id: "new-sender-to-crm",
    title: "Nový odosielateľ z Gmailu do CRM",
    description: "Keď ti do Gmailu napíše niekto kto ešte nie je v CRM, pridá sa ako kontakt. Zatiaľ pripravujeme — dáme vedieť keď bude live.",
    Icon: UserPlus,
    color: D.emerald,
    runnable: false,
    runLabel: "Plánované",
  },
];

interface LastRun { at: string; result: string }

export default function AutomationPage() {
  const [enabled, setEnabled] = useState<Record<RuleId, boolean>>({
    "daily-digest": false,
    "stale-deal": false,
    "new-sender-to-crm": false,
  });
  const [lastRuns, setLastRuns] = useState<Record<string, LastRun>>({});
  const [running, setRunning] = useState<RuleId | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const hydrate = async () => {
    const res = await fetch("/api/user/me");
    if (!res.ok) return;
    const data = await res.json();
    const prefs = data?.user?.preferences ?? {};
    const a = prefs.automations ?? {};
    setEnabled({
      "daily-digest": !!a["daily-digest"],
      "stale-deal": !!a["stale-deal"],
      "new-sender-to-crm": !!a["new-sender-to-crm"],
    });
    setLastRuns((prefs.automationRuns ?? {}) as Record<string, LastRun>);
    setUserEmail(data?.user?.email ?? null);
  };

  useEffect(() => {
    hydrate().finally(() => setLoading(false));
  }, []);

  const toggle = async (id: RuleId) => {
    const next = { ...enabled, [id]: !enabled[id] };
    setEnabled(next);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ automations: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(next[id] ? "Zapnuté" : "Vypnuté");
    } catch {
      setEnabled(enabled); // revert
      toast.error("Uloženie zlyhalo");
    }
  };

  const runNow = async (id: RuleId) => {
    setRunning(id);
    try {
      const res = await fetch("/api/automation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? "run_failed");
      toast.success(data.result || "Hotovo");
      // Refresh prefs so the "Naposledy" line updates immediately.
      hydrate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Spustenie zlyhalo");
    } finally {
      setRunning(null);
    }
  };

  return (
    <AppLayout title="Automatizácie" subtitle="Automatizácie —">
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
        {/* Hero */}
        <div
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(139,92,246,0.10))",
            border: `1px solid ${D.border}`,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `linear-gradient(135deg,${D.amber},${D.violet})`, boxShadow: "0 0 20px rgba(245,158,11,0.35)" }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold mb-1" style={{ color: D.text }}>
                Automatizácie
              </h1>
              <p className="text-xs" style={{ color: D.muted }}>
                Zapni recept → beží automaticky každý deň o 8:00 ráno (CEST).
                Tlačidlo &ldquo;Spusti teraz&rdquo; pošle výstup ihneď na
                {userEmail ? <> <strong style={{ color: D.text }}>{userEmail}</strong></> : " tvoj e-mail"}.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-[0.65rem] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                  <Check className="w-3 h-3" /> Cron aktívny (6:00 UTC)
                </span>
                <span className="text-[0.65rem]" style={{ color: D.mutedDark }}>
                  {Object.values(enabled).filter(Boolean).length} / {RULES.length} zapnutých
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rules */}
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: D.muted }} />
          </div>
        ) : (
          <div className="space-y-2">
            {RULES.map((r) => {
              const Icon = r.Icon;
              const on = enabled[r.id];
              return (
                <div
                  key={r.id}
                  className="rounded-2xl p-4 flex gap-3 items-start"
                  style={{
                    background: "var(--app-surface)",
                    border: `1px solid ${on ? `${r.color}55` : D.border}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${r.color}22` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: r.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold" style={{ color: D.text }}>
                        {r.title}
                      </h3>
                      {on && (
                        <span className="text-[0.6rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
                          style={{ background: "rgba(16,185,129,0.15)", color: D.emerald }}>
                          <Check className="w-2.5 h-2.5" /> Aktívna
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: D.muted }}>{r.description}</p>
                    {/* Last-run status — shows the user the recipe
                        really does something, not just a toggle. */}
                    {lastRuns[r.id] && (
                      <p className="text-[0.65rem] mt-1.5 flex items-center gap-1" style={{ color: D.mutedDark }}>
                        <Check className="w-3 h-3" style={{ color: "#10b981" }} />
                        <span>
                          Naposledy: {formatRelative(lastRuns[r.id].at)} ·{" "}
                          <em style={{ color: D.muted }}>{lastRuns[r.id].result}</em>
                        </span>
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      {r.runnable && (
                        <button
                          onClick={() => runNow(r.id)}
                          disabled={running !== null}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.7rem] font-semibold"
                          style={{
                            background: `${r.color}22`,
                            color: r.color,
                            border: `1px solid ${r.color}55`,
                          }}
                        >
                          {running === r.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                          {r.runLabel}
                        </button>
                      )}
                      {!r.runnable && (
                        <span className="flex items-center gap-1.5 text-[0.7rem]" style={{ color: D.mutedDark }}>
                          <Clock className="w-3 h-3" /> {r.runLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggle(r.id)}
                    className="relative rounded-full transition flex-shrink-0"
                    style={{
                      width: 36, height: 20,
                      background: on ? r.color : "rgba(255,255,255,0.1)",
                    }}
                    aria-label={on ? "Vypnúť" : "Zapnúť"}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: on ? 18 : 2 }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[0.65rem] text-center" style={{ color: D.mutedDark }}>
          V ďalšej verzii pribudne vlastný builder — nastav si triggery a akcie podľa seba.
        </p>
      </div>
    </AppLayout>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "pred chvíľou";
  if (mins < 60) return `pred ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `pred ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `pred ${days} dňami`;
  return new Date(iso).toLocaleDateString("sk-SK", { day: "numeric", month: "short" });
}
