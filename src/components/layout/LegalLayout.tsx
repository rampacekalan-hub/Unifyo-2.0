import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NeuralBackground from "@/components/ui/NeuralBackground";

interface Section {
  title: string;
  content: string | string[];
}

interface LegalLayoutProps {
  badge: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: Section[];
}

export default function LegalLayout({ badge, title, subtitle, lastUpdated, sections }: LegalLayoutProps) {
  return (
    <>
      <NeuralBackground />
      <Navbar />
      <main style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "140px 24px 80px",
        }}>
          {/* Header */}
          <div style={{ marginBottom: "56px" }}>
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
              textTransform: "uppercase",
              marginBottom: "20px",
            }}>
              {badge}
            </span>
            <h1 style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              color: "#eef2ff",
              marginBottom: "16px",
            }}>
              {title}
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.7, marginBottom: "12px" }}>
              {subtitle}
            </p>
            <p style={{ color: "#4b5563", fontSize: "0.78rem" }}>
              Posledná aktualizácia: {lastUpdated}
            </p>
          </div>

          {/* Top gradient line */}
          <div style={{
            width: "100%", height: "1px", marginBottom: "48px",
            background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.3), rgba(56,189,248,0.2), transparent)",
          }} />

          {/* Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            {sections.map((section, i) => (
              <div key={i}>
                <h2 style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#eef2ff",
                  marginBottom: "12px",
                  letterSpacing: "-0.01em",
                }}>
                  {i + 1}. {section.title}
                </h2>
                {Array.isArray(section.content) ? (
                  <ul style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "4px" }}>
                    {section.content.map((item, j) => (
                      <li key={j} style={{
                        display: "flex", alignItems: "flex-start", gap: "10px",
                        fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.7,
                      }}>
                        <span style={{ color: "#8b5cf6", marginTop: "6px", flexShrink: 0, fontSize: "0.5rem" }}>●</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.8 }}>
                    {section.content}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Bottom divider */}
          <div style={{
            width: "100%", height: "1px", margin: "56px 0 40px",
            background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.15), transparent)",
          }} />

          {/* Back + contact */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              color: "#8b5cf6", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none",
            }}>
              ← Späť na hlavnú stránku
            </Link>
            <a href="mailto:hello@unifyo.online" style={{
              color: "#64748b", fontSize: "0.82rem", textDecoration: "none",
            }}>
              Otázky? hello@unifyo.online
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
