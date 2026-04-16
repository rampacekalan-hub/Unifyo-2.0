"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Clock, Zap, X } from "lucide-react";

interface OrbitEntry {
  id: string;
  module: string;
  anonymizedContent: string | null;
  summary: string | null;
  context: string;
  emotionalTone: string;
  confidenceScore: number;
  importance: number;
  relevanceTTL: string | null;
  createdAt: string;
}

const TONE_EMOJI: Record<string, string> = {
  positive: "😊",
  negative: "😔",
  neutral:  "😐",
  anxious:  "😰",
  excited:  "🤩",
};

const TONE_COLOR: Record<string, string> = {
  positive: "#22d3ee",
  negative: "#f87171",
  neutral:  "#94a3b8",
  anxious:  "#fb923c",
  excited:  "#a78bfa",
};

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Tu som sa naučil tvoj štýl komunikácie",
  personal:  "Tu si definoval tvoj osobný kontext",
  work:      "Tu som zachytil tvoje pracovné ciele",
  fitness:   "Tu som zaznamenal tvoje fitness záujmy",
  sandbox:   "Simulovaný záznam (Brain Sandbox)",
};

function getNodeLabel(entry: OrbitEntry): string {
  if (entry.summary) return entry.summary;
  if (MODULE_LABELS[entry.module]) return MODULE_LABELS[entry.module];
  const raw = entry.anonymizedContent ?? "";
  return raw.length > 80 ? raw.slice(0, 80) + "…" : raw || "Zachytená interakcia";
}

export default function MemoryOrbit() {
  const [orbit, setOrbit] = useState<OrbitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OrbitEntry | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/user/memory-orbit")
      .then((r) => r.json())
      .then((d) => { if (d.orbit) setOrbit(d.orbit); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSelected(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 rounded-full border-2 border-t-transparent"
          style={{ borderColor: "rgba(34,211,238,0.4)", borderTopColor: "#22d3ee" }}
        />
      </div>
    );
  }

  if (orbit.length === 0) {
    return (
      <div className="py-8 text-center">
        <Brain className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: "#22d3ee" }} />
        <p className="text-xs" style={{ color: "#475569" }}>
          Zatiaľ žiadne spomienky. Začni chatovať!
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex gap-6">

      {/* ── Vertical timeline spine ── */}
      <div className="relative flex flex-col items-center flex-shrink-0 w-8">
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px"
          style={{ background: "linear-gradient(to bottom, #22d3ee44, #a78bfa44, transparent)" }} />
      </div>

      {/* ── Memory nodes ── */}
      <div className="flex-1 space-y-3 pb-4 max-h-[420px] overflow-y-auto pr-1
        scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
        {orbit.map((entry, i) => {
          const color = TONE_COLOR[entry.emotionalTone] ?? "#94a3b8";
          const isActive = selected?.id === entry.id;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="relative flex items-start gap-4 cursor-pointer group"
              onClick={() => setSelected(isActive ? null : entry)}
            >
              {/* Node dot */}
              <div className="relative z-10 flex-shrink-0 mt-1">
                <motion.div
                  animate={isActive ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: color,
                    boxShadow: `0 0 ${isActive ? "14px" : "6px"} ${color}`,
                    border: `2px solid ${isActive ? color : color + "66"}`,
                  }}
                />
                {i < orbit.length - 1 && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-4"
                    style={{ background: color + "33" }} />
                )}
              </div>

              {/* Content */}
              <div
                className="flex-1 rounded-2xl px-4 py-3 transition-all duration-200"
                style={{
                  background: isActive ? `${color}10` : "rgba(15,23,42,0.6)",
                  border: `1px solid ${isActive ? color + "44" : "rgba(51,65,85,0.6)"}`,
                  backdropFilter: "blur(12px)",
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base leading-none">{TONE_EMOJI[entry.emotionalTone] ?? "💭"}</span>
                  <span className="text-[0.6rem] font-bold tracking-widest uppercase"
                    style={{ color }}>
                    {entry.module}
                  </span>
                  <span className="text-[0.6rem] ml-auto" style={{ color: "#475569" }}>
                    {new Date(entry.createdAt).toLocaleDateString("sk-SK", { day: "2-digit", month: "short" })}
                  </span>
                </div>
                <p className="text-xs leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all"
                  style={{ color: isActive ? "#f8fafc" : "#94a3b8" }}>
                  {getNodeLabel(entry)}
                </p>

                {/* Confidence bar */}
                <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: "#1e293b" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${entry.confidenceScore * 100}%` }}
                    transition={{ delay: i * 0.04 + 0.3, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: color }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Detail panel ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            ref={panelRef}
            key={selected.id}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-0 z-50 w-72 rounded-2xl p-5 space-y-3 shadow-2xl"
            style={{
              background: "rgba(15,23,42,0.96)",
              border: `1px solid ${TONE_COLOR[selected.emotionalTone] ?? "#334155"}44`,
              backdropFilter: "blur(24px)",
            }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-widest uppercase"
                style={{ color: TONE_COLOR[selected.emotionalTone] ?? "#94a3b8" }}>
                {TONE_EMOJI[selected.emotionalTone]} {selected.emotionalTone}
              </span>
              <button onClick={() => setSelected(null)} style={{ color: "#475569" }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: "#f8fafc" }}>
              {getNodeLabel(selected)}
            </p>

            <div className="space-y-1.5 text-[0.65rem]" style={{ color: "#64748b" }}>
              <div className="flex justify-between">
                <span>Kontext</span>
                <span className="font-bold" style={{ color: selected.context === "personal" ? "#a78bfa" : "#22d3ee" }}>
                  {selected.context}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Istota AI</span>
                <span className="font-bold" style={{ color: "#f8fafc" }}>
                  {(selected.confidenceScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Dôležitosť</span>
                <span className="font-bold" style={{ color: "#f8fafc" }}>
                  {(selected.importance * 100).toFixed(0)}%
                </span>
              </div>
              {selected.relevanceTTL && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Platí do</span>
                  <span className="font-bold" style={{ color: "#fb923c" }}>
                    {new Date(selected.relevanceTTL).toLocaleDateString("sk-SK")}
                  </span>
                </div>
              )}
              {!selected.relevanceTTL && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Trvalé</span>
                  <span className="font-bold" style={{ color: "#22d3ee" }}>∞</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Dátum</span>
                <span style={{ color: "#f8fafc" }}>
                  {new Date(selected.createdAt).toLocaleString("sk-SK", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
