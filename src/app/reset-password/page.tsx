"use client";
// src/app/reset-password/page.tsx
// Step 2 of the reset flow. Reads ?token= from URL, validates length on
// client, submits with new password. On success redirects to /login.

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, ShieldCheck, AlertTriangle } from "lucide-react";
import { getSiteConfig } from "@/config/site-settings";
import { toast } from "sonner";

const { branding } = getSiteConfig();
const B = branding.colors;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: B.background }} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const tokenMissing = token.length < 16;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (password.length < 8) {
      toast.error("Heslo musí mať aspoň 8 znakov");
      return;
    }
    if (password !== confirm) {
      toast.error("Heslá sa nezhodujú");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Zmena zlyhala");
        setLoading(false);
        return;
      }
      toast.success("Heslo zmenené. Prihlás sa.");
      router.push("/login");
    } catch {
      toast.error("Sieťová chyba. Skús to znova.");
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
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-tight" style={{ color: B.text }}>
            Unifyo
          </h1>
          <p className="text-sm mt-1" style={{ color: B.textMuted }}>
            Nové heslo
          </p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{
            background: B.surface,
            border: `1px solid ${B.border}`,
            backdropFilter: "blur(20px)",
          }}
        >
          {tokenMissing ? (
            <div className="text-center py-4">
              <div
                className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: "rgba(244,63,94,0.12)",
                  border: "1px solid rgba(244,63,94,0.35)",
                }}
              >
                <AlertTriangle className="w-7 h-7" style={{ color: "#f43f5e" }} />
              </div>
              <h2 className="text-base font-bold mb-2" style={{ color: B.text }}>
                Odkaz je neplatný
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: B.textMuted }}>
                Tento odkaz chýba alebo je poškodený. Požiadaj o nový odkaz na resetovanie hesla.
              </p>
              <Link
                href="/forgot-password"
                className="inline-block mt-4 px-4 py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${B.primary}, #5b21b6)`,
                  color: "#fff",
                }}
              >
                Poslať nový odkaz
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck className="w-5 h-5" style={{ color: B.primary }} />
                <h2 className="text-lg font-bold" style={{ color: B.text }}>
                  Nastav si nové heslo
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: B.textMuted }}>
                    Nové heslo
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="aspoň 8 znakov"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      autoFocus
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none pr-10"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${B.border}`,
                        color: B.text,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: B.textDim }}
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: B.textMuted }}>
                    Potvrď heslo
                  </label>
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="zopakuj heslo"
                    required
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
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
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
                  style={{
                    background: `linear-gradient(135deg, ${B.primary}, #5b21b6)`,
                    color: "#fff",
                    boxShadow: `0 0 20px ${B.primaryGlow}`,
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "Zmeniť heslo"
                  )}
                </button>
              </form>
              <p className="text-[10px] text-center mt-4" style={{ color: B.textDim }}>
                Po zmene ťa odhlásime zo všetkých zariadení.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}
