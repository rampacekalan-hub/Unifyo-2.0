"use client";
// src/components/ui/SlashMenu.tsx
// Floating suggestions popup that appears above a chat input when the user
// types "/". Keyboard-navigable (↑/↓/Enter/Esc) and fully a11y-labelled.

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SlashCommand } from "@/lib/slashCommands";

interface Props {
  open: boolean;
  items: SlashCommand[];
  activeIdx: number;
  onHover: (idx: number) => void;
  onSelect: (cmd: SlashCommand) => void;
}

export default function SlashMenu({ open, items, activeIdx, onHover, onSelect }: Props) {
  const listRef = useRef<HTMLUListElement>(null);

  // Scroll active item into view when navigating with arrows.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLLIElement>(`[data-idx="${activeIdx}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  return (
    <AnimatePresence>
      {open && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 right-0 bottom-full mb-2 z-30 rounded-xl overflow-hidden"
          style={{
            background: "rgba(10,13,26,0.97)",
            border: "1px solid rgba(99,102,241,0.28)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            backdropFilter: "blur(18px)",
          }}
          role="listbox"
          aria-label="Slash príkazy"
        >
          <ul ref={listRef} className="max-h-60 overflow-y-auto py-1">
            {items.map((cmd, idx) => {
              const active = idx === activeIdx;
              return (
                <li
                  key={cmd.id}
                  data-idx={idx}
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => onHover(idx)}
                  onMouseDown={(e) => {
                    // onMouseDown fires before the input loses focus → selection works.
                    e.preventDefault();
                    onSelect(cmd);
                  }}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors"
                  style={{
                    background: active ? "rgba(99,102,241,0.18)" : "transparent",
                  }}
                >
                  <span className="text-base" aria-hidden>{cmd.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium" style={{ color: "#eef2ff" }}>
                      {cmd.label}
                    </div>
                    <div className="text-[0.7rem] truncate" style={{ color: "#94a3b8" }}>
                      {cmd.description}
                    </div>
                  </div>
                  <kbd
                    className="text-[0.6rem] px-1.5 py-0.5 rounded"
                    style={{
                      color: active ? "#e0e7ff" : "#64748b",
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      opacity: active ? 1 : 0.5,
                    }}
                  >
                    ↵
                  </kbd>
                </li>
              );
            })}
          </ul>
          <div
            className="px-3 py-1.5 text-[0.6rem] flex items-center gap-3"
            style={{
              borderTop: "1px solid rgba(99,102,241,0.15)",
              color: "#64748b",
              background: "rgba(99,102,241,0.04)",
            }}
          >
            <span>↑↓ navigácia</span>
            <span>↵ vybrať</span>
            <span>esc zavrieť</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
