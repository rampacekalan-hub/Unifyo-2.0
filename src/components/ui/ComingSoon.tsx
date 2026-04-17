"use client";
// src/components/ui/ComingSoon.tsx
// Reusable "coming soon" placeholder — used by /calls, /analytics, /automation,
// and any other module not yet built. Lands on a real page, not a 404.

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  sky: "#22d3ee",
  text: "#eef2ff",
  muted: "#94a3b8",
  indigoBorder: "rgba(99,102,241,0.22)",
};

interface Props {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  features?: string[];
}

export default function ComingSoon({
  title,
  description = "Tento modul ešte len vzniká. Pracujeme na tom — vráť sa čoskoro.",
  icon: Icon = Sparkles,
  features,
}: Props) {
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

        <span
          className="inline-block px-3 py-1 rounded-full text-[0.65rem] font-semibold uppercase tracking-widest mb-4"
          style={{
            background: "rgba(34,211,238,0.1)",
            border: "1px solid rgba(34,211,238,0.25)",
            color: D.sky,
          }}
        >
          Čoskoro
        </span>

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

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
            color: "white",
            boxShadow: "0 0 20px rgba(99,102,241,0.35)",
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Späť na Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
