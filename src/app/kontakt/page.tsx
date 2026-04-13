"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Shield, Clock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NeuralBackground from "@/components/ui/NeuralBackground";

const CONTACT_ITEMS = [
  {
    icon: Mail,
    title: "Email",
    value: "hello@unifyo.online",
    desc: "Odpovieme do 24 hodín v pracovné dni.",
    href: "mailto:hello@unifyo.online",
    accent: "#8b5cf6",
  },
  {
    icon: MessageSquare,
    title: "Podpora",
    value: "support@unifyo.online",
    desc: "Technické problémy a otázky k účtu.",
    href: "mailto:support@unifyo.online",
    accent: "#06b6d4",
  },
  {
    icon: Shield,
    title: "GDPR & Právne",
    value: "gdpr@unifyo.online",
    desc: "Žiadosti o údaje, výmaz, sťažnosti GDPR.",
    href: "mailto:gdpr@unifyo.online",
    accent: "#10b981",
  },
  {
    icon: Clock,
    title: "Dostupnosť",
    value: "Po – Pi · 9:00 – 18:00",
    desc: "Slovensko (SEČ). Plánované odstávky vopred oznamujeme.",
    href: null,
    accent: "#a78bfa",
  },
];

export default function KontaktPage() {
  return (
    <>
      <NeuralBackground />
      <Navbar />
      <main style={{ position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "140px 24px 100px" }}>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            style={{ marginBottom: "64px", textAlign: "center" }}
          >
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.25)",
              color: "#c4b5fd",
              borderRadius: "999px",
              padding: "6px 16px",
              fontSize: "0.78rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase" as const,
              marginBottom: "24px",
            }}>
              Kontakt
            </span>
            <h1 style={{
              fontSize: "clamp(2rem, 5vw, 3.4rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              color: "#eef2ff",
              marginBottom: "16px",
            }}>
              Sme tu pre teba
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto" }}>
              Máš otázku, problém alebo nápad? Napíš nám — odpovieme rýchlo.
            </p>
          </motion.div>

          {/* Contact grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            marginBottom: "64px",
          }}>
            {CONTACT_ITEMS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                {item.href ? (
                  <a href={item.href} style={{ textDecoration: "none" }}>
                    <ContactCard item={item} />
                  </a>
                ) : (
                  <ContactCard item={item} />
                )}
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(12,15,26,0.9) 60%, rgba(6,182,212,0.06) 100%)",
              border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: "24px",
              padding: "48px 40px",
              textAlign: "center",
            }}
          >
            <div style={{
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)",
              margin: "0 auto 32px",
              width: "60%",
            }} />
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#eef2ff", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              Radšej vyskúšaš produkt?
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "28px" }}>
              Začni s bezplatným plánom a objavuj Unifyo na vlastnej koži — bez kreditnej karty.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/register" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                boxShadow: "0 0 0 1px rgba(139,92,246,0.3), 0 4px 24px rgba(124,58,237,0.3)",
                color: "#fff", borderRadius: "12px",
                padding: "12px 24px", fontSize: "0.9rem", fontWeight: 700,
                textDecoration: "none",
              }}>
                Začať zadarmo →
              </Link>
              <Link href="/#pricing" style={{
                display: "inline-flex", alignItems: "center",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(139,92,246,0.2)",
                color: "#c4b5fd", borderRadius: "12px",
                padding: "12px 24px", fontSize: "0.9rem", fontWeight: 600,
                textDecoration: "none",
              }}>
                Pozrieť ceny
              </Link>
            </div>
          </motion.div>

          {/* Back */}
          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <Link href="/" style={{ color: "#64748b", fontSize: "0.82rem", textDecoration: "none" }}>
              ← Späť na hlavnú stránku
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ContactCard({ item }: { item: typeof CONTACT_ITEMS[0] }) {
  return (
    <div style={{
      background: `rgba(${item.accent === "#8b5cf6" ? "139,92,246" : item.accent === "#06b6d4" ? "6,182,212" : item.accent === "#10b981" ? "16,185,129" : "167,139,250"},0.07)`,
      border: `1px solid ${item.accent}25`,
      borderRadius: "18px",
      padding: "24px",
      height: "100%",
      transition: "all 0.2s ease",
      cursor: item.href ? "pointer" : "default",
    }}
    onMouseEnter={e => {
      if (!item.href) return;
      (e.currentTarget as HTMLDivElement).style.border = `1px solid ${item.accent}50`;
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${item.accent}15`;
    }}
    onMouseLeave={e => {
      if (!item.href) return;
      (e.currentTarget as HTMLDivElement).style.border = `1px solid ${item.accent}25`;
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
    }}
    >
      <div style={{
        width: "40px", height: "40px", borderRadius: "12px",
        background: `${item.accent}18`, border: `1px solid ${item.accent}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: "16px",
      }}>
        <item.icon style={{ width: "18px", height: "18px", color: item.accent }} />
      </div>
      <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: item.accent, marginBottom: "6px" }}>
        {item.title}
      </p>
      <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#eef2ff", marginBottom: "6px" }}>
        {item.value}
      </p>
      <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6 }}>
        {item.desc}
      </p>
    </div>
  );
}
