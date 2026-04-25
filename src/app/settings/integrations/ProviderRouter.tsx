"use client";
// src/app/settings/integrations/ProviderRouter.tsx
// Per-surface provider chooser. Lets the user pick which connected
// integration serves Mail vs Calendar, so e.g. Microsoft email +
// Google calendar is a one-click setup.
//
// Hides itself when fewer than 2 providers are connected — there's
// nothing to choose between, the auto-pick covers it.

import { useEffect, useState } from "react";
import { Mail, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Provider = "google" | "microsoft" | "apple";

interface Pref {
  connected: Record<Provider, boolean>;
  pinned: { email: Provider | null; calendar: Provider | null };
  effective: { email: Provider | null; calendar: Provider | null };
}

const D = {
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "#64748b",
  indigo: "#6366f1",
  indigoBorder: "rgba(99,102,241,0.22)",
};

const PROVIDER_LABELS: Record<Provider, string> = {
  google: "Google",
  microsoft: "Microsoft",
  apple: "Apple",
};
const PROVIDER_COLORS: Record<Provider, string> = {
  google: "#ea4335",
  microsoft: "#0F78D4",
  apple: "#94a3b8",
};

export default function ProviderRouter() {
  const [pref, setPref] = useState<Pref | null>(null);
  const [saving, setSaving] = useState<"email" | "calendar" | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/integrations/provider-preference");
        if (!res.ok) return;
        const j = (await res.json()) as Pref;
        if (alive) setPref(j);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!pref) return null;
  const connectedCount = Object.values(pref.connected).filter(Boolean).length;
  if (connectedCount < 2) return null; // nothing to choose

  const availableForSurface = (surface: "email" | "calendar"): Provider[] => {
    // Apple inbox/calendar in unified API is not wired yet — surface
    // it only when its adapter exists. For now Apple is hidden from
    // both choosers; users with Apple-only get auto-pick fallback.
    const all: Provider[] = ["google", "microsoft"];
    return all.filter((p) => pref.connected[p]);
  };

  async function setProvider(surface: "email" | "calendar", provider: Provider | null) {
    setSaving(surface);
    try {
      const res = await fetch("/api/integrations/provider-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surface, provider }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Re-read so effective + pinned stay in sync
      const re = await fetch("/api/integrations/provider-preference");
      if (re.ok) setPref((await re.json()) as Pref);
      toast.success(
        surface === "email"
          ? "Email plocha aktualizovaná."
          : "Kalendár plocha aktualizovaná.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Uloženie zlyhalo.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div
      className="rounded-2xl p-5 md:p-6"
      style={{
        background: "var(--app-surface)",
        border: `1px solid ${D.indigoBorder}`,
      }}
    >
      <h2 className="text-base font-bold mb-1" style={{ color: D.text }}>
        Smerovanie plôch
      </h2>
      <p className="text-xs mb-4" style={{ color: D.muted }}>
        Ktorá integrácia obsluhuje Email a Kalendár. Môžeš mixovať —
        napr. Microsoft email + Google kalendár.
      </p>

      <SurfaceRow
        surface="email"
        icon={Mail}
        label="Email"
        providers={availableForSurface("email")}
        pinned={pref.pinned.email}
        effective={pref.effective.email}
        saving={saving === "email"}
        onPick={(p) => setProvider("email", p)}
      />
      <div className="h-3" />
      <SurfaceRow
        surface="calendar"
        icon={Calendar}
        label="Kalendár"
        providers={availableForSurface("calendar")}
        pinned={pref.pinned.calendar}
        effective={pref.effective.calendar}
        saving={saving === "calendar"}
        onPick={(p) => setProvider("calendar", p)}
      />
    </div>
  );
}

function SurfaceRow({
  icon: Icon,
  label,
  providers,
  pinned,
  effective,
  saving,
  onPick,
}: {
  surface: "email" | "calendar";
  icon: typeof Mail;
  label: string;
  providers: Provider[];
  pinned: Provider | null;
  effective: Provider | null;
  saving: boolean;
  onPick: (p: Provider | null) => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(99,102,241,0.10)", border: `1px solid ${D.indigoBorder}` }}
      >
        <Icon className="w-4 h-4" style={{ color: D.indigo }} />
      </div>
      <div className="flex-1 min-w-[120px]">
        <div className="text-sm font-semibold" style={{ color: D.text }}>
          {label}
        </div>
        <div className="text-[10px]" style={{ color: D.mutedDark }}>
          {pinned
            ? `Zafixované: ${PROVIDER_LABELS[pinned]}`
            : effective
            ? `Auto: ${PROVIDER_LABELS[effective]}`
            : "Žiadny pripojený provider"}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onPick(null)}
          disabled={saving}
          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          style={{
            background: pinned === null ? "rgba(99,102,241,0.18)" : "transparent",
            border: `1px solid ${pinned === null ? D.indigo : D.indigoBorder}`,
            color: pinned === null ? D.indigo : D.muted,
          }}
        >
          Auto
        </button>
        {providers.map((p) => {
          const active = pinned === p;
          return (
            <button
              key={p}
              onClick={() => onPick(p)}
              disabled={saving}
              className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              style={{
                background: active ? `${PROVIDER_COLORS[p]}1f` : "transparent",
                border: `1px solid ${active ? PROVIDER_COLORS[p] : D.indigoBorder}`,
                color: active ? PROVIDER_COLORS[p] : D.muted,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: PROVIDER_COLORS[p] }}
              />
              {PROVIDER_LABELS[p]}
            </button>
          );
        })}
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: D.muted }} />}
      </div>
    </div>
  );
}
