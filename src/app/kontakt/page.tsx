"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NeuralBackground from "@/components/ui/NeuralBackground";

type FormState = "idle" | "sending" | "sent" | "error";

export default function KontaktPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormState("sending");
    await new Promise(r => setTimeout(r, 1200));
    setFormState("sent");
  }

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(139,92,246,0.18)",
    borderRadius: "12px",
    padding: "13px 16px",
    fontSize: "0.9rem",
    color: "#eef2ff",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box" as const,
  };

  return (
    <>
      <NeuralBackground />
      <Navbar />
      <main style={{ position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "140px 24px 100px" }}>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: "center", marginBottom: "48px" }}
          >
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.25)",
              color: "#c4b5fd", borderRadius: "999px",
              padding: "6px 16px", fontSize: "0.78rem", fontWeight: 600,
              letterSpacing: "0.04em", textTransform: "uppercase" as const,
              marginBottom: "20px",
            }}>
              Kontakt
            </span>
            <h1 style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1,
              color: "#eef2ff", marginBottom: "14px",
            }}>
              Napíš nám
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.7 }}>
              Máš otázku alebo nápad? Odpovádame do 24 hodín.
            </p>
          </motion.div>

          {/* Email direct link */}
          <motion.a
            href="mailto:info@unifyo.online"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            style={{
              display: "flex", alignItems: "center", gap: "14px",
              background: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.22)",
              borderRadius: "16px", padding: "18px 22px",
              textDecoration: "none", marginBottom: "32px",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(139,92,246,0.14)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(139,92,246,0.45)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(139,92,246,0.08)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(139,92,246,0.22)";
            }}
          >
            <div style={{
              width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0,
              background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Mail style={{ width: "18px", height: "18px", color: "#a78bfa" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8b5cf6", marginBottom: "3px" }}>Email</p>
              <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#eef2ff" }}>info@unifyo.online</p>
            </div>
            <span style={{ marginLeft: "auto", color: "#8b5cf6", fontSize: "1.1rem" }}>→</span>
          </motion.a>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(139,92,246,0.12)" }} />
            <span style={{ fontSize: "0.75rem", color: "#4b5563", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>alebo napíš cez formulár</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(139,92,246,0.12)" }} />
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            style={{
              background: "rgba(12,15,26,0.85)",
              border: "1px solid rgba(139,92,246,0.16)",
              borderRadius: "20px",
              padding: "32px",
            }}
          >
            <AnimatePresence mode="wait">
              {formState === "sent" ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ textAlign: "center", padding: "32px 0" }}
                >
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "50%",
                    background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px",
                  }}>
                    <CheckCircle2 style={{ width: "26px", height: "26px", color: "#10b981" }} />
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#eef2ff", marginBottom: "10px" }}>
                    Správa odoslaná!
                  </h3>
                  <p style={{ color: "#94a3b8", fontSize: "0.88rem", lineHeight: 1.6 }}>
                    Ozveme sa ti na <strong style={{ color: "#eef2ff" }}>{email}</strong> do 24 hodín.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", marginBottom: "7px", letterSpacing: "0.04em" }}>
                        Meno
                      </label>
                      <input
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Jana Novák"
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
                        onBlur={e => (e.target.style.borderColor = "rgba(139,92,246,0.18)")}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", marginBottom: "7px", letterSpacing: "0.04em" }}>
                        Email
                      </label>
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="ty@firma.sk"
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
                        onBlur={e => (e.target.style.borderColor = "rgba(139,92,246,0.18)")}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#94a3b8", marginBottom: "7px", letterSpacing: "0.04em" }}>
                      Správa
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Čo ti môžeme pomôcť?"
                      style={{ ...inputStyle, resize: "vertical" as const, minHeight: "120px" }}
                      onFocus={e => (e.target.style.borderColor = "rgba(139,92,246,0.5)")}
                      onBlur={e => (e.target.style.borderColor = "rgba(139,92,246,0.18)")}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formState === "sending"}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                      background: formState === "sending"
                        ? "rgba(139,92,246,0.4)"
                        : "linear-gradient(135deg, #7c3aed, #5b21b6)",
                      boxShadow: formState === "sending" ? "none" : "0 0 0 1px rgba(139,92,246,0.3), 0 4px 20px rgba(124,58,237,0.28)",
                      color: "#fff", borderRadius: "12px",
                      padding: "14px", fontSize: "0.9rem", fontWeight: 700,
                      border: "none", cursor: formState === "sending" ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {formState === "sending" ? (
                      <>
                        <span style={{
                          width: "16px", height: "16px", borderRadius: "50%",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff",
                          animation: "spin 0.7s linear infinite",
                          display: "inline-block",
                        }} />
                        Odosiela sa...
                      </>
                    ) : (
                      <>
                        <Send style={{ width: "15px", height: "15px" }} />
                        Odoslať správu
                      </>
                    )}
                  </button>

                  <p style={{ fontSize: "0.75rem", color: "#4b5563", textAlign: "center", lineHeight: 1.5 }}>
                    Odoslaním súhlasíš so spracúvaním údajov podla našich{" "}
                    <Link href="/sukromie" style={{ color: "#8b5cf6", textDecoration: "none" }}>Zásad ochrany súkromia</Link>.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Back */}
          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <Link href="/" style={{ color: "#64748b", fontSize: "0.82rem", textDecoration: "none" }}>
              ← Späť na hlavnú stránku
            </Link>
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </main>
      <Footer />
    </>
  );
}
