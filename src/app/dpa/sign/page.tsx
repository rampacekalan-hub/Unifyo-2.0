"use client";
// src/app/dpa/sign/page.tsx
// Authenticated DPA signing flow. The static contract text lives at
// /dpa for public viewing; this route is the binding e-signature
// surface for logged-in users (esp. B2B Pro/Enterprise customers).

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, FileSignature, CheckCircle2, Lock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { SkeletonCard } from "@/components/ui/Skeleton";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  emerald: "#10b981",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "var(--app-text-subtle)",
  border: "var(--app-border)",
};

interface DpaState {
  version: string;
  effectiveAt: string;
  body: string;
  signed: boolean;
  signature: {
    signerName: string;
    signerRole: string;
    companyName: string;
    ico: string | null;
    signedAt: string;
  } | null;
}

export default function DpaSignPage() {
  const [state, setState] = useState<DpaState | null>(null);
  const [tierLocked, setTierLocked] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerRole, setSignerRole] = useState("Konateľ");
  const [companyName, setCompanyName] = useState("");
  const [ico, setIco] = useState("");
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/dpa");
    if (res.ok) {
      setState(await res.json());
      setTierLocked(false);
    } else if (res.status === 403) {
      const j = await res.json().catch(() => null);
      if (j?.code === "TIER_LOCKED") setTierLocked(true);
    }
  }
  useEffect(() => { load(); }, []);

  async function sign() {
    setError(null);
    if (!signerName.trim() || !companyName.trim() || !agree) {
      setError("Vyplň meno, firmu a potvrď súhlas");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/dpa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName, signerRole, companyName, ico, agree }),
      });
      if (res.ok) {
        await load();
      } else {
        const j = await res.json().catch(() => null);
        setError(j?.error ?? "Chyba pri podpise");
      }
    } finally { setSaving(false); }
  }

  return (
    <AppLayout title="DPA — GDPR" subtitle="DPA —">
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
        {tierLocked ? (
          <div
            className="rounded-2xl p-6 flex flex-col items-start gap-4"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.05))",
              border: `1px solid ${D.border}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${D.violet}, ${D.indigo})` }}
              >
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: D.text }}>
                  Upgrade na Pro pre odomknutie DPA podpisu
                </h2>
                <p className="text-xs mt-1" style={{ color: D.muted }}>
                  Elektronický DPA podpis je súčasťou Pro a Enterprise plánu (B2B compliance).
                </p>
              </div>
            </div>
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${D.violet}, ${D.indigo})` }}
            >
              Upgradovať plán
            </Link>
          </div>
        ) : !state ? (
          <SkeletonCard lines={6} />
        ) : (
          <>
            <div
              className="rounded-2xl p-5"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(99,102,241,0.04))",
                border: `1px solid ${D.border}`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${D.emerald}, ${D.indigo})` }}
                >
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{ color: D.text }}>
                    Zmluva o spracúvaní os. údajov (DPA)
                  </h2>
                  <p className="text-xs" style={{ color: D.muted }}>
                    Verzia {state.version} · účinná od {new Date(state.effectiveAt).toLocaleDateString("sk-SK")}
                  </p>
                </div>
              </div>
            </div>

            {state.signed && state.signature && (
              <div
                className="rounded-2xl p-4 flex items-start gap-3"
                style={{ background: "rgba(16,185,129,0.08)", border: `1px solid ${D.emerald}40` }}
              >
                <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: D.emerald }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: D.text }}>
                    Podpísané · {new Date(state.signature.signedAt).toLocaleString("sk-SK")}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: D.muted }}>
                    {state.signature.signerName} ({state.signature.signerRole}) za {state.signature.companyName}
                    {state.signature.ico && ` · IČO ${state.signature.ico}`}
                  </p>
                </div>
              </div>
            )}

            <div
              className="rounded-2xl p-5 max-h-[420px] overflow-y-auto"
              style={{ background: "var(--app-surface)", border: `1px solid ${D.border}` }}
            >
              <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed" style={{ color: D.text }}>
                {state.body}
              </pre>
            </div>

            {!state.signed && (
              <div
                className="rounded-2xl p-5 space-y-3"
                style={{ background: "var(--app-surface)", border: `1px solid ${D.border}` }}
              >
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: D.text }}>
                  <FileSignature className="w-4 h-4" /> Elektronický podpis
                </h3>
                <input
                  placeholder="Meno a priezvisko"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Funkcia (napr. Konateľ)"
                    value={signerRole}
                    onChange={e => setSignerRole(e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }}
                  />
                  <input
                    placeholder="IČO (voliteľné)"
                    value={ico}
                    onChange={e => setIco(e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }}
                  />
                </div>
                <input
                  placeholder="Názov firmy"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }}
                />
                <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: D.muted }}>
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={e => setAgree(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    Potvrdzujem, že som si zmluvu prečítal/a, súhlasím s ňou v celom rozsahu a som oprávnený/á podpísať ju za vyššie uvedenú firmu.
                  </span>
                </label>

                {error && <p className="text-xs" style={{ color: "#f43f5e" }}>{error}</p>}

                <button
                  onClick={sign}
                  disabled={saving || !agree}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${D.violet}, ${D.indigo})` }}
                >
                  <FileSignature className="w-4 h-4" /> {saving ? "Podpisujem…" : "Podpísať DPA"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
