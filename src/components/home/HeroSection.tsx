"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const TYPING_PHRASES = [
  "Naplánuj mi stretnutie na zajtra o 10:00",
  "Napíš follow-up email klientovi Novák",
  "Aký je stav môjho pipeline tento mesiac?",
  "Pridaj kontakt: Jana Kováčová, jana@firma.sk",
  "Zhrň mi dnešné hovory a akcie",
];

const AI_FEATURES = [
  "Kalendár & Stretnutia",
  "Email manažment",
  "CRM & Pipeline",
  "Hovory & Prepisy",
  "Custom AI agenti",
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] as [number, number, number, number] },
  }),
};

export default function HeroSection() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const phrase = TYPING_PHRASES[phraseIndex];
    if (typing) {
      if (displayed.length < phrase.length) {
        const t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 38);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 2200);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 18);
        return () => clearTimeout(t);
      } else {
        setPhraseIndex((i) => (i + 1) % TYPING_PHRASES.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, phraseIndex]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-20">

      {/* Background: subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      {/* Ambient glow — NO animation, epilepsy-safe */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(124,58,237,0.13) 0%, rgba(6,182,212,0.05) 50%, transparent 70%)" }}
      />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse at bottom right, rgba(6,182,212,0.07) 0%, transparent 60%)" }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">

        {/* Badge */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-7">
          <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide"
            style={{
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.25)",
              color: "#c4b5fd",
            }}>
            <Sparkles className="w-3 h-3" />
            AI platforma pre SK &amp; ČR trh
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="font-black tracking-[-0.03em] leading-[1.06] mb-6"
          style={{ fontSize: "clamp(2.6rem, 6vw, 5rem)" }}
        >
          <span style={{ color: "#eef2ff" }}>Tvoj AI asistent</span>
          <br />
          <span style={{
            background: "linear-gradient(90deg, #a78bfa 0%, #67e8f9 55%, #6ee7b7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            pre prácu aj život
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="max-w-xl mx-auto mb-4 leading-relaxed"
          style={{ fontSize: "1.05rem", color: "#9ca3af" }}
        >
          Unifyo rozumie tebe, tvojmu kalendáru, emailom aj kontaktom.
          Jeden nástroj. Nekonečné možnosti.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          custom={3} variants={fadeUp} initial="hidden" animate="visible"
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {AI_FEATURES.map((f) => (
            <span key={f} className="text-xs px-3 py-1 rounded-full"
              style={{
                background: "rgba(17,24,39,0.8)",
                border: "1px solid rgba(139,92,246,0.15)",
                color: "#6b7280",
              }}>
              {f}
            </span>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          custom={4} variants={fadeUp} initial="hidden" animate="visible"
          className="flex flex-col sm:flex-row gap-3 mb-14"
        >
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.3), 0 4px 24px rgba(124,58,237,0.3)",
            }}
          >
            Začať zadarmo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/#features"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-[0.97]"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "#d1d5db",
            }}
          >
            Pozrieť ukážku
          </Link>
        </motion.div>

        {/* AI Chat Demo */}
        <motion.div
          custom={5} variants={fadeUp} initial="hidden" animate="visible"
          className="w-full max-w-2xl"
        >
          <div className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(12,15,26,0.9)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(139,92,246,0.14)",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.06), 0 8px 48px rgba(0,0,0,0.4)",
            }}
          >
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b"
              style={{ borderColor: "rgba(139,92,246,0.1)" }}>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center">
                  <span className="text-white text-[8px] font-black">U</span>
                </div>
                <span className="text-xs font-medium" style={{ color: "#6b7280" }}>Unifyo AI</span>
              </div>
              <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: "#10b981" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] inline-block" />
                Online
              </span>
            </div>

            {/* Chat area */}
            <div className="p-4 space-y-3">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[9px] font-black">AI</span>
                </div>
                <div className="rounded-xl rounded-tl-none px-4 py-3 text-sm text-left flex-1"
                  style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.12)", color: "#d1d5db" }}>
                  Ahoj! Som tvoj Unifyo AI asistent. Čo pre teba dnes urobím?
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <div className="rounded-xl rounded-tr-none px-4 py-3 text-sm text-left max-w-[80%]"
                  style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(139,92,246,0.2)", color: "#e2e8f0" }}>
                  <span>{displayed}</span>
                  <span className="text-[#a78bfa]" style={{ opacity: typing ? 1 : 0.3 }}>|</span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#111827] to-[#1f2937] border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs" style={{ color: "#6b7280" }}>Ty</span>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: "rgba(17,24,39,0.8)", border: "1px solid rgba(139,92,246,0.1)" }}>
                <span className="flex-1 text-xs" style={{ color: "#4b5563" }}>Napíš správu Unifyo AI...</span>
                <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-200"
                  style={{ background: "rgba(124,58,237,0.8)" }}>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>

          <p className="mt-5 text-xs" style={{ color: "#374151" }}>
            Plány od 8,99 €/mes · Zrušenie kedykoľvek · GDPR súlad
          </p>
        </motion.div>
      </div>
    </section>
  );
}
