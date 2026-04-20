"use client";
// src/components/ui/ActivityTimeline.tsx
// 7-day activity bar chart — four metrics per day (contacts, tasks,
// tasksDone, aiMessages). Pure flex/divs, no chart library. Hover a day
// column to see the breakdown tooltip.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

const D = {
  indigo:       "#6366f1",
  violet:       "#8b5cf6",
  sky:          "#38bdf8",
  emerald:      "#10b981",
  text:         "#eef2ff",
  muted:        "#94a3b8",
  indigoBorder: "rgba(99,102,241,0.22)",
};

interface DayRow {
  date: string;
  contacts: number;
  tasks: number;
  tasksDone: number;
  aiMessages: number;
}

// Per-metric render config. Keep keys aligned with DayRow fields.
const METRICS: { key: keyof Omit<DayRow, "date">; label: string; color: string }[] = [
  { key: "contacts",   label: "kontakty",       color: D.indigo },
  { key: "tasks",      label: "úlohy",          color: D.violet },
  { key: "tasksDone",  label: "splnené úlohy",  color: D.emerald },
  { key: "aiMessages", label: "AI správy",      color: D.sky },
];

function formatDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("sk-SK", {
    weekday: "short",
    day: "numeric",
    month: "numeric",
    timeZone: "UTC",
  });
}

export default function ActivityTimeline() {
  const [data, setData] = useState<DayRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/activity?days=7");
        if (!res.ok) return;
        const json = (await res.json()) as DayRow[];
        if (!cancelled) setData(json);
      } catch {
        // Silent.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading || !data) return null;

  const totals = data.reduce(
    (acc, d) => ({
      contacts: acc.contacts + d.contacts,
      tasks: acc.tasks + d.tasks,
      tasksDone: acc.tasksDone + d.tasksDone,
      aiMessages: acc.aiMessages + d.aiMessages,
    }),
    { contacts: 0, tasks: 0, tasksDone: 0, aiMessages: 0 },
  );

  const allZero = !data.some((d) => d.contacts + d.tasks + d.tasksDone + d.aiMessages > 0);

  // Max single-metric value across all days = Y-axis max, so tall values
  // don't squash shorter metrics to invisibility.
  const peak = Math.max(
    1,
    ...data.flatMap((d) => [d.contacts, d.tasks, d.tasksDone, d.aiMessages]),
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: "linear-gradient(135deg, rgba(56,189,248,0.06), rgba(99,102,241,0.06))",
        border: `1px solid ${D.indigoBorder}`,
        boxShadow: "0 0 24px rgba(99,102,241,0.08)",
      }}
      aria-label="Aktivita za posledných 7 dní"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg,${D.sky},${D.indigo})`,
              boxShadow: "0 0 10px rgba(56,189,248,0.35)",
            }}
          >
            <Activity className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: D.text }}>
            Aktivita (7 dní)
          </h3>
        </div>
      </div>

      {/* Totals line */}
      <p className="text-[0.65rem] mb-4" style={{ color: D.muted }}>
        {totals.contacts} nových kontaktov · {totals.tasks} úloh · {totals.aiMessages} AI správ
      </p>

      {allZero ? (
        <div
          className="rounded-xl px-3.5 py-5 text-center text-xs"
          style={{
            background: "rgba(99,102,241,0.04)",
            border: `1px dashed ${D.indigoBorder}`,
            color: D.muted,
          }}
        >
          Zatiaľ žiadna aktivita. Začni pridávať kontakty a úlohy.
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="relative">
            <div className="flex items-end gap-1.5 h-24">
              {data.map((d, i) => {
                const isHover = hoverIdx === i;
                return (
                  <div
                    key={d.date}
                    className="flex-1 flex items-end gap-0.5 h-full relative cursor-default"
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx((prev) => (prev === i ? null : prev))}
                    aria-label={`${formatDay(d.date)}: ${d.contacts} kontakty, ${d.tasks} úloh, ${d.tasksDone} splnené, ${d.aiMessages} AI`}
                  >
                    {METRICS.map((m) => {
                      const v = d[m.key];
                      const h = Math.round((v / peak) * 100);
                      return (
                        <div
                          key={m.key}
                          className="flex-1 rounded-t-sm min-h-[2px] transition-all"
                          style={{
                            height: `${h}%`,
                            background: v > 0 ? m.color : "rgba(99,102,241,0.08)",
                            opacity: isHover ? 1 : 0.8,
                            boxShadow: isHover && v > 0 ? `0 0 8px ${m.color}` : "none",
                          }}
                        />
                      );
                    })}

                    {/* Tooltip */}
                    {isHover && (
                      <div
                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[0.65rem] pointer-events-none"
                        style={{
                          background: "rgba(10,12,24,0.96)",
                          border: `1px solid ${D.indigoBorder}`,
                          color: D.text,
                          boxShadow: "0 6px 20px rgba(0,0,0,0.45)",
                        }}
                      >
                        <div className="font-semibold mb-1">{formatDay(d.date)}</div>
                        <div className="space-y-0.5" style={{ color: D.muted }}>
                          <div><span style={{ color: D.indigo }}>●</span> {d.contacts} kontakty</div>
                          <div><span style={{ color: D.violet }}>●</span> {d.tasks} úlohy</div>
                          <div><span style={{ color: D.emerald }}>●</span> {d.tasksDone} splnené</div>
                          <div><span style={{ color: D.sky }}>●</span> {d.aiMessages} AI</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex gap-1.5 mt-1.5">
              {data.map((d) => (
                <div
                  key={d.date}
                  className="flex-1 text-center text-[0.6rem]"
                  style={{ color: D.muted }}
                >
                  {formatDay(d.date).split(" ")[0]}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
            {METRICS.map((m) => (
              <div key={m.key} className="flex items-center gap-1 text-[0.6rem]" style={{ color: D.muted }}>
                <span
                  className="inline-block w-2 h-2 rounded-sm"
                  style={{ background: m.color }}
                />
                {m.label}
              </div>
            ))}
          </div>
        </>
      )}
    </motion.section>
  );
}
