"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();
const { hero } = config.texts;

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.8, ease: "easeOut" as const },
  }),
};

const stats = [
  { label: "Aktívnych tímov", value: "2 400+" },
  { label: "Ušetrených hodín", value: "100+" },
  { label: "Dostupnosť", value: "99.9%" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16">

      {/* Dot grid */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(139,92,246,0.4) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="w-full max-w-4xl mx-auto px-6 flex flex-col items-center text-center gap-8">

        {/* Badge */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[0.72rem] font-medium tracking-wider bg-white/[0.05] text-white/50 border border-white/[0.08] select-none uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8b5cf6] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" />
            </span>
            {hero.badge}
          </span>
        </motion.div>

        {/* Headline — Neon Noir */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-[3.2rem] sm:text-[5rem] md:text-[7rem] font-black tracking-[-0.055em] leading-[0.92]"
        >
          <span className="block text-white">Automatizuj.</span>
          <span
            className="block"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #a78bfa 60%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 60px rgba(139,92,246,0.6))",
            }}
          >
            Dominuj.
          </span>
          <span className="block" style={{ color: "rgba(255,255,255,0.2)" }}>Unifyo.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-base md:text-lg text-white/35 max-w-[500px] leading-[1.9] font-light tracking-wide"
        >
          {hero.subheadline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center gap-3 mt-2"
        >
          <Link href="/register">
            <div className="relative group">
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#7c3aed] opacity-80 group-hover:opacity-100 blur-[1px] transition-all duration-300" />
              <Button
                size="lg"
                className="relative h-12 px-8 text-[0.9rem] font-semibold text-white border-0 bg-black rounded-xl transition-all duration-300 group-hover:shadow-[0_0_40px_rgba(139,92,246,0.5)]"
              >
                <span className="flex items-center gap-2">
                  {hero.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </span>
              </Button>
            </div>
          </Link>
          <Button
            size="lg"
            variant="ghost"
            className="h-12 px-8 text-[0.9rem] font-medium text-white/40 hover:text-white bg-transparent border border-white/[0.07] hover:border-white/[0.15] rounded-xl transition-all duration-300"
          >
            <Play className="mr-2 w-3.5 h-3.5" />
            {hero.ctaSecondary}
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap justify-center gap-10 pt-6 border-t border-white/[0.05] w-full max-w-lg"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span className="text-xl font-bold text-white">{stat.value}</span>
              <span className="text-[0.65rem] text-white/25 font-medium tracking-widest uppercase">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
