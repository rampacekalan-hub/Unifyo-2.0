"use client";
// Admin → Finance tab. Shows global revenue/cost/net + a per-user
// table with filters for time window. Pulls /api/admin/finance.

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Users, Wallet, ArrowDownUp } from "lucide-react";

type Window = "month" | "year" | "all";

interface FinanceRow {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  membershipTier: string;
  createdAt: string;
  subscriptionStatus: string | null;
  requests: { all: number; month: number; year: number };
  tokens:   { all: number; month: number; year: number };
  calls:    { all: number; month: number; year: number };
  cost:     { all: number; month: number; year: number };
  revenue:  { all: number; month: number; year: number };
  revenueSource: "payments" | "estimated";
  net:      { all: number; month: number; year: number };
}

interface ModelBreakdown {
  model: string;
  requests: number;
  tokens: number;
  cost: number;
}

interface FinanceData {
  asOf: string;
  revenueSource: "payments" | "estimated";
  pricing: {
    usdToEur: number;
    models: Record<string, { inputPerMUsd: number; outputPerMUsd: number }>;
    whisperUsdPerMin: number;
  };
  totals: {
    users: number;
    paying: number;
    revenue: { all: number; month: number; year: number };
    cost:    { all: number; month: number; year: number };
    net:     { all: number; month: number; year: number };
    requests:{ all: number; month: number; year: number };
    calls:   { all: number; month: number; year: number };
  };
  modelBreakdown: ModelBreakdown[];
  perUser: FinanceRow[];
}

type SortKey = "revenue" | "cost" | "net" | "requests" | "calls";

const fmt = (n: number) =>
  new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);

const fmtInt = (n: number) => new Intl.NumberFormat("sk-SK").format(n);

export default function FinanceSection() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [win, setWin] = useState<Window>("month");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("net");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetch("/api/admin/finance")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    const filter = q.trim().toLowerCase();
    const filtered = filter
      ? data.perUser.filter(
          (u) =>
            u.email.toLowerCase().includes(filter) ||
            (u.name?.toLowerCase().includes(filter) ?? false),
        )
      : data.perUser;
    return [...filtered].sort((a, b) => {
      const A = a[sortKey][win];
      const B = b[sortKey][win];
      return sortDir === "desc" ? B - A : A - B;
    });
  }, [data, q, sortKey, sortDir, win]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>
        Chyba pri načítaní: {error}
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-sm" style={{ color: "var(--app-text-muted)" }}>Načítavam financie…</div>;
  }

  const totals = data.totals;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: "var(--app-text)" }}>Financie</h2>
          <p className="text-xs mt-1" style={{ color: "var(--app-text-muted)" }}>
            Príjmy, AI náklady a aktivita per používateľ. Aktualizované {new Date(data.asOf).toLocaleString("sk-SK")}.
          </p>
        </div>
        <WindowToggle value={win} onChange={setWin} />
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          icon={<Wallet className="w-4 h-4" />}
          label="Príjmy"
          value={fmt(totals.revenue[win])}
          sub={`${totals.paying} platiacich z ${totals.users}`}
          tone="positive"
        />
        <Kpi
          icon={<TrendingDown className="w-4 h-4" />}
          label="AI náklady"
          value={fmt(totals.cost[win])}
          sub={`${fmtInt(totals.requests[win])} dopytov · ${fmtInt(totals.calls[win])} hovorov`}
          tone="negative"
        />
        <Kpi
          icon={<TrendingUp className="w-4 h-4" />}
          label="Čistý zisk (gross)"
          value={fmt(totals.net[win])}
          sub={
            totals.revenue[win] > 0
              ? `Marža ${Math.round((totals.net[win] / totals.revenue[win]) * 100)}%`
              : "—"
          }
          tone={totals.net[win] >= 0 ? "positive" : "negative"}
        />
        <Kpi
          icon={<Users className="w-4 h-4" />}
          label="Používatelia"
          value={fmtInt(totals.users)}
          sub={`${totals.paying} platiacich`}
          tone="neutral"
        />
      </div>

      {/* Pricing transparency */}
      <div
        className="rounded-xl p-4 text-[0.7rem]"
        style={{ background: "var(--app-surface-2)", border: "1px solid var(--app-border)", color: "var(--app-text-muted)" }}
      >
        <div className="font-semibold mb-1.5" style={{ color: "var(--app-text)" }}>Sadzby (OpenAI list price → EUR @ {data.pricing.usdToEur.toFixed(2)})</div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {Object.entries(data.pricing.models).map(([m, p]) => (
            <span key={m}>
              <span className="font-mono" style={{ color: "var(--app-text)" }}>{m}</span>
              {" — "}
              ${p.inputPerMUsd.toFixed(2)}/M in · ${p.outputPerMUsd.toFixed(2)}/M out
            </span>
          ))}
          <span>Whisper — ${data.pricing.whisperUsdPerMin.toFixed(3)}/min</span>
        </div>
        <div className="mt-1.5">
          Príjmy:{" "}
          {data.revenueSource === "payments"
            ? "Stripe Payment ledger (presné, z webhooku invoice.paid)"
            : "odhad zo subscription createdAt × cena tarify (zatiaľ žiadne Payment záznamy)"}
        </div>
      </div>

      {/* Model breakdown for current month */}
      {data.modelBreakdown.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)" }}
        >
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--app-text)" }}>
            AI náklady tento mesiac podľa modelu
          </div>
          <div className="flex flex-col gap-1.5">
            {data.modelBreakdown.map((m) => {
              const totalCost = data.totals.cost.month || 1;
              const pct = Math.round((m.cost / totalCost) * 100);
              return (
                <div key={m.model} className="flex items-center gap-3 text-xs">
                  <span className="font-mono w-32 shrink-0" style={{ color: "var(--app-text)" }}>{m.model}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--app-surface-2)" }}>
                    <div className="h-full" style={{
                      width: `${pct}%`,
                      background: m.model.includes("gpt-4o-mini") ? "#a78bfa" : "#34d399",
                    }} />
                  </div>
                  <span className="tabular-nums w-20 text-right" style={{ color: "var(--app-text-muted)" }}>
                    {fmtInt(m.requests)} req
                  </span>
                  <span className="tabular-nums w-24 text-right" style={{ color: "var(--app-text)" }}>
                    {fmt(m.cost)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Hľadaj e-mail / meno…"
          className="px-3 py-2 rounded-lg text-sm flex-1 min-w-[220px]"
          style={{ background: "var(--app-surface-2)", border: "1px solid var(--app-border)", color: "var(--app-text)" }}
        />
      </div>

      {/* Per-user table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background: "var(--app-surface-2)", color: "var(--app-text-muted)" }}>
              <tr>
                <Th>Používateľ</Th>
                <Th>Plán</Th>
                <ThSort current={sortKey} dir={sortDir} k="revenue" onClick={toggleSort}>Príjem</ThSort>
                <ThSort current={sortKey} dir={sortDir} k="cost" onClick={toggleSort}>Náklad</ThSort>
                <ThSort current={sortKey} dir={sortDir} k="net" onClick={toggleSort}>Net</ThSort>
                <ThSort current={sortKey} dir={sortDir} k="requests" onClick={toggleSort}>AI dopyty</ThSort>
                <ThSort current={sortKey} dir={sortDir} k="calls" onClick={toggleSort}>Hovory</ThSort>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8" style={{ color: "var(--app-text-muted)" }}>
                    Žiadne výsledky.
                  </td>
                </tr>
              )}
              {rows.map((u) => {
                const net = u.net[win];
                return (
                  <tr key={u.id} style={{ borderTop: "1px solid var(--app-border)" }}>
                    <td className="px-3 py-2.5">
                      <div className="font-medium" style={{ color: "var(--app-text)" }}>{u.name ?? "—"}</div>
                      <div className="text-[0.7rem]" style={{ color: "var(--app-text-muted)" }}>{u.email}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[0.65rem] font-semibold uppercase tracking-wider"
                        style={{
                          background: u.plan === "enterprise" ? "rgba(16,185,129,0.15)" : u.plan === "pro" ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.06)",
                          color: u.plan === "enterprise" ? "#34d399" : u.plan === "pro" ? "#c4b5fd" : "var(--app-text-muted)",
                        }}>
                        {u.plan}
                      </span>
                      {u.subscriptionStatus && u.subscriptionStatus !== "active" && (
                        <div className="text-[0.65rem] mt-1" style={{ color: "var(--app-text-subtle)" }}>{u.subscriptionStatus}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: "var(--app-text)" }}>
                      {fmt(u.revenue[win])}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                      {fmt(u.cost[win])}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums font-semibold"
                      style={{ color: net >= 0 ? "#34d399" : "#fca5a5" }}>
                      {fmt(net)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                      {fmtInt(u.requests[win])}
                      <span className="text-[0.65rem] ml-1" style={{ color: "var(--app-text-subtle)" }}>
                        ({fmtInt(u.tokens[win])}t)
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                      {fmtInt(u.calls[win])}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WindowToggle({ value, onChange }: { value: Window; onChange: (w: Window) => void }) {
  const opts: { id: Window; label: string }[] = [
    { id: "month", label: "Tento mesiac" },
    { id: "year",  label: "Tento rok" },
    { id: "all",   label: "Celkom" },
  ];
  return (
    <div className="flex rounded-lg p-0.5" style={{ background: "var(--app-surface-2)", border: "1px solid var(--app-border)" }}>
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
          style={{
            background: value === o.id ? "var(--app-surface)" : "transparent",
            color: value === o.id ? "var(--app-text)" : "var(--app-text-muted)",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Kpi({
  icon, label, value, sub, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "positive" | "negative" | "neutral";
}) {
  const accent =
    tone === "positive" ? "#34d399" : tone === "negative" ? "#fca5a5" : "var(--app-text-muted)";
  return (
    <div
      className="p-4 rounded-xl"
      style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)" }}
    >
      <div className="flex items-center gap-2" style={{ color: accent }}>
        {icon}
        <span className="text-[0.7rem] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold mt-2 tabular-nums" style={{ color: "var(--app-text)" }}>{value}</div>
      {sub && <div className="text-[0.7rem] mt-0.5" style={{ color: "var(--app-text-subtle)" }}>{sub}</div>}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-[0.7rem] font-semibold uppercase tracking-wider">{children}</th>;
}

function ThSort({
  children, current, dir, k, onClick,
}: {
  children: React.ReactNode;
  current: SortKey;
  dir: "asc" | "desc";
  k: SortKey;
  onClick: (k: SortKey) => void;
}) {
  const active = current === k;
  return (
    <th className="px-3 py-2 text-left text-[0.7rem] font-semibold uppercase tracking-wider">
      <button
        onClick={() => onClick(k)}
        className="inline-flex items-center gap-1 hover:opacity-90"
        style={{ color: active ? "var(--app-text)" : "inherit" }}
      >
        {children}
        <ArrowDownUp className="w-3 h-3 opacity-60" />
        {active && <span className="text-[0.6rem]">{dir === "desc" ? "↓" : "↑"}</span>}
      </button>
    </th>
  );
}
