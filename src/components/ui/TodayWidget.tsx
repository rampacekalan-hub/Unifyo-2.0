"use client";
// src/components/ui/TodayWidget.tsx
// Dashboard "Dnešok" widget. Loads tasks + counters for today, lets the
// user tick tasks off inline. Optimistic UI — flip the checkbox, PATCH in
// the background, roll back on failure.

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Check, Users, Sparkles, CheckCircle2 } from "lucide-react";

const D = {
  indigo:       "#6366f1",
  violet:       "#8b5cf6",
  text:         "var(--app-text)",
  muted:        "var(--app-text-muted)",
  emerald:      "#10b981",
  indigoBorder: "rgba(99,102,241,0.22)",
};

interface CalendarTask {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  done: boolean;
}

interface TodayData {
  tasks: CalendarTask[];
  contactsAddedToday: number;
  tasksCompletedToday: number;
  aiMessagesToday: number;
}

export default function TodayWidget() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/today");
        if (!res.ok) return;
        const json = (await res.json()) as TodayData;
        if (!cancelled) setData(json);
      } catch {
        // Silent — empty state looks fine.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleToggle = useCallback(async (id: string) => {
    if (!data) return;
    // Optimistically remove the task (widget shows only !done tasks).
    const prev = data;
    const next: TodayData = {
      ...data,
      tasks: data.tasks.filter((t) => t.id !== id),
      tasksCompletedToday: data.tasksCompletedToday + 1,
    };
    setData(next);
    try {
      const res = await fetch("/api/calendar/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, done: true }),
      });
      if (!res.ok) throw new Error("patch failed");
    } catch {
      // Roll back on failure.
      setData(prev);
    }
  }, [data]);

  if (loading || !data) return null;

  const { tasks, contactsAddedToday, tasksCompletedToday, aiMessagesToday } = data;
  const chips = [
    { Icon: Users,         label: `${contactsAddedToday} ${pluralize(contactsAddedToday, "kontakt", "kontakty", "kontaktov")}`, color: D.indigo },
    { Icon: CheckCircle2,  label: `${tasksCompletedToday} ${pluralize(tasksCompletedToday, "úloha splnená", "úlohy splnené", "úloh splnených")}`, color: D.emerald },
    { Icon: Sparkles,      label: `${aiMessagesToday} ${pluralize(aiMessagesToday, "AI správa", "AI správy", "AI správ")}`, color: D.violet },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))",
        border: `1px solid ${D.indigoBorder}`,
        boxShadow: "0 0 24px rgba(99,102,241,0.08)",
      }}
      aria-label="Dnešok"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
            boxShadow: "0 0 10px rgba(99,102,241,0.35)",
          }}
        >
          <Calendar className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="text-sm font-semibold" style={{ color: D.text }}>
          Dnešok
        </h3>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {chips.map((c) => {
          const Icon = c.Icon;
          return (
            <div
              key={c.label}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[0.7rem] font-medium"
              style={{
                background: "rgba(99,102,241,0.06)",
                border: `1px solid ${D.indigoBorder}`,
                color: D.text,
              }}
            >
              <Icon className="w-3 h-3" style={{ color: c.color }} />
              {c.label}
            </div>
          );
        })}
      </div>

      {/* Tasks */}
      {tasks.length === 0 ? (
        <div
          className="rounded-xl px-3.5 py-5 text-center text-xs"
          style={{
            background: "rgba(99,102,241,0.04)",
            border: `1px dashed ${D.indigoBorder}`,
            color: D.muted,
          }}
        >
          Dnes nič nečaká. Pridaj úlohu cez AI chat.
        </div>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {tasks.map((t) => (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, transition: { duration: 0.18 } }}
                transition={{ duration: 0.22 }}
                className="flex items-center gap-3 px-2.5 py-2 rounded-xl"
                style={{
                  background: "rgba(99,102,241,0.04)",
                  border: `1px solid ${D.indigoBorder}`,
                }}
              >
                <button
                  onClick={() => handleToggle(t.id)}
                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    border: `1px solid ${D.indigoBorder}`,
                  }}
                  aria-label={`Označiť úlohu ${t.title} ako splnenú`}
                  title="Označiť ako splnené"
                >
                  <Check
                    className="w-3 h-3 opacity-0 hover:opacity-100 transition-opacity"
                    style={{ color: D.emerald }}
                    strokeWidth={3}
                  />
                </button>
                <div
                  className="text-[0.7rem] font-mono w-10 flex-shrink-0 tabular-nums"
                  style={{ color: D.muted }}
                >
                  {t.time ?? "—"}
                </div>
                <div className="flex-1 min-w-0 text-xs truncate" style={{ color: D.text }}>
                  {t.title}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.section>
  );
}

// Slovak-style 1/2-4/5+ plural picker.
function pluralize(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}
