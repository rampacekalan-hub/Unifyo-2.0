"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();
const { auth } = config.texts;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Nastala chyba");
        return;
      }
      toast.success("Účet vytvorený! Vitajte v Unifyo.");
      router.push("/dashboard");
    } catch {
      toast.error("Nepodarilo sa spojiť so serverom. Skúste to znova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-[#6366f1]/[0.06] blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#8b5cf6]/[0.05] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle, #a5b4fc 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">{config.name}</span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-xl shadow-[0_0_0_1px_rgba(99,102,241,0.08),0_32px_64px_rgba(0,0,0,0.4)] p-8">
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1.5">{auth.registerTitle}</h1>
            <p className="text-sm text-[#64748b]">{auth.registerSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#94a3b8] tracking-wide">E-mail</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="vas@email.sk"
                className="h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-[#334155] focus:outline-none focus:border-[#6366f1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#94a3b8] tracking-wide">Heslo</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimálne 8 znakov, 1 veľké, 1 číslica"
                  className="w-full h-11 px-4 pr-11 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-[#334155] focus:outline-none focus:border-[#6366f1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#94a3b8] tracking-wide">Potvrdiť heslo</label>
              <input
                name="confirmPassword"
                type={showPass ? "text" : "password"}
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Zopakujte heslo"
                className="h-11 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-[#334155] focus:outline-none focus:border-[#6366f1] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all duration-200"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 bg-[#6366f1] hover:bg-[#5254cc] text-white font-semibold rounded-xl border-0 shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.7),0_4px_30px_rgba(99,102,241,0.4)] transition-all duration-300 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                config.texts.hero.cta
              )}
            </Button>
          </form>

          {/* Legal */}
          <p className="mt-5 text-center text-[0.72rem] text-[#334155] leading-relaxed">
            Registráciou súhlasíte s{" "}
            {config.links.legal.map((l, i) => (
              <span key={l.href}>
                <Link href={l.href} className="text-[#6366f1] hover:underline">{l.label}</Link>
                {i < config.links.legal.length - 1 && " a "}
              </span>
            ))}
          </p>

          <div className="mt-6 pt-5 border-t border-white/[0.05] text-center">
            <p className="text-sm text-[#475569]">
              Máte už účet?{" "}
              <Link href="/login" className="text-[#6366f1] hover:text-[#a5b4fc] font-medium transition-colors">
                Prihláste sa
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
