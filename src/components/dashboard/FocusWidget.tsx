"use client";
// src/components/dashboard/FocusWidget.tsx
// "Dnes máš riešiť" — top of the dashboard, deterministic picks from
// the user's real data (overdue tasks, stale deals, fresh contacts,
// today's meetings). No animations, no hype; short labels, real links.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles, AlertTriangle, Clock, Users, Briefcase, ArrowRight, Loader2,
} from "lucide-react";

interface FocusItem {
  id: string;
  kind: "task" | "deal" | "event" | "contact";
  title: string;
  reason: string;
  href: string;
  when?: string;
  urgency: "now" | "today" | "soon";
}

const KIND_ICON = {
  task:    Clock,
  deal:    Briefcase,
  event:   Sparkles,
  contact: Users,
} as const;

const URGENCY_COLOR = {
  now:   "#f43f5e", // rose-500 — overdue
  today: "#f59e0b", // amber-500 — important today
  soon:  "#22d3ee", // cyan-400 — fresh opportunity
} as const;

export default function FocusWidget() {
  const [items, setItems] = useState<FocusItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/ai/focus");
        if (alive && res.ok) {
          const json = (await res.json()) as { items: FocusItem[] };
          setItems(json.items);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div
        className="rounded-2xl p-4 flex items-center gap-2"
        style={{
          background: "var(--app-surface-2)",
          border: "1px solid var(--app-border)",
        }}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--app-text-muted)" }} />
        <span className="text-xs" style={{ color: "var(--app-text-muted)" }}>
          Hľadám čo ti dnes najviac pomôže…
        </span>
      </div>
    );
  }
  // Nothing to show → hide completely. Empty "dnes nič" card is worse
  // than silence on a fresh-install dashboard.
  if (!items || items.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))",
        border: "1px solid var(--app-border)",
        boxShadow: "0 0 18px rgba(99,102,241,0.1)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--app-text)" }}>
          Dnes máš riešiť
        </h3>
        <span className="text-[10px]" style={{ color: "var(--app-text-subtle)" }}>
          · {items.length} akcie na teraz
        </span>
      </div>

      <ul className="space-y-1.5">
        {items.map((it) => {
          const Icon = KIND_ICON[it.kind];
          const accent = URGENCY_COLOR[it.urgency];
          return (
            <li key={it.id}>
              <Link
                href={it.href}
                className="flex items-center gap-3 px-3 py-2 rounded-xl transition"
                style={{
                  background: "var(--app-surface)",
                  border: `1px solid var(--app-border)`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${accent}18`,
                    border: `1px solid ${accent}44`,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold truncate" style={{ color: "var(--app-text)" }}>
                      {it.title}
                    </span>
                    {it.when && (
                      <span className="text-[10px] flex-shrink-0" style={{ color: accent }}>
                        {it.when}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] truncate" style={{ color: "var(--app-text-muted)" }}>
                    {it.reason}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--app-text-muted)" }} />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
