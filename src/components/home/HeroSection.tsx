"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Calendar, Mail, BarChart3, Phone, Sparkles } from "lucide-react";

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
    <section style={{
      position: "relative",
      width: "100%",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      paddingTop: "96px",
      paddingBottom: "80px",
      overflow: "hidden",
    }}>

      {/* ── Top: Badge + Headline + Sub + CTAs ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          style={{ marginBottom: "28px" }}
        >
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(139,92,246,0.1)",
            border: "1px solid rgba(139,92,246,0.28)",
            color: "#c4b5fd",
            borderRadius: "999px",
            padding: "8px 18px",
            fontSize: "0.82rem",
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}>
            <Sparkles style={{ width: "13px", height: "13px" }} />
            Nová éra práce — Unifyo AI je tu
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          style={{
            fontSize: "clamp(2.8rem, 7vw, 5.2rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.06,
            color: "#eef2ff",
            marginBottom: "24px",
          }}
        >
          Zabudni na chaos.
          <br />
          <span style={{
            background: "linear-gradient(90deg, #a78bfa 0%, #38bdf8 55%, #6ee7b7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            AI robí prácu za teba.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
          style={{
            fontSize: "clamp(1rem, 2.2vw, 1.18rem)",
            color: "#8b9ab0",
            lineHeight: 1.7,
            maxWidth: "48ch",
            margin: "0 auto 40px",
          }}
        >
          Jeden AI asistent po slovensky — kalendár, emaily, CRM aj hovory.
          Ušetri hodiny denne. Začni zadarmo.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.26 }}
          style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", marginBottom: "0" }}
        >
          <Link href="/register" style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            boxShadow: "0 0 0 1px rgba(139,92,246,0.35), 0 8px 28px rgba(124,58,237,0.35)",
            color: "#fff",
            borderRadius: "14px",
            padding: "14px 28px",
            fontSize: "1rem",
            fontWeight: 700,
            textDecoration: "none",
          }}>
            Začať zadarmo — žiadna karta
            <ArrowRight style={{ width: "18px", height: "18px" }} />
          </Link>
          <Link href="/#pricing" style={{
            display: "inline-flex", alignItems: "center",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#d1d5db",
            borderRadius: "14px",
            padding: "14px 24px",
            fontSize: "1rem",
            fontWeight: 600,
            textDecoration: "none",
          }}>
            Pozrieť ceny
          </Link>
        </motion.div>

      </motion.div>

      {/* ── Chat Demo ── */}
      <motion.div
        initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "760px",
          margin: "56px auto 0",
          padding: "0 24px",
        }}
      >
        {/* Purple glow behind card */}
        <div style={{
          position: "absolute", inset: "-20px", borderRadius: "32px",
          background: "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(124,58,237,0.12), transparent)",
          pointerEvents: "none",
        }} />

        {/* Chat card */}
        <div style={{
          position: "relative",
          background: "rgba(7,9,18,0.96)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(139,92,246,0.18)",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 0 0 1px rgba(139,92,246,0.06), 0 40px 100px rgba(0,0,0,0.7)",
        }}>
          {/* Top gradient line */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "1px",
            background: "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.6) 35%, rgba(56,189,248,0.5) 65%, transparent 100%)",
          }} />

          {/* Titlebar */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "12px 20px",
            background: "rgba(10,12,22,0.9)",
            borderBottom: "1px solid rgba(139,92,246,0.08)",
          }}>
            {/* Traffic lights */}
            <div style={{ display: "flex", gap: "5px" }}>
              {["#ff5f57","#febc2e","#28c840"].map(c => (
                <span key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c, display: "block" }} />
              ))}
            </div>
            {/* Logo + name */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "6px" }}>
              <div style={{
                width: "22px", height: "22px", borderRadius: "8px",
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ color: "#fff", fontSize: "9px", fontWeight: 900 }}>U</span>
              </div>
              <span style={{ color: "#e2e8f0", fontSize: "0.88rem", fontWeight: 600 }}>Unifyo AI</span>
              <span style={{
                background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.22)",
                color: "#34d399", fontSize: "0.68rem", padding: "2px 8px", borderRadius: "999px", fontWeight: 600,
              }}>Online</span>
            </div>
            {/* Scene tabs */}
            <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
              {SCENES.map((s, i) => {
                const TabIcon = s.icon;
                return (
                  <button key={i} onClick={() => setSceneIdx(i)} style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "4px 10px", borderRadius: "8px",
                    fontSize: "0.75rem", fontWeight: 500,
                    background: i === sceneIdx ? "rgba(139,92,246,0.14)" : "transparent",
                    border: `1px solid ${i === sceneIdx ? "rgba(139,92,246,0.3)" : "transparent"}`,
                    color: i === sceneIdx ? s.tagColor : "#374151",
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    <TabIcon style={{ width: "12px", height: "12px" }} />
                    {s.tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages — FIXED HEIGHT container, animations only inside */}
          <div style={{
            position: "relative",
            height: "230px",
            overflow: "hidden",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: "10px",
          }}>

            {/* User bubble */}
            <motion.div
              key={`u-${sceneIdx}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", gap: "10px" }}
            >
              <div style={{
                background: `rgba(${
                  scene.accent === "#8b5cf6" ? "109,40,217" :
                  scene.accent === "#06b6d4" ? "6,130,190" :
                  scene.accent === "#10b981" ? "16,130,90" : "160,110,10"
                },0.25)`,
                border: `1px solid ${scene.accent}50`,
                borderRadius: "18px 18px 4px 18px",
                padding: "11px 16px",
                maxWidth: "72%",
                fontSize: "0.875rem",
                color: "#f1f5f9",
                lineHeight: 1.6,
              }}>
                {userText}
                {phase === "user-typing" && (
                  <span style={{
                    display: "inline-block", width: "2px", height: "0.9em",
                    background: scene.accent, marginLeft: "3px", verticalAlign: "middle",
                    animation: "blink 0.85s step-end infinite",
                  }} />
                )}
              </div>
              <div style={{
                width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.55rem", color: "#9ca3af", fontWeight: 700,
              }}>TY</div>
            </motion.div>

            {/* AI row — always same vertical slot */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              {/* Avatar — always visible */}
              <div style={{
                width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0, marginTop: "2px",
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                boxShadow: `0 0 18px ${scene.accent}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ color: "#fff", fontSize: "8px", fontWeight: 900 }}>AI</span>
              </div>

              {/* Bubble slot — fixed min-height so container stays stable */}
              <div style={{ flex: 1, minHeight: "52px", position: "relative" }}>
                <AnimatePresence mode="wait">

                  {/* Thinking */}
                  {phase === "ai-thinking" && (
                    <motion.div key="dots"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        background: "rgba(20,12,40,0.92)",
                        border: `1px solid ${scene.accent}30`,
                        borderRadius: "4px 18px 18px 18px",
                        padding: "14px 18px",
                      }}
                    >
                      {[0,1,2].map(i => (
                        <span key={i} style={{
                          width: "7px", height: "7px", borderRadius: "50%",
                          background: scene.accent, display: "block",
                          animation: `bounce-dot 1.1s ease-in-out ${i * 0.18}s infinite`,
                        }} />
                      ))}
                    </motion.div>
                  )}

                  {/* Reply — only render revealed lines, each mounts fresh */}
                  {(phase === "ai-reply" || phase === "done") && aiLine > 0 && (
                    <motion.div key={`reply-${sceneIdx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        background: "rgba(18,10,36,0.95)",
                        border: `1px solid ${scene.accent}35`,
                        borderRadius: "4px 18px 18px 18px",
                        padding: "12px 16px",
                        maxWidth: "82%",
                      }}
                    >
                      <AnimatePresence initial={false}>
                        {scene.ai.split("\n").slice(0, aiLine).map((line, i) => (
                          <motion.p
                            key={`${sceneIdx}-l${i}`}
                            initial={{ opacity: 0, y: 6, x: -4 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            style={{
                              fontSize: "0.875rem",
                              lineHeight: 1.65,
                              color: i === 0 ? "#f1f5f9" : "#7d8fa8",
                              margin: i > 0 ? "5px 0 0" : "0",
                            }}
                          >
                            {line}
                          </motion.p>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Input */}
          <div style={{ padding: "0 20px 18px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "rgba(8,10,20,0.95)", border: "1px solid rgba(139,92,246,0.1)",
              borderRadius: "12px", padding: "10px 14px",
            }}>
              <SceneIcon style={{ width: "15px", height: "15px", color: scene.accent, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: "0.85rem", color: "#374151" }}>
                Opýtaj sa Unifyo AI čokoľvek po slovensky...
              </span>
              <div style={{
                width: "30px", height: "30px", borderRadius: "9px",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <ArrowRight style={{ width: "14px", height: "14px", color: "#fff" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "18px" }}>
          {SCENES.map((s, i) => (
            <button key={i} onClick={() => setSceneIdx(i)} style={{
              width: i === sceneIdx ? "22px" : "6px",
              height: "6px", borderRadius: "999px",
              background: i === sceneIdx ? scene.accent : "rgba(139,92,246,0.15)",
              border: "none", cursor: "pointer",
              transition: "all 0.25s ease",
            }} />
          ))}
        </div>
      </motion.div>

    </section>
  );
}
