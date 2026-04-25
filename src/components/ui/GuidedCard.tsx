"use client";
// src/components/ui/GuidedCard.tsx
// Single conversational draft card — persists through chat turns,
// fills LIVE as AI extracts fields from subsequent user replies.

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, CalendarCheck, Check, X, Loader2, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";

export interface GuidedDraft {
  contact: Record<string, string>; // Meno, Email, Telefón, Firma, Poznámka
  task: Record<string, string>;    // Úloha, Dátum, Čas, Poznámka
  deal?: Record<string, string>;   // Názov, Fáza, Hodnota, Poznámka (Pipeline)
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

const DEAL_FIELDS: Array<{ key: string; label: string; type?: string; placeholder: string }> = [
  { key: "Názov",    label: "Názov",    placeholder: "Hypotéka — Peter Novák" },
  { key: "Fáza",     label: "Fáza",     placeholder: "Analýza potrieb" },
  { key: "Hodnota",  label: "Hodnota",  placeholder: "€ (voliteľné)" },
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

type StepId = "contact" | "deal" | "task" | "summary";
const STEP_META: Record<StepId, { label: string; icon: React.ElementType; color: string }> = {
  contact: { label: "Kontakt",  icon: User,          color: "#6366f1" },
  deal:    { label: "Deal",     icon: TrendingUp,    color: "#8b5cf6" },
  task:    { label: "Termín",   icon: CalendarCheck, color: "#22d3ee" },
  summary: { label: "Súhrn",    icon: Check,         color: "#10b981" },
};

export default function GuidedCard({ draft, onChange, onConfirm, onDismiss }: Props) {
  const [saving, setSaving] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  // ── Flash-animate fields that just became filled (AI added them) ──
  const prevRef = useRef<GuidedDraft | null>(null);
  const [flashed, setFlashed] = useState<Set<string>>(new Set());
  useEffect(() => {
    const prev = prevRef.current;
    if (prev) {
      const newlyFilled = new Set<string>();
      for (const bucket of ["contact", "task", "deal"] as const) {
        const prevBucket = prev[bucket] ?? {};
        const nextBucket = draft[bucket] ?? {};
        for (const key of Object.keys(nextBucket)) {
          const before = (prevBucket[key] ?? "").trim();
          const after  = (nextBucket[key] ?? "").trim();
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
    const dealKeys    = DEAL_FIELDS.map(f => f.key);
    const dealBucket  = draft.deal ?? {};
    const filled =
      contactKeys.filter(k => (draft.contact[k] ?? "").trim()).length +
      taskKeys.filter(k => (draft.task[k] ?? "").trim()).length +
      dealKeys.filter(k => (dealBucket[k] ?? "").trim()).length;
    const total = contactKeys.length + taskKeys.length + dealKeys.length;
    return { filled, total, pct: Math.round((filled / total) * 100) };
  }, [draft]);

  const hasContact = Object.values(draft.contact).some((v) => v && v.trim());
  const hasTask    = Object.values(draft.task).some((v) => v && v.trim());
  const hasDeal    = draft.deal ? Object.values(draft.deal).some((v) => v && v.trim()) : false;
  if (!hasContact && !hasTask && !hasDeal) return null;

  const setContact = (key: string, v: string) =>
    onChange({ ...draft, contact: { ...draft.contact, [key]: v } });
  const setTask = (key: string, v: string) =>
    onChange({ ...draft, task: { ...draft.task, [key]: v } });
  const setDeal = (key: string, v: string) =>
    onChange({ ...draft, deal: { ...(draft.deal ?? {}), [key]: v } });

  const handleConfirm = async () => {
    setSaving(true);
    try { await onConfirm(); } finally { setSaving(false); }
  };

  // ── Build dynamic step list — only buckets that have data + final summary ──
  const steps: StepId[] = useMemo(() => {
    const out: StepId[] = [];
    if (hasContact) out.push("contact");
    if (hasDeal)    out.push("deal");
    if (hasTask)    out.push("task");
    out.push("summary");
    return out;
  }, [hasContact, hasDeal, hasTask]);

  const safeIdx = Math.min(stepIdx, steps.length - 1);
  const currentStep: StepId = steps[safeIdx];
  const isFirst = safeIdx === 0;
  const isLast  = safeIdx === steps.length - 1;
  const goNext = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const goPrev = () => setStepIdx((i) => Math.max(i - 1, 0));

  // Step header label for the active step
  const stepHeading: Record<StepId, string> = {
    contact: "Kontakt klienta",
    deal:    "Deal v Pipeline",
    task:    "Termín v kalendári",
    summary: "Súhrn — pripravené uložiť",
  };
  const stepHint: Record<StepId, string> = {
    contact: "Skontroluj meno, doplň email/telefón ak vieš.",
    deal:    "Pomenuj obchod a vyber fázu (Lead → Vyhraté).",
    task:    "Vyber dátum a čas — ide o placeholder, môžeš presunúť.",
    summary: "Posledná kontrola pred uložením.",
  };

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
        {/* Header — wizard heading + close */}
        <div
          className="px-4 py-3"
          style={{ borderBottom: `1px solid ${D.border}` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <motion.div
                className="w-6 h-6 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${STEP_META[currentStep].color}55, ${STEP_META[currentStep].color}22)`,
                  border: `1px solid ${STEP_META[currentStep].color}55`,
                }}
                animate={{ boxShadow: [`0 0 4px ${STEP_META[currentStep].color}`, `0 0 12px ${STEP_META[currentStep].color}`, `0 0 4px ${STEP_META[currentStep].color}`] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {(() => {
                  const Icon = STEP_META[currentStep].icon;
                  return <Icon className="w-3.5 h-3.5 text-white" />;
                })()}
              </motion.div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: D.text }}>
                  Sprievodca · {safeIdx + 1}/{steps.length} · {stepHeading[currentStep]}
                </p>
                <p className="text-[0.65rem] mt-0.5" style={{ color: D.muted }}>
                  {stepHint[currentStep]}
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

        {/* Stepper dots */}
        <div className="flex items-center gap-1 px-4 py-2" style={{ background: "rgba(15,23,42,0.04)", borderBottom: `1px solid ${D.border}` }}>
          {steps.map((s, i) => {
            const meta = STEP_META[s];
            const active = i === safeIdx;
            const done = i < safeIdx;
            return (
              <button
                key={s}
                onClick={() => setStepIdx(i)}
                disabled={saving}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[0.65rem] font-medium transition-all disabled:opacity-50"
                style={{
                  background: active ? `${meta.color}22` : done ? "rgba(16,185,129,0.10)" : "transparent",
                  border: `1px solid ${active ? meta.color + "55" : done ? "rgba(16,185,129,0.30)" : "transparent"}`,
                  color: active ? meta.color : done ? "#10b981" : D.muted,
                }}
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[0.6rem]"
                  style={{
                    background: active ? meta.color : done ? "#10b981" : "rgba(148,163,184,0.20)",
                    color: active || done ? "white" : D.muted,
                  }}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-full" style={{ background: "rgba(99,102,241,0.08)" }}>
          <motion.div
            className="h-full"
            style={{ background: `linear-gradient(90deg, ${D.indigo}, ${D.sky})` }}
            initial={false}
            animate={{ width: `${Math.round(((safeIdx + 1) / steps.length) * 100)}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Step body */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18 }}
            className="px-4 py-3"
          >
            {currentStep === "contact" && (
              <div>
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
            )}

            {currentStep === "deal" && (
              <div>
                {DEAL_FIELDS.map((f) => (
                  <SectionRow
                    key={f.key}
                    label={f.label}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(draft.deal ?? {})[f.key] ?? ""}
                    onChange={(v) => setDeal(f.key, v)}
                    flash={flashed.has(`deal:${f.key}`)}
                  />
                ))}
              </div>
            )}

            {currentStep === "task" && (
              <div>
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
            )}

            {currentStep === "summary" && (
              <div className="space-y-2">
                {hasContact && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(99,102,241,0.15)", border: `1px solid ${D.border}` }}>
                      <User className="w-3.5 h-3.5" style={{ color: D.indigo }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.6rem] uppercase tracking-widest" style={{ color: D.muted }}>Kontakt</p>
                      <p className="text-sm truncate" style={{ color: D.text }}>
                        {draft.contact["Meno"] || <span style={{ color: D.muted }}>meno chýba</span>}
                        {draft.contact["Telefón"] && <span style={{ color: D.muted }}> · {draft.contact["Telefón"]}</span>}
                        {draft.contact["Email"] && <span style={{ color: D.muted }}> · {draft.contact["Email"]}</span>}
                      </p>
                    </div>
                  </div>
                )}
                {hasDeal && draft.deal && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(139,92,246,0.14)", border: `1px solid rgba(139,92,246,0.32)` }}>
                      <TrendingUp className="w-3.5 h-3.5" style={{ color: D.violet }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.6rem] uppercase tracking-widest" style={{ color: D.muted }}>Deal (Pipeline)</p>
                      <p className="text-sm truncate" style={{ color: D.text }}>
                        {draft.deal["Názov"] || <span style={{ color: D.muted }}>názov chýba</span>}
                        {draft.deal["Fáza"] && <span style={{ color: D.muted }}> · {draft.deal["Fáza"]}</span>}
                      </p>
                    </div>
                  </div>
                )}
                {hasTask && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(34,211,238,0.12)", border: `1px solid ${D.borderSky}` }}>
                      <CalendarCheck className="w-3.5 h-3.5" style={{ color: D.sky }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.6rem] uppercase tracking-widest" style={{ color: D.muted }}>Termín</p>
                      <p className="text-sm truncate" style={{ color: D.text }}>
                        {draft.task["Úloha"] || <span style={{ color: D.muted }}>názov úlohy chýba</span>}
                        {draft.task["Dátum"] && <span style={{ color: D.muted }}> · {formatDate(draft.task["Dátum"])}</span>}
                        {draft.task["Čas"] && <span style={{ color: D.muted }}> · {draft.task["Čas"]}</span>}
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-[0.65rem] pt-1" style={{ color: D.muted }}>
                  {progress.filled}/{progress.total} polí vyplnených. Ak chceš dotiahnuť detaily, klikni Späť.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer — Späť / Ďalej or Uložiť */}
        <div
          className="flex items-center justify-between gap-2 px-4 py-2.5"
          style={{ borderTop: `1px solid ${D.border}`, background: "var(--app-surface-2)" }}
        >
          <button
            onClick={isFirst ? onDismiss : goPrev}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
            style={{ color: D.muted, background: "rgba(148,163,184,0.08)" }}
          >
            {isFirst ? <X className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            {isFirst ? "Zrušiť" : "Späť"}
          </button>

          {!isLast ? (
            <button
              onClick={goNext}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
                color: "white",
                boxShadow: "0 0 18px rgba(99,102,241,0.45)",
              }}
            >
              Ďalej
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={saving || (!hasContact && !hasTask && !hasDeal)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
                color: "white",
                boxShadow: "0 0 18px rgba(99,102,241,0.55)",
              }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Ukladám…" : "Uložiť všetko"}
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
