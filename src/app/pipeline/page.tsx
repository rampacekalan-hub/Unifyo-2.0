"use client";
// Pipeline board — 5-column Kanban view of deals. Drag a card to move
// it between stages (HTML5 drag-drop, no library). Every write hits the
// API optimistically; we roll back on failure. Heuristic "next action"
// is computed client-side from lastActivityAt + stage.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, ChevronLeft, Trash2, X, Euro, Calendar as CalendarIcon,
  User as UserIcon, AlertCircle, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";

type Stage = "LEAD" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";

interface Deal {
  id: string;
  title: string;
  stage: Stage;
  position: number;
  expectedValue: number | null; // EUR cents
  expectedCloseAt: string | null;
  note: string | null;
  closedAt: string | null;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  contact: { id: string; name: string; company: string | null } | null;
}

interface Contact {
  id: string;
  name: string;
  company: string | null;
}

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "var(--app-text-subtle)",
  border: "var(--app-border)",
  dim: "rgba(99,102,241,0.08)",
};

const STAGES: { id: Stage; label: string; accent: string }[] = [
  { id: "LEAD",      label: "Lead",       accent: "#64748b" },
  { id: "QUALIFIED", label: "Kvalifikovaný", accent: "#6366f1" },
  { id: "PROPOSAL",  label: "Ponuka",     accent: "#a78bfa" },
  { id: "WON",       label: "Uzavretý ✓", accent: "#10b981" },
  { id: "LOST",      label: "Stratený",   accent: "#ef4444" },
];

// Thresholds in days — over this without activity we flag "Potrebuje akciu".
const STALE_DAYS: Record<Stage, number> = {
  LEAD:      7,
  QUALIFIED: 5,
  PROPOSAL:  3,
  WON:       Infinity,
  LOST:      Infinity,
};

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function nextAction(deal: Deal): string | null {
  if (deal.stage === "WON" || deal.stage === "LOST") return null;
  const stale = daysSince(deal.lastActivityAt) >= STALE_DAYS[deal.stage];
  if (!stale) return null;
  switch (deal.stage) {
    case "LEAD":      return "Prvý kontakt — zavolaj alebo napíš";
    case "QUALIFIED": return "Pošli ponuku alebo dohodni stretnutie";
    case "PROPOSAL":  return "Follow-up na ponuku";
    default:          return null;
  }
}

function formatEur(cents: number | null): string {
  if (cents == null) return "";
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState<{ stage: Stage } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

  // Auto-open the New Deal modal when we arrive from a ?new=1 link
  // (command palette, onboarding CTA). We pre-fill stage=LEAD since
  // that's where 95 % of new deals start.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("new") === "1") {
      setShowNew({ stage: "LEAD" });
      // Clean the URL so a refresh doesn't re-open the modal.
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const [d, c] = await Promise.all([
        fetch("/api/crm/deals"),
        fetch("/api/crm/contacts"),
      ]);
      if (d.ok) setDeals(await d.json());
      if (c.ok) setContacts(await c.json());
    } catch {
      toast.error("Nepodarilo sa načítať pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byStage = useMemo(() => {
    const m: Record<Stage, Deal[]> = {
      LEAD: [], QUALIFIED: [], PROPOSAL: [], WON: [], LOST: [],
    };
    for (const d of deals) m[d.stage].push(d);
    for (const k of Object.keys(m) as Stage[]) {
      m[k].sort((a, b) => a.position - b.position);
    }
    return m;
  }, [deals]);

  const totals = useMemo(() => {
    const sum = (arr: Deal[]) => arr.reduce((s, d) => s + (d.expectedValue ?? 0), 0);
    return {
      LEAD:      sum(byStage.LEAD),
      QUALIFIED: sum(byStage.QUALIFIED),
      PROPOSAL:  sum(byStage.PROPOSAL),
      WON:       sum(byStage.WON),
      LOST:      sum(byStage.LOST),
    };
  }, [byStage]);

  // ── Move a deal to another stage (drop handler). Optimistic. ──
  async function moveDealToStage(dealId: string, toStage: Stage) {
    const current = deals.find((x) => x.id === dealId);
    if (!current || current.stage === toStage) return;

    const snapshot = deals;
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? { ...d, stage: toStage, position: 0, lastActivityAt: new Date().toISOString() }
          : d,
      ),
    );

    try {
      const res = await fetch(`/api/crm/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: toStage, position: 0 }),
      });
      if (!res.ok) throw new Error();
      if (toStage === "WON") toast.success("Deal uzavretý 🎉");
    } catch {
      setDeals(snapshot);
      toast.error("Presun zlyhal");
    }
  }

  async function deleteDeal(id: string) {
    if (!confirm("Zmazať deal?")) return;
    const snapshot = deals;
    setDeals((prev) => prev.filter((d) => d.id !== id));
    try {
      const res = await fetch(`/api/crm/deals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setDeals(snapshot);
      toast.error("Mazanie zlyhalo");
    }
  }

  return (
    <AppLayout title="Pipeline">
      <div className="p-4 md:p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/crm"
              className="inline-flex items-center gap-1 text-xs font-medium"
              style={{ color: D.muted }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              CRM
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-black" style={{ color: D.text }}>
                Pipeline
              </h1>
              <p className="text-xs" style={{ color: D.muted }}>
                Potiahni kartu do inej fázy pre presun.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: D.muted }}>
            <span>
              Otvorené:{" "}
              <strong style={{ color: D.text }}>
                {formatEur(totals.LEAD + totals.QUALIFIED + totals.PROPOSAL)}
              </strong>
            </span>
            <span>
              Uzavreté:{" "}
              <strong style={{ color: "#10b981" }}>{formatEur(totals.WON)}</strong>
            </span>
          </div>
        </div>

        {/* Board */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: D.muted }} />
          </div>
        ) : deals.length === 0 ? (
          <div
            className="rounded-2xl flex flex-col items-center justify-center py-16 px-6 text-center"
            style={{
              background: "var(--app-surface-2)",
              border: `1px dashed ${D.border}`,
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))",
                border: `1px solid ${D.border}`,
              }}
            >
              <Plus className="w-6 h-6" style={{ color: "#8b5cf6" }} />
            </div>
            <h3 className="text-base font-semibold mb-1.5" style={{ color: "#eef2ff" }}>
              Zatiaľ žiadne dealy
            </h3>
            <p className="text-xs max-w-sm mb-4" style={{ color: D.muted }}>
              Pipeline drží tvoje obchodné príležitosti od prvého kontaktu po uzavretie.
              Pridaj prvý — stačí názov, zvyšok doplníš neskôr.
            </p>
            <button
              onClick={() => setShowNew({ stage: "LEAD" })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
              style={{
                background: `linear-gradient(135deg, #6366f1, #8b5cf6)`,
                color: "white",
                boxShadow: "0 0 16px rgba(139,92,246,0.4)",
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Vytvoriť prvý deal
            </button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4 flex-1 min-h-[400px]">
            {STAGES.map((s) => {
              const items = byStage[s.id];
              const isDragOver = dragOverStage === s.id;
              return (
                <div
                  key={s.id}
                  onDragOver={(e) => {
                    if (!dragId) return;
                    e.preventDefault();
                    setDragOverStage(s.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverStage === s.id) setDragOverStage(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = dragId;
                    setDragId(null);
                    setDragOverStage(null);
                    if (id) moveDealToStage(id, s.id);
                  }}
                  className="flex-shrink-0 w-[280px] rounded-2xl flex flex-col"
                  style={{
                    background: isDragOver ? `${s.accent}18` : "rgba(99,102,241,0.04)",
                    border: `1px solid ${isDragOver ? s.accent : D.border}`,
                    transition: "background 120ms, border 120ms",
                  }}
                >
                  {/* Column header */}
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: s.accent }}
                      />
                      <h3 className="text-sm font-semibold" style={{ color: D.text }}>
                        {s.label}
                      </h3>
                      <span className="text-xs" style={{ color: D.mutedDark }}>
                        {items.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowNew({ stage: s.id })}
                      className="p-1 rounded-lg"
                      style={{ color: D.muted }}
                      aria-label="Pridať deal"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Column total */}
                  {totals[s.id] > 0 && (
                    <div
                      className="px-3 pb-2 text-xs"
                      style={{ color: D.mutedDark }}
                    >
                      {formatEur(totals[s.id])}
                    </div>
                  )}

                  {/* Cards */}
                  <div className="px-2 pb-2 space-y-2 overflow-y-auto flex-1">
                    {items.length === 0 ? (
                      <div
                        className="text-xs text-center py-6 px-2 rounded-xl"
                        style={{ color: D.mutedDark, border: `1px dashed ${D.border}` }}
                      >
                        Zatiaľ prázdne
                      </div>
                    ) : (
                      items.map((deal) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          onDragStart={() => setDragId(deal.id)}
                          onDragEnd={() => { setDragId(null); setDragOverStage(null); }}
                          onDelete={() => deleteDeal(deal.id)}
                          onMoveNext={() => {
                            const order: Stage[] = ["LEAD", "QUALIFIED", "PROPOSAL", "WON"];
                            const idx = order.indexOf(deal.stage);
                            if (idx >= 0 && idx < order.length - 1) {
                              moveDealToStage(deal.id, order[idx + 1]);
                            }
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New deal modal */}
      <AnimatePresence>
        {showNew && (
          <NewDealModal
            stage={showNew.stage}
            contacts={contacts}
            onClose={() => setShowNew(null)}
            onCreated={(d) => {
              setDeals((prev) => [d, ...prev]);
              setShowNew(null);
            }}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

// ── Single deal card ───────────────────────────────────────────
function DealCard({
  deal,
  onDragStart,
  onDragEnd,
  onDelete,
  onMoveNext,
}: {
  deal: Deal;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDelete: () => void;
  onMoveNext: () => void;
}) {
  const suggestion = nextAction(deal);
  const canAdvance = deal.stage !== "WON" && deal.stage !== "LOST";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className="p-3 rounded-xl cursor-grab active:cursor-grabbing group"
      style={{
        background: "rgba(12,15,26,0.7)",
        border: `1px solid ${D.border}`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-semibold leading-tight" style={{ color: D.text }}>
          {deal.title}
        </h4>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
          style={{ color: D.mutedDark }}
          aria-label="Zmazať"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {deal.contact && (
        <div
          className="flex items-center gap-1 text-xs mb-1.5"
          style={{ color: D.muted }}
        >
          <UserIcon className="w-3 h-3" />
          <span className="truncate">
            {deal.contact.name}
            {deal.contact.company ? ` · ${deal.contact.company}` : ""}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs" style={{ color: D.muted }}>
        {deal.expectedValue != null && (
          <span className="inline-flex items-center gap-1">
            <Euro className="w-3 h-3" />
            {formatEur(deal.expectedValue)}
          </span>
        )}
        {deal.expectedCloseAt && (
          <span className="inline-flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            {new Date(deal.expectedCloseAt).toLocaleDateString("sk-SK", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
      </div>

      {deal.note && (
        <p className="text-xs mt-2 line-clamp-2" style={{ color: D.mutedDark }}>
          {deal.note}
        </p>
      )}

      {suggestion && (
        <div
          className="mt-2 px-2 py-1.5 rounded-lg flex items-start gap-1.5 text-xs"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
            color: "#fbbf24",
          }}
        >
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{suggestion}</span>
        </div>
      )}

      {canAdvance && (
        <button
          onClick={onMoveNext}
          className="mt-2 w-full text-xs px-2 py-1.5 rounded-lg inline-flex items-center justify-center gap-1"
          style={{
            background: D.dim,
            border: `1px solid ${D.border}`,
            color: D.text,
          }}
        >
          Posunúť ďalej <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── New deal modal ─────────────────────────────────────────────
function NewDealModal({
  stage,
  contacts,
  onClose,
  onCreated,
}: {
  stage: Stage;
  contacts: Contact[];
  onClose: () => void;
  onCreated: (d: Deal) => void;
}) {
  const [title, setTitle] = useState("");
  const [contactId, setContactId] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [closeAt, setCloseAt] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) {
      toast.error("Názov dealu je povinný");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/crm/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          stage,
          contactId: contactId || undefined,
          expectedValue: value ? Math.round(Number(value) * 100) : undefined,
          expectedCloseAt: closeAt || undefined,
          note: note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Uloženie zlyhalo");
      }
      const deal = (await res.json()) as Deal;
      toast.success("Deal pridaný");
      onCreated(deal);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Uloženie zlyhalo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={() => !saving && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "#0a0d1a", border: `1px solid ${D.border}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: D.text }}>
            Nový deal · {STAGES.find((s) => s.id === stage)?.label}
          </h2>
          <button onClick={onClose} disabled={saving} className="p-1">
            <X className="w-5 h-5" style={{ color: D.muted }} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: D.muted }}>
              Názov *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="napr. Hypotéka — rodina Kováčová"
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: D.dim, border: `1px solid ${D.border}`, color: D.text }}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: D.muted }}>
              Kontakt (voliteľné)
            </label>
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: D.dim, border: `1px solid ${D.border}`, color: D.text }}
            >
              <option value="">— žiadny —</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` · ${c.company}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: D.muted }}>
                Hodnota (€)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="5000"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: D.dim, border: `1px solid ${D.border}`, color: D.text }}
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: D.muted }}>
                Uzavrieť do
              </label>
              <input
                type="date"
                value={closeAt}
                onChange={(e) => setCloseAt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: D.dim, border: `1px solid ${D.border}`, color: D.text }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: D.muted }}>
              Poznámka
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Detaily, kontext, ďalší krok…"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
              style={{ background: D.dim, border: `1px solid ${D.border}`, color: D.text }}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: D.dim, border: `1px solid ${D.border}`, color: D.text }}
          >
            Zrušiť
          </button>
          <button
            onClick={save}
            disabled={saving || !title.trim()}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: `linear-gradient(135deg,${D.indigo},${D.violet})`, color: "white" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Uložiť
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
