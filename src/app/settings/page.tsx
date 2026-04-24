"use client";
// src/app/settings/page.tsx
// User settings — profile, password, preferences.
// Stub-level implementation: profile edit is live; other sections show "Čoskoro"
// clearly (not a 404) so every navigation button lands on a real page.

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  User, KeyRound, Bell, Sparkles, LogOut, Save, Loader2, Mail, Shield, Palette,
  Brain, Thermometer, MessageSquare, Camera, Trash2, Download, AlertTriangle,
  Monitor, Smartphone, Globe, CheckCircle2, XCircle, Upload,
  Gift, Copy, CreditCard, ChevronRight, BadgeCheck, HelpCircle, Sparkle,
  Link2, Fingerprint, Plus,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import AppLayout from "@/components/layout/AppLayout";
import { loadPrefs, savePrefs, type AiPrefs, type ResponseStyle } from "@/lib/aiPrefs";
import Avatar, { useAvatar } from "@/components/ui/Avatar";
import { setAvatarFromFile, clearAvatar } from "@/lib/avatar";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  sky: "#22d3ee",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "var(--app-text-subtle)",
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
  twoFactorEnabledAt?: string | null;
  emailVerifiedAt?: string | null;
  createdAt?: string | null;
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
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Meno nemôže byť prázdne");
      return;
    }
    if (trimmed.length > 80) {
      toast.error("Meno môže mať maximálne 80 znakov");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        toast.success("Profil uložený");
        load();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Uloženie zlyhalo");
      }
    } catch {
      toast.error("Uloženie zlyhalo");
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
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
        <SettingsSubnav />
        {/* ── Profil ── */}
        <div id="profil" className="scroll-mt-24" />
        <Section
          icon={User}
          title="Profil"
          subtitle="Základné údaje o tebe"
        >
          {loading ? (
            <Skeleton />
          ) : (
            <div className="space-y-3">
              <AvatarField name={me?.name ?? null} email={me?.email ?? null} />
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
                  <span className="flex-1 truncate">{me?.email ?? "—"}</span>
                  {me?.emailVerifiedAt ? (
                    <span
                      className="px-2 py-0.5 rounded-full text-[0.6rem] font-semibold uppercase tracking-widest flex items-center gap-1"
                      style={{
                        background: "rgba(16,185,129,0.12)",
                        border: "1px solid rgba(16,185,129,0.35)",
                        color: "#10b981",
                      }}
                    >
                      <BadgeCheck className="w-3 h-3" />
                      Overený
                    </span>
                  ) : (
                    <span
                      className="px-2 py-0.5 rounded-full text-[0.6rem] font-semibold uppercase tracking-widest"
                      style={{
                        background: "rgba(245,158,11,0.1)",
                        border: "1px solid rgba(245,158,11,0.3)",
                        color: "#f59e0b",
                      }}
                    >
                      Neoverený
                    </span>
                  )}
                </div>
              </Field>
              <Field label="Plán">
                <div
                  className="w-full px-3 py-2.5 rounded-lg text-sm flex items-center"
                  style={{ background: "rgba(99,102,241,0.04)", border: `1px solid ${D.indigoBorder}`, color: D.text }}
                >
                  {(me?.membershipTier ?? "Basic").toString().replace(/^./, (c) => c.toUpperCase())}
                </div>
              </Field>
              <Field label="Člen od">
                <div
                  className="w-full px-3 py-2.5 rounded-lg text-sm"
                  style={{ background: "rgba(99,102,241,0.04)", border: `1px solid ${D.indigoBorder}`, color: D.muted }}
                >
                  {me?.createdAt
                    ? new Date(me.createdAt).toLocaleDateString("sk-SK", {
                        day: "2-digit", month: "long", year: "numeric",
                      })
                    : "—"}
                </div>
              </Field>
              {(me?.role === "SUPERADMIN" || me?.role === "ADMIN") && (
                <Field label="Rola">
                  <span
                    className="inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold items-center gap-1"
                    style={{
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      color: "#f59e0b",
                    }}
                  >
                    <Shield className="w-3 h-3" />
                    {me.role}
                  </span>
                </Field>
              )}
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

        {/* ── Zmena hesla ── */}
        <div id="bezpecnost" className="scroll-mt-24" />
        <ChangePasswordSection />

        {/* ── 2FA ── */}
        <TwoFactorSection
          enabledAt={me?.twoFactorEnabledAt ?? null}
          onChange={load}
        />

        {/* ── Passkeys (Touch ID / Face ID / Windows Hello / bezpečnostné kľúče) ── */}
        <PasskeysSection />

        {/* ── AI preferencie ── */}
        <div id="ai" className="scroll-mt-24" />
        <AiPrefsSection />
        <PrivacyInfoSection />

        {/* ── Notifikácie ── */}
        <div id="notifikacie" className="scroll-mt-24" />
        <Section icon={Bell} title="Notifikácie" subtitle="Email, push, pripomienky úloh" comingSoon />

        {/* ── Vzhľad ── */}
        <div id="vzhlad" className="scroll-mt-24" />
        <AppearanceSection />

        {/* ── Prihlásenia & bezpečnosť ── */}
        <SessionsSection />

        {/* ── Export údajov ── */}
        <div id="data" className="scroll-mt-24" />
        <DataExportSection />

        {/* ── Import CRM ── */}
        <CrmImportSection />

        {/* ── Plán & fakturácia (link) ── */}
        <div id="plan" className="scroll-mt-24" />
        <BillingLinkRow />

        {/* ── Integrácie (Google, Microsoft, …) ── */}
        <div id="integracie" className="scroll-mt-24" />
        <ExternalLinkRow
          href="/settings/integrations"
          icon={Link2}
          title="Integrácie"
          subtitle="Pripoj Gmail, Google Kalendár a ďalšie služby"
        />

        {/* ── FAQ (link) ── */}
        <ExternalLinkRow
          href="/faq"
          icon={HelpCircle}
          title="Často kladené otázky"
          subtitle="Odpovede na 12 najčastejších otázok o Unifyo"
        />

        {/* ── Changelog (link) ── */}
        <ExternalLinkRow
          href="/changelog"
          icon={Sparkle}
          title="Čo je nové"
          subtitle="Prehľad zmien, nových funkcií a opráv"
        />

        {/* ── Referral ── */}
        <ReferralSection />

        {/* ── Moje zdieľané odkazy ── */}
        <ShareLinksSection />

        {/* ── Zmazať účet ── */}
        <DeleteAccountSection email={me?.email ?? ""} />

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

// ── Avatar upload ──────────────────────────────────────────────
function AvatarField({ name, email }: { name: string | null; email: string | null }) {
  const current = useAvatar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      await setAvatarFromFile(file);
      toast.success("Avatar aktualizovaný");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nahrávanie zlyhalo");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label="Fotka">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar name={name} email={email} size={64} />
          {busy && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.5)" }}>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
              style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
            >
              <Camera className="w-3.5 h-3.5" />
              {current ? "Vymeniť" : "Nahrať"}
            </button>
            {current && (
              <button
                onClick={() => { clearAvatar(); toast.success("Avatar odstránený"); }}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", color: "#fca5a5" }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Zmazať
              </button>
            )}
          </div>
          <p className="text-[0.6rem]" style={{ color: D.mutedDark }}>
            JPG / PNG, max 5 MB. Uložené v prehliadači.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = ""; // allow re-selecting same file
          }}
        />
      </div>
    </Field>
  );
}

// ── Data export (GDPR) ─────────────────────────────────────────
function DataExportSection() {
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/user/export");
      if (!res.ok) throw new Error("Export zlyhal");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `unifyo-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export stiahnutý");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export zlyhal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section icon={Download} title="Export údajov" subtitle="GDPR: stiahni si svoje údaje">
      <p className="text-xs mb-3" style={{ color: D.muted }}>
        Export obsahuje tvoj profil, kontakty, úlohy, konverzácie a AI pamäť.
        Súbor je citlivý — uchovávaj ho v bezpečí.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleExport}
          disabled={busy}
          className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Stiahni všetky moje údaje (JSON)
        </button>
        <a
          href="/api/crm/export"
          download
          className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
          style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
        >
          <Download className="w-4 h-4" />
          Stiahni kontakty (CSV)
        </a>
      </div>
    </Section>
  );
}

// ── CRM import section (anchor target for /settings#import) ───────────
function CrmImportSection() {
  return (
    <div id="import" className="scroll-mt-24">
      <Section icon={Upload} title="Import kontaktov" subtitle="Nahraj CSV s kontaktmi do CRM">
        <p className="text-xs mb-3" style={{ color: D.muted }}>
          Podporované stĺpce: Meno, Firma, Email, Telefón, Poznámka. Duplikáty (rovnaký email
          alebo telefón) sa preskočia. Max 5000 riadkov na jeden import.
        </p>
        <a
          href="/crm"
          className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 w-fit"
          style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
        >
          <Upload className="w-4 h-4" />
          Otvoriť import v CRM
        </a>
      </Section>
    </div>
  );
}

// ── Delete account ─────────────────────────────────────────────
function DeleteAccountSection({ email }: { email: string }) {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    if (confirm !== email) {
      toast.error("Zadaj svoj email presne rovnako");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        toast.success("Účet zmazaný. Zbohom!");
        window.location.href = "/";
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Mazanie zlyhalo");
      }
    } catch {
      toast.error("Mazanie zlyhalo");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(244,63,94,0.05)",
        border: "1px solid rgba(244,63,94,0.2)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)" }}
        >
          <AlertTriangle className="w-4 h-4" style={{ color: "#fca5a5" }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold" style={{ color: "#fca5a5" }}>Zmazať účet</h3>
          <p className="text-xs mt-0.5" style={{ color: D.muted }}>
            Permanentne zmaže všetky tvoje údaje. Nedá sa vrátiť.
          </p>
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)", color: "#fca5a5" }}
            >
              Chcem zmazať účet
            </button>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-xs" style={{ color: D.muted }}>
                Pre potvrdenie napíš svoj email: <span className="font-mono" style={{ color: D.text }}>{email}</span>
              </p>
              <input
                type="email"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={email}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.25)", color: D.text }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setOpen(false); setConfirm(""); }}
                  disabled={busy}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                >
                  Zrušiť
                </button>
                <button
                  onClick={handleDelete}
                  disabled={busy || confirm !== email}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-40"
                  style={{ background: "#dc2626", color: "white" }}
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Permanentne zmazať
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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

// ── Sessions & audit ───────────────────────────────────────────────
interface LoginEventRow {
  id: string;
  ip: string | null;
  userAgent: string | null;
  success: boolean;
  createdAt: string;
}

function formatUA(ua: string | null): { device: "desktop" | "mobile" | "unknown"; label: string } {
  if (!ua) return { device: "unknown", label: "Neznáme zariadenie" };
  const s = ua.toLowerCase();
  const mobile = /iphone|android|mobile|ipad/.test(s);
  let browser = "Browser";
  if (s.includes("firefox")) browser = "Firefox";
  else if (s.includes("edg/")) browser = "Edge";
  else if (s.includes("chrome")) browser = "Chrome";
  else if (s.includes("safari")) browser = "Safari";
  let os = "";
  if (s.includes("mac os")) os = "macOS";
  else if (s.includes("windows")) os = "Windows";
  else if (s.includes("android")) os = "Android";
  else if (s.includes("iphone") || s.includes("ipad") || s.includes("ios")) os = "iOS";
  else if (s.includes("linux")) os = "Linux";
  return { device: mobile ? "mobile" : "desktop", label: `${browser}${os ? ` · ${os}` : ""}` };
}

function SessionsSection() {
  const [events, setEvents] = useState<LoginEventRow[] | null>(null);
  const [current, setCurrent] = useState<{ userAgent: string | null; ip: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/user/sessions");
        if (!alive) return;
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events ?? []);
          setCurrent(data.current ?? null);
        }
      } catch {
        if (alive) toast.error("Nepodarilo sa načítať prihlásenia");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function handleLogoutAll() {
    if (!confirm("Odhlásiť sa zo všetkých zariadení? Budeš sa musieť znova prihlásiť aj tu.")) return;
    setLoggingOut(true);
    try {
      const res = await fetch("/api/user/sessions/logout-all", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Odhlásené zo všetkých zariadení");
      window.location.href = "/login";
    } catch {
      toast.error("Odhlásenie zlyhalo");
      setLoggingOut(false);
    }
  }

  const currentUA = formatUA(current?.userAgent ?? null);

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(99,102,241,0.04)",
        border: `1px solid rgba(99,102,241,0.22)`,
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(99,102,241,0.12)" }}
        >
          <Shield className="w-4 h-4" style={{ color: D.indigo }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold" style={{ color: D.text }}>
            Prihlásenia & bezpečnosť
          </h3>
          <p className="text-xs mt-0.5" style={{ color: D.muted }}>
            Audit prístupov k účtu a možnosť odhlásiť všetky zariadenia
          </p>
        </div>
      </div>

      {/* Current device */}
      <div
        className="rounded-xl p-3 mb-3 flex items-center gap-3"
        style={{
          background: "rgba(16,185,129,0.06)",
          border: "1px solid rgba(16,185,129,0.22)",
        }}
      >
        {currentUA.device === "mobile"
          ? <Smartphone className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
          : <Monitor className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold" style={{ color: D.text }}>
            Toto zariadenie · {currentUA.label}
          </div>
          {current?.ip && (
            <div className="text-[10px]" style={{ color: D.muted }}>IP {current.ip}</div>
          )}
        </div>
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase"
          style={{
            background: "rgba(16,185,129,0.15)",
            color: "#10b981",
            border: "1px solid rgba(16,185,129,0.35)",
          }}
        >
          aktívne
        </span>
      </div>

      {/* Recent login events */}
      <div className="mb-3">
        <div
          className="text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: D.mutedDark }}
        >
          Nedávne prihlásenia
        </div>
        {loading ? (
          <div className="text-xs py-3" style={{ color: D.muted }}>
            <Loader2 className="w-3 h-3 animate-spin inline mr-2" />
            Načítavam…
          </div>
        ) : events && events.length > 0 ? (
          <ul className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {events.map((ev) => {
              const ua = formatUA(ev.userAgent);
              return (
                <li
                  key={ev.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg"
                  style={{ background: "rgba(99,102,241,0.04)" }}
                >
                  {ev.success
                    ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10b981" }} />
                    : <XCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#ef4444" }} />}
                  <Globe className="w-3 h-3 flex-shrink-0" style={{ color: D.mutedDark }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] truncate" style={{ color: D.text }}>
                      {ua.label}
                      {ev.ip && <span style={{ color: D.mutedDark }}> · {ev.ip}</span>}
                    </div>
                  </div>
                  <div className="text-[10px] flex-shrink-0" style={{ color: D.muted }}>
                    {new Date(ev.createdAt).toLocaleString("sk-SK", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-xs py-3" style={{ color: D.muted }}>
            Žiadne záznamy.
          </div>
        )}
      </div>

      <button
        onClick={handleLogoutAll}
        disabled={loggingOut}
        className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        style={{
          background: "rgba(244,63,94,0.08)",
          border: "1px solid rgba(244,63,94,0.3)",
          color: "#f43f5e",
        }}
      >
        {loggingOut
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <LogOut className="w-3.5 h-3.5" />}
        Odhlásiť zo všetkých zariadení
      </button>
    </div>
  );
}

// ── Billing link row ───────────────────────────────────────────────
function BillingLinkRow() {
  return (
    <Link
      href="/settings/billing"
      className="block rounded-2xl p-5 transition-all hover:brightness-125"
      style={{
        background: "rgba(99,102,241,0.04)",
        border: `1px solid ${D.indigoBorder}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))",
            border: `1px solid ${D.indigoBorder}`,
          }}
        >
          <CreditCard className="w-4 h-4" style={{ color: D.indigo }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold" style={{ color: D.text }}>
            Plán a fakturácia
          </h3>
          <p className="text-xs mt-0.5" style={{ color: D.muted }}>
            Prehľad plánov a nadchádzajúcej Pro verzie
          </p>
        </div>
        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: D.muted }} />
      </div>
    </Link>
  );
}

// ── Generic settings link row (FAQ, Changelog, …) ─────────────────
function ExternalLinkRow({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl p-5 transition-all hover:brightness-125"
      style={{
        background: "rgba(99,102,241,0.04)",
        border: `1px solid ${D.indigoBorder}`,
      }}
    >
      <div className="flex items-center gap-3">
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
          <p className="text-xs mt-0.5" style={{ color: D.muted }}>{subtitle}</p>
        </div>
        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: D.muted }} />
      </div>
    </Link>
  );
}

// ── Referral section ───────────────────────────────────────────────
function ReferralSection() {
  // Referral program is not live — Stripe credits aren't wired yet.
  // Show a single honest line and hide all counters/lists until the
  // feature works end-to-end. We deliberately drop the share URL too,
  // so we don't set expectations we can't meet.
  return (
    <Section
      icon={Gift}
      title="Pozvi kolegu"
      subtitle="Referral program je v príprave."
    >
      <div
        className="rounded-xl p-4 flex items-start gap-2.5 text-xs"
        style={{
          background: "var(--brand-warning-soft)",
          border: "1px solid color-mix(in oklab, var(--brand-warning) 35%, transparent)",
          color: "var(--brand-warning)",
        }}
      >
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div style={{ color: "var(--app-text)" }}>
          V príprave — referral program spustíme v priebehu roka 2026.
        </div>
      </div>
    </Section>
  );
}

// ── Shared links section ───────────────────────────────────────────
interface ShareLinkRow {
  token: string;
  url: string;
  resourceType: "task" | "contact";
  label: string;
  createdAt: string;
  expiresAt: string | null;
  viewCount: number;
  state: "active" | "revoked" | "expired";
}

function ShareLinksSection() {
  const [rows, setRows] = useState<ShareLinkRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/share");
      if (res.ok) {
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } else {
        setRows([]);
      }
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Odkaz skopírovaný");
    } catch {
      toast.error("Kopírovanie zlyhalo");
    }
  };

  const revoke = async (token: string) => {
    if (!confirm("Naozaj zrušiť tento zdieľaný odkaz?")) return;
    setRevokingToken(token);
    try {
      const res = await fetch(`/api/share/${token}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Odkaz zrušený");
        // Optimistic: mark revoked locally.
        setRows((prev) =>
          prev ? prev.map((r) => (r.token === token ? { ...r, state: "revoked" as const } : r)) : prev
        );
      } else {
        toast.error("Zrušenie zlyhalo");
      }
    } catch {
      toast.error("Zrušenie zlyhalo");
    } finally {
      setRevokingToken(null);
    }
  };

  const active = (rows ?? []).filter((r) => r.state === "active");
  const inactive = (rows ?? []).filter((r) => r.state !== "active");

  return (
    <Section
      icon={Link2}
      title="Moje zdieľané odkazy"
      subtitle="Verejné read-only odkazy na úlohy a kontakty"
    >
      {loading ? (
        <Skeleton />
      ) : !rows || rows.length === 0 ? (
        <div
          className="rounded-xl p-4 text-xs text-center"
          style={{
            background: "rgba(99,102,241,0.04)",
            border: `1px dashed ${D.indigoBorder}`,
            color: D.muted,
          }}
        >
          Zatiaľ žiadne zdieľané odkazy. Klikni na „Zdieľať“ v CRM alebo Kalendári.
        </div>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <ul className="space-y-2">
              {active.map((r) => (
                <li
                  key={r.token}
                  className="rounded-xl p-3"
                  style={{
                    background: "rgba(99,102,241,0.05)",
                    border: `1px solid ${D.indigoBorder}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        background: "rgba(99,102,241,0.12)",
                        border: `1px solid ${D.indigoBorder}`,
                      }}
                    >
                      <Link2 className="w-3.5 h-3.5" style={{ color: D.indigo }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: D.text }}>
                        {r.label}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: D.mutedDark }}>
                        {r.resourceType === "task" ? "Úloha" : "Kontakt"}
                        {" • "}
                        Vytvorené {new Date(r.createdAt).toLocaleDateString("sk-SK")}
                        {" • "}
                        {r.viewCount} {r.viewCount === 1 ? "zobrazenie" : r.viewCount < 5 ? "zobrazenia" : "zobrazení"}
                        {" • "}
                        {r.expiresAt
                          ? `Expiruje ${new Date(r.expiresAt).toLocaleDateString("sk-SK")}`
                          : "Neobmedzená platnosť"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => copyUrl(r.url)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1"
                        style={{
                          background: D.indigoDim,
                          border: `1px solid ${D.indigoBorder}`,
                          color: D.text,
                        }}
                      >
                        <Copy className="w-3 h-3" />
                        Kopírovať
                      </button>
                      <button
                        onClick={() => revoke(r.token)}
                        disabled={revokingToken === r.token}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium disabled:opacity-50"
                        style={{
                          background: "rgba(244,63,94,0.1)",
                          border: "1px solid rgba(244,63,94,0.3)",
                          color: "#fca5a5",
                        }}
                      >
                        {revokingToken === r.token ? "…" : "Zrušiť"}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {inactive.length > 0 && (
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: D.mutedDark }}
              >
                Neaktívne ({inactive.length})
              </div>
              <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {inactive.map((r) => (
                  <li
                    key={r.token}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg text-xs"
                    style={{ background: "rgba(99,102,241,0.03)" }}
                  >
                    <span className="flex-1 truncate" style={{ color: D.muted }}>
                      {r.label}
                    </span>
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase"
                      style={{
                        background: "rgba(148,163,184,0.1)",
                        color: D.mutedDark,
                        border: "1px solid rgba(148,163,184,0.2)",
                      }}
                    >
                      {r.state === "revoked" ? "Zrušené" : "Expirované"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

// ── Change password section ────────────────────────────────────────
function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (newPassword.length < 10) {
      toast.error("Nové heslo musí mať aspoň 10 znakov");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("Nové heslo musí byť iné ako súčasné");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Zmena hesla zlyhala");
        return;
      }
      toast.success("Heslo zmenené. Ostatné zariadenia boli odhlásené.");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast.error("Sieťová chyba");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section icon={KeyRound} title="Zmena hesla" subtitle="Nové heslo odhlási všetky ostatné zariadenia">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Súčasné heslo">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
          />
        </Field>
        <Field label="Nové heslo (min. 10 znakov)">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={10}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
          />
        </Field>
        <button
          type="submit"
          disabled={saving || !currentPassword || newPassword.length < 10}
          className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
            color: "white",
            boxShadow: "0 0 14px rgba(99,102,241,0.35)",
          }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Uložiť
        </button>
      </form>
    </Section>
  );
}

// ── Two-factor authentication section ──────────────────────────────
function TwoFactorSection({
  enabledAt,
  onChange,
}: {
  enabledAt: string | null;
  onChange: () => void;
}) {
  const [setupData, setSetupData] = useState<{
    secret: string;
    otpauthUrl: string;
    qrDataUrl: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const enabled = !!enabledAt;

  async function startSetup() {
    setBusy(true);
    try {
      const res = await fetch("/api/user/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Nepodarilo sa spustiť 2FA");
        return;
      }
      setSetupData(data);
      setVerifyCode("");
    } catch {
      toast.error("Sieťová chyba");
    } finally {
      setBusy(false);
    }
  }

  async function verifySetup(e: React.FormEvent) {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/user/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Overenie zlyhalo");
        return;
      }
      setSetupData(null);
      setBackupCodes(data.backupCodes ?? []);
      toast.success("2FA je aktívne");
      onChange();
    } catch {
      toast.error("Sieťová chyba");
    } finally {
      setBusy(false);
    }
  }

  async function disable(e: React.FormEvent) {
    e.preventDefault();
    if (!disablePassword) return;
    setBusy(true);
    try {
      const res = await fetch("/api/user/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword, code: disableCode.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Vypnutie zlyhalo");
        return;
      }
      toast.success("2FA vypnuté");
      setDisableOpen(false);
      setDisablePassword("");
      setDisableCode("");
      onChange();
    } catch {
      toast.error("Sieťová chyba");
    } finally {
      setBusy(false);
    }
  }

  async function copySecret() {
    if (!setupData) return;
    try {
      await navigator.clipboard.writeText(setupData.secret);
      toast.success("Secret skopírovaný");
    } catch {
      toast.error("Kopírovanie zlyhalo");
    }
  }

  function downloadBackupCodes() {
    if (!backupCodes) return;
    const content = [
      "Unifyo — zalozne kody pre 2FA",
      `Vygenerovane: ${new Date().toISOString()}`,
      "",
      "Kazdy kod je pouzitelny len raz. Uloz si ich na bezpecne miesto.",
      "",
      ...backupCodes,
      "",
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unifyo-2fa-backup-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Section
      icon={Shield}
      title="Dvojfaktorové overenie"
      subtitle="Chráň prihlásenie aplikáciou autentifikátora (TOTP)"
    >
      {backupCodes && backupCodes.length > 0 ? (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.3)",
          }}
        >
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5" style={{ color: "#10b981" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: D.text }}>
                2FA je aktívne. Ulož si záložné kódy.
              </p>
              <p className="text-xs mt-0.5" style={{ color: D.muted }}>
                Stiahni alebo si ich ulož — už sa nezobrazia.
              </p>
            </div>
          </div>
          <div
            className="rounded-lg p-3 grid grid-cols-2 gap-1.5 font-mono text-sm"
            style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${D.indigoBorder}`, color: D.text }}
          >
            {backupCodes.map((c) => (
              <div key={c} className="tracking-widest">{c}</div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadBackupCodes}
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
              style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
            >
              <Download className="w-3.5 h-3.5" />
              Stiahnuť ako .txt
            </button>
            <button
              onClick={() => setBackupCodes(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.35)",
                color: "#10b981",
              }}
            >
              Uložil som si ich
            </button>
          </div>
        </div>
      ) : enabled ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              style={{
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.35)",
                color: "#10b981",
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Aktívne od {new Date(enabledAt!).toLocaleDateString("sk-SK")}
            </span>
          </div>
          {!disableOpen ? (
            <button
              onClick={() => setDisableOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: "rgba(244,63,94,0.12)",
                border: "1px solid rgba(244,63,94,0.3)",
                color: D.rose,
              }}
            >
              Vypnúť 2FA
            </button>
          ) : (
            <form onSubmit={disable} className="space-y-2">
              <Field label="Heslo">
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                />
              </Field>
              <Field label="6-ciferný alebo záložný kód">
                <input
                  type="text"
                  inputMode="numeric"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none font-mono"
                  style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                />
              </Field>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setDisableOpen(false); setDisablePassword(""); setDisableCode(""); }}
                  disabled={busy}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  disabled={busy || !disablePassword}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-40"
                  style={{ background: "#dc2626", color: "white" }}
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Potvrdiť vypnutie
                </button>
              </div>
            </form>
          )}
        </div>
      ) : setupData ? (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: D.muted }}>
            Naskenuj QR kód v aplikácii (Google Authenticator, 1Password, Authy…) a zadaj 6-ciferný kód.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={setupData.qrDataUrl}
              alt="QR pre 2FA"
              width={180}
              height={180}
              className="rounded-lg"
              style={{ background: "white", padding: 8 }}
            />
            <div className="flex-1 space-y-2">
              <Field label="Manuálny secret">
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={setupData.secret}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-mono outline-none"
                    style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                  />
                  <button
                    type="button"
                    onClick={copySecret}
                    className="px-2.5 rounded-lg text-xs font-medium flex items-center gap-1"
                    style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Field>
              <form onSubmit={verifySetup} className="space-y-2">
                <Field label="6-ciferný kód">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    autoFocus
                    placeholder="123456"
                    className="w-full px-3 py-2 rounded-lg text-sm font-mono tracking-widest text-center outline-none"
                    style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                  />
                </Field>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSetupData(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                  >
                    Zrušiť
                  </button>
                  <button
                    type="submit"
                    disabled={busy || verifyCode.length !== 6}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-40"
                    style={{
                      background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
                      color: "white",
                    }}
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Overiť a zapnúť
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: D.muted }}>
            Pri prihlásení budeš po hesle zadávať ešte 6-ciferný kód z autentifikátora.
          </p>
          <button
            onClick={startSetup}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
              color: "white",
              boxShadow: "0 0 14px rgba(99,102,241,0.35)",
            }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            Zapnúť 2FA
          </button>
        </div>
      )}
    </Section>
  );
}

// ── Passkeys — WebAuthn credentials listing + register/remove ───────
// The heavy lifting lives in /api/passkeys/**; this component is just
// a thin UI. We lazy-import @simplewebauthn/browser because it pulls
// ~20KB that first-load users don't need.
interface PasskeyRow {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  backedUp: boolean;
  transports: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

function PasskeysSection() {
  const [rows, setRows] = useState<PasskeyRow[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/passkeys", { cache: "no-store" });
      if (!r.ok) throw new Error("fetch_failed");
      const d = await r.json();
      setRows(d.passkeys ?? []);
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    // Feature detection — if the browser doesn't expose PublicKeyCredential
    // (very old browsers, some webviews), we hide the button and show a
    // friendly message instead of letting the user click something that
    // throws.
    setSupported(
      typeof window !== "undefined" &&
        typeof window.PublicKeyCredential !== "undefined",
    );
    load();
  }, [load]);

  const handleAdd = useCallback(async () => {
    if (adding) return;
    setAdding(true);
    try {
      const { startRegistration } = await import("@simplewebauthn/browser");
      const optsRes = await fetch("/api/passkeys/register/options", { method: "POST" });
      if (!optsRes.ok) throw new Error("options_failed");
      const options = await optsRes.json();

      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON: options });
      } catch (e) {
        const err = e as { name?: string; message?: string };
        if (err.name === "InvalidStateError") {
          toast.error("Tento kľúč je už zaregistrovaný na tvojom účte.");
        } else if (err.name === "NotAllowedError") {
          // User cancelled — no toast, just silently stop.
          return;
        } else {
          toast.error(err.message ?? "Registrácia kľúča zlyhala");
        }
        return;
      }

      const deviceName =
        window.prompt("Pomenuj tento kľúč (napr. 'MacBook Touch ID'):", "")?.trim() || null;

      const verifyRes = await fetch("/api/passkeys/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: attResp, deviceName }),
      });
      if (!verifyRes.ok) {
        const d = await verifyRes.json().catch(() => ({}));
        throw new Error(d.error ?? "verify_failed");
      }
      toast.success("Passkey pridaný");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Neznáma chyba";
      toast.error(`Nepodarilo sa pridať passkey: ${msg}`);
    } finally {
      setAdding(false);
    }
  }, [adding, load]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Odstrániť tento passkey? Už sa ním nebudeš vedieť prihlásiť.")) return;
      const r = await fetch(`/api/passkeys/${id}`, { method: "DELETE" });
      if (r.ok) {
        toast.success("Passkey odstránený");
        await load();
      } else {
        toast.error("Odstránenie zlyhalo");
      }
    },
    [load],
  );

  return (
    <Section
      icon={Fingerprint}
      title="Prístupové kľúče (Passkeys)"
      subtitle="Touch ID, Face ID, Windows Hello, YubiKey — prihlasuj sa bez hesla."
    >
      {supported === false && (
        <div
          className="rounded-xl p-3 text-xs mb-3"
          style={{
            background: "var(--brand-warning-soft)",
            color: "var(--brand-warning)",
          }}
        >
          Tento prehliadač nepodporuje passkey. Skús Safari, Chrome alebo Edge.
        </div>
      )}

      {rows === null ? (
        <div className="text-xs opacity-60">Načítavam…</div>
      ) : rows.length === 0 ? (
        <div className="text-xs opacity-70 mb-3">
          Zatiaľ si nepridal žiadny passkey. Pridaním si zapneš prihlásenie cez odtlačok / Face ID bez písania hesla.
        </div>
      ) : (
        <ul className="space-y-2 mb-3">
          {rows.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl"
              style={{
                background: "var(--app-surface-muted)",
                border: "1px solid var(--app-border)",
              }}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {p.deviceName ?? (p.deviceType === "multiDevice" ? "Synced passkey" : "Passkey")}
                </div>
                <div className="text-[11px] opacity-60">
                  Pridaný {new Date(p.createdAt).toLocaleDateString("sk-SK")}
                  {p.lastUsedAt
                    ? ` · posledné použitie ${new Date(p.lastUsedAt).toLocaleDateString("sk-SK")}`
                    : " · zatiaľ nepoužitý"}
                  {p.backedUp ? " · zálohovaný" : ""}
                </div>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-xs px-2.5 py-1.5 rounded-lg"
                style={{ color: "var(--brand-danger)", background: "var(--brand-danger-soft)" }}
                aria-label="Odstrániť passkey"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {supported !== false && (
        <button
          onClick={handleAdd}
          disabled={adding}
          className="px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          style={{
            background: "var(--brand-primary)",
            color: "white",
          }}
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Pridať passkey
        </button>
      )}
    </Section>
  );
}

// ── Top section-nav — sticky pill bar with quick jumps ─────────────
// Uses native hash navigation (scrolls via CSS `scroll-mt-*` on the
// anchor divs above). IntersectionObserver highlights the active
// section as the user scrolls.
function SettingsSubnav() {
  const SECTIONS: Array<{ id: string; label: string; Icon: React.ElementType }> = [
    { id: "profil",      label: "Profil",       Icon: User },
    { id: "bezpecnost",  label: "Bezpečnosť",   Icon: Shield },
    { id: "ai",          label: "AI",           Icon: Sparkles },
    { id: "notifikacie", label: "Notifikácie",  Icon: Bell },
    { id: "vzhlad",      label: "Vzhľad",       Icon: Palette },
    { id: "integracie",  label: "Integrácie",   Icon: Link2 },
    { id: "plan",        label: "Plán",         Icon: CreditCard },
    { id: "data",        label: "Dáta",         Icon: Download },
  ];

  const [active, setActive] = useState<string>("profil");

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (x): x is HTMLElement => !!x,
    );
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="sticky top-0 z-20 -mx-4 md:mx-0 px-4 md:px-0 py-2 mb-2"
      style={{ background: "var(--app-surface-2)", backdropFilter: "blur(18px)" }}
    >
      <div
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-xl p-1.5"
        style={{ background: "var(--app-surface)", border: `1px solid ${D.indigoBorder}` }}
      >
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          const Icon = s.Icon;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex-shrink-0"
              style={{
                background: isActive ? "rgba(139,92,246,0.18)" : "transparent",
                color: isActive ? D.text : D.muted,
                border: `1px solid ${isActive ? "rgba(139,92,246,0.45)" : "transparent"}`,
              }}
            >
              <Icon className="w-3.5 h-3.5" /> {s.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ── Appearance (theme) section — live switcher tied to user prefs ──
// Uses next-themes for the immediate DOM update; persists the choice
// via /api/onboarding/complete (which accepts partial preferences). A
// tiny beta badge on "Svetlý" warns the user that full light styling
// is in progress — framing looks right, interiors of some modals are
// still dark-first.
function AppearanceSection() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [saving, setSaving] = useState(false);

  const pick = async (next: "dark" | "light" | "system") => {
    setTheme(next);
    setSaving(true);
    try {
      const mapped = next === "system" ? "auto" : next;
      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: mapped }),
      });
      toast.success("Uložené");
    } catch {
      toast.error("Uloženie zlyhalo");
    } finally {
      setSaving(false);
    }
  };

  const options: Array<{ id: "dark" | "light" | "system"; label: string; desc: string; beta?: boolean }> = [
    { id: "dark",   label: "Tmavý",  desc: "Predvolené, plne vyladené" },
    { id: "light",  label: "Svetlý", desc: "Rámec aplikácie, niektoré komponenty tmavé", beta: true },
    { id: "system", label: "Auto",   desc: "Podľa OS" },
  ];

  const active = theme ?? "dark";

  return (
    <Section icon={Palette} title="Vzhľad" subtitle="Tmavý / svetlý režim">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((o) => {
          const on = active === o.id;
          return (
            <button
              key={o.id}
              onClick={() => pick(o.id)}
              disabled={saving}
              className="text-left p-3 rounded-xl transition"
              style={{
                background: on ? "rgba(139,92,246,0.15)" : "rgba(99,102,241,0.04)",
                border: `1px solid ${on ? "rgba(139,92,246,0.45)" : D.indigoBorder}`,
                color: D.text,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold">{o.label}</span>
                {o.beta && (
                  <span
                    className="text-[0.55rem] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                    style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
                  >
                    beta
                  </span>
                )}
              </div>
              <p className="text-[0.65rem]" style={{ color: D.muted }}>{o.desc}</p>
            </button>
          );
        })}
      </div>
      {resolvedTheme === "light" && (
        <p className="mt-3 text-[0.7rem]" style={{ color: D.muted }}>
          Pracujeme na plnej svetlej verzii — rámec (sidebar, header, backgrounds) už svieti,
          niektoré modály zostávajú zatiaľ tmavé.
        </p>
      )}
    </Section>
  );
}

// ── Privacy info — explains exactly where data goes ─────────────────
// Owner asked for this explicitly. Honest disclosure beats a vague
// "secure" badge. We describe each destination (DB, Google, Stripe,
// OpenAI) and what crosses the wire.
function PrivacyInfoSection() {
  const rows: Array<{ where: string; what: string; note: string; color: string }> = [
    {
      where: "Unifyo DB (Hetzner, EU)",
      what: "Kontakty, úlohy, dealy, poznámky, konverzácie, e-mail tokeny.",
      note: "Šifrované pri prenose (HTTPS). Nikto okrem teba to nevidí, okrem nás pri hlásenej chybe — ak to povolíš.",
      color: "#10b981",
    },
    {
      where: "OpenAI API",
      what: "Iba aktuálna správa + tvoj posledný kontext (CRM výňatok, posledných 12 správ).",
      note: "OpenAI tvoje dáta NEPOUŽÍVA na tréning (enterprise API). Nikdy tam nejde databáza celá.",
      color: "#8b5cf6",
    },
    {
      where: "Google (Gmail, Calendar)",
      what: "Len keď si prepojil účet. Tokeny šifrované, používané iba pre tvoje zobrazenie.",
      note: "Môžeš kedykoľvek odpojiť — tokeny zrušíme aj na Google strane.",
      color: "#38bdf8",
    },
    {
      where: "Stripe",
      what: "Iba platobné údaje pri upgrade na Pro/Enterprise. Unifyo tvoju kartu nikdy nevidí.",
      note: "Stripe je PCI-DSS certifikovaný.",
      color: "#f59e0b",
    },
  ];
  return (
    <Section icon={Shield} title="Súkromie a dáta" subtitle="Kam čo ide — bez marketingu">
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.where}
            className="rounded-xl p-3"
            style={{
              background: "rgba(99,102,241,0.04)",
              border: `1px solid ${r.color}33`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />
              <span className="text-xs font-semibold" style={{ color: D.text }}>{r.where}</span>
            </div>
            <p className="text-[0.7rem]" style={{ color: D.muted }}>
              <strong style={{ color: D.text }}>Čo:</strong> {r.what}
            </p>
            <p className="text-[0.65rem] mt-0.5" style={{ color: D.mutedDark }}>
              {r.note}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[0.65rem]" style={{ color: D.mutedDark }}>
        Chceš úplne lokálny model (bez OpenAI)? Pripravujeme variant s Ollama — napíš cez Feedback.
      </p>
    </Section>
  );
}
