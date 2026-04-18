"use client";
// Cookie consent banner — GDPR/ePrivacy compliant.
// Three actions: Accept all, Only necessary, Manage (toggle analytics).
// Decision stored in localStorage under `unifyo.cookie-consent.v1`:
//   { necessary: true, analytics: boolean, ts: number }
// Necessary cookies (session auth, CSRF) are always allowed — users are
// informed, not asked, because without them the app literally can't work.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X, Check, Settings as SettingsIcon } from "lucide-react";

const STORAGE_KEY = "unifyo.cookie-consent.v1";

interface ConsentState {
  necessary: true;
  analytics: boolean;
  ts: number;
}

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "analytics" in parsed) {
      return parsed as ConsentState;
    }
  } catch {}
  return null;
}

export function writeConsent(analytics: boolean) {
  if (typeof window === "undefined") return;
  const state: ConsentState = {
    necessary: true,
    analytics,
    ts: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  // Dispatch so other tabs/components can react
  window.dispatchEvent(new CustomEvent("unifyo:consent-change", { detail: state }));
}

/** Open the banner again from anywhere (e.g. footer "Spravovať cookies" link) */
export function openCookieManager() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("unifyo:open-cookie-manager"));
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const consent = readConsent();
    if (!consent) setOpen(true);
    else setAnalytics(consent.analytics);

    const reopen = () => {
      const c = readConsent();
      if (c) setAnalytics(c.analytics);
      setManage(true);
      setOpen(true);
    };
    window.addEventListener("unifyo:open-cookie-manager", reopen);
    return () => window.removeEventListener("unifyo:open-cookie-manager", reopen);
  }, []);

  function acceptAll() {
    writeConsent(true);
    setOpen(false);
  }
  function onlyNecessary() {
    writeConsent(false);
    setOpen(false);
  }
  function saveChoices() {
    writeConsent(analytics);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Súhlas s cookies"
      className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-3 pb-3 sm:px-4 sm:pb-4 pointer-events-none"
    >
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden pointer-events-auto"
        style={{
          background: "rgba(10,12,24,0.96)",
          border: "1px solid rgba(139,92,246,0.28)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow:
            "0 0 0 1px rgba(139,92,246,0.08), 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.15)",
        }}
      >
        {/* Top gradient hairline */}
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, transparent)",
          }}
        />

        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                boxShadow: "0 0 16px rgba(124,58,237,0.35)",
              }}
            >
              <Cookie className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "#64748b" }}
              >
                GDPR · ePrivacy
              </div>
              <h3
                className="text-base sm:text-lg font-black tracking-tight mt-0.5"
                style={{ color: "#eef2ff" }}
              >
                Tvoje{" "}
                <span
                  style={{
                    background: "linear-gradient(90deg, #a78bfa, #67e8f9)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  súkromie
                </span>
              </h3>
            </div>
            <button
              onClick={onlyNecessary}
              aria-label="Zavrieť a povoliť len nevyhnutné"
              className="p-1.5 -mr-1 -mt-1 rounded-lg transition-colors"
              style={{ color: "#64748b" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#eef2ff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Copy */}
          {!manage ? (
            <p
              className="text-[13px] leading-relaxed mb-5"
              style={{ color: "#94a3b8" }}
            >
              Používame <strong style={{ color: "#eef2ff" }}>nevyhnutné cookies</strong> na
              prihlásenie a bezpečnosť a <strong style={{ color: "#eef2ff" }}>voliteľné
              analytické cookies</strong> na zlepšovanie platformy. Marketingové cookies
              nepoužívame. Detaily nájdeš v{" "}
              <Link
                href="/cookies"
                className="underline"
                style={{ color: "#a78bfa" }}
              >
                Zásadách cookies
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-3 mb-5">
              <Row
                title="Nevyhnutné"
                desc="Prihlásenie, relácia, ochrana formulárov (CSRF). Bez nich platforma nefunguje."
                locked
                checked
              />
              <Row
                title="Analytické"
                desc="Anonymizované metriky návštevnosti a chýb. Pomáhajú nám zlepšovať Unifyo."
                checked={analytics}
                onChange={setAnalytics}
              />
              <Row
                title="Marketingové"
                desc="Nepoužívame. Ak sa to zmení, vyžiadame si nový súhlas."
                locked
                checked={false}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
            {!manage ? (
              <>
                <button
                  onClick={() => setManage(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                  style={{
                    color: "#94a3b8",
                    border: "1px solid rgba(148,163,184,0.18)",
                    background: "transparent",
                  }}
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  Nastaviť
                </button>
                <button
                  onClick={onlyNecessary}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                  style={{
                    color: "#cbd5e1",
                    background: "rgba(148,163,184,0.08)",
                    border: "1px solid rgba(148,163,184,0.18)",
                  }}
                >
                  Iba nevyhnutné
                </button>
                <button
                  onClick={acceptAll}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                    boxShadow:
                      "0 0 0 1px rgba(139,92,246,0.3), 0 4px 20px rgba(124,58,237,0.35)",
                  }}
                >
                  <Check className="w-3.5 h-3.5" />
                  Prijať všetky
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setManage(false)}
                  className="px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all"
                  style={{
                    color: "#94a3b8",
                    border: "1px solid rgba(148,163,184,0.18)",
                    background: "transparent",
                  }}
                >
                  Späť
                </button>
                <button
                  onClick={saveChoices}
                  className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                    boxShadow:
                      "0 0 0 1px rgba(139,92,246,0.3), 0 4px 20px rgba(124,58,237,0.35)",
                  }}
                >
                  <Check className="w-3.5 h-3.5" />
                  Uložiť voľbu
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  title,
  desc,
  checked,
  locked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  locked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-xl ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}
      style={{
        background: "rgba(139,92,246,0.04)",
        border: "1px solid rgba(139,92,246,0.14)",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-[13px] font-semibold"
            style={{ color: "#eef2ff" }}
          >
            {title}
          </span>
          {locked && (
            <span
              className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(148,163,184,0.1)",
                color: "#94a3b8",
              }}
            >
              {checked ? "Vždy zap." : "Vypnuté"}
            </span>
          )}
        </div>
        <p
          className="text-[11px] leading-relaxed mt-0.5"
          style={{ color: "#94a3b8" }}
        >
          {desc}
        </p>
      </div>
      <div
        onClick={
          locked || !onChange ? undefined : () => onChange(!checked)
        }
        className="mt-0.5 flex-shrink-0 relative"
        style={{
          width: 36,
          height: 20,
          borderRadius: 999,
          background: checked ? "#7c3aed" : "rgba(148,163,184,0.2)",
          transition: "background 0.2s",
          opacity: locked ? 0.6 : 1,
        }}
        aria-checked={checked}
        role="switch"
      >
        <div
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 16,
            height: 16,
            borderRadius: 999,
            background: "#fff",
            transition: "left 0.2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}
        />
      </div>
    </label>
  );
}
