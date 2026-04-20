"use client";
// src/components/ui/OnboardingChecklist.tsx
// Dashboard onboarding widget. Shows progress on 5 setup steps. Hides
// itself once the user finishes all 5 or dismisses explicitly (persisted
// via localStorage). Designed to sit above the chat greeting.

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Mail, UserPlus, Sparkles, CalendarPlus, Settings } from "lucide-react";

const D = {
  indigo:       "#6366f1",
  violet:       "#8b5cf6",
  text:         "#eef2ff",
  muted:        "#94a3b8",
  emerald:      "#10b981",
  indigoBorder: "rgba(99,102,241,0.22)",
};

interface OnboardingStatus {
  emailVerified: boolean;
  hasContact: boolean;
  hasConversation: boolean;
  hasTask: boolean;
  hasName: boolean;
}

interface Step {
  key: keyof OnboardingStatus;
  title: string;
  desc: string;
  href: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const STEPS: Step[] = [
  { key: "emailVerified",   title: "Over email",            desc: "Klikni na overovací link.",             href: "/verify-email", Icon: Mail },
  { key: "hasContact",      title: "Pridaj prvý kontakt",   desc: "Naplň CRM prvým klientom.",             href: "/crm?new=1",    Icon: UserPlus },
  { key: "hasConversation", title: "Vyskúšaj AI chat",      desc: "Povedz AI, čo potrebuješ.",             href: "/dashboard",    Icon: Sparkles },
  { key: "hasTask",         title: "Naplánuj úlohu",        desc: "Zapíš si prvý termín.",                 href: "/calendar?new=1", Icon: CalendarPlus },
  { key: "hasName",         title: "Nastav profil",         desc: "Doplň svoje meno v nastaveniach.",      href: "/settings",     Icon: Settings },
];

const DISMISS_KEY = "onboarding_dismissed";

export default function OnboardingChecklist() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Read dismissal + status in parallel. We avoid flashing the widget
  // before we know whether the user already dismissed it.
  useEffect(() => {
    try {
      setDismissed(typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      // localStorage may be blocked (private mode) — treat as not dismissed.
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding/status");
        if (!res.ok) return;
        const data = (await res.json()) as OnboardingStatus;
        if (!cancelled) setStatus(data);
      } catch {
        // Network / auth error — widget stays hidden, silent fail is fine.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading || !status) return null;

  const done = STEPS.filter((s) => status[s.key]).length;
  const total = STEPS.length;
  const allDone = done === total;

  // Auto-hide once the user completes everything, even if they never
  // dismissed manually. Also hide if they explicitly dismissed.
  if (allDone || dismissed) return null;

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
    setDismissed(true);
  };

  const pct = Math.round((done / total) * 100);

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="rounded-2xl p-4 sm:p-5 relative"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.10), rgba(139,92,246,0.08))",
          border: `1px solid ${D.indigoBorder}`,
          boxShadow: "0 0 24px rgba(99,102,241,0.10)",
        }}
        aria-label="Onboarding sprievodca"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
                boxShadow: "0 0 10px rgba(99,102,241,0.35)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate" style={{ color: D.text }}>
                Začíname
              </h3>
              <p className="text-[0.65rem]" style={{ color: D.muted }}>
                {done} z {total} hotovo
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md transition-colors"
            style={{ color: D.muted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = D.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = D.muted)}
            aria-label="Skryť sprievodcu"
            title="Skryť sprievodcu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div
          className="h-1.5 rounded-full overflow-hidden mb-4"
          style={{ background: "rgba(99,102,241,0.12)" }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg,${D.indigo},${D.violet})`,
              boxShadow: "0 0 10px rgba(139,92,246,0.5)",
            }}
          />
        </div>

        {/* Steps */}
        <ul className="space-y-1.5">
          {STEPS.map((step) => {
            const isDone = status[step.key];
            const Icon = step.Icon;
            return (
              <li
                key={step.key}
                className="flex items-center gap-3 px-2.5 py-2 rounded-xl"
                style={{
                  background: isDone ? "rgba(16,185,129,0.08)" : "rgba(99,102,241,0.04)",
                  border: `1px solid ${isDone ? "rgba(16,185,129,0.22)" : D.indigoBorder}`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isDone ? "rgba(16,185,129,0.18)" : "rgba(99,102,241,0.12)",
                    color: isDone ? D.emerald : D.indigo,
                  }}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-medium truncate"
                    style={{
                      color: isDone ? D.emerald : D.text,
                      textDecoration: isDone ? "line-through" : "none",
                    }}
                  >
                    {step.title}
                  </div>
                  <div className="text-[0.65rem] truncate" style={{ color: D.muted }}>
                    {step.desc}
                  </div>
                </div>
                {isDone ? (
                  <span className="text-[0.65rem] font-medium flex-shrink-0" style={{ color: D.emerald }}>
                    Hotovo
                  </span>
                ) : (
                  <Link
                    href={step.href}
                    className="text-[0.7rem] font-medium flex-shrink-0 px-2.5 py-1 rounded-lg transition-colors"
                    style={{
                      background: "rgba(99,102,241,0.14)",
                      border: `1px solid ${D.indigoBorder}`,
                      color: D.text,
                    }}
                  >
                    Otvoriť →
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </motion.section>
    </AnimatePresence>
  );
}
