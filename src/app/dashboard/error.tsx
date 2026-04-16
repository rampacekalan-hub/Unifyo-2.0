// src/app/dashboard/error.tsx
"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#05070f" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <AlertTriangle className="w-6 h-6" style={{ color: "#ef4444" }} />
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: "#eef2ff" }}>
          Niečo sa pokazilo
        </h2>
        <p className="text-sm mb-6" style={{ color: "#64748b" }}>
          Dashboard sa nepodarilo načítať. Skúste to znova.
        </p>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold mx-auto transition-all"
          style={{
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.25)",
            color: "#a5b4fc",
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Skúsiť znova
        </button>
      </motion.div>
    </div>
  );
}
