"use client";
// src/app/onboarding/OnboardingWizard.tsx
// 5-step first-run wizard. Self-contained layout (no AppLayout) so the
// user isn't distracted by nav chrome. On finish we POST to
// /api/onboarding/complete and redirect to dashboard.
//
// Steps:
//   1. Welcome / name + goals
//   2. Company + industry (optional)
//   3. Connect Google (Gmail + Calendar) — skippable
//   4. Preferences (theme, apps, notifications)
//   5. Plan (Basic free / Pro paid) — Pro kicks to Stripe checkout

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Check, ArrowRight, ArrowLeft, Mail, CalendarDays, Users,
  LayoutDashboard, Bot, Phone, CheckCircle2, Bell, Sun, Moon, Monitor,
  Building2, Target, Loader2, X,
} from "lucide-react";
import type { AppId, ThemeMode, UserPrefs } from "@/lib/userPrefs";
import { DEFAULT_USER_PREFS, INDUSTRIES, GOALS } from "@/lib/userPrefs";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  sky:    "#22d3ee",
  emerald:"#10b981",
  amber:  "#f59e0b",
  text:   "#eef2ff",
  muted:  "#94a3b8",
  mutedDark: "#475569",
  border: "rgba(99,102,241,0.22)",
  borderActive: "rgba(139,92,246,0.55)",
  panel:  "rgba(10,12,24,0.92)",
};

const APPS: Array<{ id: AppId; label: string; desc: string; Icon: React.ElementType; color: string }> = [
  { id: "dashboard",  label: "AI Dashboard",  desc: "Asistent na každý deň",   Icon: Bot,           color: D.violet },
  { id: "email",      label: "E-mail",        desc: "Gmail cez Unifyo",        Icon: Mail,          color: D.sky },
  { id: "calendar",   label: "Kalendár",      desc: "Google Calendar sync",    Icon: CalendarDays,  color: D.emerald },
  { id: "crm",        label: "CRM",           desc: "Kontakty + dealy",        Icon: Users,         color: D.indigo },
  { id: "pipeline",   label: "Pipeline",      desc: "Obchodné príležitosti",   Icon: LayoutDashboard, color: D.amber },
  { id: "calls",      label: "Hovory",        desc: "AI prepis + zhrnutie",    Icon: Phone,         color: "#ec4899" },
];

interface Props {
  initialStep: number;
  defaultName: string;
  email: string;
  defaultCompany: string;
  defaultIndustry: string;
  googleConnected: boolean;
  googleEmail: string | null;
  justConnectedGoogle: boolean;
}

export default function OnboardingWizard({
  initialStep, defaultName, email, defaultCompany, defaultIndustry,
  googleConnected, googleEmail, justConnectedGoogle,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Step 1
  const [name, setName] = useState(defaultName);
  const [goals, setGoals] = useState<string[]>([]);

  // Step 2
  const [company, setCompany] = useState(defaultCompany);
  const [industry, setIndustry] = useState(defaultIndustry);

  // Step 4
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_USER_PREFS);

  const total = 5;

  const save = async (opts?: { skip?: boolean }) => {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          industry,
          preferences: { ...prefs, goals },
          skip: !!opts?.skip,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "save_failed");
      router.push("/dashboard-overview");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "save_failed");
      setSaving(false);
    }
  };

  const next = () => {
    setErr(null);
    if (step === 1 && !name.trim()) { setErr("Zadaj meno, aby sme ťa vedeli osloviť."); return; }
    if (step < total) setStep(step + 1);
  };
  const prev = () => step > 1 && setStep(step - 1);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#05070f", color: D.text }}>
      {/* Decorative radial glow */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(1200px 800px at 50% -10%, rgba(139,92,246,0.18), transparent 60%), radial-gradient(900px 600px at 110% 110%, rgba(34,211,238,0.14), transparent 60%)",
        }}
      />

      <div className="w-full max-w-3xl relative">
        {/* Progress + step dots */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg,${D.indigo},${D.violet})`, boxShadow: "0 0 16px rgba(99,102,241,0.45)" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-wide">Unifyo</span>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} className="h-1 rounded-full transition-all"
                style={{
                  width: i + 1 === step ? 28 : 10,
                  background: i + 1 <= step ? D.violet : "rgba(255,255,255,0.12)",
                  boxShadow: i + 1 === step ? `0 0 10px ${D.violet}88` : undefined,
                }} />
            ))}
            <span className="ml-2 text-[0.65rem]" style={{ color: D.muted }}>{step} / {total}</span>
          </div>
        </div>

        {/* Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl p-6 sm:p-10"
          style={{
            background: D.panel,
            border: `1px solid ${D.border}`,
            boxShadow: "0 30px 80px rgba(0,0,0,0.55), 0 0 40px rgba(139,92,246,0.12)",
            backdropFilter: "blur(28px)",
          }}
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepWelcome key="s1" name={name} setName={setName} goals={goals} setGoals={setGoals} email={email} />
            )}
            {step === 2 && (
              <StepCompany key="s2" company={company} setCompany={setCompany} industry={industry} setIndustry={setIndustry} />
            )}
            {step === 3 && (
              <StepGoogle key="s3" connected={googleConnected} email={googleEmail} justConnected={justConnectedGoogle} />
            )}
            {step === 4 && (
              <StepPrefs key="s4" prefs={prefs} setPrefs={setPrefs} />
            )}
            {step === 5 && (
              <StepPlan key="s5" />
            )}
          </AnimatePresence>

          {err && (
            <div className="mt-4 p-3 rounded-xl text-xs"
              style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" }}>
              {err}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={prev}
              disabled={step === 1 || saving}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition disabled:opacity-30"
              style={{ color: D.muted }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Späť
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => save({ skip: true })}
                disabled={saving}
                className="text-xs px-3 py-2 rounded-lg"
                style={{ color: D.mutedDark }}
              >
                Preskočiť sprievodcu
              </button>
              {step < total ? (
                <button
                  onClick={next}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 rounded-xl transition"
                  style={{
                    background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
                    color: "white",
                    boxShadow: `0 0 20px ${D.violet}66`,
                  }}
                >
                  Ďalej <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => save()}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-semibold px-5 py-2.5 rounded-xl transition"
                  style={{
                    background: `linear-gradient(135deg,${D.emerald},${D.sky})`,
                    color: "#05070f",
                    boxShadow: `0 0 20px ${D.emerald}66`,
                  }}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Dokončiť a spustiť
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────────── Step 1 — Welcome ─────────────── */
function StepWelcome({
  name, setName, goals, setGoals, email,
}: {
  name: string; setName: (v: string) => void;
  goals: string[]; setGoals: (v: string[]) => void;
  email: string;
}) {
  const toggle = (id: string) =>
    setGoals(goals.includes(id) ? goals.filter((g) => g !== id) : [...goals, id]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: D.text }}>
        Vitaj v Unifyo 👋
      </h1>
      <p className="text-sm mb-6" style={{ color: D.muted }}>
        Prihlásený ako <span style={{ color: D.text }}>{email}</span>. Za 2 minúty si nastavíme prostredie podľa teba.
      </p>

      <label className="block mb-4">
        <span className="text-xs font-semibold mb-1.5 block" style={{ color: D.muted }}>
          Ako ťa máme oslovovať?
        </span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="napr. Alan"
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{
            background: "rgba(5,7,15,0.6)",
            border: `1px solid ${D.border}`,
            color: D.text,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = D.borderActive)}
          onBlur={(e) => (e.currentTarget.style.borderColor = D.border)}
        />
      </label>

      <div>
        <span className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: D.muted }}>
          <Target className="w-3.5 h-3.5" /> Čo chceš hlavne dosiahnuť? (voliteľné)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GOALS.map((g) => {
            const active = goals.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggle(g.id)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-left transition"
                style={{
                  background: active ? "rgba(139,92,246,0.15)" : "rgba(5,7,15,0.4)",
                  border: `1px solid ${active ? D.borderActive : D.border}`,
                  color: active ? D.text : D.muted,
                }}
              >
                <span
                  className="w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{
                    background: active ? D.violet : "transparent",
                    border: `1px solid ${active ? D.violet : D.border}`,
                  }}
                >
                  {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                {g.label}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────── Step 2 — Company ─────────────── */
function StepCompany({
  company, setCompany, industry, setIndustry,
}: {
  company: string; setCompany: (v: string) => void;
  industry: string; setIndustry: (v: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5" style={{ color: D.sky }} />
        <h1 className="text-2xl font-bold" style={{ color: D.text }}>Povedz nám o firme</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: D.muted }}>
        Pomôže AI dávať relevantnejšie odporúčania. Môžeš tento krok preskočiť.
      </p>

      <label className="block mb-5">
        <span className="text-xs font-semibold mb-1.5 block" style={{ color: D.muted }}>
          Názov firmy / značky
        </span>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="napr. Unifyo s.r.o."
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: "rgba(5,7,15,0.6)", border: `1px solid ${D.border}`, color: D.text }}
        />
      </label>

      <div>
        <span className="text-xs font-semibold mb-2 block" style={{ color: D.muted }}>
          Odvetvie
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {INDUSTRIES.map((it) => {
            const active = industry === it.id;
            return (
              <button
                key={it.id}
                onClick={() => setIndustry(active ? "" : it.id)}
                className="px-3 py-2 rounded-xl text-xs transition"
                style={{
                  background: active ? "rgba(34,211,238,0.14)" : "rgba(5,7,15,0.4)",
                  border: `1px solid ${active ? "rgba(34,211,238,0.55)" : D.border}`,
                  color: active ? D.text : D.muted,
                }}
              >
                {it.label}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────── Step 3 — Google ─────────────── */
function StepGoogle({
  connected, email, justConnected,
}: {
  connected: boolean; email: string | null; justConnected: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center gap-2 mb-4">
        <GoogleGIcon />
        <h1 className="text-2xl font-bold" style={{ color: D.text }}>Prepoj Gmail a Kalendár</h1>
      </div>
      <p className="text-sm mb-6" style={{ color: D.muted }}>
        Jedným klikom spojíš Gmail (čítanie + posielanie) a Google Calendar (tvoje eventy v Unifyo). Kedykoľvek to môžeš zrušiť.
      </p>

      {justConnected && (
        <div className="mb-4 p-3 rounded-xl text-xs flex items-center gap-2"
          style={{ background: "rgba(16,185,129,0.10)", border: "1px solid rgba(16,185,129,0.35)", color: "#6ee7b7" }}>
          <CheckCircle2 className="w-4 h-4" /> Skvelé — Google je pripojený. Môžeš pokračovať.
        </div>
      )}

      {connected ? (
        <div className="p-4 rounded-2xl flex items-center gap-3"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.28)" }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.18)" }}>
            <Check className="w-4 h-4" style={{ color: D.emerald }} strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: D.text }}>Pripojené</p>
            <p className="text-xs truncate" style={{ color: D.muted }}>{email ?? "Google účet"}</p>
          </div>
        </div>
      ) : (
        <a
          href="/api/integrations/google/start?from=onboarding"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold transition"
          style={{
            background: "white",
            color: "#111827",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
          }}
        >
          <GoogleGIcon />
          Pripojiť Google účet
        </a>
      )}

      <p className="mt-5 text-[0.7rem]" style={{ color: D.mutedDark }}>
        Nechceš teraz? Klikni <strong>Ďalej</strong>. Pripojiť môžeš kedykoľvek z <span style={{ color: D.muted }}>Nastavenia → Integrácie</span>.
      </p>
    </motion.div>
  );
}

function GoogleGIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

/* ─────────────── Step 4 — Preferences ─────────────── */
function StepPrefs({ prefs, setPrefs }: { prefs: UserPrefs; setPrefs: (p: UserPrefs) => void }) {
  const toggleApp = (id: AppId) => {
    const has = prefs.enabledApps.includes(id);
    setPrefs({
      ...prefs,
      enabledApps: has ? prefs.enabledApps.filter((x) => x !== id) : [...prefs.enabledApps, id],
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h1 className="text-2xl font-bold mb-2" style={{ color: D.text }}>Prispôsob prostredie</h1>
      <p className="text-sm mb-5" style={{ color: D.muted }}>
        Ktoré moduly budeš používať? Zobrazí sa iba to, čo vyberieš. Meniť môžeš kedykoľvek.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {APPS.map((a) => {
          const active = prefs.enabledApps.includes(a.id);
          const Icon = a.Icon;
          return (
            <button
              key={a.id}
              onClick={() => toggleApp(a.id)}
              className="relative p-3 rounded-xl text-left transition"
              style={{
                background: active ? `${a.color}14` : "rgba(5,7,15,0.4)",
                border: `1px solid ${active ? `${a.color}77` : D.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" style={{ color: active ? a.color : D.muted }} />
                <span className="text-xs font-semibold" style={{ color: D.text }}>{a.label}</span>
              </div>
              <p className="text-[0.65rem]" style={{ color: D.muted }}>{a.desc}</p>
              {active && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: a.color }}>
                  <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Theme */}
      <div className="mb-5">
        <span className="text-xs font-semibold mb-2 block" style={{ color: D.muted }}>Vzhľad</span>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "dark",  label: "Tmavý",  Icon: Moon },
            { id: "light", label: "Svetlý", Icon: Sun },
            { id: "auto",  label: "Auto",   Icon: Monitor },
          ] as Array<{ id: ThemeMode; label: string; Icon: React.ElementType }>).map((t) => {
            const active = prefs.theme === t.id;
            const Icon = t.Icon;
            return (
              <button
                key={t.id}
                onClick={() => setPrefs({ ...prefs, theme: t.id })}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs transition"
                style={{
                  background: active ? "rgba(139,92,246,0.15)" : "rgba(5,7,15,0.4)",
                  border: `1px solid ${active ? D.borderActive : D.border}`,
                  color: active ? D.text : D.muted,
                }}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      <div>
        <span className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: D.muted }}>
          <Bell className="w-3.5 h-3.5" /> Notifikácie
        </span>
        <div className="space-y-2">
          <ToggleRow
            label="Denný súhrn emailom"
            desc="Ráno o 8:00 dostaneš, čo je dôležité dnes."
            checked={prefs.notifications.emailDigest}
            onChange={(v) => setPrefs({ ...prefs, notifications: { ...prefs.notifications, emailDigest: v } })}
          />
          <ToggleRow
            label="Produktové novinky"
            desc="Občasný e-mail o nových funkciách."
            checked={prefs.notifications.productUpdates}
            onChange={(v) => setPrefs({ ...prefs, notifications: { ...prefs.notifications, productUpdates: v } })}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ToggleRow({
  label, desc, checked, onChange,
}: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition"
      style={{
        background: "rgba(5,7,15,0.4)",
        border: `1px solid ${D.border}`,
      }}
    >
      <div className="text-left pr-4 min-w-0">
        <div className="text-xs font-medium" style={{ color: D.text }}>{label}</div>
        <div className="text-[0.65rem] truncate" style={{ color: D.muted }}>{desc}</div>
      </div>
      <div
        className="w-9 h-5 rounded-full relative transition flex-shrink-0"
        style={{ background: checked ? D.violet : "rgba(255,255,255,0.08)" }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: checked ? 18 : 2 }}
        />
      </div>
    </button>
  );
}

/* ─────────────── Step 5 — Plan ─────────────── */
function StepPlan() {
  const [redirecting, setRedirecting] = useState<null | "pro">(null);
  const [err, setErr] = useState<string | null>(null);

  const goCheckout = async (plan: "pro") => {
    setRedirecting(plan);
    setErr(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? "checkout_failed");
      window.location.href = json.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "checkout_failed");
      setRedirecting(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h1 className="text-2xl font-bold mb-2" style={{ color: D.text }}>Vyber si plán</h1>
      <p className="text-sm mb-6" style={{ color: D.muted }}>
        Začni zadarmo, upgradni keď AI prekročí limit. Žiadna karta teraz.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Basic */}
        <div
          className="p-4 rounded-2xl"
          style={{ background: "rgba(5,7,15,0.5)", border: `1px solid ${D.border}` }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: D.muted }}>Basic</span>
            <span className="text-xs" style={{ color: D.emerald }}>✓ Predvolene</span>
          </div>
          <p className="text-2xl font-bold mb-3" style={{ color: D.text }}>Zadarmo</p>
          <ul className="text-xs space-y-1.5" style={{ color: D.muted }}>
            <li>• AI asistent (limitovane)</li>
            <li>• CRM + Kalendár + Email</li>
            <li>• 1 Google účet</li>
          </ul>
          <p className="mt-4 text-[0.7rem]" style={{ color: D.mutedDark }}>
            Pokračuj kliknutím <strong>Dokončiť a spustiť</strong>.
          </p>
        </div>

        {/* Pro */}
        <div
          className="p-4 rounded-2xl relative"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.14), rgba(99,102,241,0.10))",
            border: `1px solid ${D.borderActive}`,
            boxShadow: "0 0 30px rgba(139,92,246,0.18)",
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: D.violet }}>Pro</span>
            <span className="text-[0.6rem] px-1.5 py-0.5 rounded-md" style={{ background: `${D.amber}22`, color: D.amber }}>
              Odporúčané
            </span>
          </div>
          <p className="text-2xl font-bold mb-3" style={{ color: D.text }}>
            €19 <span className="text-xs font-normal" style={{ color: D.muted }}>/mesiac</span>
          </p>
          <ul className="text-xs space-y-1.5 mb-4" style={{ color: D.muted }}>
            <li>• Neobmedzený AI chat</li>
            <li>• Hovory s AI prepisom</li>
            <li>• Priority support</li>
          </ul>
          <button
            onClick={() => goCheckout("pro")}
            disabled={redirecting !== null}
            className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
            style={{
              background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
              color: "white",
              boxShadow: `0 0 20px ${D.violet}55`,
            }}
          >
            {redirecting === "pro" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Upgradovať na Pro
          </button>
        </div>
      </div>

      {err && (
        <p className="mt-3 text-xs flex items-center gap-1.5" style={{ color: "#fca5a5" }}>
          <X className="w-3 h-3" /> Checkout zlyhal — skús neskôr z Nastavení.
        </p>
      )}
    </motion.div>
  );
}
