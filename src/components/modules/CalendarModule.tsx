"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CalendarCheck, Clock, Plus, X, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

function SkeletonTask() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl animate-pulse"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="w-5 h-5 rounded-lg flex-shrink-0" style={{ background: "rgba(139,92,246,0.15)" }} />
      <div className="flex-1 space-y-2">
        <div className="h-3 rounded-full w-48" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="h-2 rounded-full w-20" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>
      <div className="h-2.5 w-10 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>
  );
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  done: boolean;
}

const D = { violet: "#8b5cf6", violetBorder: "rgba(139,92,246,0.22)", violetDim: "rgba(139,92,246,0.10)", muted: "#6b7280", text: "#eef2ff" };

const EMPTY_FORM = { title: "", description: "", date: new Date().toISOString().slice(0, 10), time: "" };

function TaskDialog({ task, onClose, onSave }: {
  task: Partial<Task> | null;
  onClose: () => void;
  onSave: (data: typeof EMPTY_FORM) => Promise<void>;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...task });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(form as typeof EMPTY_FORM);
    setSaving(false);
  }

  const inputCls = "w-full bg-transparent rounded-xl px-3 py-2 text-sm outline-none transition-all"
    + " border border-white/10 focus:border-violet-500/50 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "rgba(10,12,28,0.97)", border: `1px solid ${D.violetBorder}`, backdropFilter: "blur(32px)" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-sm" style={{ color: D.text }}>{task?.id ? "Upraviť úlohu" : "Nová úloha"}</h3>
          <button onClick={onClose} className="opacity-40 hover:opacity-80"><X className="w-4 h-4" style={{ color: D.muted }} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[0.65rem] uppercase tracking-widest mb-1 block" style={{ color: D.muted }}>Názov *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Stretnutie s klientom…" className={inputCls} style={{ color: D.text }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.65rem] uppercase tracking-widest mb-1 block" style={{ color: D.muted }}>Dátum *</label>
              <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={inputCls} style={{ color: D.text, colorScheme: "dark" }} />
            </div>
            <div>
              <label className="text-[0.65rem] uppercase tracking-widest mb-1 block" style={{ color: D.muted }}>Čas</label>
              <input type="time" value={form.time ?? ""} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className={inputCls} style={{ color: D.text, colorScheme: "dark" }} />
            </div>
          </div>
          <div>
            <label className="text-[0.65rem] uppercase tracking-widest mb-1 block" style={{ color: D.muted }}>Popis</label>
            <textarea value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Voliteľný popis…" rows={3}
              className={inputCls + " resize-none"} style={{ color: D.text }} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg,${D.violet},#6366f1)`, boxShadow: `0 0 16px rgba(139,92,246,0.3)` }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (task?.id ? "Uložiť zmeny" : "Pridať úlohu")}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: D.muted }}>
              Zrušiť
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function CalendarModule() {
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<Partial<Task> | null | false>(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } else {
        toast.error("Chyba pri načítaní úloh");
      }
    } catch {
      toast.error("Problém s pripojením k databáze");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(form: typeof EMPTY_FORM) {
    const editing = dialog && (dialog as Task).id;
    try {
      let res: Response;
      if (editing) {
        res = await fetch("/api/calendar/tasks", { method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: (dialog as Task).id, ...form }) });
      } else {
        res = await fetch("/api/calendar/tasks", { method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form) });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        toast.error(err.error ?? "Uloženie zlyhalo");
        return;
      }
      const saved = await res.json() as Task;
      if (editing) {
        setTasks(prev => prev.map(t => t.id === saved.id ? saved : t));
        toast.success("Úloha aktualizovaná");
      } else {
        setTasks(prev => [...prev, saved].sort((a, b) => a.date.localeCompare(b.date)));
        toast.success("Vedomosť úspešne integrovaná", { description: `„${saved.title}" pridaná do Kalendára` });
      }
      setDialog(false);
    } catch {
      toast.error("Problém s pripojením — skúste znova");
    }
  }

  async function toggleDone(task: Task) {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t));
    const res = await fetch("/api/calendar/tasks", { method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, done: !task.done }) });
    if (!res.ok) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: task.done } : t));
      toast.error("Aktualizácia zlyhala");
    }
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    const res = await fetch("/api/calendar/tasks", { method: "DELETE",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) {
      toast.success("Úloha odstránená");
    } else {
      toast.error("Odstránenie zlyhalo");
      load();
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return tasks;
    return tasks.filter(t => t.title.toLowerCase().includes(q) || t.date.includes(q));
  }, [query, tasks]);

  const grouped = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of filtered) {
      if (!m.has(t.date)) m.set(t.date, []);
      m.get(t.date)!.push(t);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-5" style={{ minHeight: 0 }}>

      {/* Header */}
      <div className="flex items-center gap-3 max-w-xl mb-5">
        <div className="flex-1 flex items-center gap-3 rounded-2xl px-4 py-2.5"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${D.violetBorder}`, backdropFilter: "blur(16px)" }}>
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: D.muted }} />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Hľadať úlohu, dátum…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600"
            style={{ color: D.text, caretColor: D.violet }} />
          {query && <button onClick={() => setQuery("")} className="opacity-40 hover:opacity-80"><X className="w-3.5 h-3.5" style={{ color: D.muted }} /></button>}
        </div>
        <button onClick={() => setDialog({})}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-semibold text-white flex-shrink-0"
          style={{ background: `linear-gradient(135deg,${D.violet},#6366f1)`, boxShadow: `0 0 14px rgba(139,92,246,0.3)` }}>
          <Plus className="w-3.5 h-3.5" /> Pridať
        </button>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex-1 space-y-2 overflow-hidden">
          {[...Array(6)].map((_, i) => <SkeletonTask key={i} />)}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-5" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.05) transparent" }}>
          {grouped.map(([date, group]) => (
            <div key={date}>
              <p className="text-[0.62rem] font-bold tracking-widest uppercase mb-2 ml-1" style={{ color: D.muted }}>
                {new Date(date + "T12:00:00").toLocaleDateString("sk-SK", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <div className="space-y-1.5">
                <AnimatePresence initial={false}>
                  {group.map((t, i) => (
                    <motion.div key={t.id}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6, height: 0 }}
                      transition={{ duration: 0.16, delay: i * 0.03 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl group"
                      style={{ background: t.done ? "rgba(255,255,255,0.015)" : "rgba(255,255,255,0.025)", border: `1px solid ${t.done ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)"}`, opacity: t.done ? 0.55 : 1 }}>
                      <button onClick={() => toggleDone(t)}
                        className="w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-all"
                        style={{ borderColor: t.done ? "#34d399" : D.violetBorder, background: t.done ? "rgba(52,211,153,0.15)" : "transparent" }}>
                        {t.done && <span className="w-2 h-2 rounded-sm" style={{ background: "#34d399" }} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: D.text, textDecoration: t.done ? "line-through" : "none" }}>{t.title}</p>
                        {t.description && <p className="text-xs truncate mt-0.5" style={{ color: D.muted }}>{t.description}</p>}
                      </div>
                      {t.time && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 h-3" style={{ color: D.muted }} />
                          <span className="text-xs tabular-nums" style={{ color: D.muted }}>{t.time}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setDialog(t)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                          <Pencil className="w-3 h-3" style={{ color: D.muted }} />
                        </button>
                        <button onClick={() => deleteTask(t.id)} className="p-1 rounded-lg hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-3 h-3" style={{ color: "#f87171" }} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-12">
              <CalendarCheck className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: D.muted }} />
              <p className="text-sm mb-3" style={{ color: D.muted }}>{query ? `Žiadne úlohy pre „${query}"` : "Zatiaľ žiadne úlohy"}</p>
              {!query && <button onClick={() => setDialog({})}
                className="text-xs px-4 py-2 rounded-xl font-semibold"
                style={{ background: D.violetDim, border: `1px solid ${D.violetBorder}`, color: "#c4b5fd" }}>
                + Pridať prvú úlohu
              </button>}
            </div>
          )}
        </div>
      )}

      {/* Dialog */}
      <AnimatePresence>
        {dialog !== false && (
          <TaskDialog task={dialog} onClose={() => setDialog(false)} onSave={handleSave} />
        )}
      </AnimatePresence>
    </div>
  );
}
