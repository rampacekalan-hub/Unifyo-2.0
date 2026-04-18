"use client";
// src/app/error.tsx — segment-level error boundary (within root layout)

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Mail } from "lucide-react";

const B = {
  bg: "#080b12",
  surface: "rgba(15,18,32,0.85)",
  border: "rgba(139,92,246,0.18)",
  text: "#eef2ff",
  muted: "#94a3b8",
  dim: "#64748b",
  violet: "#8b5cf6",
  violetDeep: "#7c3aed",
  violetGlow: "rgba(124,58,237,0.35)",
  red: "#ef4444",
  redDim: "rgba(239,68,68,0.15)",
};

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  const code = error.digest ?? "UNKNOWN";
  const isDev = process.env.NODE_ENV === "development";

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: B.bg }}
    >
      {/* Ambient blobs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black tracking-tight" style={{ color: B.text }}>
            Unifyo
          </h1>
        </div>

        {/* Error card */}
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: B.surface,
            border: `1px solid ${B.border}`,
            backdropFilter: "blur(24px)",
            boxShadow: "0 0 60px rgba(124,58,237,0.08)",
          }}
        >
          {/* Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: B.redDim,
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <AlertTriangle className="w-8 h-8" style={{ color: B.red }} />
          </div>

          <h2
            className="text-xl font-bold mb-2"
            style={{ color: B.text }}
          >
            Nastala chyba aplikácie
          </h2>
          <p
            className="text-sm mb-6 leading-relaxed"
            style={{ color: B.muted }}
          >
            Niečo sa pokazilo. Naša podpora bola automaticky notifikovaná.
            Skúste stránku obnoviť, alebo nás kontaktujte.
          </p>

          {/* Error code badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-6"
            style={{
              background: "rgba(139,92,246,0.08)",
              border: `1px solid ${B.border}`,
            }}
          >
            <span className="text-xs font-mono" style={{ color: B.dim }}>
              Kód chyby:
            </span>
            <span
              className="text-xs font-mono font-bold tracking-wide"
              style={{ color: B.violet }}
            >
              {code}
            </span>
          </div>

          {/* Dev message */}
          {isDev && error.message && (
            <div
              className="text-left rounded-xl p-3 mb-6 text-xs font-mono overflow-auto max-h-32"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
                color: "#fca5a5",
              }}
            >
              {error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${B.violetDeep}, #5b21b6)`,
                color: "#fff",
                boxShadow: `0 0 20px ${B.violetGlow}`,
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Skúsiť znova
            </button>
            <a
              href={`mailto:info@unifyo.online?subject=Chyba%20${code}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
              style={{
                background: "rgba(139,92,246,0.1)",
                border: `1px solid ${B.border}`,
                color: B.text,
              }}
            >
              <Mail className="w-4 h-4" />
              Kontaktovať podporu
            </a>
          </div>

          <Link
            href="/"
            className="inline-block mt-4 text-xs transition-colors"
            style={{ color: B.dim }}
          >
            ← Späť na hlavnú stránku
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
