"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Calendar, Mail, BarChart3, Phone, CheckCircle2 } from "lucide-react";

// Each "scene" is a full back-and-forth exchange showing a real capability
const SCENES = [
  {
    tag: "Kalendár",
    tagColor: "#a78bfa",
    user: "Naplánuj mi stretnutie s Martinom Kováčom na štvrtok o 14:00",
    ai: "Stretnutie naplánované ✓\n📅 Štvrtok 17. apríl · 14:00 – 15:00\n👤 Martin Kováč · Pozývanka odoslaná",
    icon: Calendar,
    accent: "#8b5cf6",
  },
  {
    tag: "Email",
    tagColor: "#67e8f9",
    user: "Napíš follow-up email klientovi Novák po včerajšom hovore",
    ai: "Email pripravený a odoslaný ✓\n✉️ Predmet: Follow-up – hovor 16.4.\n📎 Zhrnutie hovoru priložené · Doručený o 9:02",
    icon: Mail,
    accent: "#06b6d4",
  },
  {
    tag: "Pipeline",
    tagColor: "#34d399",
    user: "Aký je stav môjho obchodného pipeline tento mesiac?",
    ai: "Pipeline – apríl 2025\n💰 Otvorené dealy: 12 · Hodnota: €47 200\n🔥 Horúce: TechStart s.r.o. (+€8 400)\n📈 Konverzný pomer: 34% (+6% vs. minulý mes.)",
    icon: BarChart3,
    accent: "#10b981",
  },
  {
    tag: "Hovory",
    tagColor: "#fbbf24",
    user: "Zhrň mi dnešné hovory a dôležité akcie",
    ai: "Dnešné hovory – 3 prepisy ✓\n📞 Alžbeta Šimková · Akcia: Poslať ponuku\n📞 Ján Mináč · Akcia: Demo budúci týždeň\n📞 Peter Blaho · Akcia: Žiadna",
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
    <section className="relative w-full overflow-hidden" style={{ paddingTop: "100px", paddingBottom: "80px", minHeight: "100vh" }}>

      <div className="hero-grid relative z-10 w-full max-w-6xl mx-auto px-6">

        {/* ── LEFT: Text content ── */}
        <div className="flex flex-col items-start" style={{ minWidth: 0 }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-7"
          >
            <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
              style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.22)", color: "#c4b5fd" }}>
              <Sparkles className="w-3 h-3" />
              AI asistent pre SK &amp; ČR trh
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="font-black tracking-[-0.03em] leading-[1.07] mb-6"
            style={{ fontSize: "clamp(2.6rem, 4.5vw, 4rem)" }}
          >
            <span style={{ color: "#eef2ff" }}>Tvoj AI asistent</span>
            <br />
            <span style={{
              background: "linear-gradient(90deg, #a78bfa 0%, #67e8f9 60%, #6ee7b7 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              pre prácu aj život
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26 }}
            className="mb-8 leading-relaxed"
            style={{ fontSize: "1.05rem", color: "#9ca3af", maxWidth: "36ch" }}
          >
            Unifyo riadi tvoj kalendár, emaily, pipeline aj hovory.
            Hovoríš po slovensky — AI rozumie dokonale.
          </motion.p>

          {/* Capability list */}
          <motion.ul
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.34 }}
            className="flex flex-col gap-3 mb-9"
          >
            {[
              { label: "Automatický kalendár & meeting scheduling", color: "#a78bfa" },
              { label: "Email drafty, follow-upy, triediaca AI", color: "#67e8f9" },
              { label: "CRM pipeline s AI odporúčaniami", color: "#34d399" },
              { label: "Prepisy hovorov & akčné body", color: "#fbbf24" },
            ].map(item => (
              <li key={item.label} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} />
                <span style={{ fontSize: "0.95rem", color: "#d1d5db" }}>{item.label}</span>
              </li>
            ))}
          </motion.ul>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.42 }}
            className="flex flex-wrap gap-3"
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base text-white transition-all duration-200 active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                boxShadow: "0 0 0 1px rgba(139,92,246,0.3), 0 4px 20px rgba(124,58,237,0.3)",
              }}
            >
              Začať zadarmo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/#features"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-medium text-base transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#d1d5db" }}
            >
              Pozrieť funkcie
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-5 text-sm" style={{ color: "#6b7280" }}
          >
            Od 8,99 €/mes · GDPR · Zrušenie kedykoľvek
          </motion.p>
        </div>

        {/* ── RIGHT: Live AI Chat Demo ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="min-w-0 w-full"
        >
          <div className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(8,10,18,0.92)",
              backdropFilter: "blur(28px)",
              WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(139,92,246,0.16)",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.06), 0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(139,92,246,0.08)",
            }}
          >
            {/* Title bar */}
            <div className="flex items-center gap-3 px-4 py-3"
              style={{ background: "rgba(12,15,26,0.6)" }}>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
              </div>
              <div className="flex items-center gap-2 ml-1">
                <div className="w-5 h-5 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                  <span className="text-white font-black" style={{ fontSize: "9px" }}>U</span>
                </div>
                <span className="text-sm font-semibold" style={{ color: "#d1d5db" }}>Unifyo AI</span>
              </div>
              <span className="ml-auto flex items-center gap-1.5 text-xs font-medium" style={{ color: "#10b981" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
                Online
              </span>
            </div>
            {/* Scene tabs row */}
            <div className="flex gap-1.5 px-4 py-2"
              style={{ borderBottom: "1px solid rgba(139,92,246,0.1)", background: "rgba(8,10,18,0.5)" }}>
              {SCENES.map((s, i) => (
                <button key={i} onClick={() => setSceneIdx(i)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: i === sceneIdx ? `${s.accent}18` : "transparent",
                    border: `1px solid ${i === sceneIdx ? s.accent + "35" : "rgba(255,255,255,0.04)"}`,
                    color: i === sceneIdx ? s.tagColor : "#4b5563",
                  }}>
                  <s.icon className="w-3 h-3" style={{ color: i === sceneIdx ? s.accent : "#4b5563" }} />
                  {s.tag}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="p-5 space-y-4" style={{ minHeight: "280px", maxHeight: "340px" }}>

              {/* User message */}
              <AnimatePresence mode="wait">
                <motion.div key={`user-${sceneIdx}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-3 justify-end"
                >
                  <div className="max-w-[82%] rounded-2xl rounded-tr-sm px-4 py-3.5 text-left"
                    style={{
                      background: "rgba(109,40,217,0.28)",
                      border: "1px solid rgba(139,92,246,0.35)",
                    }}>
                    <p className="text-[0.95rem] leading-relaxed" style={{ color: "#f1f5f9", wordBreak: "break-word" }}>
                      {userText}
                      {phase === "user-typing" && (
                        <span className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                          style={{ background: "#a78bfa" }} />
                      )}
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-[0.65rem] font-bold" style={{ color: "#9ca3af" }}>Ty</span>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* AI thinking indicator */}
              <AnimatePresence>
                {phase === "ai-thinking" && (
                  <motion.div key="thinking"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-3"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                      <span className="font-black text-white" style={{ fontSize: "9px" }}>AI</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm"
                      style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.12)" }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: "#8b5cf6",
                            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                          }} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* AI reply */}
              <AnimatePresence>
                {(phase === "ai-reply" || phase === "done") && aiText && (
                  <motion.div key={`ai-${sceneIdx}`}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-3"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                      <span className="font-black text-white" style={{ fontSize: "9px" }}>AI</span>
                    </div>
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3.5 max-w-[82%]"
                      style={{
                        background: "rgba(30,20,60,0.7)",
                        border: "1px solid rgba(139,92,246,0.25)",
                      }}>
                      {aiText.split("\n").map((line, i) => (
                        <motion.p key={i}
                          initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.05 }}
                          className="text-[0.95rem] leading-relaxed"
                          style={{ color: i === 0 ? "#f1f5f9" : "#c4c4cc", marginTop: i > 0 ? "6px" : 0 }}>
                          {line}
                        </motion.p>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input bar */}
            <div className="px-5 pb-5">
              <div className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                style={{ background: "rgba(12,15,26,0.8)", border: "1px solid rgba(139,92,246,0.1)" }}>
                <SceneIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: scene.accent }} />
                <span className="flex-1 text-sm" style={{ color: "#6b7280" }}>
                  Opýtaj sa Unifyo AI čokoľvek...
                </span>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)" }}>
                  <ArrowRight className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Scene progress dots */}
          <div className="flex justify-center gap-2 mt-4">
            {SCENES.map((_, i) => (
              <button key={i} onClick={() => setSceneIdx(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === sceneIdx ? "20px" : "6px",
                  height: "6px",
                  background: i === sceneIdx ? scene.accent : "rgba(139,92,246,0.2)",
                }} />
            ))}
          </div>
        </motion.div>

      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </section>
  );
}
