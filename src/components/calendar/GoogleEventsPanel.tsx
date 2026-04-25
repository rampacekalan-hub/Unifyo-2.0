"use client";
// src/components/calendar/GoogleEventsPanel.tsx
// Compact "next 7 days" widget that sits above the local calendar grid.
// When NO calendar provider is connected, shows connect prompts for all
// three (Google, Outlook, iCloud) — users shouldn't have to dig into
// Settings → Integrations to find Outlook/iCloud just because the
// dashboard nag only mentioned Google.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ExternalLink, Loader2 } from "lucide-react";

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  htmlLink?: string;
  location?: string;
  allDay: boolean;
}

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "not_connected" }
  | { kind: "ready"; events: GoogleCalendarEvent[] }
  | { kind: "error" };

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "#64748b",
  indigoBorder: "rgba(99,102,241,0.22)",
};

export default function GoogleEventsPanel() {
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState({ kind: "loading" });
      try {
        const res = await fetch("/api/gcal/events");
        if (cancelled) return;
        if (res.status === 409) {
          setState({ kind: "not_connected" });
          return;
        }
        if (!res.ok) {
          setState({ kind: "error" });
          return;
        }
        const json = (await res.json()) as { events: GoogleCalendarEvent[] };
        setState({ kind: "ready", events: json.events });
      } catch {
        if (!cancelled) setState({ kind: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "idle" || state.kind === "error") return null;

  if (state.kind === "loading") {
    return (
      <div
        className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-2"
        style={{ background: "var(--app-surface)", border: `1px solid ${D.indigoBorder}` }}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: D.indigo }} />
        <span className="text-[11px]" style={{ color: D.muted }}>
          Načítavam Google Kalendár…
        </span>
      </div>
    );
  }

  if (state.kind === "not_connected") {
    return <ConnectProviders />;
  }

  const upcoming = state.events.slice(0, 6);
  if (upcoming.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-4 mb-4"
      style={{ background: "var(--app-surface)", border: `1px solid ${D.indigoBorder}` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-3.5 h-3.5" style={{ color: D.indigo }} />
        <h3 className="text-xs font-bold tracking-wide" style={{ color: D.text }}>
          GOOGLE KALENDÁR
        </h3>
        <span className="text-[10px]" style={{ color: D.mutedDark }}>
          · najbližších {state.events.length} udalostí
        </span>
      </div>
      <ul className="space-y-1.5">
        {upcoming.map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-3 px-2.5 py-2 rounded-lg"
            style={{ background: "rgba(99,102,241,0.04)" }}
          >
            <div
              className="w-1 self-stretch rounded-full flex-shrink-0"
              style={{ background: `linear-gradient(180deg, ${D.indigo}, ${D.violet})` }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate" style={{ color: D.text }}>
                {e.summary}
              </div>
              <div className="text-[10px]" style={{ color: D.muted }}>
                {formatWhen(e)}
                {e.location ? ` · ${e.location}` : ""}
              </div>
            </div>
            {e.htmlLink && (
              <a
                href={e.htmlLink}
                target="_blank"
                rel="noreferrer"
                className="p-1 opacity-70 hover:opacity-100"
                title="Otvoriť v Google Kalendári"
              >
                <ExternalLink className="w-3 h-3" style={{ color: D.muted }} />
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Multi-provider connect prompt. Three buttons (Google, Outlook, iCloud).
// Google + Microsoft are OAuth — same /start pattern. Apple is app-password
// based and lives behind the integrations page (CalDAV form).
function ConnectProviders() {
  return (
    <div
      className="rounded-2xl p-4 mb-4"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))",
        border: `1px dashed ${D.indigoBorder}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-3.5 h-3.5" style={{ color: D.indigo }} />
        <h3 className="text-xs font-bold tracking-wide" style={{ color: D.text }}>
          PREPOJ KALENDÁR
        </h3>
      </div>
      <p className="text-[11px] mb-3" style={{ color: D.muted }}>
        Udalosti sa zobrazia vedľa tvojich úloh. Vyber poskytovateľa:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <a
          href="/api/integrations/google/start"
          className="flex items-center justify-center gap-2 text-[11px] font-semibold px-3 py-2 rounded-lg transition-colors"
          style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${D.indigoBorder}`, color: D.text }}
        >
          <ProviderDot color="#ea4335" />
          Google
        </a>
        <a
          href="/api/integrations/microsoft/start"
          className="flex items-center justify-center gap-2 text-[11px] font-semibold px-3 py-2 rounded-lg transition-colors"
          style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${D.indigoBorder}`, color: D.text }}
        >
          <ProviderDot color="#0078d4" />
          Outlook
        </a>
        <Link
          href="/settings/integrations#apple"
          className="flex items-center justify-center gap-2 text-[11px] font-semibold px-3 py-2 rounded-lg transition-colors"
          style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${D.indigoBorder}`, color: D.text }}
        >
          <ProviderDot color="#1d1d1f" />
          iCloud
        </Link>
      </div>
    </div>
  );
}

function ProviderDot({ color }: { color: string }) {
  return <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />;
}

function formatWhen(e: GoogleCalendarEvent): string {
  if (e.allDay) {
    const d = new Date(e.start);
    return `${d.toLocaleDateString("sk-SK", { weekday: "short", day: "numeric", month: "short" })} · celý deň`;
  }
  const s = new Date(e.start);
  const en = new Date(e.end);
  const sameDay = s.toDateString() === en.toDateString();
  const day = s.toLocaleDateString("sk-SK", { weekday: "short", day: "numeric", month: "short" });
  const sTime = s.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
  const eTime = en.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
  return sameDay ? `${day} · ${sTime}–${eTime}` : `${day} · ${sTime}`;
}
