"use client";
// src/app/settings/billing/BillingClient.tsx
// In-app billing page. Reads plan definitions directly from
// `config.pricing` so prices/features can never drift from the public
// pricing section. Stripe checkout is not wired yet — the Pro CTA
// currently signs the user up to the "billing" waitlist slug.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Check, Minus, Sparkles, Crown, Building2, ChevronLeft, Loader2, ArrowRight,
  ExternalLink, CheckCircle2,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

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

// Plan id → tier value persisted on the User row. Keep this in sync with
// `membershipTier` mapping in the auth layer.
const PLAN_TO_TIER: Record<string, string> = {
  basic: "BASIC",
  pro: "PREMIUM",
  enterprise: "ENTERPRISE",
};

const PLAN_ICONS: Record<string, typeof Sparkles> = {
  basic: Sparkles,
  pro: Crown,
  enterprise: Building2,
};

interface SubscriptionInfo {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
}

interface Props {
  plan: string;
  tier: string;
  email: string;
  subscription: SubscriptionInfo | null;
}

const ACTIVE_SUB_STATUSES = new Set(["active", "trialing", "past_due"]);

export default function BillingClient({ plan, tier, email, subscription }: Props) {
  const currentPlan = (plan ?? "basic").toLowerCase();
  const hasActiveSub =
    subscription !== null && ACTIVE_SUB_STATUSES.has(subscription.status);

  // Surface Stripe checkout outcome in a toast, then strip the query so
  // a refresh doesn't re-trigger it.
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const c = searchParams.get("checkout");
    if (c === "success") {
      toast.success("Platba prešla — Pro funkcie sú aktívne (môže chvíľu trvať).");
      router.replace("/settings/billing");
    } else if (c === "cancelled") {
      toast("Platba zrušená.");
      router.replace("/settings/billing");
    }
  }, [searchParams, router]);

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
            Ceny a funkcie sa zhodujú s verejným cenníkom. Počas bety je všetko zadarmo.
          </p>
        </div>

        {/* Active subscription banner */}
        {hasActiveSub && subscription && (
          <div
            className="rounded-2xl p-4 flex items-center gap-3 flex-wrap"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(34,211,238,0.05))",
              border: "1px solid rgba(16,185,129,0.3)",
            }}
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: D.emerald }} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold" style={{ color: D.text }}>
                Predplatné aktívne · {subscription.status}
                {subscription.cancelAtPeriodEnd && " · zruší sa na konci obdobia"}
              </div>
              {subscription.currentPeriodEnd && (
                <div className="text-[11px]" style={{ color: D.muted }}>
                  {subscription.cancelAtPeriodEnd ? "Končí" : "Obnoví sa"}{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("sk-SK", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </div>
              )}
            </div>
            <ManagePortalButton compact />
          </div>
        )}

        {/* Plan cards — rendered from config.pricing so we never drift */}
        <div className="grid gap-4 md:grid-cols-3">
          {config.pricing.map((p) => {
            const isCurrent =
              currentPlan === p.id ||
              (PLAN_TO_TIER[p.id] !== undefined && tier === PLAN_TO_TIER[p.id]);
            const Icon = PLAN_ICONS[p.id] ?? Sparkles;

            // Pro gets the waitlist CTA; Enterprise opens mail; Basic is
            // the default plan during beta so no CTA needed.
            let cta: React.ReactNode;
            if (p.id === "basic") {
              cta = (
                <button
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: D.indigoDim,
                    border: `1px solid ${D.indigoBorder}`,
                    color: D.text,
                  }}
                >
                  {isCurrent ? "Aktuálny plán" : "Default počas bety"}
                </button>
              );
            } else if (p.id === "enterprise") {
              cta = (
                <Link
                  href={`mailto:${config.links.contact.email}`}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-center inline-flex items-center justify-center gap-1.5"
                  style={{
                    background: D.indigoDim,
                    border: `1px solid ${D.indigoBorder}`,
                    color: D.text,
                  }}
                >
                  {p.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              );
            } else {
              // Pro → real Stripe checkout. If user already has an active
              // sub on this exact plan, show "Manage" instead.
              cta = isCurrent && hasActiveSub ? (
                <ManagePortalButton />
              ) : (
                <CheckoutButton plan={p.id} label={p.cta ?? "Upgrade"} />
              );
            }

            return (
              <PlanCard
                key={p.id}
                name={p.name}
                priceText={formatPrice(p)}
                priceNote={p.description}
                icon={Icon}
                highlight={p.highlighted}
                current={isCurrent}
                features={p.features}
                cta={cta}
              />
            );
          })}
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

function formatPrice(p: (typeof config.pricing)[number]): string {
  if (!p.price || p.price <= 0) return "Zadarmo";
  if (p.id === "enterprise") return "Na mieru";
  return `${p.currency}${p.price}/${p.interval === "mesiac" ? "mes" : p.interval}`;
}

// ── Plan card (shared) ─────────────────────────────────────────────
function PlanCard({
  name,
  priceText,
  priceNote,
  icon: Icon,
  features,
  cta,
  current,
  highlight,
}: {
  name: string;
  priceText: string;
  priceNote?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  features: { text: string; included: boolean; tooltip?: string }[];
  cta: React.ReactNode;
  current?: boolean;
  highlight?: boolean;
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
      {priceNote && (
        <p className="text-xs mb-3" style={{ color: D.mutedDark }}>{priceNote}</p>
      )}

      <div className="mb-4">
        <span className="text-2xl font-black" style={{ color: D.text }}>{priceText}</span>
      </div>

      <ul className="space-y-2 mb-5 flex-1">
        {features.map((f) => (
          <li key={f.text} className="flex items-start gap-2 text-xs" style={{ color: f.included ? D.text : D.mutedDark }}>
            {f.included ? (
              <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: D.emerald }} />
            ) : (
              <Minus className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: D.mutedDark }} />
            )}
            <span className={f.tooltip ? "underline decoration-dotted underline-offset-2" : ""} title={f.tooltip}>
              {f.text}
              {f.tooltip && !f.included ? ` · ${f.tooltip}` : ""}
            </span>
          </li>
        ))}
      </ul>

      {cta}
    </div>
  );
}

// ── Stripe Checkout CTA ───────────────────────────────────────────
function CheckoutButton({ plan, label }: { plan: string; label: string }) {
  const [loading, setLoading] = useState(false);

  const go = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      // Full-page navigation to Stripe-hosted checkout.
      window.location.href = json.url;
    } catch (e) {
      setLoading(false);
      toast.error(e instanceof Error ? e.message : "Nepodarilo sa.");
    }
  };

  return (
    <button
      onClick={go}
      disabled={loading}
      className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
      style={{
        background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
        color: "white",
        boxShadow: "0 0 18px rgba(99,102,241,0.4)",
      }}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
      {loading ? "Presmerovávam…" : label}
    </button>
  );
}

// ── Customer Portal CTA ───────────────────────────────────────────
function ManagePortalButton({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState(false);

  const open = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || `HTTP ${res.status}`);
      window.location.href = json.url;
    } catch (e) {
      setLoading(false);
      toast.error(e instanceof Error ? e.message : "Nepodarilo sa.");
    }
  };

  if (compact) {
    return (
      <button
        onClick={open}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl disabled:opacity-50"
        style={{
          background: "rgba(99,102,241,0.08)",
          border: `1px solid ${D.indigoBorder}`,
          color: D.text,
        }}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
        Spravovať predplatné
      </button>
    );
  }

  return (
    <button
      onClick={open}
      disabled={loading}
      className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
      style={{
        background: D.indigoDim,
        border: `1px solid ${D.indigoBorder}`,
        color: D.text,
      }}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
      Spravovať predplatné
    </button>
  );
}
