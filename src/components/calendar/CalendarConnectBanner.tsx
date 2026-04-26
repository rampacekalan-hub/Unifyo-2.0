"use client";
// src/components/calendar/CalendarConnectBanner.tsx
// Top-of-calendar banner mirroring the visual treatment used on the
// email NotConnectedCard: three branded provider tiles (Google,
// Outlook, iCloud), inline Apple modal, and a "TLS · žiadne dáta
// neopúšťajú EU" footer. Apple here uses the shared CalDAV form;
// Google + Microsoft kick off OAuth via /start.
//
// Two ways the banner disappears: any provider becomes connected
// (status endpoints flip to connected:true), OR the user explicitly
// dismisses it via the close button. Dismissal is persisted in
// localStorage so we don't keep nagging across navigation. We DO
// still re-show it on a fresh device — the dismissal is "I saw this,
// not now," not "never again."

import { useEffect, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import AppleConnectModal from "@/components/integrations/AppleConnectModal";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "var(--app-text-subtle)",
  border: "var(--app-border)",
};

const DISMISS_KEY = "unifyo.calendar-connect-dismissed.v1";

type ProviderState = "checking" | "none" | "connected";

// Brand logos sized for chip context (12-14px tall). Same glyphs as
// /email's NotConnectedCard so the surfaces feel cohesive.
function GmailLogo() {
  return (
    <svg width="14" height="11" viewBox="0 0 24 18" aria-hidden>
      <path fill="#4285F4" d="M0 18V4l5 3v11z" />
      <path fill="#34A853" d="M19 18v-11l5-3v14z" />
      <path fill="#FBBC04" d="M0 4l12 8 12-8v-2a2 2 0 00-2-2h-1L12 7 2 0H1a2 2 0 00-1 2z" />
      <path fill="#EA4335" d="M0 4v0L12 12 24 4l-1.5-2L12 9 1.5 2z" opacity=".95" />
      <path fill="#C5221F" d="M5 7L0 4v0L12 12l-7-5z" />
    </svg>
  );
}
function OutlookLogo() {
  return (
    <svg width="13" height="13" viewBox="0 0 32 32" aria-hidden>
      <rect x="2" y="6" width="28" height="20" rx="2" fill="#0F78D4" />
      <circle cx="10" cy="16" r="6" fill="#fff" />
      <text
        x="10" y="20" textAnchor="middle"
        fontFamily="Arial" fontWeight="bold" fontSize="9" fill="#0F78D4"
      >
        O
      </text>
    </svg>
  );
}
function ICloudLogo() {
  return (
    <svg width="15" height="11" viewBox="0 0 32 22" aria-hidden>
      <path
        fill="#cbd5e1"
        d="M24.5 21H8a7 7 0 01-1.6-13.8A8 8 0 0122 6.5a5.5 5.5 0 012.5 14.5z"
      />
      <path
        fill="#94a3b8"
        d="M24.5 21H16V6.6A8 8 0 0122 6.5a5.5 5.5 0 012.5 14.5z"
        opacity=".5"
      />
    </svg>
  );
}

export default function CalendarConnectBanner() {
  const [state, setState] = useState<ProviderState>("checking");
  const [dismissed, setDismissed] = useState(false);
  const [appleOpen, setAppleOpen] = useState(false);

  // Read dismissal flag on mount. Stored as a simple presence check —
  // any value means "user dismissed at least once", we don't track
  // when. Cleared automatically on logout (see Sidebar logout cleanup).
  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) setDismissed(true);
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [g, m, a] = await Promise.all([
          fetch("/api/integrations/google/status").then((r) => r.ok ? r.json() : null).catch(() => null),
          fetch("/api/integrations/microsoft/status").then((r) => r.ok ? r.json() : null).catch(() => null),
          fetch("/api/integrations/apple/status").then((r) => r.ok ? r.json() : null).catch(() => null),
        ]);
        if (cancelled) return;
        const anyConnected = !!(g?.connected || m?.connected || a?.connected);
        setState(anyConnected ? "connected" : "none");
      } catch {
        if (!cancelled) setState("none");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function dismiss() {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
  }

  if (state !== "none" || dismissed) return null;

  // Compact one-row strip — calendar grid is the primary thing on this
  // page, so the connect prompt can't dominate. We keep the three brand
  // chips for one-click consent and tuck the dismissal X on the right.
  // The full marketing card (logos, EU-data note) lives on
  // /settings/integrations for users who want it.
  const ChipBase: React.CSSProperties = {
    background: "var(--app-surface)",
    border: `1px solid ${D.border}`,
  };
  return (
    <div
      className="rounded-2xl px-4 py-2.5 mb-3 flex items-center gap-3 flex-wrap relative"
      style={{
        background:
          "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))," +
          " var(--app-surface-2)",
        border: `1px solid ${D.border}`,
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
          boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
        }}
      >
        <CalendarDays className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-[180px]">
        <div className="text-[13px] font-semibold" style={{ color: D.text }}>
          Prepoj kalendár
        </div>
        <div className="text-[11px]" style={{ color: D.muted }}>
          Nezávisle od e-mailu · TLS šifrované
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <a
          href="/api/integrations/google/start"
          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors"
          style={{ ...ChipBase, color: "#ea4335" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ea4335"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = D.border; }}
        >
          <GmailLogo />
          <span>Google</span>
        </a>
        <a
          href="/api/integrations/microsoft/start"
          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors"
          style={{ ...ChipBase, color: "#0F78D4" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0F78D4"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = D.border; }}
        >
          <OutlookLogo />
          <span>Outlook</span>
        </a>
        <button
          type="button"
          onClick={() => setAppleOpen(true)}
          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors"
          style={{ ...ChipBase, color: "#94a3b8" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#94a3b8"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = D.border; }}
        >
          <ICloudLogo />
          <span>iCloud</span>
        </button>
      </div>
      <button
        onClick={dismiss}
        aria-label="Zavrieť"
        title="Zavrieť"
        className="p-1.5 rounded-lg transition-colors flex-shrink-0"
        style={{ color: D.mutedDark }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = D.text;
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(148,163,184,0.10)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = D.mutedDark;
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        }}
      >
        <X className="w-4 h-4" />
      </button>

      {appleOpen && <AppleConnectModal onClose={() => setAppleOpen(false)} />}
    </div>
  );
}
