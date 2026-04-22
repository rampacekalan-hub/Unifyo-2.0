"use client";
// src/components/onboarding/OnboardingTour.tsx
// First-run tour — 4 slides shown once per device. Dismiss marks
// unifyo.onboarding.v1 in localStorage so it doesn't reappear.
// Intentionally not tied to user account — UX polish, not compliance.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, BarChart3, Calendar, Sparkles, X } from "lucide-react";

const KEY = "unifyo.onboarding.v1";

interface Slide {
  icon: React.ElementType;
  title: string;
  body: string;
  color: string;
}

const SLIDES: Slide[] = [
  {
    icon: Sparkles,
    title: "Vitaj v Unifyo",
    body: "Tvoj AI asistent pre podnikanie. Chatuj, pridávaj kontakty, plánuj úlohy — všetko na jednom mieste, po slovensky.",
    color: "#8b5cf6",
  },
  {
    icon: Bot,
    title: "AI Chat pozná tvoj kontext",
    body: "V chate použi `/` pre slash príkazy: `/kontakt`, `/stretnutie`, `/email`. AI vidí tvoje CRM a kalendár.",
    color: "#6366f1",
  },
  {
    icon: BarChart3,
    title: "CRM bez zbytočností",
    body: "Drž si prehľad o klientoch. Shift+klik pre hromadný výber a mazanie. Povedz AI „pridaj kontakt Peter Novák\" a je to.",
    color: "#22d3ee",
  },
  {
    icon: Calendar,
    title: "Kalendár s drag-n-drop",
    body: "Prepínaj medzi týždňom a mesiacom. Ťahaj úlohy medzi dňami. Stlač `?` hocikedy pre klávesové skratky.",
    color: "#10b981",
  },
];

export default function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage blocked — skip onboarding */
    }
  }, []);

  function dismiss() {
    try { localStorage.setItem(KEY, "1"); } catch { /* noop */ }
    setShow(false);
  }

  const slide = SLIDES[idx];
  const Icon = slide.icon;
  const isLast = idx === SLIDES.length - 1;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-md rounded-3xl p-8 relative"
            style={{
              background: "var(--app-surface)",
              border: `1px solid ${slide.color}44`,
              boxShadow: `0 20px 60px ${slide.color}33`,
            }}
          >
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5"
              aria-label="Zavrieť"
            >
              <X className="w-4 h-4" style={{ color: "var(--app-text-muted)" }} />
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: `linear-gradient(135deg, ${slide.color}33, ${slide.color}11)`,
                    border: `1px solid ${slide.color}44`,
                    boxShadow: `0 0 30px ${slide.color}33`,
                  }}
                >
                  <Icon className="w-8 h-8" style={{ color: slide.color }} />
                </div>

                <h2
                  className="text-xl font-bold mb-3"
                  style={{ color: "var(--app-text)" }}
                >
                  {slide.title}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "var(--app-text-muted)" }}>
                  {slide.body}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === idx ? 20 : 6,
                    height: 6,
                    background: i === idx ? slide.color : "rgba(255,255,255,0.2)",
                  }}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={dismiss}
                className="text-xs px-3 py-2"
                style={{ color: "var(--app-text-muted)" }}
              >
                Preskočiť
              </button>
              <button
                onClick={() => (isLast ? dismiss() : setIdx(idx + 1))}
                className="text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
                style={{
                  background: `linear-gradient(135deg, ${slide.color}, ${slide.color}dd)`,
                  color: "white",
                  boxShadow: `0 0 20px ${slide.color}55`,
                }}
              >
                {isLast ? "Spustiť Unifyo" : "Ďalej"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
