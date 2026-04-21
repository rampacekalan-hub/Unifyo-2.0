"use client";
// src/app/settings/integrations/IntegrationsClient.tsx
// UI for connecting external services (currently Google = Gmail+Calendar).
// Reads initial status from server props, watches URL query params for
// callback outcomes, and supports disconnect with confirm dialog.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Mail,
  Calendar,
  Loader2,
  ExternalLink,
  Shield,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  text: "#eef2ff",
  muted: "#94a3b8",
  mutedDark: "#64748b",
  indigoDim: "rgba(99,102,241,0.08)",
  indigoBorder: "rgba(99,102,241,0.22)",
  emerald: "#10b981",
  red: "#ef4444",
};

interface GoogleStatus {
  connected: boolean;
  email?: string;
  connectedAt?: Date;
  scopes?: string[];
}

const CALLBACK_ERROR_MAP: Record<string, string> = {
  missing_code: "Google neposlal autorizačný kód.",
  state_expired: "Autorizácia vypršala, skús znovu.",
  state_mismatch: "Bezpečnostná kontrola zlyhala, skús znovu.",
  token_exchange: "Výmena tokenu zlyhala na Google strane.",
  no_refresh_token: "Google neposlal refresh token. Odpoj appku v Google účte a skús znovu.",
  userinfo: "Nepodarilo sa overiť identitu u Google.",
  db_error: "Uloženie tokenov do databázy zlyhalo.",
  access_denied: "Prístup zamietnutý — bez súhlasu to nepôjde.",
};

export default function IntegrationsClient({ google: initial }: { google: GoogleStatus }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [google, setGoogle] = useState<GoogleStatus>(initial);
  const [disconnecting, setDisconnecting] = useState(false);

  // Show toast on callback return (?connected=google or ?error=…) and
  // strip the query so a refresh doesn't re-trigger.
  useEffect(() => {
    const connected = searchParams.get("connected");
    const err = searchParams.get("error");
    if (connected === "google") {
      toast.success("Google pripojený — Gmail a Kalendár sú aktívne");
      router.replace("/settings/integrations");
    } else if (err) {
      toast.error(CALLBACK_ERROR_MAP[err] ?? `Chyba: ${err}`);
      router.replace("/settings/integrations");
    }
  }, [searchParams, router]);

  async function handleDisconnect() {
    if (!confirm("Naozaj odpojiť Google? Stratíš prístup k Gmailu a Kalendáru v Unifyo.")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/integrations/google/disconnect", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setGoogle({ connected: false });
      toast.success("Google odpojený");
    } catch (e) {
      console.error(e);
      toast.error("Odpojenie zlyhalo");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <AppLayout title="Integrácie" subtitle="Integrácie —">
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs font-medium"
          style={{ color: D.muted }}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Späť na Nastavenia
        </Link>

        <div>
          <h1 className="text-2xl md:text-3xl font-black" style={{ color: D.text }}>
            Integrácie
          </h1>
          <p className="text-sm mt-1" style={{ color: D.muted }}>
            Pripoj svoje služby. Tokeny sú šifrované a nikdy neopustia náš server.
          </p>
        </div>

        {/* Google card */}
        <div
          className="rounded-2xl p-5 md:p-6"
          style={{
            background: "rgba(10,12,24,0.55)",
            border: `1px solid ${D.indigoBorder}`,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18))",
                border: `1px solid ${D.indigoBorder}`,
              }}
            >
              <GoogleGIcon />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold" style={{ color: D.text }}>
                  Google
                </h2>
                {google.connected ? (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(16,185,129,0.12)",
                      color: D.emerald,
                      border: "1px solid rgba(16,185,129,0.3)",
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3" /> PRIPOJENÝ
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(148,163,184,0.08)",
                      color: D.muted,
                      border: `1px solid ${D.indigoBorder}`,
                    }}
                  >
                    <XCircle className="w-3 h-3" /> NEPRIPOJENÝ
                  </span>
                )}
              </div>
              <p className="text-xs mt-1" style={{ color: D.muted }}>
                Pripoj Gmail a Google Kalendár. Emaily prídu do Unifyo, udalosti sa
                zobrazia v kalendári vedľa tvojich úloh.
              </p>

              {google.connected && google.email && (
                <div
                  className="mt-3 text-xs font-medium"
                  style={{ color: D.text }}
                >
                  {google.email}
                  {google.connectedAt && (
                    <span style={{ color: D.mutedDark }}>
                      {" "}
                      · pripojený {new Date(google.connectedAt).toLocaleDateString("sk-SK")}
                    </span>
                  )}
                </div>
              )}

              {/* Permissions list */}
              <ul className="mt-4 space-y-1.5">
                <Perm icon={Mail} text="Čítať a odosielať Gmail v tvojom mene" />
                <Perm icon={Calendar} text="Čítať udalosti z Google Kalendára" />
                <Perm icon={Shield} text="Tokeny sú revokované pri odpojení" />
              </ul>

              {/* CTA */}
              <div className="mt-5 flex items-center gap-3 flex-wrap">
                {google.connected ? (
                  <>
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all disabled:opacity-50"
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        color: D.red,
                      }}
                    >
                      {disconnecting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : null}
                      Odpojiť Google
                    </button>
                    <a
                      href="https://myaccount.google.com/permissions"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px]"
                      style={{ color: D.muted }}
                    >
                      Správa v Google účte <ExternalLink className="w-3 h-3" />
                    </a>
                  </>
                ) : (
                  <a
                    href="/api/integrations/google/start"
                    className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
                      color: "#fff",
                      boxShadow: "0 0 18px rgba(99,102,241,0.35)",
                    }}
                  >
                    <GoogleGIcon size={14} />
                    Pripojiť Google
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Planned integrations — let users see what's coming and
            signal interest. Clicking "Chcem túto" records a waitlist
            entry so we prioritise by demand. */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: D.muted }}>
            Plánované integrácie — klikni „Chcem túto" a pošlem ti e-mail keď budú live
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PlannedIntegration
              name="Microsoft Outlook"
              description="E-mail + kontakty zo súkromného alebo firemného Outlook účtu."
              feature="outlook"
              gradient="linear-gradient(135deg, #0072C6, #004E8C)"
              letter="O"
            />
            <PlannedIntegration
              name="Microsoft Teams"
              description="Kalendár meetingov a AI prepis hovorov."
              feature="teams"
              gradient="linear-gradient(135deg, #4B53BC, #7B83EB)"
              letter="T"
            />
            <PlannedIntegration
              name="Trello"
              description="Synchronizuj karty a boardy s Unifyo pipeline."
              feature="trello"
              gradient="linear-gradient(135deg, #0079BF, #026AA7)"
              letter="T"
            />
            <PlannedIntegration
              name="Slack"
              description="Notifikácie o nových dealoch a úlohách priamo do Slacku."
              feature="slack"
              gradient="linear-gradient(135deg, #4A154B, #611F69)"
              letter="S"
            />
            <PlannedIntegration
              name="Zoom"
              description="Nahrávky meetingov prepísané Whisperom + AI zhrnutie."
              feature="zoom"
              gradient="linear-gradient(135deg, #2D8CFF, #0B5CFF)"
              letter="Z"
            />
            <PlannedIntegration
              name="Apple Kalendár (iCloud)"
              description="Dvojsmerná synchronizácia cez CalDAV."
              feature="icloud"
              gradient="linear-gradient(135deg, #555555, #222222)"
              letter=""
            />
          </div>
          <p className="text-[0.65rem] mt-4" style={{ color: D.mutedDark }}>
            Tvoja požiadavka mi príde ako feedback — rozhoduje sa podľa počtu hlasov.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

function Perm({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return (
    <li className="flex items-center gap-2 text-[11px]" style={{ color: D.muted }}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: D.indigo }} />
      <span>{text}</span>
    </li>
  );
}

function PlannedIntegration({
  name, description, feature, gradient, letter,
}: {
  name: string; description: string; feature: string; gradient: string; letter: string;
}) {
  const [voted, setVoted] = useState(false);
  const [pending, setPending] = useState(false);

  const requestIt = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "idea",
          message: `Chcem integráciu: ${name} (${feature})`,
        }),
      });
      if (!res.ok) throw new Error();
      setVoted(true);
      toast.success("Vďaka! Mám to v požiadavkách.");
    } catch {
      toast.error("Nepodarilo sa odoslať");
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-3"
      style={{ background: "rgba(10,12,24,0.4)", border: `1px solid ${D.indigoBorder}` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
        style={{ background: gradient }}
      >
        {letter}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold" style={{ color: D.text }}>{name}</h3>
          <span className="text-[0.6rem] font-semibold uppercase px-1.5 py-0.5 rounded"
            style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
            Plánované
          </span>
        </div>
        <p className="text-[0.7rem] mt-1" style={{ color: D.muted }}>{description}</p>
        <button
          onClick={requestIt}
          disabled={voted || pending}
          className="mt-2 text-[0.7rem] font-semibold px-2.5 py-1 rounded-md disabled:opacity-60"
          style={{
            background: voted ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.14)",
            color: voted ? "#10b981" : D.indigo,
            border: `1px solid ${voted ? "rgba(16,185,129,0.35)" : D.indigoBorder}`,
          }}
        >
          {voted ? "✓ Zaznamenané" : pending ? "Posielam…" : "+ Chcem túto"}
        </button>
      </div>
    </div>
  );
}

function GoogleGIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.568 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.335z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.48 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}
