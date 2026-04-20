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
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { loadPrefs, savePrefs, type AiPrefs, type ResponseStyle } from "@/lib/aiPrefs";
import Avatar, { useAvatar } from "@/components/ui/Avatar";
import { setAvatarFromFile, clearAvatar } from "@/lib/avatar";

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

        {/* ── Prihlásenia & bezpečnosť ── */}
        <SessionsSection />

        {/* ── Export údajov ── */}
        <DataExportSection />

        {/* ── Import CRM ── */}
        <CrmImportSection />

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
