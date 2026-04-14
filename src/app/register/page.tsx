"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowRight, User } from "lucide-react";
import NeuralBackground from "@/components/ui/NeuralBackground";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();
const { auth } = config.texts;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

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

  const inputClass = "w-full h-11 px-4 rounded-xl text-sm text-white placeholder:text-[#374151] focus:outline-none transition-all duration-200"
    + " bg-white/[0.04] border border-white/[0.08] focus:border-[#7c3aed] focus:shadow-[0_0_0_3px_rgba(124,58,237,0.18)]";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#05070f" }}>
      <NeuralBackground themeEngine={config.branding.themeEngine} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", boxShadow: "0 0 20px rgba(124,58,237,0.45)" }}>
            <span className="text-white text-[11px] font-black">U</span>
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: "#eef2ff" }}>{config.name}</span>
        </Link>

        {/* Glassmorphism card */}
        <div style={{
          borderRadius: "20px",
          border: "1px solid rgba(139,92,246,0.18)",
          background: "rgba(12,15,26,0.75)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 0 0 1px rgba(139,92,246,0.08), 0 32px 64px rgba(0,0,0,0.5), 0 0 80px rgba(124,58,237,0.08)",
          padding: "32px",
        }}>
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold tracking-tight mb-1.5" style={{ color: "#eef2ff" }}>{auth.registerTitle}</h1>
            <p className="text-sm" style={{ color: "#64748b" }}>{auth.registerSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium tracking-wide" style={{ color: "#94a3b8" }}>Meno (voliteľné)</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#475569" }} />
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ján Novák"
                  className={inputClass + " pl-10"}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium tracking-wide" style={{ color: "#94a3b8" }}>E-mail</label>
              <input name="email" type="email" autoComplete="email" required
                value={form.email} onChange={handleChange} placeholder="vas@email.sk"
                className={inputClass} />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium tracking-wide" style={{ color: "#94a3b8" }}>Heslo</label>
              <div className="relative">
                <input name="password" type={showPass ? "text" : "password"}
                  autoComplete="new-password" required
                  value={form.password} onChange={handleChange}
                  placeholder="Min. 8 znakov, 1 veľké, 1 číslica"
                  className={inputClass + " pr-11"} />
                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#475569" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#eef2ff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium tracking-wide" style={{ color: "#94a3b8" }}>Potvrdiť heslo</label>
              <input name="confirmPassword" type={showPass ? "text" : "password"}
                autoComplete="new-password" required
                value={form.confirmPassword} onChange={handleChange}
                placeholder="Zopakujte heslo"
                className={inputClass} />
            </div>

            <button type="submit" disabled={loading}
              className="mt-2 h-11 flex items-center justify-center gap-2 rounded-xl font-semibold text-white text-sm transition-all duration-300 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                boxShadow: "0 0 0 1px rgba(124,58,237,0.4), 0 4px 20px rgba(124,58,237,0.3)",
              }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>{auth.registerTitle} <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <p className="mt-5 text-center leading-relaxed" style={{ fontSize: "0.72rem", color: "#334155" }}>
            Registráciou súhlasíte s{" "}
            {config.links.legal.slice(0, 2).map((l, i) => (
              <span key={l.href}>
                <Link href={l.href} style={{ color: "#7c3aed" }} className="hover:underline">{l.label}</Link>
                {i === 0 && " a "}
              </span>
            ))}
          </p>

          <div className="mt-6 pt-5 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-sm" style={{ color: "#475569" }}>
              Máte už účet?{" "}
              <Link href="/login" className="font-medium transition-colors hover:underline"
                style={{ color: "#8b5cf6" }}>Prihláste sa</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
