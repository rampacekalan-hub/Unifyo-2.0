"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();
const { hero } = config.texts;

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: "easeOut" as const },
  }),
};

const stats = [
  { label: "Aktívnych tímov", value: "2 400+" },
  { label: "Projektov spravovaných", value: "18 000+" },
  { label: "Dostupnosť", value: "99.9%" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16">

      {/* ── Layered mesh gradients ── */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[#6366f1]/[0.07] blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-[#8b5cf6]/[0.06] blur-[120px]" />
        <div className="absolute bottom-0 left-10 w-[400px] h-[300px] rounded-full bg-[#6366f1]/[0.05] blur-[100px]" />
        {/* Fine dot grid */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: `radial-gradient(circle, #a5b4fc 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Top radial fade */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#080b12] to-transparent" />
        {/* Bottom radial fade */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#080b12] to-transparent" />
      </div>

      <div className="w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center gap-7">

        {/* Pill badge */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide bg-white/[0.04] text-[#a5b4fc] border border-white/[0.07] backdrop-blur-sm select-none">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6366f1] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
            </span>
            {hero.badge}
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-[2.75rem] sm:text-6xl md:text-[5.5rem] font-bold tracking-[-0.04em] leading-[1.04] max-w-4xl"
        >
          <span className="text-white">Váš tím.&nbsp;</span>
          <br className="hidden sm:block" />
          <span
            className="bg-gradient-to-br from-[#c7d2fe] via-[#818cf8] to-[#6366f1] bg-clip-text text-transparent"
            style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            Jeden systém.
          </span>
          <br />
          <span className="text-white/80">Nekonečné možnosti.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-[1.05rem] md:text-xl text-[#64748b] max-w-[580px] leading-[1.75] font-light"
        >
          {hero.subheadline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center gap-3 mt-1"
        >
          <Link href="/register">
            <Button
              size="lg"
              className="group relative h-12 px-8 text-[0.9rem] font-semibold text-white border-0 bg-[#6366f1] hover:bg-[#5254cc] shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_8px_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.8),0_8px_50px_rgba(99,102,241,0.45)] transition-all duration-300 rounded-xl overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                {hero.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </span>
            </Button>
          </Link>
          <Button
            size="lg"
            variant="ghost"
            className="h-12 px-8 text-[0.9rem] font-medium text-[#94a3b8] hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.14] rounded-xl transition-all duration-300"
          >
            <Play className="mr-2 w-3.5 h-3.5" />
            {hero.ctaSecondary}
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mt-4"
        />

        {/* Stats */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap justify-center gap-10"
        >
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              {i > 0 && (
                <div className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 h-6 w-px bg-white/[0.06]" />
              )}
              <span className="text-2xl font-bold tracking-tight text-white">{stat.value}</span>
              <span className="text-xs text-[#475569] font-medium tracking-wide uppercase">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
