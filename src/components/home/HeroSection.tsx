"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const TYPING_PHRASES = [
  "Naplánuj mi stretnutie na zajtra o 10:00",
  "Napíš follow-up email klientovi Novák",
  "Aký je stav môjho pipeline tento mesiac?",
  "Pridaj kontakt: Jana Kováčová, jana@firma.sk",
  "Zhrň mi dnešné hovory",
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: "easeOut" as const },
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
        const t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 40);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 2000);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 20);
        return () => clearTimeout(t);
      } else {
        setPhraseIndex((i) => (i + 1) % TYPING_PHRASES.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, phraseIndex]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 pb-16">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.04)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_20%,transparent_100%)] pointer-events-none" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#7c3aed]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#2563eb]/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">

        {/* Badge */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
          <span className="inline-flex items-center gap-2 bg-[#7c3aed]/10 border border-[#7c3aed]/20 rounded-full px-4 py-1.5 text-xs text-[#a78bfa] font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a78bfa] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7c3aed]" />
            </span>
            Nová AI platforma pre SK &amp; ČR trh
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1} variants={fadeUp} initial="hidden" animate="visible"
          className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.05] text-white"
        >
          Tvoj biznis na{" "}
          <span style={{
            background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            autopilote
          </span>
          <br />s AI asistentom
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Unifyo spravuje tvoj kalendár, emaily, kontakty a obchodné príležitosti —
          všetko v jednom mieste, po slovensky.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3} variants={fadeUp} initial="hidden" animate="visible"
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-sm transition-all active:scale-95 shadow-[0_0_30px_rgba(124,58,237,0.35)] hover:shadow-[0_0_50px_rgba(124,58,237,0.5)]"
          >
            Začať teraz
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/#features"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.08] text-white font-medium text-sm border border-white/10 transition-all active:scale-95"
          >
            Pozrieť ukážku
          </Link>
        </motion.div>

        {/* AI Chat Demo Widget */}
        <motion.div
          custom={4} variants={fadeUp} initial="hidden" animate="visible"
          className="max-w-2xl mx-auto"
        >
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(13,17,23,0.8)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(124,58,237,0.15)",
              boxShadow: "0 0 40px rgba(124,58,237,0.08)",
            }}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#7c3aed] to-[#2563eb] flex items-center justify-center">
                <span className="text-white text-xs font-black">U</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">Unifyo AI</span>
              <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                Online
              </span>
            </div>
            <div className="bg-[#030712] rounded-xl px-4 py-3 text-left border border-white/5">
              <p className="text-sm text-gray-300 min-h-[1.5rem]">
                {displayed}
                <span className="text-[#a78bfa] animate-pulse">|</span>
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-[#030712] rounded-lg px-3 py-2 text-xs text-gray-600 border border-white/5">
                Opýtaj sa čokoľvek...
              </div>
              <button className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center text-white hover:bg-[#6d28d9] transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Social proof */}
        <motion.p
          custom={5} variants={fadeUp} initial="hidden" animate="visible"
          className="mt-8 text-xs text-gray-600"
        >
          Platné predplatné od 8,99 €/mes · Zrušenie kedykoľvek
        </motion.p>
      </div>
    </section>
  );
}
