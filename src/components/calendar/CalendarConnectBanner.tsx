"use client";
// src/components/calendar/CalendarConnectBanner.tsx
// Top-of-calendar banner that prompts the user to connect at least one
// calendar provider (Google / Outlook / Apple). It checks all three
// status endpoints in parallel; once ANY of them is connected we hide
// the banner (the user has signalled which surface they want — no
// reason to keep nagging on the others). Independent from email: a
// user can connect Apple here for calendar but Google over on /email.
//
// Apple opens an inline modal (CalDAV form). Google + Microsoft kick
// off OAuth via /start endpoints — the round-trip lands back here
// where the status check flips and the banner disappears.

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import AppleConnectModal from "@/components/integrations/AppleConnectModal";

const D = {
  indigo: "#6366f1",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  border: "var(--app-border)",
};

type ProviderState = "checking" | "none" | "connected";

export default function CalendarConnectBanner() {
  const [state, setState] = useState<ProviderState>("checking");
  const [appleOpen, setAppleOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // We only need to know whether *any* provider is connected. If
      // one of them errors (network blip, server error) we treat that
      // single endpoint as unknown and rely on the others — better
      // than flashing the banner over a working setup.
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

  if (state !== "none") return null;

  return (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{
        background:
          "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))",
        border: `1px dashed ${D.border}`,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-3.5 h-3.5" style={{ color: D.indigo }} />
        <h3 className="text-xs font-bold tracking-wide" style={{ color: D.text }}>
          PREPOJ KALENDÁR
        </h3>
      </div>
      <p className="text-[11px] mb-3" style={{ color: D.muted }}>
        Vyber si nezávisle od emailu — môžeš mať napr. Apple kalendár a Gmail
        v emaily. Udalosti sa zobrazia priamo v mesačnom prehľade.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <a
          href="/api/integrations/google/start"
          className="flex items-center justify-center gap-2 text-[12px] font-semibold px-3 py-2.5 rounded-lg transition-colors hover:opacity-90"
          style={{
            background: "var(--app-surface-2)",
            border: `1px solid ${D.border}`,
            color: D.text,
          }}
        >
          <Dot color="#ea4335" />
          Google
        </a>
        <a
          href="/api/integrations/microsoft/start"
          className="flex items-center justify-center gap-2 text-[12px] font-semibold px-3 py-2.5 rounded-lg transition-colors hover:opacity-90"
          style={{
            background: "var(--app-surface-2)",
            border: `1px solid ${D.border}`,
            color: D.text,
          }}
        >
          <Dot color="#0078d4" />
          Outlook
        </a>
        <button
          type="button"
          onClick={() => setAppleOpen(true)}
          className="flex items-center justify-center gap-2 text-[12px] font-semibold px-3 py-2.5 rounded-lg transition-colors hover:opacity-90"
          style={{
            background: "var(--app-surface-2)",
            border: `1px solid ${D.border}`,
            color: D.text,
          }}
        >
          <Dot color="#cbd5e1" />
          iCloud
        </button>
      </div>
      {appleOpen && <AppleConnectModal onClose={() => setAppleOpen(false)} />}
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />;
}
