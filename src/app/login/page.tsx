"use client";
// src/app/login/page.tsx

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, ShieldCheck, Fingerprint } from "lucide-react";
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

  // Passkey passwordless flow — lazy feature detection so we hide the
  // button on legacy browsers / webviews that don't expose WebAuthn.
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  useEffect(() => {
    setPasskeySupported(
      typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined",
    );
  }, []);

  async function handlePasskeyLogin() {
    if (passkeyBusy) return;
    setPasskeyBusy(true);
    try {
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const optsRes = await fetch("/api/passkeys/auth/options", { method: "POST" });
      if (!optsRes.ok) throw new Error("options_failed");
      const options = await optsRes.json();

      let assertion;
      try {
        assertion = await startAuthentication({ optionsJSON: options });
      } catch (e) {
        const err = e as { name?: string };
        if (err.name === "NotAllowedError") return; // user cancelled
        throw e;
      }

      const verifyRes = await fetch("/api/passkeys/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: assertion }),
      });
      if (!verifyRes.ok) {
        const d = await verifyRes.json().catch(() => ({}));
        throw new Error(d.error ?? "verify_failed");
      }
      toast.success("Prihlásenie úspešné");
      track("login_passkey_success");
      router.push(from);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "neznáma chyba";
      toast.error(`Prihlásenie cez passkey zlyhalo: ${msg}`);
    } finally {
      setPasskeyBusy(false);
    }
  }

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
    <main className="min-h-screen grid lg:grid-cols-2" style={{ background: B.background }}>
      {/* Left panel — brand hero. Hidden on mobile to keep the form
          above the fold on small screens. */}
      <section
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(14,165,233,0.18))",
          borderRight: `1px solid ${B.border}`,
        }}
      >
        {/* Decorative gradient orbs — tasteful, not carnival. */}
        <div
          aria-hidden
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-40"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, #0ea5e9, transparent 70%)" }}
        />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--brand-gradient)" }}
            >
              <span className="text-white text-sm font-black">U</span>
            </div>
            <span className="font-bold text-lg" style={{ color: B.text }}>Unifyo</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10"
        >
          <h1
            className="font-black tracking-[-0.03em] leading-[1.05] mb-4"
            style={{ fontSize: "clamp(2rem, 3vw, 3rem)", color: B.text }}
          >
            Tvoj biznis v jednej{" "}
            <span
              style={{
                background: "var(--brand-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              mysli.
            </span>
          </h1>
          <p className="text-base max-w-md leading-relaxed" style={{ color: B.textMuted }}>
            CRM, kalendár, e-maily, hovory a AI poradca — všetko po slovensky,
            na jednom mieste, bez chaosu medzi záložkami.
          </p>
          <div className="flex items-center gap-4 mt-8">
            {["CRM", "Kalendár", "AI chat", "Hovory"].map((f) => (
              <span
                key={f}
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${B.border}`,
                  color: B.textMuted,
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="relative z-10 text-[11px]" style={{ color: B.textMuted }}>
          © Unifyo · {new Date().getFullYear()} · Slovensko
        </div>
      </section>

      {/* Right panel — the form */}
      <section className="flex items-center justify-center p-6 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full max-w-sm"
      >
        {/* Brand (mobile only — desktop shows it in the left panel) */}
        <div className="lg:hidden">
          <AuthBrand subtitle={texts.auth.loginSubtitle} />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 lg:p-8 lg:border-0 lg:shadow-none lg:bg-transparent"
          style={{
            background: B.surface,
            border: `1px solid ${B.border}`,
            backdropFilter: "blur(20px)",
            borderRadius: "var(--r-lg)",
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

                {passkeySupported && (
                  <>
                    <div className="relative flex items-center gap-3 my-1">
                      <div className="flex-1 h-px" style={{ background: B.border }} />
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: B.textMuted }}>
                        alebo
                      </span>
                      <div className="flex-1 h-px" style={{ background: B.border }} />
                    </div>
                    <button
                      type="button"
                      onClick={handlePasskeyLogin}
                      disabled={passkeyBusy}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                      style={{
                        background: B.surface,
                        color: B.text,
                        border: `1px solid ${B.border}`,
                      }}
                    >
                      {passkeyBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Fingerprint className="w-4 h-4" />
                      )}
                      Prihlásiť cez passkey
                    </button>
                  </>
                )}
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
      </section>
    </main>
  );
}
