import { ImageResponse } from "next/og";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

export const alt = `${config.name} — ${config.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(1200px 600px at 20% 0%, rgba(124,58,237,0.35), transparent 60%), radial-gradient(900px 500px at 100% 100%, rgba(6,182,212,0.25), transparent 60%), linear-gradient(135deg, #05060d 0%, #0a0c18 50%, #050812 100%)",
          color: "#eef2ff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top gradient hairline */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background:
              "linear-gradient(90deg, transparent, #8b5cf6, #06b6d4, transparent)",
          }}
        />

        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 48 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
              boxShadow: "0 0 60px rgba(124,58,237,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 48,
              fontWeight: 900,
              letterSpacing: -2,
            }}
          >
            U
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: -1.5 }}>
              {config.name}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                marginTop: 8,
                color: "#94a3b8",
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              Neural OS
            </div>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 900,
            letterSpacing: -3,
            lineHeight: 1.05,
            maxWidth: 1040,
            background: "linear-gradient(90deg, #eef2ff 0%, #a78bfa 60%, #67e8f9 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {config.tagline}
        </div>

        {/* Status pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginTop: 48,
            padding: "12px 22px",
            borderRadius: 999,
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.35)",
            color: "#c4b5fd",
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#10b981",
              boxShadow: "0 0 12px #10b981",
            }}
          />
          unifyo.online
        </div>
      </div>
    ),
    { ...size }
  );
}
