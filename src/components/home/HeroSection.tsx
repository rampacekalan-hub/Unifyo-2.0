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
            backgroundImage: `radial-gradient(circle, #818cf8 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#080b12] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#080b12] to-transparent" />
      </div>

      <div className="w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center gap-8">

        {/* Badge */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wide bg-white/[0.04] text-[#a5b4fc] border border-white/[0.07] backdrop-blur-sm select-none">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6366f1] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#6366f1]" />
            </span>
            {hero.badge}
          </span>
        </motion.div>

        {/* Headline — BEAST MODE */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-[3rem] sm:text-[4.5rem] md:text-[6.5rem] font-black tracking-[-0.05em] leading-[0.95] max-w-4xl"
        >
          <span className="block text-white">Automatizuj.</span>
          <span
            className="block"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #c7d2fe 30%, #818cf8 60%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 40px rgba(99,102,241,0.45))",
            }}
          >
            Dominuj.
          </span>
          <span className="block text-white/70">Unifyo.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-base md:text-xl text-[#64748b] max-w-[560px] leading-[1.8] font-light"
        >
          {hero.subheadline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <Link href="/register">
            {/* Pulsing border gradient button */}
            <div className="relative group">
              <div className="absolute -inset-[1.5px] rounded-xl bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#6366f1] opacity-70 group-hover:opacity-100 blur-[2px] group-hover:blur-[4px] transition-all duration-500 animate-pulse" />
              <Button
                size="lg"
                className="relative h-12 px-8 text-[0.9rem] font-semibold text-white border-0 bg-[#080b12] group-hover:bg-[#0d1020] rounded-xl transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
              >
                <span className="flex items-center gap-2">
                  {hero.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              </Button>
            </div>
          </Link>
          <Button
            size="lg"
            variant="ghost"
            className="h-12 px-8 text-[0.9rem] font-medium text-[#64748b] hover:text-white bg-transparent hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-xl transition-all duration-300"
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
          className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
        />

        {/* Stats */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap justify-center gap-12"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold tracking-tight text-white">{stat.value}</span>
              <span className="text-[0.7rem] text-[#334155] font-medium tracking-widest uppercase">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
