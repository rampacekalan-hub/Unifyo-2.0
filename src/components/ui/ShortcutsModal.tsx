"use client";
// src/components/ui/ShortcutsModal.tsx
// Global keyboard shortcuts cheat-sheet. Opens on `?` (Shift+/) or from
// the command palette. Esc to close. Mounted once in AppLayout.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

interface Shortcut {
  keys: string[];
  label: string;
}

const GROUPS: { title: string; items: Shortcut[] }[] = [
  {
    title: "Navigácia",
    items: [
      { keys: ["⌘", "K"], label: "Príkazová paleta" },
      { keys: ["?"], label: "Táto nápoveda" },
      { keys: ["Esc"], label: "Zavrieť / zrušiť" },
    ],
  },
  {
    title: "Chat",
    items: [
      { keys: ["/"], label: "Slash príkazy" },
      { keys: ["Enter"], label: "Odoslať správu" },
      { keys: ["Shift", "Enter"], label: "Nový riadok" },
      { keys: ["↑", "↓"], label: "Výber z menu" },
    ],
  },
  {
    title: "Správa",
    items: [
      { keys: ["Shift", "klik"], label: "Hromadný výber v CRM/Kalendári" },
      { keys: ["Drag"], label: "Presun úlohy v kalendári" },
    ],
  },
];

export default function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // `?` = Shift+/ on most layouts; accept plain `?` too.
      const target = e.target as HTMLElement | null;
      const inField =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (!inField && (e.key === "?" || (e.shiftKey && e.key === "/"))) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl p-6"
            style={{
              background: "rgba(10,12,24,0.95)",
              border: "1px solid rgba(99,102,241,0.28)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5" style={{ color: "#6366f1" }} />
                <h2 className="text-base font-bold" style={{ color: "#eef2ff" }}>
                  Klávesové skratky
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5"
                aria-label="Zavrieť"
              >
                <X className="w-4 h-4" style={{ color: "#94a3b8" }} />
              </button>
            </div>

            <div className="space-y-5">
              {GROUPS.map((g) => (
                <div key={g.title}>
                  <h3
                    className="text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "#6b7280" }}
                  >
                    {g.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {g.items.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between py-1.5"
                      >
                        <span className="text-xs" style={{ color: "#cbd5e1" }}>
                          {s.label}
                        </span>
                        <span className="flex gap-1">
                          {s.keys.map((k, j) => (
                            <kbd
                              key={j}
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold"
                              style={{
                                background: "rgba(99,102,241,0.12)",
                                border: "1px solid rgba(99,102,241,0.28)",
                                color: "#eef2ff",
                              }}
                            >
                              {k}
                            </kbd>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p
              className="mt-5 pt-4 text-[10px] text-center"
              style={{
                color: "#6b7280",
                borderTop: "1px solid rgba(99,102,241,0.14)",
              }}
            >
              Stlač <kbd className="px-1 py-0.5 rounded bg-white/5 font-mono">?</kbd>{" "}
              kedykoľvek pre toto okno
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
