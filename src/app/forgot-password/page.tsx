"use client";
// src/app/forgot-password/page.tsx
// Email-input step of the reset flow. Always shows the same success screen
// after submit so an attacker can't tell whether the account exists.

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { getSiteConfig } from "@/config/site-settings";
import { toast } from "sonner";
import AuthBrand, { GradientTitle } from "@/components/auth/AuthBrand";

const { branding } = getSiteConfig();
const B = branding.colors;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Endpoint returns 200 even for unknown emails — by design.
      if (!res.ok && res.status !== 200) {
        throw new Error();
      }
      setSent(true);
    } catch {
      toast.error("Sieťová chyba. Skús to znova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: B.background }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full max-w-sm"
      >
        <AuthBrand subtitle="Obnovenie hesla" />

        <div
          className="rounded-2xl p-6"
          style={{
            background: B.surface,
            border: `1px solid ${B.border}`,
            backdropFilter: "blur(20px)",
          }}
        >
          {sent ? (
            <div className="text-center py-4">
              <div
                className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.35)",
                }}
              >
                <MailCheck className="w-7 h-7" style={{ color: "#10b981" }} />
              </div>
              <GradientTitle
                before="Skontroluj"
                accent="schránku"
                className="text-lg font-black tracking-tight mb-2"
              />
              <p className="text-xs leading-relaxed" style={{ color: B.textMuted }}>
                Ak účet s emailom <strong style={{ color: B.text }}>{email}</strong> existuje,
                poslali sme naň odkaz na obnovu hesla. Odkaz platí 60 minút.
              </p>
              <p className="text-[11px] mt-4" style={{ color: B.textDim }}>
                Nedorazil email? Skontroluj spam alebo skús znova o pár minút.
              </p>
            </div>
          ) : (
            <>
              <GradientTitle
                before="Zabudnuté"
                accent="heslo?"
                className="text-lg font-black tracking-tight mb-2"
              />
              <p className="text-xs mb-5" style={{ color: B.textMuted }}>
                Napíš svoj email a pošleme ti odkaz na nastavenie nového hesla.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: B.textMuted }}>
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vas@email.sk"
                    required
                    autoComplete="email"
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${B.border}`,
                      color: B.text,
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${B.primary}, #5b21b6)`,
                    color: "#fff",
                    boxShadow: `0 0 20px ${B.primaryGlow}`,
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Poslať odkaz"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm mt-5" style={{ color: B.textDim }}>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-medium transition-colors"
            style={{ color: B.violet }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Späť na prihlásenie
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
