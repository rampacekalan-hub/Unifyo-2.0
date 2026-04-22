// src/components/ui/EmptyState.tsx
// One component for every "nothing here yet" state. Forces a
// consistent look: soft dashed border, iconic circle, H3, supporting
// text, optional CTA. Replaces the ad-hoc divs scattered across CRM,
// Calendar, Calls, Pipeline and Email pages.

import React from "react";
import Link from "next/link";

interface Props {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description?: string;
  /** Tone — maps to one of the brand-* CSS variables. */
  tone?: "primary" | "accent" | "success" | "warning" | "danger";
  /** Call-to-action — either a client-handler button or a next-link. */
  cta?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Compact version — shorter padding for inline use. */
  compact?: boolean;
}

const TONE_COLOR: Record<NonNullable<Props["tone"]>, string> = {
  primary: "var(--brand-primary)",
  accent:  "var(--brand-accent)",
  success: "var(--brand-success)",
  warning: "var(--brand-warning)",
  danger:  "var(--brand-danger)",
};

export default function EmptyState({
  Icon, title, description, tone = "primary", cta, compact = false,
}: Props) {
  const color = TONE_COLOR[tone];
  return (
    <div
      className={`flex flex-col items-center text-center rounded-2xl ${compact ? "py-8 px-4" : "py-14 px-6"}`}
      style={{
        background: "var(--app-surface-2)",
        border: `1px dashed var(--app-border)`,
        borderRadius: "var(--r-lg)",
      }}
    >
      <div
        className={`${compact ? "w-12 h-12" : "w-14 h-14"} rounded-2xl flex items-center justify-center mb-3`}
        style={{
          background: `color-mix(in oklab, ${color} 14%, transparent)`,
          border: `1px solid color-mix(in oklab, ${color} 35%, transparent)`,
          borderRadius: "var(--r-md)",
          boxShadow: `0 0 20px color-mix(in oklab, ${color} 25%, transparent)`,
        }}
      >
        <Icon
          className={compact ? "w-5 h-5" : "w-6 h-6"}
          style={{ color }}
        />
      </div>
      <h3
        className={`font-semibold mb-1 ${compact ? "text-sm" : "text-base"}`}
        style={{ color: "var(--app-text)" }}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`max-w-sm ${compact ? "text-[0.7rem]" : "text-xs"}`}
          style={{ color: "var(--app-text-muted)" }}
        >
          {description}
        </p>
      )}
      {cta && (
        <div className="mt-4">
          {cta.href ? (
            <Link
              href={cta.href}
              data-press
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl"
              style={{
                background: "var(--brand-gradient)",
                color: "#fff",
                borderRadius: "var(--r-md)",
                boxShadow: `0 0 18px color-mix(in oklab, ${color} 40%, transparent)`,
              }}
            >
              {cta.label} →
            </Link>
          ) : (
            <button
              onClick={cta.onClick}
              data-press
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl"
              style={{
                background: "var(--brand-gradient)",
                color: "#fff",
                borderRadius: "var(--r-md)",
                boxShadow: `0 0 18px color-mix(in oklab, ${color} 40%, transparent)`,
              }}
            >
              {cta.label} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
