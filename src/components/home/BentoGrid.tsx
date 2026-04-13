"use client";

import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { Zap, Shield, BarChart3, Users, Clock, Globe } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Bleskovo rýchle",
    desc: "Žiadne čakanie. Unifyo reaguje okamžite — každý klik, každá akcia.",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.25)",
    size: "col-span-1 md:col-span-2",
  },
  {
    icon: Shield,
    title: "Vaše dáta, váš server",
    desc: "100% kontrola. Žiadne cloudy tretích strán.",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.2)",
    size: "col-span-1",
  },
  {
    icon: BarChart3,
    title: "Analytika v reálnom čase",
    desc: "Vidíte čo sa deje — teraz.",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.2)",
    size: "col-span-1",
  },
  {
    icon: Users,
    title: "Tímová spolupráca",
    desc: "Celý tím na jednom mieste. Komentáre, úlohy, notifikácie.",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.2)",
    size: "col-span-1",
  },
  {
    icon: Clock,
    title: "Automatizácia procesov",
    desc: "Opakujúce sa úlohy preberáme za vás. Vy sa sústreďte na to čo má hodnotu.",
    color: "#7c3aed",
    glow: "rgba(124,58,237,0.25)",
    size: "col-span-1 md:col-span-2",
  },
  {
    icon: Globe,
    title: "Dostupné odkiaľkoľvek",
    desc: "Web, mobil, tablet. Unifyo beží všade.",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.2)",
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
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-[#7c3aed]/[0.07] text-[#7c3aed] border border-[#7c3aed]/[0.15] mb-5">
            Prečo Unifyo
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-[-0.04em] text-[#0a0a0a] leading-tight">
            Jeden nástroj.<br />
            <span
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Nekonečné výhody.
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
                  className="h-full min-h-[160px] rounded-2xl p-6 border border-black/[0.07] bg-white flex flex-col gap-4 cursor-default transition-all duration-300 hover:border-[#7c3aed]/[0.2] hover:shadow-[0_4px_24px_rgba(124,58,237,0.08)]"
                  style={{
                    boxShadow: `0 1px 3px rgba(0,0,0,0.04)`,
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
                    <h3 className="text-[#0a0a0a] font-semibold text-[0.95rem] mb-1.5 tracking-tight">{f.title}</h3>
                    <p className="text-[#71717a] text-sm leading-relaxed">{f.desc}</p>
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
