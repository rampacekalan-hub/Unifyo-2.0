"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 section-bg">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative rounded-3xl px-6 py-12 sm:p-16 text-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(12,15,26,0.9) 50%, rgba(6,182,212,0.08) 100%)",
            border: "1px solid rgba(139,92,246,0.18)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Glow top */}
          <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)" }}
          />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-6"
              style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#c4b5fd" }}>
              <Sparkles className="w-3 h-3" />
              Začni ešte dnes
            </div>

            <h2 className="font-black tracking-[-0.03em] leading-[1.08] mb-5"
              style={{ fontSize: "clamp(1.7rem, 6vw, 3.5rem)", color: "#eef2ff", wordBreak: "break-word" }}>
              Nechaj AI pracovať{" "}
              <span style={{
                background: "linear-gradient(90deg, #a78bfa, #67e8f9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                za teba
              </span>
            </h2>

            <p className="mb-10 max-w-lg mx-auto" style={{ fontSize: "1rem", color: "#94a3b8", lineHeight: 1.8 }}>
              Unifyo AI spravuje tvoj čas, komunikáciu aj biznis.
              Začni s bezplatným plánom — bez kreditnej karty.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  boxShadow: "0 0 0 1px rgba(139,92,246,0.3), 0 4px 32px rgba(124,58,237,0.35)",
                }}
              >
                Začať zadarmo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-medium text-sm transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(139,92,246,0.2)",
                  color: "#c4b5fd",
                }}
              >
                Už mám účet →
              </Link>
            </div>

            <p className="mt-8 text-xs" style={{ color: "#64748b" }}>
              Plány od 8,99 €/mes · GDPR súlad · Zrušenie kedykoľvek
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
