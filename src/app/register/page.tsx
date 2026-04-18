"use client";
// src/app/register/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { getSiteConfig } from "@/config/site-settings";
import { toast } from "sonner";
import AuthBrand, { GradientTitle } from "@/components/auth/AuthBrand";

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
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ name: name || undefined, email, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Registrácia zlyhala");
        setLoading(false);
        return;
      }

      toast.success("Účet vytvorený! Vitajte v Unifyo.");
      router.push("/dashboard");
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
        <AuthBrand subtitle={texts.auth.registerSubtitle} />

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: B.surface,
            border: `1px solid ${B.border}`,
            backdropFilter: "blur(20px)",
          }}
        >
          <GradientTitle
            before="Začni"
            accent="zadarmo"
            className="text-lg font-black tracking-tight mb-5"
          />

          <form onSubmit={handleSubmit} className="space-y-4">
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
    </main>
  );
}
