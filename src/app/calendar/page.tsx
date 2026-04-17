"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, Clock, X, Trash2, Check, Loader2,
  CalendarDays, Search, LayoutGrid, Rows3,
} from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import EmptyIllustration from "@/components/ui/EmptyIllustration";

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
function isoFromDate(d: Date) { return toISO(d.getFullYear(), d.getMonth(), d.getDate()); }
function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Get Monday of the week containing `d` (Europe/SK convention — week starts Monday).
function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const day = out.getDay();          // 0 = Sun, 1 = Mon, …, 6 = Sat
  const diff = day === 0 ? -6 : 1 - day;
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

type ViewMode = "month" | "week";

export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarPageInner />
    </Suspense>
  );
}

function CalendarPageInner() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [dragOverIso, setDragOverIso] = useState<string | null>(null);

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

  // URL param handlers — ?new=1 opens add modal, ?focus=<id> selects task
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (!searchParams) return;
    if (searchParams.get("new") === "1") {
      setShowModal(true);
      router.replace("/calendar");
    }
  }, [searchParams, router]);
  useEffect(() => {
    const focusId = searchParams?.get("focus");
    if (!focusId || tasks.length === 0) return;
    const t = tasks.find((x) => x.id === focusId);
    if (t) {
      setSelectedTask(t);
      router.replace("/calendar");
    }
  }, [searchParams, tasks, router]);

  const firstDay = new Date(year, month, 1).getDay();
  const startingDay = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const filteredTasks = useMemo(() => {
    const q = norm(searchQuery.trim());
    if (!q) return tasks;
    return tasks.filter((t) =>
      norm(t.title).includes(q) || norm(t.description ?? "").includes(q)
    );
  }, [tasks, searchQuery]);

  const getTasksForDay = useCallback((day: number): Task[] => {
    const iso = toISO(year, month, day);
    return filteredTasks.filter((t) => t.date === iso).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  }, [filteredTasks, year, month]);

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

  // Drag-n-drop reschedule: move task to a new date. Optimistic update + rollback on fail.
  async function moveTaskToDate(taskId: string, newDate: string) {
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.date === newDate) return;
    // Optimistic UI.
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, date: newDate } : t));
    try {
      const res = await fetch("/api/calendar/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, date: newDate }),
      });
      if (!res.ok) throw new Error("patch failed");
      toast.success(`Presunuté na ${newDate}`);
    } catch {
      // Rollback.
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, date: current.date } : t));
      toast.error("Presun zlyhal");
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, iso: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIso(iso);
  };

  const handleDrop = (e: React.DragEvent, iso: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    setDragOverIso(null);
    if (taskId) moveTaskToDate(taskId, iso);
  };

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
    return filteredTasks
      .filter((t) => t.date >= todayISO && !t.done)
      .sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")))
      .slice(0, 5);
  }, [filteredTasks, today]);

  return (
    <AppLayout title="Kalendár">
      <div className="flex flex-col lg:flex-row h-full p-4 md:p-6 gap-4 md:gap-6">
        {/* ── Calendar grid ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 md:mb-6 flex-wrap gap-2">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => {
                  if (viewMode === "month") setCurrentDate(new Date(year, month - 1, 1));
                  else { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }
                }}
                className="p-2 rounded-xl transition-colors"
                style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}` }}
                aria-label="Predchádzajúci"
              >
                <ChevronLeft className="w-5 h-5" style={{ color: D.text }} />
              </button>
              <h2 className="text-lg md:text-2xl font-bold" style={{ color: D.text }}>
                {viewMode === "month"
                  ? `${MONTHS[month]} ${year}`
                  : (() => {
                      const s = startOfWeek(currentDate);
                      const e = new Date(s); e.setDate(e.getDate() + 6);
                      const sameMonth = s.getMonth() === e.getMonth();
                      return sameMonth
                        ? `${s.getDate()}. – ${e.getDate()}. ${MONTHS[s.getMonth()]}`
                        : `${s.getDate()}. ${MONTHS[s.getMonth()].slice(0,3)} – ${e.getDate()}. ${MONTHS[e.getMonth()].slice(0,3)}`;
                    })()}
              </h2>
              <button
                onClick={() => {
                  if (viewMode === "month") setCurrentDate(new Date(year, month + 1, 1));
                  else { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }
                }}
                className="p-2 rounded-xl transition-colors"
                style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}` }}
                aria-label="Nasledujúci"
              >
                <ChevronRight className="w-5 h-5" style={{ color: D.text }} />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hidden sm:inline-block"
                style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.muted }}
              >
                Dnes
              </button>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div
                className="flex items-center p-0.5 rounded-xl"
                style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}` }}
              >
                <button
                  onClick={() => setViewMode("month")}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                  style={{
                    background: viewMode === "month" ? D.indigo : "transparent",
                    color: viewMode === "month" ? "white" : D.muted,
                  }}
                  aria-pressed={viewMode === "month"}
                  title="Mesiac"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mesiac</span>
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className="px-2 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                  style={{
                    background: viewMode === "week" ? D.indigo : "transparent",
                    color: viewMode === "week" ? "white" : D.muted,
                  }}
                  aria-pressed={viewMode === "week"}
                  title="Týždeň"
                >
                  <Rows3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Týždeň</span>
                </button>
              </div>
              <div className="relative hidden md:block">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                  style={{ color: D.muted }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hľadať úlohy..."
                  className="pl-8 pr-3 py-2 rounded-xl text-sm outline-none w-48 lg:w-56"
                  style={{
                    background: D.indigoDim,
                    border: `1px solid ${D.indigoBorder}`,
                    color: D.text,
                  }}
                />
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
          </div>

          {viewMode === "month" ? (
            <>
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
                  const iso = toISO(year, month, day);
                  const dayTasks = getTasksForDay(day);
                  const isToday =
                    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                  const isDragOver = dragOverIso === iso;
                  return (
                    <motion.div
                      key={day}
                      onDragOver={(e) => handleDragOver(e, iso)}
                      onDragLeave={() => setDragOverIso((v) => v === iso ? null : v)}
                      onDrop={(e) => handleDrop(e, iso)}
                      className="aspect-square rounded-lg md:rounded-xl p-1 md:p-2 cursor-pointer relative overflow-hidden"
                      style={{
                        background: isDragOver
                          ? "rgba(139,92,246,0.25)"
                          : isToday ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.05)",
                        border: `1px solid ${isDragOver ? D.violet : isToday ? D.indigo : D.indigoBorder}`,
                      }}
                      whileHover={{ background: "rgba(99,102,241,0.1)" }}
                      onClick={() => {
                        if (dayTasks.length > 0) setSelectedTask(dayTasks[0]);
                        else {
                          setForm((f) => ({ ...f, date: iso }));
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
                            draggable
                            onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, t.id); }}
                            onClick={(e) => { e.stopPropagation(); setSelectedTask(t); }}
                            className="text-[9px] md:text-[10px] truncate px-1 py-0.5 rounded cursor-grab active:cursor-grabbing"
                            style={{
                              background: t.done ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.25)",
                              color: t.done ? D.emerald : "#a5b4fc",
                              textDecoration: t.done ? "line-through" : "none",
                            }}
                            title={t.title}
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
            </>
          ) : (
            // ── Week view ──────────────────────────────────────────
            (() => {
              const weekStart = startOfWeek(currentDate);
              const days = Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(weekStart);
                d.setDate(weekStart.getDate() + i);
                return d;
              });
              const DAY_LABELS = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];
              return (
                <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                  {days.map((d, i) => {
                    const iso = isoFromDate(d);
                    const dayTasks = filteredTasks
                      .filter((t) => t.date === iso)
                      .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
                    const isTodayCell = iso === isoFromDate(today);
                    const isDragOver = dragOverIso === iso;
                    return (
                      <div
                        key={iso}
                        onDragOver={(e) => handleDragOver(e, iso)}
                        onDragLeave={() => setDragOverIso((v) => v === iso ? null : v)}
                        onDrop={(e) => handleDrop(e, iso)}
                        className="rounded-xl p-2 min-h-[280px] flex flex-col"
                        style={{
                          background: isDragOver
                            ? "rgba(139,92,246,0.18)"
                            : isTodayCell ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.05)",
                          border: `1px solid ${isDragOver ? D.violet : isTodayCell ? D.indigo : D.indigoBorder}`,
                        }}
                      >
                        <div className="flex items-baseline justify-between mb-2 pb-1.5"
                          style={{ borderBottom: `1px solid ${D.indigoBorder}` }}>
                          <span className="text-[0.65rem] font-medium uppercase tracking-wider" style={{ color: D.muted }}>
                            {DAY_LABELS[i]}
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{ color: isTodayCell ? D.indigo : D.text }}
                          >
                            {d.getDate()}.
                          </span>
                        </div>
                        <div className="flex-1 space-y-1.5 overflow-y-auto">
                          {dayTasks.length === 0 ? (
                            <button
                              onClick={() => {
                                setForm((f) => ({ ...f, date: iso }));
                                setShowModal(true);
                              }}
                              className="w-full text-[0.65rem] py-2 rounded opacity-50 hover:opacity-100 transition-opacity"
                              style={{ color: D.mutedDark, background: "transparent", border: `1px dashed ${D.indigoBorder}` }}
                            >
                              + pridať
                            </button>
                          ) : dayTasks.map((t) => (
                            <div
                              key={t.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, t.id)}
                              onClick={() => setSelectedTask(t)}
                              className="px-2 py-1.5 rounded-lg text-xs cursor-grab active:cursor-grabbing transition-all"
                              style={{
                                background: t.done ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.2)",
                                border: `1px solid ${t.done ? "rgba(16,185,129,0.3)" : D.indigoBorder}`,
                                color: t.done ? D.emerald : "#c4b5fd",
                              }}
                            >
                              {t.time && (
                                <div className="text-[0.6rem] font-semibold mb-0.5" style={{ color: D.muted }}>
                                  {t.time}
                                </div>
                              )}
                              <div
                                className="font-medium leading-tight"
                                style={{ textDecoration: t.done ? "line-through" : "none" }}
                              >
                                {t.title}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
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
              <EmptyIllustration
                variant="calendar"
                size={96}
                title="Nič nie je vybrané"
                hint="Klikni na deň alebo úlohu v zozname."
              />
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
