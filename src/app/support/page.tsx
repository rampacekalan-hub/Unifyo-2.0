"use client";
// src/app/support/page.tsx
// User-facing support inbox. Lists their tickets and lets them open
// a new one. Click into a ticket to view full thread + reply. SLA
// hint shown by tier (Basic best-effort, Pro 24h, Enterprise 4h).

import { useEffect, useState } from "react";
import { LifeBuoy, Plus, Send, X, ChevronRight, Clock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { SkeletonCard } from "@/components/ui/Skeleton";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "var(--app-text-subtle)",
  border: "var(--app-border)",
};

interface TicketRow {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  _count: { replies: number };
}

interface Reply {
  id: string;
  body: string;
  isStaff: boolean;
  createdAt: string;
}

interface TicketFull extends TicketRow {
  body: string;
  replies: Reply[];
}

const STATUS_COLOR: Record<string, string> = {
  OPEN: D.amber,
  IN_PROGRESS: D.indigo,
  RESOLVED: D.emerald,
  CLOSED: D.mutedDark,
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Otvorené",
  IN_PROGRESS: "Rieši sa",
  RESOLVED: "Vyriešené",
  CLOSED: "Uzavreté",
};

export default function SupportPage() {
  const [list, setList] = useState<TicketRow[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [open, setOpen] = useState<TicketFull | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/support");
    if (res.ok) setList(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function openTicket(id: string) {
    const res = await fetch(`/api/support/${id}`);
    if (res.ok) setOpen(await res.json());
  }

  async function submit() {
    if (!subject.trim() || !body.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, category, priority }),
      });
      if (res.ok) {
        setShowForm(false);
        setSubject(""); setBody(""); setCategory("general"); setPriority("normal");
        await load();
      }
    } finally { setSaving(false); }
  }

  async function sendReply() {
    if (!open || !reply.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/support/${open.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      if (res.ok) {
        setReply("");
        await openTicket(open.id);
      }
    } finally { setSaving(false); }
  }

  async function closeTicket() {
    if (!open) return;
    if (!confirm("Označiť ticket ako uzavretý?")) return;
    const res = await fetch(`/api/support/${open.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    });
    if (res.ok) {
      setOpen(null);
      await load();
    }
  }

  return (
    <AppLayout title="Podpora" subtitle="Podpora —">
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
        {open ? (
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "var(--app-surface)", border: `1px solid ${D.border}` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold" style={{ color: D.text }}>{open.subject}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[0.65rem] px-2 py-0.5 rounded-full font-semibold uppercase"
                    style={{ background: `${STATUS_COLOR[open.status]}22`, color: STATUS_COLOR[open.status] }}
                  >
                    {STATUS_LABEL[open.status] ?? open.status}
                  </span>
                  <span className="text-[0.7rem]" style={{ color: D.muted }}>{open.category}</span>
                </div>
              </div>
              <button onClick={() => setOpen(null)} style={{ color: D.muted }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="rounded-xl p-3 text-sm whitespace-pre-wrap"
              style={{ background: "var(--app-surface-2)", color: D.text }}
            >
              {open.body}
            </div>

            {open.replies.map(r => (
              <div
                key={r.id}
                className="rounded-xl p-3 text-sm whitespace-pre-wrap"
                style={{
                  background: r.isStaff ? "rgba(99,102,241,0.10)" : "var(--app-surface-2)",
                  border: r.isStaff ? `1px solid ${D.indigo}40` : `1px solid ${D.border}`,
                  color: D.text,
                }}
              >
                <p className="text-[0.65rem] mb-1 font-semibold uppercase" style={{ color: r.isStaff ? D.indigo : D.muted }}>
                  {r.isStaff ? "Unifyo podpora" : "Ty"}
                </p>
                {r.body}
              </div>
            ))}

            {open.status !== "CLOSED" && (
              <div className="space-y-2">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="Tvoja odpoveď…"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm resize-y"
                  style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={sendReply}
                    disabled={saving || !reply.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${D.violet}, ${D.indigo})` }}
                  >
                    <Send className="w-4 h-4" /> Odoslať
                  </button>
                  <button
                    onClick={closeTicket}
                    className="text-xs px-3 py-2 rounded-lg"
                    style={{ color: D.muted, border: `1px solid ${D.border}` }}
                  >
                    Uzavrieť ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: D.muted }}>
                <Clock className="inline w-3 h-3 mr-1" />
                SLA: Basic — best effort · Pro — do 24h · Enterprise — do 4h
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${D.violet}, ${D.indigo})` }}
              >
                <Plus className="w-4 h-4" /> Nový ticket
              </button>
            </div>

            {showForm && (
              <div
                className="rounded-2xl p-5 space-y-3"
                style={{ background: "var(--app-surface)", border: `1px solid ${D.border}` }}
              >
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Predmet"
                  maxLength={200}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }}
                  >
                    <option value="general">Všeobecné</option>
                    <option value="bug">Chyba</option>
                    <option value="how-to">Ako na to</option>
                    <option value="billing">Fakturácia</option>
                    <option value="feature">Návrh funkcie</option>
                  </select>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }}
                  >
                    <option value="low">Nízka priorita</option>
                    <option value="normal">Normálna</option>
                    <option value="high">Vysoká</option>
                    <option value="urgent">Urgentná (Enterprise)</option>
                  </select>
                </div>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Popíš, s čím potrebuješ pomôcť…"
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg text-sm resize-y"
                  style={{ background: "var(--app-surface-2)", border: `1px solid ${D.border}`, color: D.text }}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={submit}
                    disabled={saving || !subject.trim() || !body.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${D.violet}, ${D.indigo})` }}
                  >
                    <Send className="w-4 h-4" /> Odoslať
                  </button>
                  <button onClick={() => setShowForm(false)} className="text-xs px-3 py-2 rounded-lg" style={{ color: D.muted }}>
                    Zrušiť
                  </button>
                </div>
              </div>
            )}

            {list === null ? (
              <SkeletonCard lines={2} />
            ) : list.length === 0 ? (
              <div
                className="rounded-2xl p-10 text-center"
                style={{ background: "var(--app-surface)", border: `1px solid ${D.border}` }}
              >
                <LifeBuoy className="w-8 h-8 mx-auto mb-3" style={{ color: D.muted }} />
                <p className="text-sm" style={{ color: D.muted }}>Zatiaľ žiadne tickety.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {list.map(t => (
                  <button
                    key={t.id}
                    onClick={() => openTicket(t.id)}
                    className="w-full rounded-2xl p-4 text-left flex items-center gap-3 transition-colors hover:opacity-90"
                    style={{ background: "var(--app-surface)", border: `1px solid ${D.border}` }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold truncate" style={{ color: D.text }}>{t.subject}</h4>
                        <span
                          className="text-[0.6rem] px-1.5 py-0.5 rounded font-semibold uppercase flex-shrink-0"
                          style={{ background: `${STATUS_COLOR[t.status]}22`, color: STATUS_COLOR[t.status] }}
                        >
                          {STATUS_LABEL[t.status] ?? t.status}
                        </span>
                      </div>
                      <p className="text-[0.7rem] mt-0.5" style={{ color: D.muted }}>
                        {t.category} · {t._count.replies} odpovedí · {new Date(t.updatedAt).toLocaleDateString("sk-SK")}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: D.mutedDark }} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
