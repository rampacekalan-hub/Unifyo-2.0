"use client";
// src/components/ui/GuidedCard.tsx
// Single conversational draft card — persists through chat turns,
// fills LIVE as AI extracts fields from subsequent user replies.

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, CalendarCheck, Check, X, Loader2 } from "lucide-react";

export interface GuidedDraft {
  contact: Record<string, string>; // Meno, Email, Telefón, Firma, Poznámka
  task: Record<string, string>;    // Úloha, Dátum, Čas, Poznámka
}

interface Props {
  draft: GuidedDraft;
  onChange: (next: GuidedDraft) => void;
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
}

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  sky:    "#22d3ee",
  text:   "var(--app-text)",
  muted:  "var(--app-text-muted)",
  mutedDark: "var(--app-text-subtle)",
  border: "rgba(99,102,241,0.28)",
  borderSky: "rgba(34,211,238,0.28)",
};

const CONTACT_FIELDS: Array<{ key: string; label: string; type?: string; placeholder: string }> = [
  { key: "Meno",     label: "Meno",     placeholder: "Peter Novák" },
  { key: "Telefón",  label: "Telefón",  type: "tel",   placeholder: "+421 900 000 000" },
  { key: "Email",    label: "Email",    type: "email", placeholder: "peter@firma.sk" },
  { key: "Firma",    label: "Firma",    placeholder: "Alfa s.r.o." },
  { key: "Poznámka", label: "Poznámka", placeholder: "Záujem o hypotéku" },
];

const TASK_FIELDS: Array<{ key: string; label: string; type?: string; placeholder: string }> = [
  { key: "Úloha",    label: "Úloha",    placeholder: "Stretnutie: Peter Novák" },
  { key: "Dátum",    label: "Dátum",    type: "date", placeholder: "" },
  { key: "Čas",      label: "Čas",      type: "time", placeholder: "14:00" },
  { key: "Poznámka", label: "Poznámka", placeholder: "" },
];

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("sk-SK", { weekday: "short", day: "numeric", month: "short" });
}

function SectionRow({
  label, value, placeholder, type, onChange, flash,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (v: string) => void;
  flash?: boolean;
}) {
  const filled = Boolean(value && value.trim());
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span
        className="text-[0.65rem] uppercase tracking-widest w-16 flex-shrink-0"
        style={{ color: filled ? D.muted : D.mutedDark }}
      >
        {label}
      </span>
      <motion.input
        type={type ?? "text"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm outline-none border-b"
        animate={
          flash
            ? { backgroundColor: ["rgba(34,211,238,0.0)", "rgba(34,211,238,0.18)", "rgba(34,211,238,0.0)"] }
            : undefined
        }
        transition={{ duration: 1.0, ease: "easeOut" }}
        style={{
          color: filled ? D.text : D.muted,
          borderColor: filled ? "rgba(99,102,241,0.35)" : "rgba(148,163,184,0.15)",
          paddingBottom: 2,
          borderRadius: 3,
        }}
      />
    </div>
  );
}

export default function GuidedCard({ draft, onChange, onConfirm, onDismiss }: Props) {
  const [saving, setSaving] = useState(false);
  // Default to edit mode so users see the fields they can tweak
  // + the big "Uložiť" button from the first render. The old compact
  // mode hid the form behind a pencil icon and confused users who
  // expected a classic form.
  const [editing, setEditing] = useState(true);

  // ── Flash-animate fields that just became filled (AI added them) ──
  const prevRef = useRef<GuidedDraft | null>(null);
  const [flashed, setFlashed] = useState<Set<string>>(new Set());
  useEffect(() => {
    const prev = prevRef.current;
    if (prev) {
      const newlyFilled = new Set<string>();
      for (const bucket of ["contact", "task"] as const) {
        for (const key of Object.keys(draft[bucket])) {
          const before = (prev[bucket]?.[key] ?? "").trim();
          const after  = (draft[bucket][key] ?? "").trim();
          if (!before && after) newlyFilled.add(`${bucket}:${key}`);
        }
      }
      if (newlyFilled.size > 0) {
        setFlashed(newlyFilled);
        const t = window.setTimeout(() => setFlashed(new Set()), 1200);
        return () => window.clearTimeout(t);
      }
    }
    prevRef.current = draft;
  }, [draft]);
  useEffect(() => { prevRef.current = draft; }, [draft]);

  // ── Progress: how many fields are filled? ──
  const progress = useMemo(() => {
    const contactKeys = CONTACT_FIELDS.map(f => f.key);
    const taskKeys    = TASK_FIELDS.map(f => f.key);
    const filled =
      contactKeys.filter(k => (draft.contact[k] ?? "").trim()).length +
      taskKeys.filter(k => (draft.task[k] ?? "").trim()).length;
    const total = contactKeys.length + taskKeys.length;
    return { filled, total, pct: Math.round((filled / total) * 100) };
  }, [draft]);

  const hasContact = Object.values(draft.contact).some((v) => v && v.trim());
  const hasTask    = Object.values(draft.task).some((v) => v && v.trim());
  if (!hasContact && !hasTask) return null;

  const setContact = (key: string, v: string) =>
    onChange({ ...draft, contact: { ...draft.contact, [key]: v } });
  const setTask = (key: string, v: string) =>
    onChange({ ...draft, task: { ...draft.task, [key]: v } });

  const handleConfirm = async () => {
    setSaving(true);
    try { await onConfirm(); } finally { setSaving(false); }
  };

  // Compact summary when not editing
  const meno = draft.contact["Meno"];
  const uloha = draft.task["Úloha"];
  const datum = draft.task["Dátum"];
  const cas   = draft.task["Čas"];

  return (
    <AnimatePresence>
      <motion.div
        key="guided-card"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(34,211,238,0.06) 100%)",
          border: `1px solid ${D.border}`,
          boxShadow: "0 0 24px rgba(99,102,241,0.18)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        {/* Header — tells the user exactly what the card does.
            Previously it said "Sprievodca · 0/9 polí" which left
            users guessing what this widget is for. */}
        <div
          className="px-4 py-3"
          style={{ borderBottom: `1px solid ${D.border}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <motion.div
                className="w-6 h-6 rounded-lg flex items-center justify-center mt-0.5"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))",
                  border: `1px solid ${D.border}`,
                }}
                animate={{ boxShadow: ["0 0 4px #8b5cf6", "0 0 12px #8b5cf6", "0 0 4px #8b5cf6"] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Check className="w-3.5 h-3.5 text-white" />
              </motion.div>
              <div>
                <p className="text-xs font-bold" style={{ color: D.text }}>
                  {hasContact && hasTask
                    ? "Pridať kontakt a naplánovať úlohu?"
                    : hasContact
                    ? "Pridať tento kontakt do CRM?"
                    : "Naplánovať túto úlohu?"}
                </p>
                <p className="text-[0.65rem] mt-0.5" style={{ color: D.muted }}>
                  Skontroluj údaje a klikni <strong style={{ color: D.text }}>Uložiť</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg transition-colors flex-shrink-0"
              style={{ color: D.muted }}
              aria-label="Zavrieť bez uloženia"
              title="Zavrieť bez uloženia"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-full" style={{ background: "rgba(99,102,241,0.08)" }}>
          <motion.div
            className="h-full"
            style={{ background: `linear-gradient(90deg, ${D.indigo}, ${D.sky})` }}
            initial={false}
            animate={{ width: `${progress.pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Compact summary OR editable sections */}
        {!editing ? (
          <div className="px-4 py-3 space-y-2">
            {hasContact && (
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(99,102,241,0.15)",
                    border: `1px solid ${D.border}`,
                  }}
                >
                  <User className="w-3.5 h-3.5" style={{ color: D.indigo }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.6rem] uppercase tracking-widest" style={{ color: D.muted }}>
                    Kontakt
                  </p>
                  <p className="text-sm truncate" style={{ color: D.text }}>
                    {meno || <span style={{ color: D.muted }}>meno chýba</span>}
                    {draft.contact["Telefón"] && (
                      <span style={{ color: D.muted }}> · {draft.contact["Telefón"]}</span>
                    )}
                    {draft.contact["Email"] && (
                      <span style={{ color: D.muted }}> · {draft.contact["Email"]}</span>
                    )}
                  </p>
                </div>
              </div>
            )}
            {hasTask && (
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(34,211,238,0.12)",
                    border: `1px solid ${D.borderSky}`,
                  }}
                >
                  <CalendarCheck className="w-3.5 h-3.5" style={{ color: D.sky }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.6rem] uppercase tracking-widest" style={{ color: D.muted }}>
                    Termín
                  </p>
                  <p className="text-sm truncate" style={{ color: D.text }}>
                    {uloha || <span style={{ color: D.muted }}>názov úlohy chýba</span>}
                    {datum && (
                      <span style={{ color: D.muted }}> · {formatDate(datum)}</span>
                    )}
                    {cas && <span style={{ color: D.muted }}> · {cas}</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-3 space-y-4">
            <div>
              <p className="text-[0.6rem] uppercase tracking-widest mb-1" style={{ color: D.indigo }}>
                Kontakt (CRM)
              </p>
              {CONTACT_FIELDS.map((f) => (
                <SectionRow
                  key={f.key}
                  label={f.label}
                  type={f.type}
                  placeholder={f.placeholder}
                  value={draft.contact[f.key] ?? ""}
                  onChange={(v) => setContact(f.key, v)}
                  flash={flashed.has(`contact:${f.key}`)}
                />
              ))}
            </div>
            <div>
              <p className="text-[0.6rem] uppercase tracking-widest mb-1" style={{ color: D.sky }}>
                Termín (Kalendár)
              </p>
              {TASK_FIELDS.map((f) => (
                <SectionRow
                  key={f.key}
                  label={f.label}
                  type={f.type}
                  placeholder={f.placeholder}
                  value={draft.task[f.key] ?? ""}
                  onChange={(v) => setTask(f.key, v)}
                  flash={flashed.has(`task:${f.key}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          className="flex items-center justify-between gap-2 px-4 py-2.5"
          style={{ borderTop: `1px solid ${D.border}`, background: "var(--app-surface-2)" }}
        >
          <span className="text-[0.7rem] font-semibold" style={{ color: D.sky }}>
            ← Uprav polia a klikni &quot;Uložiť&quot;
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onDismiss}
              disabled={saving}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
              style={{ color: D.muted, background: "rgba(148,163,184,0.08)" }}
            >
              Zrušiť
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || (!hasContact && !hasTask)}
              className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
                color: "white",
                boxShadow: "0 0 18px rgba(99,102,241,0.55)",
              }}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {saving ? "Ukladám…" : "Uložiť"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
