"use client";

import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { Zap, Shield, BarChart3, Brain, MessageSquare, Globe } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Brain",
    desc: "Lokálna AI ktorá sa učí z každej interakcie. Rozumie slovenčine a češtine, pamätá si kontext.",
    color: "#7c3aed",
    glow: "rgba(124,58,237,0.2)",
    span: "col-span-1",
  },
  {
    icon: Zap,
    title: "Inteligentný kalendár",
    desc: "Integrácia s Google a Outlook. AI automaticky navrhuje časy stretnutí bez konfliktov.",
    color: "#2563eb",
    glow: "rgba(37,99,235,0.2)",
    size: "col-span-1",
  },
  {
    icon: MessageSquare,
    title: "Email manažment",
    desc: "AI triedi emaily, navrhuje odpovede a posiela follow-upy za teba. Gmail integrácia.",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.2)",
    size: "col-span-1",
  },
  {
    icon: Globe,
    title: "Hovory & SMS",
    desc: "Prepisy hovorov, AI zhrnutia, odosielanie SMS. Lokálne spracovanie — žiadne úniky dát.",
    color: "#10b981",
    glow: "rgba(16,185,129,0.2)",
    size: "col-span-1",
  },
  {
    icon: BarChart3,
    title: "CRM & Kontakty",
    desc: "Správa kontaktov, pipeline a obchodných príležitostí. AI navrhuje ďalší krok.",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.2)",
    size: "col-span-1",
  },
  {
    icon: Shield,
    title: "GDPR & Bezpečnosť",
    desc: "End-to-end šifrovanie, súlad s GDPR, slovenské a európske právne požiadavky.",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.2)",
    size: "col-span-1",
  },
];

export default function BentoGrid() {
  return (
    <section className="py-28 px-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-[#7c3aed]/10 text-[#a78bfa] border border-[#7c3aed]/20 mb-5">
            Prečo Unifyo
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-[-0.04em] text-white leading-tight">
            Všetko čo tvoj biznis<br />
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              potrebuje.
            </span>
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 auto-rows-fr">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              className={f.size}
            >
              <Tilt
                tiltMaxAngleX={8}
                tiltMaxAngleY={8}
                glareEnable={true}
                glareMaxOpacity={0.06}
                glareColor="#a5b4fc"
                glarePosition="all"
                glareBorderRadius="16px"
                transitionSpeed={1200}
                style={{ height: "100%" }}
              >
                <div
                  className="h-full min-h-[160px] rounded-2xl p-6 border border-[rgba(124,58,237,0.15)] bg-white/[0.03] backdrop-blur-sm flex flex-col gap-4 cursor-default transition-all duration-300 hover:border-[rgba(124,58,237,0.35)] hover:bg-white/[0.05]"
                  style={{
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`,
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${f.color}22, ${f.color}11)`,
                      boxShadow: `0 0 20px ${f.glow}`,
                      border: `1px solid ${f.color}33`,
                    }}
                  >
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-[0.95rem] mb-1.5 tracking-tight">{f.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </Tilt>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
