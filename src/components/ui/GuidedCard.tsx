"use client";
// src/components/ui/GuidedCard.tsx
// Single conversational draft card — persists through chat turns,
// fills LIVE as AI extracts fields from subsequent user replies.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, CalendarCheck, Check, X, Pencil, Loader2 } from "lucide-react";

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
  text:   "#eef2ff",
  muted:  "#94a3b8",
  mutedDark: "#475569",
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
  label, value, placeholder, type, onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (v: string) => void;
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
      <input
        type={type ?? "text"}
        value={value}
        placeholder={placeholder ? `chýba · ${placeholder}` : "chýba"}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm outline-none border-b transition-colors"
        style={{
          color: filled ? D.text : D.muted,
          borderColor: filled ? "rgba(99,102,241,0.35)" : "rgba(148,163,184,0.15)",
          paddingBottom: 2,
        }}
      />
    </div>
  );
}

export default function GuidedCard({ draft, onChange, onConfirm, onDismiss }: Props) {
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

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
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${D.border}` }}
        >
          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: D.sky }}
              animate={{ boxShadow: ["0 0 4px #22d3ee", "0 0 10px #22d3ee", "0 0 4px #22d3ee"] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span
              className="text-[0.65rem] font-semibold uppercase tracking-widest"
              style={{ color: D.sky }}
            >
              Sprievodca · Rozpracované
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditing((e) => !e)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: D.muted }}
              aria-label="Upraviť"
              title="Upraviť polia"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: D.muted }}
              aria-label="Zrušiť"
              title="Zrušiť"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
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
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          className="flex items-center justify-between gap-2 px-4 py-2.5"
          style={{ borderTop: `1px solid ${D.border}`, background: "rgba(5,7,15,0.35)" }}
        >
          <span className="text-[0.65rem]" style={{ color: D.muted }}>
            AI dopĺňa polia počas rozhovoru
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
              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
                color: "white",
                boxShadow: "0 0 14px rgba(99,102,241,0.38)",
              }}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              {saving ? "Ukladám…" : "Potvrdiť a uložiť"}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
