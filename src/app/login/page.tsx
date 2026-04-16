"use client";
// src/app/login/page.tsx

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { getSiteConfig } from "@/config/site-settings";
import { toast } from "sonner";

const { branding, texts } = getSiteConfig();
const B = branding.colors;

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: B.background }} />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

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

      toast.success("Prihlásenie úspešné");
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
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-tight" style={{ color: B.text }}>
            Unifyo
          </h1>
          <p className="text-sm mt-1" style={{ color: B.textMuted }}>
            {texts.auth.loginSubtitle}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: B.surface,
            border: `1px solid ${B.border}`,
            backdropFilter: "blur(20px)",
          }}
        >
          <h2 className="text-lg font-bold mb-5" style={{ color: B.text }}>
            {texts.auth.loginTitle}
          </h2>

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
        </div>

        {/* Register link */}
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
      </motion.div>
    </main>
  );
}
