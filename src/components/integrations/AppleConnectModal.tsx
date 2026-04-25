"use client";
// src/components/integrations/AppleConnectModal.tsx
// Shared inline form for Apple iCloud connect. Used wherever the user
// needs to link iCloud — currently the email page and the calendar
// widget. Apple has no OAuth; we collect Apple ID + an app-specific
// password generated at appleid.apple.com and verify against
// caldav.icloud.com before storing.
//
// Auth-failure UX is the most important detail here: by far the most
// common failure mode is users typing their normal Apple ID password
// (Apple's CalDAV refuses it). The error copy spells that out so they
// stop retrying with the wrong credential.

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Loader2, X } from "lucide-react";

const D = {
  indigo: "#6366f1",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "var(--app-text-subtle)",
};

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

interface Props {
  onClose: () => void;
  /** Optional callback when connection succeeds — defaults to a full reload. */
  onConnected?: () => void;
}

export default function AppleConnectModal({ onClose, onConnected }: Props) {
  const [appleId, setAppleId] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cleanedPw = pw.replace(/[\s-]/g, "");
  const looksLikeASP = cleanedPw.length === 16;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!appleId.includes("@")) {
      setErr("Zadaj celý Apple ID e-mail (napr. meno@icloud.com).");
      return;
    }
    if (cleanedPw.length !== 16) {
      setErr(
        "App-specific password má 16 znakov (formát xxxx-xxxx-xxxx-xxxx). " +
          "Vygeneruj ho na appleid.apple.com — nezadávaj svoje bežné Apple ID heslo."
      );
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/integrations/apple/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appleId: appleId.trim(), password: cleanedPw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === "auth_failed") {
          throw new Error(
            "Apple nás odmietol. Vygeneruj NOVÝ app-specific password na " +
              "appleid.apple.com → Sign-In and Security → App-Specific Passwords. " +
              "Bežné Apple ID heslo Apple cez CalDAV nepustí."
          );
        }
        throw new Error(data.hint || data.error || `HTTP ${res.status}`);
      }
      toast.success("iCloud prepojený.");
      if (onConnected) {
        onConnected();
      } else {
        onClose();
        if (typeof window !== "undefined") window.location.reload();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Pripojenie zlyhalo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: "rgba(3,4,10,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md p-6 rounded-2xl"
        style={{
          background: "var(--app-surface)",
          border: "1px solid var(--app-border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--app-border)" }}
            >
              <ICloudLogo />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: D.text }}>
                Prepoj iCloud
              </h3>
              <p className="text-[11px]" style={{ color: D.muted }}>
                Cez CalDAV. Heslo šifrujeme AES-256.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1" aria-label="Zavrieť">
            <X className="w-4 h-4" style={{ color: D.muted }} />
          </button>
        </div>

        <a
          href="https://appleid.apple.com/account/manage"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-2 mb-4 px-3 py-2.5 rounded-lg text-[11px] font-semibold"
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid var(--app-border)",
            color: D.indigo,
          }}
        >
          <span>1) Vygeneruj app-specific password</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <form onSubmit={submit} className="space-y-2.5">
          <input
            type="email"
            value={appleId}
            onChange={(e) => setAppleId(e.target.value)}
            placeholder="meno@icloud.com"
            autoComplete="email"
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none"
            style={{
              background: "var(--app-surface-2)",
              border: "1px solid var(--app-border)",
              color: D.text,
            }}
          />
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="xxxx-xxxx-xxxx-xxxx"
            autoComplete="off"
            className="w-full text-xs px-3 py-2.5 rounded-lg outline-none font-mono"
            style={{
              background: "var(--app-surface-2)",
              border: "1px solid var(--app-border)",
              color: D.text,
            }}
          />
          <p className="text-[10px]" style={{ color: looksLikeASP ? "#10b981" : D.mutedDark }}>
            {pw === ""
              ? "16 znakov, formát xxxx-xxxx-xxxx-xxxx. NIE bežné Apple ID heslo."
              : looksLikeASP
              ? "✓ Formát vyzerá správne."
              : `Zatiaľ ${cleanedPw.length}/16 znakov.`}
          </p>

          {err && (
            <div
              className="text-[11px] px-3 py-2 rounded-lg"
              style={{
                background: "rgba(244,63,94,0.08)",
                border: "1px solid rgba(244,63,94,0.3)",
                color: "#fda4af",
              }}
            >
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              color: "white",
              boxShadow: "0 0 14px rgba(99,102,241,0.3)",
            }}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Pripojiť iCloud
          </button>
        </form>
      </div>
    </div>
  );
}
