"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, Clock, X, Trash2, Check, Loader2,
  CalendarDays, Search, LayoutGrid, Rows3, Pencil, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { confirmWithUndo } from "@/lib/undoable";
import AppLayout from "@/components/layout/AppLayout";
import EmptyIllustration from "@/components/ui/EmptyIllustration";
import ShareButton from "@/components/ui/ShareButton";
import CalendarConnectBanner from "@/components/calendar/CalendarConnectBanner";
import { track } from "@/lib/analytics";

interface Task {
  id: string;
  title: string;
  description: string | null;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  done: boolean;
  createdAt: string;
  // When set, this row originated from Google Calendar — we show it
  // with a different accent and disable edit/delete.
  googleEventId?: string;
  htmlLink?: string;
  calendarName?: string;
  calendarColor?: string;
}

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  emerald: "#10b981",
  indigoBorder: "var(--app-border)",
  indigoDim: "rgba(99,102,241,0.08)",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "var(--app-text-subtle)",
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
  const [selectedDay, setSelectedDay] = useState<string | null>(null); // ISO day for the detail drawer
  const [showModal, setShowModal] = useState(false);
  // Task being edited in the modal. null = add new. Works for both
  // local CalendarTask rows and Google events (g:-prefixed id).
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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
      // Local tasks + remote events in parallel. The remote source is
      // resolved server-side from user.calendarProvider — could be
      // Google, Microsoft, or Apple. /api/calendar/events handles the
      // routing; UI doesn't need to care which provider is in play.
      const [tasksRes, gcalRes] = await Promise.all([
        fetch("/api/calendar/tasks"),
        fetch("/api/calendar/events").catch(() => null),
      ]);
      const local: Task[] = tasksRes.ok ? await tasksRes.json() : [];
      let google: Task[] = [];
      if (gcalRes && gcalRes.ok) {
        const json = (await gcalRes.json()) as {
          events?: Array<{
            id: string;
            summary: string;
            description?: string;
            start: string;
            end: string;
            htmlLink?: string;
            allDay: boolean;
            calendarName?: string;
            calendarColor?: string;
          }>;
        };
        google = (json.events ?? []).map((e) => {
          // Google gives us ISO datetime (all-day = date only). We
          // want YYYY-MM-DD + HH:MM for the existing grid logic.
          const isAllDay = e.allDay || !/T/.test(e.start);
          const date = e.start.slice(0, 10);
          const time = isAllDay ? null : e.start.slice(11, 16);
          return {
            id: `g:${e.id}`,
            title: e.summary ?? "(bez názvu)",
            description: e.description ?? null,
            date,
            time,
            done: false,
            createdAt: e.start,
            googleEventId: e.id,
            htmlLink: e.htmlLink,
            calendarName: e.calendarName,
            calendarColor: e.calendarColor,
          };
        });
      }
      setTasks([...local, ...google]);
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
      setEditingTask(null);
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

  // Open the add/edit modal. Pre-fills the form from `task` for edits;
  // when task is null, uses the current form.date so "+ pridať" on a
  // given day lands you on that day.
  function openEdit(task: Task | null, dateHint?: string) {
    setEditingTask(task);
    if (task) {
      setForm({
        title: task.title,
        date: task.date,
        time: task.time ?? "",
        description: task.description ?? "",
      });
    } else {
      setForm({
        title: "",
        date: dateHint ?? form.date,
        time: "",
        description: "",
      });
    }
    setShowModal(true);
  }

  async function handleSave() {
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
      // Editing an existing task/event → PATCH to the right endpoint.
      if (editingTask) {
        if (editingTask.googleEventId) {
          // Google: build start/end ISO. All-day when time is empty.
          const allDay = !form.time.trim();
          const newStart = allDay ? form.date : `${form.date}T${form.time}:00`;
          // Preserve duration from the current event when we know it;
          // otherwise default to 1h for timed, same-day for all-day.
          const durationMs =
            editingTask.time && editingTask.date
              ? 60 * 60 * 1000
              : 60 * 60 * 1000;
          const endDt = allDay
            ? form.date
            : new Date(
                new Date(`${form.date}T${form.time}:00`).getTime() + durationMs,
              ).toISOString();
          const res = await fetch(
            `/api/gcal/event/${encodeURIComponent(editingTask.googleEventId)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                summary: form.title.trim(),
                description: form.description.trim() || undefined,
                start: newStart,
                end: endDt,
                allDay,
              }),
            },
          );
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.hint ?? data.error ?? "patch failed");
          }
          toast.success("Uložené v Google Kalendári.");
        } else {
          const res = await fetch("/api/calendar/tasks", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: editingTask.id,
              title: form.title.trim(),
              date: form.date,
              time: form.time.trim() || null,
              description: form.description.trim() || null,
            }),
          });
          if (!res.ok) throw new Error("patch failed");
          toast.success("Úloha upravená");
        }
      } else {
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
        if (!res.ok) throw new Error("post failed");
        track("task_created");
        toast.success("Úloha pridaná");
      }
      setForm({ title: "", date: form.date, time: "", description: "" });
      setShowModal(false);
      setEditingTask(null);
      // Close the selected-task detail only when we just edited it.
      if (editingTask && selectedTask?.id === editingTask.id) {
        setSelectedTask(null);
      }
      loadTasks();
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Nepodarilo sa uložiť");
    } finally {
      setSaving(false);
    }
  }

  async function toggleDone(task: Task) {
    if (task.googleEventId) {
      // Google events are read-only here. User should complete them in
      // Google Calendar (or click the external-link icon).
      toast.info("Udalosť z Google Kalendára uprav priamo v Googli.");
      return;
    }
    try {
      const res = await fetch("/api/calendar/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, done: !task.done }),
      });
      if (res.ok) {
        if (!task.done) track("task_completed");
        setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, done: !t.done } : t));
        if (selectedTask?.id === task.id) setSelectedTask({ ...task, done: !task.done });
      }
    } catch {
      toast.error("Nepodarilo sa aktualizovať");
    }
  }

  // Drag-n-drop reschedule: move task to a new date. Optimistic update + rollback on fail.
  // Handles both local CalendarTask rows and Google Calendar events —
  // prefix `g:` routes through /api/gcal/event/:id.
  async function moveTaskToDate(taskId: string, newDate: string) {
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.date === newDate) return;
    // Optimistic UI.
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, date: newDate } : t));
    try {
      if (current.googleEventId) {
        // Google expects ISO datetime for timed events, date-only for all-day.
        const gcalId = current.googleEventId; // "calendarId::eventId" already
        const allDay = !current.time;
        const newStart = allDay ? newDate : `${newDate}T${current.time}:00`;
        // Preserve original duration if known; fall back to +1h for timed events.
        const durationMs = 60 * 60 * 1000;
        const endStart = new Date(`${newDate}T${current.time ?? "00:00"}:00`).getTime();
        const newEnd = allDay ? newDate : new Date(endStart + durationMs).toISOString();
        const res = await fetch(`/api/gcal/event/${encodeURIComponent(gcalId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start: newStart, end: newEnd, allDay }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.hint ?? data.error ?? "patch failed");
        }
      } else {
        const res = await fetch("/api/calendar/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: taskId, date: newDate }),
        });
        if (!res.ok) throw new Error("patch failed");
      }
      toast.success(`Presunuté na ${newDate}`);
    } catch (e) {
      // Rollback.
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, date: current.date } : t));
      toast.error(e instanceof Error ? e.message : "Presun zlyhal");
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
    // Google event → route through gcal delete. Local task → normal API.
    if (id.startsWith("g:")) {
      const current = tasks.find((t) => t.id === id);
      const gcalId = current?.googleEventId;
      if (!gcalId) return;
      if (!confirm("Zmazať túto udalosť aj v Google Kalendári?")) return;
      const snapshot = tasks;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (selectedTask?.id === id) setSelectedTask(null);
      try {
        const res = await fetch(`/api/gcal/event/${encodeURIComponent(gcalId)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error();
        toast.success("Zmazané v Google Kalendári.");
      } catch {
        setTasks(snapshot);
        toast.error("Mazanie zlyhalo");
      }
      return;
    }
    const snapshot = tasks;
    const wasSelected = selectedTask?.id === id;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (wasSelected) setSelectedTask(null);

    confirmWithUndo({
      message: "Úloha zmazaná",
      commit: async () => {
        const res = await fetch("/api/calendar/tasks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error("Delete failed");
      },
      onUndo: () => setTasks(snapshot),
    });
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
      <div className="flex flex-col lg:flex-row h-full p-3 md:p-5 gap-3 md:gap-5">
        {/* ── Calendar grid ── */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {/* Banner appears only when no calendar provider is linked.
              Independent from email — user can connect any of the
              three (Google / Outlook / iCloud) here. */}
          <CalendarConnectBanner />
          {/* Compact one-line legend on top, inline to save vertical
              space. Owner flagged that the grid didn't fit on screen. */}
          <CalendarLegend />
          <div className="flex items-center justify-between mb-2 md:mb-3 flex-wrap gap-2 flex-shrink-0">
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
              {/* View toggle — segmented pill so both buttons visible
                  in light mode too. Active uses brand gradient. */}
              <div
                className="flex items-center p-0.5 rounded-xl"
                style={{ background: "var(--app-surface-2)", border: "1px solid var(--app-border)" }}
              >
                <button
                  onClick={() => setViewMode("month")}
                  data-press
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  style={{
                    background: viewMode === "month" ? "var(--brand-gradient)" : "transparent",
                    color: viewMode === "month" ? "#fff" : "var(--app-text-muted)",
                    boxShadow: viewMode === "month" ? "0 0 10px rgba(139,92,246,0.35)" : "none",
                  }}
                  aria-pressed={viewMode === "month"}
                  title="Mesiac"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mesiac</span>
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  data-press
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  style={{
                    background: viewMode === "week" ? "var(--brand-gradient)" : "transparent",
                    color: viewMode === "week" ? "#fff" : "var(--app-text-muted)",
                    boxShadow: viewMode === "week" ? "0 0 10px rgba(139,92,246,0.35)" : "none",
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
                onClick={() => openEdit(null)}
                className="px-3 md:px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium"
                style={{ background: D.indigo, color: "white" }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nová úloha</span>
              </button>
            </div>
          </div>

          {viewMode === "month" ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="grid grid-cols-7 gap-1 mb-1 flex-shrink-0">
                {["Po", "Ut", "St", "Št", "Pi", "So", "Ne"].map((day) => (
                  <div key={day} className="text-center py-1 text-[10px] md:text-xs font-semibold uppercase tracking-wider" style={{ color: D.mutedDark }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid fills all remaining vertical space. Each row is
                  an equal fraction of the container height — cells
                  shrink on laptops, grow on big screens, never overflow. */}
              <div
                className="grid grid-cols-7 gap-1 flex-1 min-h-0"
                style={{
                  gridAutoRows: "minmax(0, 1fr)",
                }}
              >
                {Array.from({ length: startingDay }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="rounded-lg"
                    style={{
                      background: "transparent",
                      border: `1px dashed ${D.indigoBorder}`,
                    }}
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
                      className="rounded-lg p-1 md:p-1.5 cursor-pointer relative overflow-hidden flex flex-col"
                      style={{
                        // Row uses minmax(0, 1fr) so this h-auto fills
                        // exactly 1/6 of the grid's vertical space —
                        // calendar always fits on one screen.
                        minHeight: 0,
                        background: isDragOver
                          ? "rgba(139,92,246,0.25)"
                          : isToday
                          ? "rgba(99,102,241,0.14)"
                          : "var(--app-surface-2)",
                        border: `1px solid ${isDragOver ? D.violet : isToday ? D.indigo : D.indigoBorder}`,
                      }}
                      whileHover={{ background: "rgba(99,102,241,0.1)" }}
                      onClick={() => {
                        // Clicking the cell (not a specific task pill)
                        // always opens the day-detail drawer. User can
                        // see every task/event for that day, click one
                        // to edit, or hit "Pridať" to add another.
                        setSelectedDay(iso);
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="inline-flex items-center justify-center rounded-full w-5 h-5 text-[10px] md:text-[11px] font-bold"
                          style={{
                            background: isToday ? D.indigo : "transparent",
                            color: isToday ? "white" : D.text,
                          }}
                        >
                          {day}
                        </span>
                        {dayTasks.length > 0 && (
                          <span className="text-[9px]" style={{ color: D.mutedDark }}>
                            {dayTasks.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5 flex-1">
                        {dayTasks.slice(0, 3).map((t) => {
                          const isGoogle = !!t.googleEventId;
                          const accent = t.done
                            ? "#10b981"
                            : isGoogle
                            ? (t.calendarColor ?? "#0ea5e9") // sky-500 for Google
                            : "#8b5cf6"; // violet for local tasks
                          return (
                            <div
                              key={t.id}
                              draggable
                              onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, t.id); }}
                              onClick={(e) => { e.stopPropagation(); setSelectedTask(t); }}
                              className="text-[10px] md:text-[11px] truncate px-1.5 py-0.5 rounded flex items-center gap-1"
                              style={{
                                background: `${accent}22`,
                                borderLeft: `2px solid ${accent}`,
                                color: t.done ? accent : D.text,
                                textDecoration: t.done ? "line-through" : "none",
                                cursor: "grab",
                              }}
                              title={`${t.time ? t.time + " · " : ""}${t.title}${t.calendarName ? " · " + t.calendarName : ""}`}
                            >
                              {t.time && (
                                <span className="font-semibold flex-shrink-0" style={{ color: accent, opacity: 0.9 }}>
                                  {t.time}
                                </span>
                              )}
                              <span className="truncate">{t.title}</span>
                            </div>
                          );
                        })}
                        {dayTasks.length > 3 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedDay(iso); }}
                            className="text-[9px] md:text-[10px] px-1 text-left w-full hover:underline"
                            style={{ color: D.muted }}
                          >
                            +{dayTasks.length - 3} ďalších →
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
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
                              onClick={() => openEdit(null, iso)}
                              className="w-full text-[0.65rem] py-2 rounded opacity-50 hover:opacity-100 transition-opacity"
                              style={{ color: D.mutedDark, background: "transparent", border: `1px dashed ${D.indigoBorder}` }}
                            >
                              + pridať
                            </button>
                          ) : dayTasks.map((t) => {
                            // Mirror the month-view color logic so week view
                            // reads the same: violet = local, sky (or the
                            // user's calendar color) = Google, emerald = done.
                            const isGoogle = !!t.googleEventId;
                            const accent = t.done
                              ? "#10b981"
                              : isGoogle
                              ? (t.calendarColor ?? "#0ea5e9")
                              : "#8b5cf6";
                            return (
                              <div
                                key={t.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, t.id)}
                                onClick={() => setSelectedTask(t)}
                                className="px-2 py-1.5 rounded-lg text-xs cursor-grab active:cursor-grabbing transition-all"
                                style={{
                                  background: `${accent}1f`,
                                  borderLeft: `3px solid ${accent}`,
                                  border: `1px solid ${accent}55`,
                                  borderLeftWidth: "3px",
                                  color: "var(--app-text)",
                                }}
                                title={`${t.time ? t.time + " · " : ""}${t.title}${t.calendarName ? " · " + t.calendarName : ""}`}
                              >
                                {t.time && (
                                  <div
                                    className="text-[0.6rem] font-semibold mb-0.5"
                                    style={{ color: accent }}
                                  >
                                    {t.time}
                                  </div>
                                )}
                                <div
                                  className="font-medium leading-tight"
                                  style={{ textDecoration: t.done ? "line-through" : "none" }}
                                >
                                  {t.title}
                                </div>
                                {isGoogle && t.calendarName && (
                                  <div
                                    className="text-[9px] mt-0.5 truncate"
                                    style={{ color: "var(--app-text-subtle)" }}
                                  >
                                    {t.calendarName}
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
              tasks.length === 0 ? (
                <EmptyIllustration
                  variant="calendar"
                  size={88}
                  title="Žiadne úlohy — naplánuj prvú."
                  hint="Vyber rýchlu cestu:"
                  action={
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                      <button
                        onClick={() => openEdit(null)}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                        style={{ background: `linear-gradient(135deg,${D.indigo},${D.violet})`, color: "white" }}
                      >
                        📅 Nová úloha
                      </button>
                      <Link
                        href={`/dashboard?prompt=${encodeURIComponent("Naplánuj stretnutie s klientom zajtra o 14:00")}`}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                        style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${D.indigoBorder}`, color: D.text }}
                      >
                        💬 AI to naplánuje
                      </Link>
                      <button
                        onClick={() => openEdit(null)}
                        className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                        style={{ background: "rgba(99,102,241,0.06)", border: `1px solid ${D.indigoBorder}`, color: D.muted }}
                      >
                        🔁 Opakujúca sa úloha
                      </button>
                    </div>
                  }
                />
              ) : (
                <p className="text-xs" style={{ color: D.mutedDark }}>Žiadne nadchádzajúce úlohy.</p>
              )
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
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium flex-1" style={{ color: D.text }}>{selectedTask.title}</h4>
                  <button
                    onClick={() => openEdit(selectedTask)}
                    className="p-1.5 rounded-lg"
                    style={{ color: D.muted }}
                    title="Upraviť"
                    aria-label="Upraviť"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedTask.id)}
                    className="p-1.5 rounded-lg"
                    style={{ color: D.muted }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = D.muted)}
                    title="Zmazať"
                    aria-label="Zmazať"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {selectedTask.googleEventId && selectedTask.calendarName && (
                  <div
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${selectedTask.calendarColor ?? "#0ea5e9"}22`,
                      color: selectedTask.calendarColor ?? "#0ea5e9",
                      border: `1px solid ${selectedTask.calendarColor ?? "#0ea5e9"}55`,
                    }}
                  >
                    <CalendarDays className="w-3 h-3" />
                    {selectedTask.calendarName}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm" style={{ color: D.muted }}>
                  <Clock className="w-4 h-4" />
                  <span>{selectedTask.date}{selectedTask.time ? ` o ${selectedTask.time}` : ""}</span>
                </div>
                {selectedTask.description && (
                  <div
                    className="p-3 rounded-xl text-sm whitespace-pre-wrap"
                    style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                  >
                    {selectedTask.description}
                  </div>
                )}
                {!selectedTask.googleEventId && (
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
                )}
                {selectedTask.googleEventId && selectedTask.htmlLink && (
                  <a
                    href={selectedTask.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
                    style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.muted }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Otvoriť v Google Kalendári
                  </a>
                )}
                {!selectedTask.googleEventId && (
                  <ShareButton resourceType="task" resourceId={selectedTask.id} fullWidth />
                )}
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

      {/* ── Day detail drawer — lists every task/event for the
            clicked day with quick-add button. Replaces the old
            "click-opens-first-task" confusion. ── */}
      <AnimatePresence>
        {selectedDay && (
          <DayDetailDrawer
            iso={selectedDay}
            tasks={tasks.filter((t) => t.date === selectedDay)
              .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))}
            onClose={() => setSelectedDay(null)}
            onOpenTask={(t) => { setSelectedTask(t); }}
            onAddNew={() => {
              const day = selectedDay;
              setSelectedDay(null);
              openEdit(null, day);
            }}
            onToggleDone={toggleDone}
            onDelete={handleDelete}
            onEdit={(t) => {
              setSelectedDay(null);
              openEdit(t);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Add modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => { if (!saving) { setShowModal(false); setEditingTask(null); } }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "var(--app-surface)", border: `1px solid ${D.indigoBorder}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: D.text }}>
                  {editingTask
                    ? (editingTask.googleEventId ? "Upraviť udalosť (Google)" : "Upraviť úlohu")
                    : "Nová úloha"}
                </h2>
                <button
                  onClick={() => { setShowModal(false); setEditingTask(null); }}
                  disabled={saving}
                  className="p-1"
                >
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
                  onClick={() => { setShowModal(false); setEditingTask(null); }}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: D.indigoDim, border: `1px solid ${D.indigoBorder}`, color: D.text }}
                >
                  Zrušiť
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim() || !form.date}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg,${D.indigo},${D.violet})`, color: "white" }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingTask ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                  {editingTask ? "Uložiť zmeny" : "Uložiť"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

// ── Calendar legend — tiny visual key for the color system ─────────
// Local tasks = violet, Google events = sky, completed = emerald.
// Kept self-contained here because it only makes sense next to the
// grid that uses those colors.
function CalendarLegend() {
  // Compact inline legend — saves vertical real-estate so the month
  // grid can fit the viewport without scrolling.
  const items = [
    { color: "#8b5cf6", label: "Úlohy" },
    { color: "#0ea5e9", label: "Google" },
    { color: "#10b981", label: "Hotové" },
  ];
  return (
    <div className="flex items-center gap-3 mb-2 flex-shrink-0">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1 text-[10px]" style={{ color: D.mutedDark }}>
          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

// ── Day detail drawer — full list of tasks/events for one day ────
// Slides in from the right. Scrollable if the day has lots of items.
// Each row: coloured bar (source), time, title, actions. Local tasks
// are toggle-able / deletable; Google events are read-only with a
// "Otvoriť v Googli" link.
function DayDetailDrawer({
  iso, tasks, onClose, onOpenTask, onAddNew, onToggleDone, onDelete, onEdit,
}: {
  iso: string;
  tasks: Task[];
  onClose: () => void;
  onOpenTask: (t: Task) => void;
  onAddNew: () => void;
  onToggleDone: (t: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (t: Task) => void;
}) {
  const d = new Date(iso + "T00:00:00");
  const title = d.toLocaleDateString("sk-SK", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80]"
        style={{ background: "rgba(3,4,10,0.6)", backdropFilter: "blur(4px)" }}
      />
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.22 }}
        className="fixed right-0 top-0 bottom-0 z-[81] w-full sm:max-w-md flex flex-col"
        style={{
          background: "var(--app-surface)",
          borderLeft: "1px solid var(--app-border)",
        }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--app-border)" }}
        >
          <div>
            <h2 className="text-sm font-bold capitalize" style={{ color: "var(--app-text)" }}>
              {title}
            </h2>
            <p className="text-[0.7rem]" style={{ color: "var(--app-text-muted)" }}>
              {tasks.length === 0 ? "Zatiaľ prázdny deň" : `${tasks.length} položiek`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{ color: "var(--app-text-muted)" }}
            aria-label="Zavrieť"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-4 py-3 space-y-2">
          {tasks.length === 0 ? (
            <div
              className="text-center py-10 rounded-xl text-xs"
              style={{
                background: "var(--app-surface-2)",
                border: "1px dashed var(--app-border)",
                color: "var(--app-text-muted)",
              }}
            >
              Nič na tento deň. Pridaj prvú úlohu.
            </div>
          ) : (
            tasks.map((t) => {
              const isGoogle = !!t.googleEventId;
              const accent = t.done
                ? "#10b981"
                : isGoogle
                ? (t.calendarColor ?? "#0ea5e9")
                : "#8b5cf6";
              return (
                <div
                  key={t.id}
                  className="rounded-xl p-3 flex items-start gap-3"
                  style={{
                    background: "var(--app-surface-2)",
                    border: "1px solid var(--app-border)",
                    borderLeft: `3px solid ${accent}`,
                  }}
                >
                  {!isGoogle && (
                    <button
                      onClick={() => onToggleDone(t)}
                      className="w-4 h-4 rounded border mt-0.5 flex-shrink-0"
                      style={{
                        background: t.done ? accent : "transparent",
                        borderColor: accent,
                      }}
                      aria-label="Označiť hotové"
                      title={t.done ? "Zrušiť hotové" : "Označiť hotové"}
                    >
                      {t.done && <Check className="w-3 h-3 text-white m-auto" />}
                    </button>
                  )}
                  {isGoogle && (
                    <div
                      className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0"
                      style={{ background: `${accent}44`, border: `1px solid ${accent}` }}
                      title={t.calendarName ?? "Google Kalendár"}
                    />
                  )}
                  <button
                    onClick={() => onOpenTask(t)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-baseline gap-2">
                      {t.time && (
                        <span className="text-xs font-semibold" style={{ color: accent }}>
                          {t.time}
                        </span>
                      )}
                      <span
                        className="text-sm font-medium truncate"
                        style={{
                          color: "var(--app-text)",
                          textDecoration: t.done ? "line-through" : "none",
                          opacity: t.done ? 0.7 : 1,
                        }}
                      >
                        {t.title}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-[0.7rem] mt-0.5 line-clamp-2" style={{ color: "var(--app-text-muted)" }}>
                        {t.description}
                      </p>
                    )}
                    {isGoogle && t.calendarName && (
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--app-text-subtle)" }}>
                        {t.calendarName}
                      </p>
                    )}
                  </button>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Edit works for both local + Google — opens the
                        unified modal which PATCHes the right endpoint. */}
                    <button
                      onClick={() => onEdit(t)}
                      className="p-1.5 rounded-md"
                      style={{ color: "var(--app-text-muted)" }}
                      title="Upraviť"
                      aria-label="Upraviť"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(t.id)}
                      className="p-1.5 rounded-md"
                      style={{ color: "#f43f5e" }}
                      title="Zmazať"
                      aria-label="Zmazať"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isGoogle && t.htmlLink && (
                      <a
                        href={t.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-md"
                        style={{ color: "var(--app-text-subtle)" }}
                        title="Otvoriť v Google Kalendári"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div
          className="p-4"
          style={{ borderTop: "1px solid var(--app-border)" }}
        >
          <button
            onClick={onAddNew}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold"
            style={{
              background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
              color: "white",
              boxShadow: "0 0 14px rgba(99,102,241,0.4)",
            }}
          >
            <Plus className="w-4 h-4" />
            Pridať úlohu na tento deň
          </button>
        </div>
      </motion.aside>
    </>
  );
}
