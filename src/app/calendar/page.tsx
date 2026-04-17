"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, Clock, X, Trash2, Check, Loader2,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";

interface Task {
  id: string;
  title: string;
  description: string | null;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  done: boolean;
  createdAt: string;
}

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  emerald: "#10b981",
  indigoBorder: "rgba(99,102,241,0.22)",
  indigoDim: "rgba(99,102,241,0.08)",
  text: "#eef2ff",
  muted: "#94a3b8",
  mutedDark: "#64748b",
};

const MONTHS = [
  "Január", "Február", "Marec", "Apríl", "Máj", "Jún",
  "Júl", "August", "September", "Október", "November", "December",
];

function pad(n: number) { return String(n).padStart(2, "0"); }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = useMemo(() => new Date(), []);

  const [form, setForm] = useState({
    title: "",
    date: toISO(today.getFullYear(), today.getMonth(), today.getDate()),
    time: "",
    description: "",
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch {
      toast.error("Nepodarilo sa načítať úlohy");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const firstDay = new Date(year, month, 1).getDay();
  const startingDay = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getTasksForDay = useCallback((day: number): Task[] => {
    const iso = toISO(year, month, day);
    return tasks.filter((t) => t.date === iso).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  }, [tasks, year, month]);

  async function handleAdd() {
    if (!form.title.trim()) {
      toast.error("Názov úlohy je povinný");
      return;
    }
    if (!form.date) {
      toast.error("Dátum je povinný");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/calendar/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          date: form.date,
          time: form.time.trim() || undefined,
          description: form.description.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Úloha pridaná");
        setForm({ title: "", date: form.date, time: "", description: "" });
        setShowModal(false);
        loadTasks();
      } else {
        toast.error("Nepodarilo sa pridať");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleDone(task: Task) {
    try {
      const res = await fetch("/api/calendar/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, done: !task.done }),
      });
      if (res.ok) {
        setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, done: !t.done } : t));
        if (selectedTask?.id === task.id) setSelectedTask({ ...task, done: !task.done });
      }
    } catch {
      toast.error("Nepodarilo sa aktualizovať");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Naozaj zmazať úlohu?")) return;
    try {
      const res = await fetch("/api/calendar/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("Úloha zmazaná");
        if (selectedTask?.id === id) setSelectedTask(null);
        loadTasks();
      }
    } catch {
      toast.error("Nepodarilo sa zmazať");
    }
  }

  const upcoming = useMemo(() => {
    const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());
    return tasks
      .filter((t) => t.date >= todayISO && !t.done)
      .sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")))
      .slice(0, 5);
  }, [tasks, today]);

  return (
    <AppLayout title="Kalendár">
      <div className="flex flex-col lg:flex-row h-full p-4 md:p-6 gap-4 md:gap-6">
        {/* ── Calendar grid ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-2 rounded-xl transition-colors"
                style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}` }}
              >
                <ChevronLeft className="w-5 h-5" style={{ color: D.text }} />
              </button>
              <h2 className="text-lg md:text-2xl font-bold" style={{ color: D.text }}>
                {MONTHS[month]} {year}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-2 rounded-xl transition-colors"
                style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}` }}
              >
                <ChevronRight className="w-5 h-5" style={{ color: D.text }} />
              </button>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-3 md:px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium"
              style={{ background: D.indigo, color: "white" }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nová úloha</span>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Po", "Ut", "St", "Št", "Pi", "So", "Ne"].map((day) => (
              <div key={day} className="text-center py-2 text-xs md:text-sm font-medium" style={{ color: D.muted }}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startingDay }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square rounded-lg md:rounded-xl"
                style={{ background: "rgba(99,102,241,0.02)", border: `1px solid ${D.indigoBorder}` }}
              />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayTasks = getTasksForDay(day);
              const isToday =
                today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              return (
                <motion.div
                  key={day}
                  className="aspect-square rounded-lg md:rounded-xl p-1 md:p-2 cursor-pointer relative overflow-hidden"
                  style={{
                    background: isToday ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.05)",
                    border: `1px solid ${isToday ? D.indigo : D.indigoBorder}`,
                  }}
                  whileHover={{ background: "rgba(99,102,241,0.1)" }}
                  onClick={() => {
                    if (dayTasks.length > 0) setSelectedTask(dayTasks[0]);
                    else {
                      setForm((f) => ({ ...f, date: toISO(year, month, day) }));
                      setShowModal(true);
                    }
                  }}
                >
                  <span
                    className="text-xs md:text-sm font-medium"
                    style={{ color: isToday ? D.indigo : D.text }}
                  >
                    {day}
                  </span>
                  <div className="mt-0.5 md:mt-1 space-y-0.5 md:space-y-1">
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className="text-[9px] md:text-[10px] truncate px-1 py-0.5 rounded"
                        style={{
                          background: t.done ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.25)",
                          color: t.done ? D.emerald : "#a5b4fc",
                          textDecoration: t.done ? "line-through" : "none",
                        }}
                      >
                        {t.time ?? t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-[9px] md:text-[10px]" style={{ color: D.muted }}>
                        +{dayTasks.length - 2}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Side panel: upcoming + detail ── */}
        <div className="w-full lg:w-[340px] flex flex-col gap-4 flex-shrink-0">
          {/* Upcoming */}
          <div
            className="rounded-2xl p-4 md:p-5"
            style={{ background: "rgba(99,102,241,0.05)", border: `1px solid ${D.indigoBorder}` }}
          >
            <h3 className="font-semibold mb-3 text-sm md:text-base" style={{ color: D.text }}>
              Nadchádzajúce
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: D.muted }} />
              </div>
            ) : upcoming.length === 0 ? (
              <p className="text-xs" style={{ color: D.mutedDark }}>Žiadne nadchádzajúce úlohy.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((t) => (
                  <li
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="p-2 rounded-lg cursor-pointer"
                    style={{
                      background: selectedTask?.id === t.id
                        ? "rgba(99,102,241,0.15)"
                        : "rgba(99,102,241,0.04)",
                      border: `1px solid ${selectedTask?.id === t.id ? D.indigoBorder : "transparent"}`,
                    }}
                  >
                    <p className="text-sm truncate" style={{ color: D.text }}>{t.title}</p>
                    <p className="text-[10px]" style={{ color: D.muted }}>
                      {t.date}{t.time ? ` • ${t.time}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Detail */}
          <div
            className="rounded-2xl p-4 md:p-5 flex-1"
            style={{ background: "rgba(99,102,241,0.05)", border: `1px solid ${D.indigoBorder}` }}
          >
            <h3 className="font-semibold mb-3 text-sm md:text-base" style={{ color: D.text }}>Detail</h3>
            {selectedTask ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-medium flex-1" style={{ color: D.text }}>{selectedTask.title}</h4>
                  <button
                    onClick={() => handleDelete(selectedTask.id)}
                    className="p-1.5 rounded-lg"
                    style={{ color: D.muted }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = D.muted)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: D.muted }}>
                  <Clock className="w-4 h-4" />
                  <span>{selectedTask.date}{selectedTask.time ? ` o ${selectedTask.time}` : ""}</span>
                </div>
                {selectedTask.description && (
                  <div
                    className="p-3 rounded-xl text-sm"
                    style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                  >
                    {selectedTask.description}
                  </div>
                )}
                <button
                  onClick={() => toggleDone(selectedTask)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
                  style={
                    selectedTask.done
                      ? { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: D.emerald }
                      : { background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }
                  }
                >
                  <Check className="w-4 h-4" />
                  {selectedTask.done ? "Hotovo" : "Označiť ako hotové"}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="w-10 h-10 mx-auto mb-3" style={{ color: D.mutedDark }} />
                <p className="text-xs" style={{ color: D.muted }}>Vyber úlohu alebo klikni na deň</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => !saving && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "#0a0d1a", border: `1px solid ${D.indigoBorder}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: D.text }}>Nová úloha</h2>
                <button onClick={() => setShowModal(false)} disabled={saving} className="p-1">
                  <X className="w-5 h-5" style={{ color: D.muted }} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: D.muted }}>Názov *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Konzultácia: hypotéka"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: D.muted }}>Dátum *</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text, colorScheme: "dark" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: D.muted }}>Čas</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                      style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text, colorScheme: "dark" }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: D.muted }}>Poznámka</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Voliteľné detaily..."
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                    style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                >
                  Zrušiť
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving || !form.title.trim() || !form.date}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg,${D.indigo},${D.violet})`, color: "white" }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Uložiť
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
