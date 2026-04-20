"use client";
// src/app/settings/billing/BillingClient.tsx
// Client-side skeleton of the Pro/Basic/Enterprise plan selector. No
// Stripe yet — the Pro CTA just signs the user up to the "billing"
// waitlist slug so we can ping them at launch.

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Check, Sparkles, Crown, Building2, ChevronLeft, Loader2,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  sky: "#22d3ee",
  text: "#eef2ff",
  muted: "#94a3b8",
  mutedDark: "#64748b",
  indigoDim: "rgba(99,102,241,0.08)",
  indigoBorder: "rgba(99,102,241,0.22)",
  emerald: "#10b981",
};

interface Props {
  plan: string;
  tier: string;
  email: string;
}

export default function BillingClient({ plan, tier, email }: Props) {
  const currentPlan = (plan ?? "basic").toLowerCase();

  return (
    <AppLayout title="Plán a fakturácia" subtitle="Plán a fakturácia —">
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs font-medium"
          style={{ color: D.muted }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Späť na Nastavenia
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-black" style={{ color: D.text }}>
            Plán a fakturácia
          </h1>
          <p className="text-sm mt-1" style={{ color: D.muted }}>
            Vyber si plán, ktorý ti sadne. Beta je zadarmo.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <PlanCard
            name="Basic"
            price="Zadarmo"
            priceNote="Pre začiatočníkov"
            icon={Sparkles}
            current={currentPlan === "basic"}
            features={[
              "AI chat s dennými limitmi",
              "CRM — kontakty a poznámky",
              "Kalendár a úlohy",
              "Základné notifikácie",
            ]}
            ctaLabel={currentPlan === "basic" ? "Aktuálny plán" : "Aktivovať"}
            ctaDisabled
          />

          <ProPlanCard email={email} currentTier={tier} />

          <PlanCard
            name="Enterprise"
            price="Na mieru"
            priceNote="Pre firmy a tímy"
            icon={Building2}
            features={[
              "SSO & SCIM",
              "Dedicated support",
              "Custom SLA a DPA",
              "On-prem / EU hosting",
            ]}
            ctaLabel="Kontakt"
            ctaHref="/kontakt"
          />
        </div>

        {/* Beta notice */}
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            background: "rgba(34,211,238,0.06)",
            border: "1px solid rgba(34,211,238,0.25)",
          }}
        >
          <p className="text-sm font-medium" style={{ color: D.text }}>
            Beta obdobie — všetko zdarma do spustenia platenej verzie (Q3 2026).
          </p>
          <p className="text-xs mt-1" style={{ color: D.muted }}>
            Keď Pro spustíme, dáme ti vedieť na e-mail a dostaneš privilegovanú cenu.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

// ── Plan card (generic) ────────────────────────────────────────────
function PlanCard({
  name,
  price,
  priceNote,
  icon: Icon,
  features,
  ctaLabel,
  ctaHref,
  ctaDisabled,
  current,
  highlight,
  children,
}: {
  name: string;
  price: string;
  priceNote?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  features: string[];
  ctaLabel: string;
  ctaHref?: string;
  ctaDisabled?: boolean;
  current?: boolean;
  highlight?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col relative"
      style={{
        background: highlight
          ? "linear-gradient(160deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))"
          : "rgba(99,102,241,0.04)",
        border: `1px solid ${highlight ? D.indigo : D.indigoBorder}`,
        boxShadow: highlight ? "0 0 24px rgba(99,102,241,0.25)" : "none",
      }}
    >
      {current && (
        <span
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-widest"
          style={{
            background: "rgba(16,185,129,0.15)",
            color: D.emerald,
            border: "1px solid rgba(16,185,129,0.35)",
          }}
        >
          Aktuálny
        </span>
      )}
      {highlight && !current && (
        <span
          className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-widest"
          style={{
            background: "rgba(34,211,238,0.15)",
            color: D.sky,
            border: "1px solid rgba(34,211,238,0.35)",
          }}
        >
          Čoskoro
        </span>
      )}

      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
          border: `1px solid ${D.indigoBorder}`,
        }}
      >
        <Icon className="w-5 h-5" style={{ color: D.indigo }} />
      </div>

      <h3 className="text-lg font-bold" style={{ color: D.text }}>{name}</h3>
      <p className="text-xs mb-3" style={{ color: D.mutedDark }}>{priceNote}</p>

      <div className="mb-4">
        <span className="text-2xl font-black" style={{ color: D.text }}>{price}</span>
      </div>

      <ul className="space-y-2 mb-5 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs" style={{ color: D.text }}>
            <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: D.emerald }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {children ??
        (ctaHref ? (
          <Link
            href={ctaHref}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-center"
            style={{
              background: D.indigoDim,
              border: `1px solid ${D.indigoBorder}`,
              color: D.text,
            }}
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            disabled={ctaDisabled}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: D.indigoDim,
              border: `1px solid ${D.indigoBorder}`,
              color: D.text,
            }}
          >
            {ctaLabel}
          </button>
        ))}
    </div>
  );
}

// ── Pro plan card with waitlist CTA ────────────────────────────────
function ProPlanCard({ email, currentTier }: { email: string; currentTier: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const isPro = currentTier === "PREMIUM";

  const joinBeta = async () => {
    if (state === "loading" || state === "done") return;
    setState("loading");
    // TODO(stripe): wire checkout session creation here
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature: "billing", email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Nepodarilo sa.");
      }
      setState("done");
      toast.success("Si v poradí — ozveme sa pri spustení Pro.");
    } catch (e) {
      setState("error");
      toast.error(e instanceof Error ? e.message : "Nepodarilo sa.");
    }
  };

  return (
    <PlanCard
      name="Pro"
      price="€12/mes"
      priceNote="Pre profesionálov"
      icon={Crown}
      highlight
      current={isPro}
      features={[
        "Neobmedzené AI requesty",
        "Pokročilá pamäť a kontext",
        "Prioritná podpora",
        "Všetky budúce Pro moduly",
      ]}
      ctaLabel=""
    >
      <button
        onClick={joinBeta}
        disabled={state === "loading" || state === "done"}
        className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
        style={{
          background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
          color: "white",
          boxShadow: "0 0 18px rgba(99,102,241,0.4)",
        }}
      >
        {state === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
        {state === "done"
          ? "Si v poradí ✓"
          : state === "loading"
          ? "Prihlasujem…"
          : "Čoskoro — zapojiť sa do betatestu"}
      </button>
    </PlanCard>
  );
}
