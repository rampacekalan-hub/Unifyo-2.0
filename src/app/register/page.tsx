"use client";
// src/app/register/page.tsx

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, Check, X, Gift } from "lucide-react";
import { getSiteConfig } from "@/config/site-settings";
import { toast } from "sonner";
import AuthBrand, { GradientTitle } from "@/components/auth/AuthBrand";
import { track } from "@/lib/analytics";

const { branding, texts, validation } = getSiteConfig();
const B = branding.colors;

function PasswordRule({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {ok ? (
        <Check className="w-3 h-3" style={{ color: B.green }} />
      ) : (
        <X className="w-3 h-3" style={{ color: B.textDim }} />
      )}
      <span className="text-[0.68rem]" style={{ color: ok ? B.green : B.textDim }}>
        {text}
      </span>
    </div>
  );
}

export default function RegisterPage() {
  // useSearchParams must sit below a Suspense boundary so that the route
  // can still prerender statically — wrapper below satisfies that.
  return (
    <Suspense fallback={null}>
      <RegisterPageInner />
    </Suspense>
  );
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  // Referral code from ?ref= — sanitised to 4-32 chars, alphanumeric.
  // Stored in state so it survives re-renders and is submitted with the form.
  const [referralCode, setReferralCode] = useState<string>("");

  useEffect(() => {
    const raw = searchParams?.get("ref");
    if (!raw) return;
    const cleaned = raw.replace(/[^A-Za-z0-9]/g, "").slice(0, 32);
    if (cleaned.length >= 4) setReferralCode(cleaned);
  }, [searchParams]);

  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasLength = password.length >= validation.password.minLength;
  const passMatch = password === confirmPassword && confirmPassword.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!passMatch) {
      toast.error("Heslá sa nezhodujú");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          email,
          password,
          confirmPassword,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Registrácia zlyhala");
        setLoading(false);
        return;
      }

      toast.success("Účet vytvorený! Vitajte v Unifyo.");
      track("signup");
      // Fresh signups go straight into the onboarding wizard — this
      // is their first impression, not an empty chat screen. AppLayout
      // also redirects un-onboarded users, but routing here directly
      // avoids a flash of the dashboard before the bounce.
      router.push("/onboarding");
      router.refresh();
    } catch {
      toast.error("Sieťová chyba. Skúste to neskôr.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2" style={{ background: B.background }}>
      {/* Left brand panel — matches /login for consistency. */}
      <section
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(14,165,233,0.18))",
          borderRight: `1px solid ${B.border}`,
        }}
      >
        <div aria-hidden className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-40"
             style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }} />
        <div aria-hidden className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full blur-3xl opacity-30"
             style={{ background: "radial-gradient(circle, #0ea5e9, transparent 70%)" }} />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                 style={{ background: "var(--brand-gradient)" }}>
              <span className="text-white text-sm font-black">U</span>
            </div>
            <span className="font-bold text-lg" style={{ color: B.text }}>Unifyo</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }} className="relative z-10"
        >
          <h1 className="font-black tracking-[-0.03em] leading-[1.05] mb-4"
              style={{ fontSize: "clamp(2rem, 3vw, 3rem)", color: B.text }}>
            Prvých 14 dní{" "}
            <span style={{ background: "var(--brand-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              bez platby.
            </span>
          </h1>
          <p className="text-base max-w-md leading-relaxed" style={{ color: B.textMuted }}>
            Žiadna karta, žiadny nátlak. Vyskúšaj AI asistenta, CRM, kalendár
            a hovory — rozhodneš sa až potom.
          </p>
          <ul className="mt-8 space-y-2">
            {[
              "100 AI správ denne",
              "Neobmedzené kontakty a kalendár",
              "Gmail + Google Calendar integrácia",
              "Storno kedykoľvek, dáta exportuješ",
            ].map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm" style={{ color: B.text }}>
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px]"
                      style={{ background: "var(--brand-success)" }}>✓</span>
                {b}
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="relative z-10 text-[11px]" style={{ color: B.textMuted }}>
          © Unifyo · {new Date().getFullYear()} · Slovensko
        </div>
      </section>

      <section className="flex items-center justify-center p-6 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full max-w-sm"
      >
        <div className="lg:hidden">
          <AuthBrand subtitle={texts.auth.registerSubtitle} />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 lg:p-8 lg:border-0 lg:bg-transparent"
          style={{
            background: B.surface,
            border: `1px solid ${B.border}`,
            backdropFilter: "blur(20px)",
            borderRadius: "var(--r-lg)",
          }}
        >
          <GradientTitle
            before="Začni"
            accent="zadarmo"
            className="text-lg font-black tracking-tight mb-5"
          />

          {referralCode && (
            <div
              className="mb-4 rounded-xl px-3 py-2.5 text-xs flex items-start gap-2"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.28)",
                color: "#86efac",
              }}
            >
              <Gift className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Pridal si sa cez odkaz od kolegu — dostaneš <strong>30 dní Pro zdarma.</strong>
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {referralCode && (
              <input type="hidden" name="referralCode" value={referralCode} readOnly />
            )}
            {/* Meno */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: B.textMuted }}>
                Meno <span style={{ color: B.textDim }}>(voliteľné)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ján Novák"
                autoComplete="name"
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
              <label className="block text-xs font-medium mb-1.5" style={{ color: B.textMuted }}>
                Heslo
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
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

              {/* Password rules */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1 pl-1">
                  <PasswordRule ok={hasLength} text={`Aspoň ${validation.password.minLength} znakov`} />
                  {validation.password.requireUppercase && (
                    <PasswordRule ok={hasUpper} text="Aspoň jedno veľké písmeno" />
                  )}
                  {validation.password.requireNumber && (
                    <PasswordRule ok={hasNumber} text="Aspoň jedna číslica" />
                  )}
                </div>
              )}
            </div>

            {/* Potvrdenie hesla */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: B.textMuted }}>
                Potvrdiť heslo
              </label>
              <input
                type={showPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${confirmPassword.length > 0 ? (passMatch ? B.green : "#ef4444") : B.border}`,
                  color: B.text,
                }}
                onFocus={(e) => (e.target.style.borderColor = B.primary)}
                onBlur={(e) => {
                  e.target.style.borderColor =
                    confirmPassword.length > 0 ? (passMatch ? B.green : "#ef4444") : B.border;
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !hasLength || (validation.password.requireUppercase && !hasUpper) || (validation.password.requireNumber && !hasNumber)}
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
                "Vytvoriť účet"
              )}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-sm mt-5" style={{ color: B.textDim }}>
          Máte už účet?{" "}
          <Link
            href="/login"
            className="font-medium transition-colors"
            style={{ color: B.violet }}
          >
            Prihláste sa
          </Link>
        </p>
      </motion.div>
      </section>
    </main>
  );
}
