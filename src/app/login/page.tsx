"use client";
// src/app/login/page.tsx

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { getSiteConfig } from "@/config/site-settings";
import { toast } from "sonner";
import AuthBrand, { GradientTitle } from "@/components/auth/AuthBrand";
import { track } from "@/lib/analytics";

const { branding, texts } = getSiteConfig();
const B = branding.colors;

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: B.background }} />}>
      <LoginForm />
    </Suspense>
  );
}

type Stage = "credentials" | "twofactor";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/dashboard";

  const [stage, setStage] = useState<Stage>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // 2FA stage
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [useBackup, setUseBackup] = useState(false);
  const [code, setCode] = useState("");
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stage === "twofactor") {
      const t = setTimeout(() => codeRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [stage, useBackup]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Prihlásenie zlyhalo");
        setLoading(false);
        return;
      }

      if (data.requiresTwoFactor && data.challengeToken) {
        setChallengeToken(data.challengeToken);
        setStage("twofactor");
        setCode("");
        setLoading(false);
        return;
      }

      toast.success("Prihlásenie úspešné");
      track("login");
      router.push(from);
      router.refresh();
    } catch {
      toast.error("Sieťová chyba. Skúste to neskôr.");
      setLoading(false);
    }
  }

  async function handle2fa(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !challengeToken) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeToken, code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Overenie zlyhalo");
        setLoading(false);
        return;
      }
      if (data.backupCodeConsumed) {
        toast.warning(
          `Záložný kód spotrebovaný. Zostáva ${data.backupCodesRemaining}.`
        );
      } else {
        toast.success("Prihlásenie úspešné");
      }
      track("login");
      router.push(from);
      router.refresh();
    } catch {
      toast.error("Sieťová chyba. Skúste to neskôr.");
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
        {/* Brand */}
        <AuthBrand subtitle={texts.auth.loginSubtitle} />

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: B.surface,
            border: `1px solid ${B.border}`,
            backdropFilter: "blur(20px)",
          }}
        >
          {stage === "credentials" ? (
            <>
              <GradientTitle
                before="Vitaj"
                accent="späť"
                className="text-lg font-black tracking-tight mb-5"
              />
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
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
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${B.border}`,
                      color: B.text,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = B.primary)}
                    onBlur={(e) => (e.target.style.borderColor = B.border)}
                  />
                </div>

                {/* Heslo */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium" style={{ color: B.textMuted }}>
                      Heslo
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[11px] font-medium transition-colors"
                      style={{ color: B.violet }}
                    >
                      Zabudli ste?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all pr-10"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${B.border}`,
                        color: B.text,
                      }}
                      onFocus={(e) => (e.target.style.borderColor = B.primary)}
                      onBlur={(e) => (e.target.style.borderColor = B.border)}
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

                {/* Submit */}
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
                    "Prihlásiť sa"
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5" style={{ color: B.violet }} />
                <GradientTitle
                  before="Dvojfaktorové"
                  accent="overenie"
                  className="text-lg font-black tracking-tight"
                />
              </div>
              <p className="text-xs mb-5" style={{ color: B.textMuted }}>
                {useBackup
                  ? "Zadaj jeden z uložených 8-znakových záložných kódov."
                  : "Otvor aplikáciu autentifikátora a zadaj 6-ciferný kód."}
              </p>

              <form onSubmit={handle2fa} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: B.textMuted }}>
                    {useBackup ? "Záložný kód" : "6-ciferný kód"}
                  </label>
                  <input
                    ref={codeRef}
                    type="text"
                    inputMode={useBackup ? "text" : "numeric"}
                    pattern={useBackup ? undefined : "[0-9]*"}
                    maxLength={useBackup ? 8 : 6}
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={useBackup ? "abcd1234" : "123456"}
                    required
                    className="w-full px-3.5 py-3 rounded-xl text-center tracking-[0.4em] text-lg font-mono outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${B.border}`,
                      color: B.text,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = B.primary)}
                    onBlur={(e) => (e.target.style.borderColor = B.border)}
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
                    "Overiť a prihlásiť"
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackup((v) => !v);
                      setCode("");
                    }}
                    className="font-medium transition-colors"
                    style={{ color: B.violet }}
                  >
                    {useBackup ? "← Použiť 6-ciferný kód" : "Použiť záložný kód →"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStage("credentials");
                      setChallengeToken(null);
                      setCode("");
                      setUseBackup(false);
                    }}
                    className="font-medium transition-colors"
                    style={{ color: B.textDim }}
                  >
                    Späť
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Register link */}
        {stage === "credentials" && (
          <p className="text-center text-sm mt-5" style={{ color: B.textDim }}>
            Nemáte účet?{" "}
            <Link
              href="/register"
              className="font-medium transition-colors"
              style={{ color: B.violet }}
            >
              Zaregistrujte sa
            </Link>
          </p>
        )}
      </motion.div>
    </main>
  );
}
