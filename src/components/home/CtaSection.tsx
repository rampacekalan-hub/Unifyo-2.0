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
            background: "linear-gradient(135deg, color-mix(in oklab, var(--brand-primary) 14%, transparent) 0%, var(--app-surface) 55%, color-mix(in oklab, var(--brand-accent) 10%, transparent) 100%)",
            border: "1px solid var(--app-border)",
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
              style={{ background: "var(--brand-primary-soft)", border: "1px solid color-mix(in oklab, var(--brand-primary) 35%, transparent)", color: "var(--brand-primary)" }}>
              <Sparkles className="w-3 h-3" />
              Začni ešte dnes
            </div>

            <h2 className="font-black tracking-[-0.03em] leading-[1.08] mb-5"
              style={{ fontSize: "clamp(1.7rem, 6vw, 3.5rem)", color: "var(--app-text)", wordBreak: "break-word" }}>
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

            <p className="mb-10 max-w-lg mx-auto" style={{ fontSize: "1rem", color: "var(--app-text-muted)", lineHeight: 1.8 }}>
              Unifyo AI spravuje tvoj čas, komunikáciu aj biznis.
              Plány od 8,99 €/mes · Zruš kedykoľvek.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                data-press
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200"
                style={{
                  background: "var(--brand-gradient)",
                  boxShadow: "0 0 0 1px rgba(139,92,246,0.3), 0 4px 32px rgba(124,58,237,0.35)",
                }}
              >
                Skúsiť Unifyo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                data-press
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-medium text-sm transition-all duration-200"
                style={{
                  background: "var(--app-surface-2)",
                  border: "1px solid var(--app-border)",
                  color: "var(--app-text)",
                }}
              >
                Už mám účet →
              </Link>
            </div>

            <p className="mt-8 text-xs" style={{ color: "var(--app-text-subtle)" }}>
              Plány od 8,99 €/mes · GDPR súlad · Zrušenie kedykoľvek
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
