"use client";

import { motion } from "framer-motion";
import { Calendar, Shield, BarChart3, Brain, Mail, Phone } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

type Feature = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
  accent: string;
  bg: string;
  border: string;
  cta: string;
  comingSoon?: string;
};

const features: Feature[] = [
  {
    icon: Brain,
    title: "AI asistent po slovensky",
    desc: "Rozumie slovenčine a češtine, pamätá si tvoje kontakty, úlohy a kontext. Hostované v EÚ, žiadne dáta mimo tvojho účtu.",
    accent: "#8b5cf6",
    bg: "rgba(139,92,246,0.07)",
    border: "rgba(139,92,246,0.15)",
    cta: "Skús AI asistenta",
  },
  {
    icon: Calendar,
    title: "Kalendár & úlohy",
    desc: "Denný a týždenný prehľad úloh, drag & drop preplánovanie, AI navrhne časy bez konfliktov. Google a Outlook sync na ceste.",
    accent: "#06b6d4",
    bg: "rgba(6,182,212,0.07)",
    border: "rgba(6,182,212,0.15)",
    cta: "Otvoriť kalendár",
  },
  {
    icon: Mail,
    title: "Email manažment",
    desc: "AI triedi emaily, navrhuje odpovede a posiela follow-upy za teba. Gmail integrácia.",
    accent: "#67e8f9",
    bg: "rgba(103,232,249,0.06)",
    border: "rgba(103,232,249,0.12)",
    cta: "Na ceste — Q3 2026",
    comingSoon: "Q3 2026",
  },
  {
    icon: Phone,
    title: "Hovory & Prepisy",
    desc: "Automatické prepisy hovorov, AI zhrnutia, odosielanie SMS. Lokálne spracovanie.",
    accent: "#10b981",
    bg: "rgba(16,185,129,0.07)",
    border: "rgba(16,185,129,0.15)",
    cta: "Na ceste — Q4 2026",
    comingSoon: "Q4 2026",
  },
  {
    icon: BarChart3,
    title: "CRM & Pipeline",
    desc: "Kontakty, poznámky a história komunikácie. Deal pipeline s fázami (Lead → Won) a AI návrhmi ďalšieho kroku.",
    accent: "#a78bfa",
    bg: "rgba(167,139,250,0.07)",
    border: "rgba(167,139,250,0.15)",
    cta: "Otvoriť CRM",
  },
  {
    icon: Shield,
    title: "GDPR & Bezpečnosť",
    desc: "Hostované v EÚ (Hetzner DE), TLS, 2FA, audit log prihlásení, GDPR export a zmazanie účtu. Field-level šifrovanie Q3 2026.",
    accent: "#34d399",
    bg: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.12)",
    cta: "Bezpečnosť & GDPR",
  },
];

export default function BentoGrid() {
  return (
    <section id="features" className="py-28 px-6 relative section-bg">
      <div className="max-w-6xl mx-auto">

        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold tracking-[0.18em] uppercase mb-4"
            style={{ color: "#94a3b8" }}>
            Čo Unifyo zvláda
          </span>
          <h2 className="font-black tracking-[-0.03em] leading-[1.08]"
            style={{ fontSize: "clamp(1.9rem, 4vw, 3.2rem)", color: "#eef2ff" }}>
            Jeden nástroj.{" "}
            <span style={{
              background: "linear-gradient(90deg, #a78bfa, #67e8f9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Nekonečné možnosti.
            </span>
          </h2>
          <p className="mt-4 text-sm max-w-md mx-auto" style={{ color: "#94a3b8" }}>
            AI, ktorá pracuje za teba — po slovensky, v súlade s GDPR.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: [0.21, 0.47, 0.32, 0.98] }}
            >
              <div
                className="group h-full rounded-2xl p-5 sm:p-6 flex flex-col gap-4 cursor-default transition-all duration-300"
                style={{
                  background: f.bg,
                  border: `1px solid ${f.border}`,
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  minHeight: "180px",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.background = f.bg.replace("0.07", "0.13").replace("0.06", "0.12");
                  (e.currentTarget as HTMLDivElement).style.border = `1px solid ${f.accent}50`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 32px ${f.accent}18, 0 8px 32px rgba(0,0,0,0.3)`;
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background = f.bg;
                  (e.currentTarget as HTMLDivElement).style.border = `1px solid ${f.border}`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                {/* Icon badge + optional ComingSoon pill */}
                <div className="flex items-center justify-between gap-2">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${f.accent}18`, border: `1px solid ${f.accent}30` }}>
                    <f.icon className="w-5 h-5" style={{ color: f.accent }} />
                  </div>
                  {f.comingSoon && (
                    <span
                      className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
                      style={{
                        background: `${f.accent}1a`,
                        color: f.accent,
                        border: `1px solid ${f.accent}50`,
                      }}
                    >
                      Čoskoro · {f.comingSoon}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-[0.95rem] mb-2 tracking-tight" style={{ color: "#eef2ff" }}>
                    {f.title}
                  </h3>
                  <p className="text-[0.84rem] leading-relaxed" style={{ color: "#94a3b8" }}>
                    {f.desc}
                  </p>
                </div>

                {/* Bottom cta */}
                <div className="mt-auto pt-3 border-t" style={{ borderColor: `${f.accent}22` }}>
                  <span className="text-xs font-medium" style={{ color: f.accent }}>
                    {f.cta} →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
