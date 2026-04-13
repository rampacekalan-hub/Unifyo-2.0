"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Calendar, Mail, BarChart3, Phone, Users, Zap } from "lucide-react";

const SCENES = [
  {
    tag: "Kalendár",
    tagColor: "#a78bfa",
    user: "Naplánuj stretnutie s Martinom Kováčom na štvrtok o 14:00",
    ai: "Stretnutie naplánované ✓\n📅 Štvrtok 17. apríl · 14:00 – 15:00\n👤 Martin Kováč · Pozvánka odoslaná emailom",
    icon: Calendar,
    accent: "#8b5cf6",
  },
  {
    tag: "Email",
    tagColor: "#67e8f9",
    user: "Napíš follow-up email klientovi Novák po včerajšom hovore",
    ai: "Email odoslaný ✓\n✉️ Predmet: Follow-up – hovor 16.4.\n📎 Zhrnutie hovoru priložené · Doručený o 9:02",
    icon: Mail,
    accent: "#06b6d4",
  },
  {
    tag: "Pipeline",
    tagColor: "#34d399",
    user: "Aký je stav môjho obchodného pipeline tento mesiac?",
    ai: "Pipeline – apríl 2025\n💰 Otvorené dealy: 12 · Hodnota: €47 200\n🔥 TechStart s.r.o. je najhorúcejší deal (+€8 400)\n📈 Konverzný pomer: 34% · +6% oproti minulému mes.",
    icon: BarChart3,
    accent: "#10b981",
  },
  {
    tag: "Hovory",
    tagColor: "#fbbf24",
    user: "Zhrň mi dnešné hovory a dôležité akcie",
    ai: "Dnešné hovory – 3 prepisy ✓\n📞 Alžbeta Šimková · → Poslať cenovú ponuku\n📞 Ján Mináč · → Naplánovať demo budúci týždeň\n📞 Peter Blaho · → Žiadna akcia",
    icon: Phone,
    accent: "#f59e0b",
  },
];

export default function HeroSection() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [phase, setPhase] = useState<"user-typing" | "ai-thinking" | "ai-reply" | "done">("user-typing");
  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [aiLine, setAiLine] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scene = SCENES[sceneIdx];

  // Reset and run scene
  useEffect(() => {
    setPhase("user-typing");
    setUserText("");
    setAiText("");
    setAiLine(0);
  }, [sceneIdx]);

  // User typing
  useEffect(() => {
    if (phase !== "user-typing") return;
    const full = scene.user;
    if (userText.length < full.length) {
      const t = setTimeout(() => setUserText(full.slice(0, userText.length + 1)), 28);
      return () => clearTimeout(t);
    } else {
      timerRef.current = setTimeout(() => setPhase("ai-thinking"), 400);
      return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }
  }, [phase, userText, scene]);

  // AI thinking → reply
  useEffect(() => {
    if (phase !== "ai-thinking") return;
    timerRef.current = setTimeout(() => setPhase("ai-reply"), 900);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]);

  // AI reply — line by line
  useEffect(() => {
    if (phase !== "ai-reply") return;
    const lines = scene.ai.split("\n");
    if (aiLine < lines.length) {
      const t = setTimeout(() => {
        setAiText(lines.slice(0, aiLine + 1).join("\n"));
        setAiLine(l => l + 1);
      }, aiLine === 0 ? 0 : 380);
      return () => clearTimeout(t);
    } else {
      setPhase("done");
    }
  }, [phase, aiLine, scene]);

  // Auto-advance scene
  useEffect(() => {
    if (phase !== "done") return;
    timerRef.current = setTimeout(() => {
      setSceneIdx(i => (i + 1) % SCENES.length);
    }, 2400);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]);

  const SceneIcon = scene.icon;

  return (
    <section className="relative w-full" style={{ paddingTop: "110px", paddingBottom: "100px" }}>

      {/* ── CENTERED TOP: Badge + Headline + Sub + CTAs ── */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">

        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold"
            style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#c4b5fd" }}>
            <Sparkles className="w-3.5 h-3.5" />
            AI platforma pre SK &amp; ČR trh · GPT-4o powered
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="font-black tracking-[-0.04em] leading-[1.05] mb-7"
          style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)", color: "#eef2ff" }}
        >
          Zabudni na chaos.<br />
          <span style={{
            background: "linear-gradient(90deg, #a78bfa 0%, #67e8f9 50%, #6ee7b7 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            AI robí prácu za teba.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="mx-auto mb-10 leading-relaxed"
          style={{ fontSize: "clamp(1.05rem, 2vw, 1.25rem)", color: "#9ca3af", maxWidth: "52ch" }}
        >
          Unifyo rozumie slovenčine a riadi tvoj kalendár, emaily, CRM pipeline aj hovory.
          Jeden AI asistent namiesto piatich nástrojov.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          <Link href="/register"
            className="inline-flex items-center gap-2.5 rounded-2xl font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.4), 0 8px 32px rgba(124,58,237,0.4)",
              padding: "0.9rem 2.2rem",
              fontSize: "1.05rem",
            }}>
            Začať zadarmo — žiadna karta
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/#pricing"
            className="inline-flex items-center gap-2 rounded-2xl font-semibold transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#e2e8f0",
              padding: "0.9rem 2rem",
              fontSize: "1.05rem",
            }}>
            Pozrieť ceny
          </Link>
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center items-center gap-6"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: "#6b7280" }} />
            <span className="text-sm" style={{ color: "#6b7280" }}>1 200+ aktívnych používateľov</span>
          </div>
          <span style={{ color: "#1f2937" }}>·</span>
          <div className="flex items-center gap-1.5">
            {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#f59e0b", fontSize: "0.9rem" }}>★</span>)}
            <span className="text-sm ml-1" style={{ color: "#6b7280" }}>4.9 / 5</span>
          </div>
          <span style={{ color: "#1f2937" }}>·</span>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: "#6b7280" }} />
            <span className="text-sm" style={{ color: "#6b7280" }}>GDPR · AES-256 · SK &amp; ČR</span>
          </div>
        </motion.div>
      </div>

      {/* ── CHAT DEMO: Full-width below ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="relative z-10 max-w-4xl mx-auto px-6 mt-16"
      >
        {/* Glow behind chat */}
        <div className="absolute inset-x-0 -top-10 h-40 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(124,58,237,0.15), transparent)" }} />

        <div className="rounded-2xl overflow-hidden relative"
          style={{
            background: "rgba(8,10,20,0.95)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            border: "1px solid rgba(139,92,246,0.2)",
            boxShadow: "0 0 0 1px rgba(139,92,246,0.08), 0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent 5%, rgba(139,92,246,0.5) 40%, rgba(6,182,212,0.4) 60%, transparent 95%)" }} />

          {/* Title bar */}
          <div className="flex items-center gap-3 px-5 py-3.5"
            style={{ borderBottom: "1px solid rgba(139,92,246,0.1)", background: "rgba(12,15,26,0.8)" }}>
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
              <span className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
            </div>
            <div className="flex items-center gap-2 ml-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                <span className="text-white font-black" style={{ fontSize: "10px" }}>U</span>
              </div>
              <span className="font-semibold" style={{ fontSize: "0.95rem", color: "#e2e8f0" }}>Unifyo AI</span>
              <span className="text-xs px-2 py-0.5 rounded-full ml-1"
                style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>
                Online
              </span>
            </div>
            {/* Scene tabs */}
            <div className="ml-auto flex gap-2">
              {SCENES.map((s, i) => (
                <button key={i} onClick={() => setSceneIdx(i)}
                  className="flex items-center gap-1.5 rounded-lg font-medium transition-all duration-200"
                  style={{
                    padding: "0.35rem 0.75rem",
                    fontSize: "0.8rem",
                    background: i === sceneIdx ? `rgba(${s.accent === "#8b5cf6" ? "139,92,246" : s.accent === "#06b6d4" ? "6,182,212" : s.accent === "#10b981" ? "16,185,129" : "245,158,11"},0.15)` : "transparent",
                    border: `1px solid ${i === sceneIdx ? s.accent + "50" : "transparent"}`,
                    color: i === sceneIdx ? s.tagColor : "#4b5563",
                  }}>
                  <s.icon className="w-3.5 h-3.5" />
                  {s.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Messages area — 2 columns: left AI, right User */}
          <div className="p-6" style={{ minHeight: "200px" }}>
            <div className="flex flex-col gap-4">

              {/* User message */}
              <AnimatePresence mode="wait">
                <motion.div key={`user-${sceneIdx}`}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                  className="flex justify-end items-start gap-3"
                >
                  <div className="rounded-2xl rounded-tr-sm px-5 py-3.5"
                    style={{
                      background: "rgba(109,40,217,0.25)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      maxWidth: "60%",
                    }}>
                    <p style={{ fontSize: "0.975rem", color: "#f1f5f9", lineHeight: 1.6 }}>
                      {userText}
                      {phase === "user-typing" && (
                        <span className="inline-block w-0.5 h-[1.1em] ml-0.5 align-middle"
                          style={{ background: "#a78bfa", animation: "blink 1s step-end infinite" }} />
                      )}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.7rem", color: "#9ca3af", fontWeight: 700 }}>
                    Ty
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* AI thinking */}
              <AnimatePresence>
                {phase === "ai-thinking" && (
                  <motion.div key="thinking"
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }} className="flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                      <span className="font-black text-white" style={{ fontSize: "10px" }}>AI</span>
                    </div>
                    <div className="flex items-center gap-2 px-5 py-3.5 rounded-2xl rounded-tl-sm"
                      style={{ background: "rgba(30,20,60,0.7)", border: "1px solid rgba(139,92,246,0.2)" }}>
                      {[0,1,2].map(i => (
                        <span key={i} className="w-2 h-2 rounded-full"
                          style={{ background: "#8b5cf6", animation: `bounce-dot 1.2s ease-in-out ${i*0.2}s infinite` }} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI reply */}
              <AnimatePresence>
                {(phase === "ai-reply" || phase === "done") && aiText && (
                  <motion.div key={`ai-${sceneIdx}`}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }} className="flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)", boxShadow: "0 0 16px rgba(124,58,237,0.3)" }}>
                      <span className="font-black text-white" style={{ fontSize: "10px" }}>AI</span>
                    </div>
                    <div className="rounded-2xl rounded-tl-sm px-5 py-3.5"
                      style={{
                        background: "rgba(30,20,60,0.8)",
                        border: "1px solid rgba(139,92,246,0.2)",
                        maxWidth: "70%",
                      }}>
                      {aiText.split("\n").map((line, i) => (
                        <motion.p key={i}
                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.06 }}
                          style={{
                            fontSize: "0.975rem",
                            lineHeight: 1.65,
                            color: i === 0 ? "#f1f5f9" : "#b0b8cc",
                            marginTop: i > 0 ? "6px" : 0,
                          }}>
                          {line}
                        </motion.p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Input bar */}
          <div className="px-6 pb-5">
            <div className="flex items-center gap-3 rounded-xl px-5 py-3"
              style={{ background: "rgba(12,15,26,0.9)", border: "1px solid rgba(139,92,246,0.12)" }}>
              <SceneIcon className="w-4 h-4 flex-shrink-0" style={{ color: scene.accent }} />
              <span style={{ flex: 1, fontSize: "0.9rem", color: "#4b5563" }}>
                Opýtaj sa Unifyo AI čokoľvek po slovensky...
              </span>
              <div className="flex items-center justify-center w-8 h-8 rounded-xl"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-5">
          {SCENES.map((s, i) => (
            <button key={i} onClick={() => setSceneIdx(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === sceneIdx ? "24px" : "6px",
                height: "6px",
                background: i === sceneIdx ? scene.accent : "rgba(139,92,246,0.18)",
              }} />
          ))}
        </div>
      </motion.div>

    </section>
  );
}
