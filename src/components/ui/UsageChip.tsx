"use client";
// src/components/ui/UsageChip.tsx
// Shows total tokens used in the current conversation. Hover reveals a small
// tooltip with a rough cost estimate. Clicking opens /settings (where detailed
// usage will live once billing is wired up).

import { useMemo, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { useChatStore } from "@/lib/chatStore";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  sky:    "#22d3ee",
  text:   "#eef2ff",
  muted:  "#94a3b8",
  border: "rgba(99,102,241,0.22)",
};

// Rough GPT-4o-mini-ish pricing; displayed as "~€0.003" — not billing-accurate.
const EUR_PER_1K_TOKENS = 0.0015;

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function UsageChip() {
  const { messages } = useChatStore();
  const [hover, setHover] = useState(false);

  const total = useMemo(
    () => messages.reduce((sum, m) => sum + (m.tokens ?? 0), 0),
    [messages],
  );

  const costEur = (total / 1000) * EUR_PER_1K_TOKENS;

  return (
    <Link
      href="/settings"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[0.7rem] font-medium transition-colors"
      style={{
        background: "rgba(99,102,241,0.06)",
        border: `1px solid ${D.border}`,
        color: D.text,
      }}
      aria-label="AI spotreba"
      title="AI spotreba v tomto rozhovore"
    >
      <Zap className="w-3 h-3" style={{ color: D.sky }} />
      <span>{formatTokens(total)}</span>
      <span className="hidden sm:inline" style={{ color: D.muted }}>tokenov</span>

      {hover && (
        <div
          className="absolute top-full right-0 mt-2 w-[220px] rounded-xl p-3 z-50 text-left"
          style={{
            // Plne nepriehľadné — alpha pozadie nestačilo na čitateľnosť.
            background: "#0a0c18",
            border: `1px solid ${D.border}`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          }}
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest mb-2" style={{ color: D.muted }}>
            Tento rozhovor
          </p>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: D.muted }}>Tokeny</span>
            <span className="text-sm font-semibold" style={{ color: D.text }}>{total.toLocaleString("sk-SK")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: D.muted }}>Odhad</span>
            <span className="text-sm font-semibold" style={{ color: D.sky }}>
              ~€{costEur.toFixed(4)}
            </span>
          </div>
          <p className="text-[0.6rem] mt-2 leading-relaxed" style={{ color: "rgba(148,163,184,0.7)" }}>
            Detailná spotreba a limity v Nastaveniach →
          </p>
        </div>
      )}
    </Link>
  );
}
