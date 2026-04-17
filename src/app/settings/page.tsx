"use client";
// src/app/settings/page.tsx
// User settings — profile, password, preferences.
// Stub-level implementation: profile edit is live; other sections show "Čoskoro"
// clearly (not a 404) so every navigation button lands on a real page.

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  User, KeyRound, Bell, Sparkles, LogOut, Save, Loader2, Mail, Shield, Palette,
  Brain, Thermometer, MessageSquare,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { loadPrefs, savePrefs, type AiPrefs, type ResponseStyle } from "@/lib/aiPrefs";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  sky: "#22d3ee",
  text: "#eef2ff",
  muted: "#94a3b8",
  mutedDark: "#64748b",
  indigoDim: "rgba(99,102,241,0.08)",
  indigoBorder: "rgba(99,102,241,0.22)",
  rose: "#f43f5e",
};

interface Me {
  id: string;
  email: string;
  name: string | null;
  role: string;
  membershipTier: string | null;
}

export default function SettingsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/me");
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          setMe(data.user);
          setName(data.user.name ?? "");
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Meno nemôže byť prázdne");
      return;
    }
    setSaving(true);
    try {
      // Endpoint nebude 404-ovať — ak neexistuje PATCH, spadneme do catch
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        toast.success("Profil uložený");
        load();
      } else {
        toast.info("Ukladanie profilu bude dostupné čoskoro");
      }
    } catch {
      toast.info("Ukladanie profilu bude dostupné čoskoro");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <AppLayout title="Nastavenia" subtitle="Nastavenia —">
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
        {/* ── Profil ── */}
        <Section
          icon={User}
          title="Profil"
          subtitle="Základné údaje o tebe"
        >
          {loading ? (
            <Skeleton />
          ) : (
            <div className="space-y-3">
              <Field label="Meno">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tvoje meno"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                />
              </Field>
              <Field label="Email">
                <div
                  className="w-full px-3 py-2.5 rounded-lg text-sm flex items-center gap-2"
                  style={{ background: "rgba(99,102,241,0.04)", border: `1px solid ${D.indigoBorder}`, color: D.muted }}
                >
                  <Mail className="w-3.5 h-3.5" style={{ color: D.indigo }} />
                  {me?.email ?? "—"}
                </div>
              </Field>
              <Field label="Členstvo">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                    style={{
                      background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
                      border: `1px solid ${D.indigoBorder}`,
                      color: D.text,
                    }}
                  >
                    {me?.membershipTier ?? "FREE"}
                  </span>
                  {me?.role === "SUPERADMIN" || me?.role === "ADMIN" ? (
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                      style={{
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.3)",
                        color: "#f59e0b",
                      }}
                    >
                      <Shield className="w-3 h-3" />
                      {me.role}
                    </span>
                  ) : null}
                </div>
              </Field>
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-2 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
                  color: "white",
                  boxShadow: "0 0 14px rgba(99,102,241,0.35)",
                }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Uložiť
              </button>
            </div>
          )}
        </Section>

        {/* ── Heslo ── */}
        <Section icon={KeyRound} title="Heslo a bezpečnosť" subtitle="Zmena hesla, dvojfaktorová autentifikácia" comingSoon />

        {/* ── AI preferencie ── */}
        <AiPrefsSection />

        {/* ── Notifikácie ── */}
        <Section icon={Bell} title="Notifikácie" subtitle="Email, push, pripomienky úloh" comingSoon />

        {/* ── Vzhľad ── */}
        <Section icon={Palette} title="Vzhľad" subtitle="Téma, farebný akcent, hustota" comingSoon />

        {/* ── Odhlásenie ── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(244,63,94,0.05)",
            border: "1px solid rgba(244,63,94,0.2)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: D.text }}>Odhlásiť sa</h3>
              <p className="text-xs mt-0.5" style={{ color: D.muted }}>
                Ukončíš aktuálnu reláciu na tomto zariadení.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
              style={{
                background: "rgba(244,63,94,0.12)",
                border: "1px solid rgba(244,63,94,0.3)",
                color: D.rose,
              }}
            >
              <LogOut className="w-4 h-4" />
              Odhlásiť
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// ── Section helpers ─────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  subtitle,
  children,
  comingSoon = false,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  comingSoon?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(99,102,241,0.04)",
        border: `1px solid ${D.indigoBorder}`,
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
            border: `1px solid ${D.indigoBorder}`,
          }}
        >
          <Icon className="w-4 h-4" style={{ color: D.indigo }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold" style={{ color: D.text }}>{title}</h3>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: D.muted }}>{subtitle}</p>}
        </div>
        {comingSoon && (
          <span
            className="px-2 py-0.5 rounded-full text-[0.6rem] font-semibold uppercase tracking-widest"
            style={{
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.25)",
              color: D.sky,
            }}
          >
            Čoskoro
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1" style={{ color: D.muted }}>{label}</label>
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 rounded-lg" style={{ background: "rgba(99,102,241,0.08)" }} />
      <div className="h-10 rounded-lg" style={{ background: "rgba(99,102,241,0.08)" }} />
      <div className="h-10 rounded-lg w-40" style={{ background: "rgba(99,102,241,0.08)" }} />
    </div>
  );
}

// ── AI preferences section — functional, localStorage-backed ─────
const STYLE_OPTIONS: { id: ResponseStyle; label: string; hint: string }[] = [
  { id: "concise",  label: "Stručný",    hint: "Krátke odpovede, málo slov" },
  { id: "friendly", label: "Priateľský", hint: "Vyvážené, ľudské, default" },
  { id: "formal",   label: "Formálny",   hint: "Oficiálny tón, úplné vety" },
];

function AiPrefsSection() {
  const [prefs, setPrefs] = useState<AiPrefs | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setPrefs(loadPrefs()); }, []);

  if (!prefs) {
    return (
      <Section icon={Sparkles} title="AI preferencie" subtitle="Načítavam…">
        <Skeleton />
      </Section>
    );
  }

  const update = (patch: Partial<AiPrefs>) => {
    setPrefs((p) => (p ? { ...p, ...patch } : p));
    setDirty(true);
  };

  const handleSave = () => {
    if (!prefs) return;
    savePrefs(prefs);
    setDirty(false);
    toast.success("Preferencie uložené");
  };

  return (
    <Section
      icon={Sparkles}
      title="AI preferencie"
      subtitle="Štýl odpovedí, kreativita, pamäť"
    >
      <div className="space-y-5">
        {/* Štýl odpovedí */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: D.muted }}>
            <MessageSquare className="w-3.5 h-3.5" style={{ color: D.indigo }} />
            Štýl odpovedí
          </label>
          <div className="grid grid-cols-3 gap-2">
            {STYLE_OPTIONS.map((opt) => {
              const active = prefs.style === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => update({ style: opt.id })}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: active ? "rgba(99,102,241,0.15)" : D.indigoDim,
                    border: `1px solid ${active ? D.indigo : D.indigoBorder}`,
                    boxShadow: active ? "0 0 14px rgba(99,102,241,0.3)" : "none",
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: active ? D.text : D.muted }}>
                    {opt.label}
                  </p>
                  <p className="text-[0.6rem] mt-0.5 leading-snug" style={{ color: D.mutedDark }}>
                    {opt.hint}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Temperature */}
        <div>
          <label className="flex items-center justify-between text-xs font-medium mb-2" style={{ color: D.muted }}>
            <span className="flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5" style={{ color: D.indigo }} />
              Kreativita
            </span>
            <span style={{ color: D.sky }}>{prefs.temperature.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={prefs.temperature}
            onChange={(e) => update({ temperature: Number(e.target.value) })}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-[0.6rem] mt-1" style={{ color: D.mutedDark }}>
            <span>Presný</span>
            <span>Balansovaný</span>
            <span>Kreatívny</span>
          </div>
        </div>

        {/* Pamäť */}
        <Toggle
          icon={Brain}
          label="Pamäť konverzácií"
          hint="AI si pamätá predchádzajúce rozhovory pre konzistentné odpovede"
          checked={prefs.memoryEnabled}
          onChange={(v) => update({ memoryEnabled: v })}
        />

        {/* Sample prompts */}
        <Toggle
          icon={Sparkles}
          label="Návrhy promptov"
          hint="Zobrazovať sample tlačidlá v prázdnom chate"
          checked={prefs.suggestionsEnabled}
          onChange={(v) => update({ suggestionsEnabled: v })}
        />

        <button
          onClick={handleSave}
          disabled={!dirty}
          className="mt-2 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: dirty ? `linear-gradient(135deg,${D.indigo},${D.violet})` : D.indigoDim,
            color: "white",
            boxShadow: dirty ? "0 0 14px rgba(99,102,241,0.35)" : "none",
          }}
        >
          <Save className="w-4 h-4" />
          {dirty ? "Uložiť preferencie" : "Uložené"}
        </button>
      </div>
    </Section>
  );
}

function Toggle({
  icon: Icon, label, hint, checked, onChange,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2 flex-1">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: D.indigo }} />
        <div>
          <p className="text-sm font-medium" style={{ color: D.text }}>{label}</p>
          {hint && <p className="text-xs mt-0.5" style={{ color: D.muted }}>{hint}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5"
        style={{
          background: checked ? D.indigo : "rgba(99,102,241,0.15)",
          boxShadow: checked ? "0 0 10px rgba(99,102,241,0.4)" : "none",
        }}
        role="switch"
        aria-checked={checked}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: checked ? "calc(100% - 18px)" : "2px" }}
        />
      </button>
    </div>
  );
}
