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

// Brand logos — inline SVG, identical glyphs to the email page so the
// two surfaces feel like the same product. No external image fetches.
function GmailLogo() {
  return (
    <svg width="28" height="22" viewBox="0 0 24 18" aria-hidden>
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
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <rect x="2" y="6" width="28" height="20" rx="2" fill="#0F78D4" />
      <path fill="#fff" d="M14 24V8l16 4v8z" opacity=".15" />
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
    <svg width="30" height="22" viewBox="0 0 32 22" aria-hidden>
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

// Same ProviderTile used by /email — large logo, centred name + desc,
// brand-coloured "Pripojiť →" pill that lights the border on hover.
interface TileProps {
  href?: string;
  onClick?: () => void;
  Logo: React.FC;
  name: string;
  desc: string;
  accent: string;
}
function ProviderTile({ href, onClick, Logo, name, desc, accent }: TileProps) {
  const Tag = (href ? "a" : "button") as "a" | "button";
  const interactiveProps = href ? { href } : { type: "button" as const, onClick };
  return (
    <Tag
      {...(interactiveProps as Record<string, unknown>)}
      className="group flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 text-left"
      style={{
        background: "var(--app-surface)",
        border: `1px solid ${D.border}`,
        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.25)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.boxShadow = `0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 28px ${accent}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = D.border;
        e.currentTarget.style.boxShadow = "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.25)";
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${D.border}`,
        }}
      >
        <Logo />
      </div>
      <div className="text-center">
        <div className="text-sm font-bold mb-0.5" style={{ color: D.text }}>
          {name}
        </div>
        <div className="text-[11px]" style={{ color: D.muted }}>
          {desc}
        </div>
      </div>
      <span
        className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors"
        style={{
          background: `${accent}1f`,
          color: accent,
          border: `1px solid ${accent}55`,
        }}
      >
        Pripojiť →
      </span>
    </Tag>
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

  return (
    <div
      className="rounded-3xl p-6 mb-3 relative"
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, rgba(99,102,241,0.10), rgba(139,92,246,0.04) 50%, transparent 80%)," +
          " var(--app-surface-2)",
        border: `1px solid ${D.border}`,
      }}
    >
      {/* Close — top-right. Persists across navigation via localStorage. */}
      <button
        onClick={dismiss}
        aria-label="Zavrieť"
        title="Zavrieť"
        className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors"
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

      <div className="text-center mb-5">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
          style={{
            background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
          }}
        >
          <CalendarDays className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-lg font-bold mb-1" style={{ color: D.text }}>
          Prepoj svoj kalendár
        </h2>
        <p className="text-[13px] max-w-md mx-auto" style={{ color: D.muted }}>
          Vyber si nezávisle od emailu — môžeš mať Apple kalendár a Gmail e-mail.
          Tokeny šifrujeme, kedykoľvek odpojíš v Nastaveniach.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
        <ProviderTile
          href="/api/integrations/google/start"
          Logo={GmailLogo}
          name="Google"
          desc="Workspace · Gmail"
          accent="#ea4335"
        />
        <ProviderTile
          href="/api/integrations/microsoft/start"
          Logo={OutlookLogo}
          name="Outlook"
          desc="Microsoft 365"
          accent="#0F78D4"
        />
        <ProviderTile
          onClick={() => setAppleOpen(true)}
          Logo={ICloudLogo}
          name="iCloud"
          desc="Apple ID · CalDAV"
          accent="#94a3b8"
        />
      </div>

      <div className="flex items-center justify-center gap-2 mt-5 text-[11px]" style={{ color: D.mutedDark }}>
        <span className="w-1 h-1 rounded-full" style={{ background: "#10b981" }} />
        Šifrované cez TLS · žiadne dáta neopúšťajú EU
      </div>

      {appleOpen && <AppleConnectModal onClose={() => setAppleOpen(false)} />}
    </div>
  );
}
