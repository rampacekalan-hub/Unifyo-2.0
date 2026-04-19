"use client";
// src/components/ui/ComingSoon.tsx
// Reusable "coming soon" placeholder — used by /calls, /analytics, /automation,
// /email. Lands on a real page, not a 404. Now with:
//  - ETA badge (voliteľné)
//  - progress bar (0-100, voliteľné)
//  - waitlist signup (email form → POST /api/waitlist)
// Waitlist je idempotentný na serveri (unique feature+email), takže viacnásobný
// submit je OK a state tu riešime per-browser cez localStorage, nech user
// nevidí formulár po tom čo sa už raz prihlásil.

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, BellRing, Check, Loader2 } from "lucide-react";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  sky: "#22d3ee",
  text: "#eef2ff",
  muted: "#94a3b8",
  indigoBorder: "rgba(99,102,241,0.22)",
  emerald: "#10b981",
};

type FeatureSlug = "email" | "calls" | "analytics" | "automation";

interface Props {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  features?: string[];
  /** Slug pre waitlist. Ak nie je zadaný, form sa nezobrazí. */
  feature?: FeatureSlug;
  /** Predvyplní email (napr. zo session). */
  defaultEmail?: string;
  /** Voľný text ETA — napr. "Q2 2026" alebo "máj 2026". */
  eta?: string;
  /** 0–100. Zobrazí sa progress bar. */
  progress?: number;
}

export default function ComingSoon({
  title,
  description = "Tento modul ešte len vzniká. Pracujeme na tom — vráť sa čoskoro.",
  icon: Icon = Sparkles,
  features,
  feature,
  defaultEmail = "",
  eta,
  progress,
}: Props) {
  const [email, setEmail] = useState(defaultEmail);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Po návrate na stránku zobraz "Si v poradí" bez ďalšieho API callu.
  useEffect(() => {
    if (!feature) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(`waitlist:${feature}`) === "1") setState("done");
  }, [feature]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!feature) return;
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Nepodarilo sa.");
      }
      localStorage.setItem(`waitlist:${feature}`, "1");
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Nepodarilo sa.");
      setState("error");
    }
  }

  const pct = typeof progress === "number" ? Math.max(0, Math.min(100, progress)) : null;

  return (
    <div className="h-full w-full flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg rounded-2xl p-8 md:p-10 text-center relative overflow-hidden"
        style={{
          background: "rgba(15,18,32,0.75)",
          border: `1px solid ${D.indigoBorder}`,
          backdropFilter: "blur(24px)",
          boxShadow: "0 0 60px rgba(99,102,241,0.08)",
        }}
      >
        {/* ambient glow */}
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <motion.div
          className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center relative"
          animate={{ boxShadow: [
            "0 0 20px rgba(99,102,241,0.25)",
            "0 0 40px rgba(99,102,241,0.5)",
            "0 0 20px rgba(99,102,241,0.25)",
          ]}}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))",
            border: `1px solid ${D.indigoBorder}`,
          }}
        >
          <Icon className="w-7 h-7" style={{ color: D.indigo }} />
        </motion.div>

        <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
          <span
            className="inline-block px-3 py-1 rounded-full text-[0.65rem] font-semibold uppercase tracking-widest"
            style={{
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.25)",
              color: D.sky,
            }}
          >
            Čoskoro
          </span>
          {eta && (
            <span
              className="inline-block px-3 py-1 rounded-full text-[0.65rem] font-semibold uppercase tracking-widest"
              style={{
                background: "rgba(139,92,246,0.12)",
                border: "1px solid rgba(139,92,246,0.3)",
                color: "#c4b5fd",
              }}
            >
              ETA · {eta}
            </span>
          )}
        </div>

        <h1
          className="text-2xl md:text-3xl font-black mb-3"
          style={{
            background: "linear-gradient(135deg, #eef2ff 0%, #a5b4fc 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {title}
        </h1>

        <p className="text-sm mb-6 leading-relaxed" style={{ color: D.muted }}>
          {description}
        </p>

        {pct !== null && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-widest mb-2" style={{ color: D.muted }}>
              <span>Vývoj</span>
              <span style={{ color: D.text }}>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(99,102,241,0.12)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${D.indigo}, ${D.violet})` }}
              />
            </div>
          </div>
        )}

        {features && features.length > 0 && (
          <ul className="text-left space-y-2 mb-7 text-xs">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2" style={{ color: D.text }}>
                <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: D.violet }} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Waitlist */}
        {feature && (
          <div className="mb-6 text-left">
            {state === "done" ? (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  color: D.emerald,
                }}
              >
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Si v poradí. Ozveme sa ti hneď po spustení.</span>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-2">
                <label className="block text-[0.65rem] font-semibold uppercase tracking-widest" style={{ color: D.muted }}>
                  <BellRing className="inline w-3 h-3 mr-1 -mt-0.5" />
                  Daj mi vedieť ako prvý
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tvoj@email.sk"
                    disabled={state === "loading"}
                    className="flex-1 rounded-xl px-3 py-2 text-sm outline-none transition-colors"
                    style={{
                      background: "rgba(15,18,32,0.6)",
                      border: `1px solid ${D.indigoBorder}`,
                      color: D.text,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-60"
                    style={{
                      background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
                      color: "white",
                      boxShadow: "0 0 20px rgba(99,102,241,0.35)",
                      minWidth: 110,
                    }}
                  >
                    {state === "loading" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Prihlásiť"
                    )}
                  </button>
                </div>
                {state === "error" && errorMsg && (
                  <p className="text-xs" style={{ color: "#fca5a5" }}>{errorMsg}</p>
                )}
              </form>
            )}
          </div>
        )}

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
          style={{
            background: "rgba(99,102,241,0.12)",
            border: `1px solid ${D.indigoBorder}`,
            color: D.text,
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Späť na Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
