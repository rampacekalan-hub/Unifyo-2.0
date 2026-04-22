"use client";
// src/app/analytics/page.tsx
// Dashboard of cheap counters — one /api/analytics/summary call, no
// heavy charting libs. Good baseline; we'll add trends/charts as real
// data accumulates and users tell us what they want to see.

import { useEffect, useState } from "react";
import {
  BarChart3, Users, Briefcase, CalendarDays, Phone, MessageSquare,
  TrendingUp, Sparkles, Loader2,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  sky: "#22d3ee",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "var(--app-text-subtle)",
  border: "var(--app-border)",
};

interface Summary {
  contacts: { total: number; new7d: number };
  deals: { total: number; won: number; lost: number; openValueCents: number; winRate: number };
  tasks: { total: number; open: number };
  calls: { total: number; last30d: number };
  chat: { conversations: number; messages30d: number };
  aiToday: { requests: number };
}

function formatEur(cents: number): string {
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/analytics/summary");
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppLayout title="Analytika" subtitle="Analytika —">
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: D.muted }} />
          </div>
        ) : !data ? (
          <p className="text-sm" style={{ color: D.muted }}>Dáta sa nepodarilo načítať.</p>
        ) : (
          <>
            {/* Top row — 4 big counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard Icon={Users} color={D.indigo} label="Kontakty" value={data.contacts.total} delta={data.contacts.new7d} deltaLabel="posledných 7d" />
              <StatCard Icon={Briefcase} color={D.violet} label="Dealy" value={data.deals.total} sub={`${data.deals.won} won · ${data.deals.lost} lost`} />
              <StatCard Icon={CalendarDays} color={D.emerald} label="Úlohy" value={data.tasks.total} sub={`${data.tasks.open} otvorených`} />
              <StatCard Icon={Phone} color={D.amber} label="Hovory" value={data.calls.total} sub={`${data.calls.last30d} za 30d`} />
            </div>

            {/* Pipeline value + win rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Panel title="Pipeline hodnota" Icon={TrendingUp} accent={D.violet}>
                <p className="text-3xl font-bold" style={{ color: D.text }}>
                  {formatEur(data.deals.openValueCents)}
                </p>
                <p className="text-xs mt-1" style={{ color: D.muted }}>
                  Otvorené dealy (Lead + Qualified + Proposal)
                </p>
              </Panel>
              <Panel title="Win rate" Icon={Sparkles} accent={D.emerald}>
                <p className="text-3xl font-bold" style={{ color: D.text }}>
                  {data.deals.winRate}%
                </p>
                <p className="text-xs mt-1" style={{ color: D.muted }}>
                  Z uzavretých dealov ({data.deals.won + data.deals.lost})
                </p>
              </Panel>
            </div>

            {/* AI usage */}
            <Panel title="AI asistent" Icon={MessageSquare} accent={D.sky}>
              <div className="grid grid-cols-3 gap-3">
                <Metric label="Konverzácie" value={data.chat.conversations} />
                <Metric label="Správy / 30d" value={data.chat.messages30d} />
                <Metric label="Dnes (requests)" value={data.aiToday.requests} />
              </div>
            </Panel>

            <p className="text-[0.65rem] text-center" style={{ color: D.mutedDark }}>
              Detailnejšie grafy a trendy pribudnú keď budeš mať viac dát.
            </p>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({
  Icon, color, label, value, delta, deltaLabel, sub,
}: {
  Icon: React.ElementType; color: string; label: string; value: number;
  delta?: number; deltaLabel?: string; sub?: string;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "var(--app-surface)",
        border: `1px solid ${D.border}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.65rem] uppercase tracking-widest" style={{ color: D.muted }}>
          {label}
        </span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}22` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: D.text }}>{value}</p>
      {delta !== undefined && (
        <p className="text-[0.65rem] mt-1 flex items-center gap-1" style={{ color: delta > 0 ? D.emerald : D.muted }}>
          {delta > 0 && <TrendingUp className="w-3 h-3" />}
          {delta > 0 ? `+${delta}` : delta === 0 ? "—" : delta} {deltaLabel}
        </p>
      )}
      {sub && <p className="text-[0.65rem] mt-1" style={{ color: D.muted }}>{sub}</p>}
    </div>
  );
}

function Panel({
  title, Icon, accent, children,
}: {
  title: string; Icon: React.ElementType; accent: string; children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl p-5"
      style={{ background: "var(--app-surface)", border: `1px solid ${D.border}` }}
    >
      <h3 className="text-[0.7rem] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: accent }}>
        <Icon className="w-3.5 h-3.5" /> {title}
      </h3>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-lg font-bold" style={{ color: D.text }}>{value}</p>
      <p className="text-[0.65rem]" style={{ color: D.muted }}>{label}</p>
    </div>
  );
}
