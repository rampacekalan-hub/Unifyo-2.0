"use client";
// src/app/admin/feedback/FeedbackAdmin.tsx
// Interactive list — filter by status + kind, mark SEEN / ACTIONED /
// ARCHIVED. Keeps raw message visible (no truncation) because that's
// exactly what we came here to read.

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  MessageCircleHeart, Bug, Lightbulb, ThumbsUp, MessageSquare, ArrowLeft,
  Check, Archive, Eye, ExternalLink, User, Mail,
} from "lucide-react";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  text: "#eef2ff",
  muted: "#94a3b8",
  mutedDark: "#64748b",
  border: "rgba(99,102,241,0.22)",
};

interface Row {
  id: string;
  kind: string;
  message: string;
  rating: number | null;
  page: string | null;
  userAgent: string | null;
  status: string;
  createdAt: string;
  userEmail: string | null;
  userName: string | null;
}

const KIND_META: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  bug:     { label: "Bug",    Icon: Bug,          color: D.rose },
  idea:    { label: "Nápad",  Icon: Lightbulb,    color: D.amber },
  praise:  { label: "Chvála", Icon: ThumbsUp,     color: D.emerald },
  general: { label: "Ostatné", Icon: MessageSquare, color: D.indigo },
};

const STATUSES = ["NEW", "SEEN", "ACTIONED", "ARCHIVED"] as const;

export default function FeedbackAdmin({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<"ALL" | "NEW" | "SEEN" | "ACTIONED" | "ARCHIVED">("NEW");
  const [kindFilter, setKindFilter] = useState<"ALL" | keyof typeof KIND_META>("ALL");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter !== "ALL" && r.status !== filter) return false;
      if (kindFilter !== "ALL" && r.kind !== kindFilter) return false;
      return true;
    });
  }, [rows, filter, kindFilter]);

  const setStatus = async (id: string, status: string) => {
    const prev = rows;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status aktualizovaný");
    } catch {
      setRows(prev);
      toast.error("Nepodarilo sa uložiť");
    }
  };

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: rows.length };
    for (const s of STATUSES) map[s] = rows.filter((r) => r.status === s).length;
    return map;
  }, [rows]);

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "#05070f", color: D.text }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg"
              style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.border}`, color: D.muted }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <MessageCircleHeart className="w-5 h-5" style={{ color: D.violet }} />
                <h1 className="text-xl font-bold">Feedback</h1>
              </div>
              <p className="text-xs" style={{ color: D.muted }}>
                Všetko čo používatelia poslali cez widget
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-2 mb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[0.65rem] uppercase tracking-widest mr-1" style={{ color: D.mutedDark }}>
              Status
            </span>
            {(["ALL", ...STATUSES] as const).map((s) => {
              const active = filter === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className="px-2.5 py-1 rounded-md text-[0.65rem] font-semibold transition"
                  style={{
                    background: active ? "rgba(139,92,246,0.2)" : "rgba(5,7,15,0.5)",
                    border: `1px solid ${active ? "rgba(139,92,246,0.55)" : D.border}`,
                    color: active ? D.text : D.muted,
                  }}
                >
                  {s} <span style={{ color: D.mutedDark }}>({counts[s] ?? 0})</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[0.65rem] uppercase tracking-widest mr-1" style={{ color: D.mutedDark }}>
              Typ
            </span>
            <button
              onClick={() => setKindFilter("ALL")}
              className="px-2.5 py-1 rounded-md text-[0.65rem] font-semibold"
              style={{
                background: kindFilter === "ALL" ? "rgba(139,92,246,0.2)" : "rgba(5,7,15,0.5)",
                border: `1px solid ${kindFilter === "ALL" ? "rgba(139,92,246,0.55)" : D.border}`,
                color: kindFilter === "ALL" ? D.text : D.muted,
              }}
            >
              Všetky
            </button>
            {Object.entries(KIND_META).map(([id, meta]) => {
              const active = kindFilter === id;
              const Icon = meta.Icon;
              return (
                <button
                  key={id}
                  onClick={() => setKindFilter(id as keyof typeof KIND_META)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[0.65rem] font-semibold"
                  style={{
                    background: active ? `${meta.color}22` : "rgba(5,7,15,0.5)",
                    border: `1px solid ${active ? `${meta.color}66` : D.border}`,
                    color: active ? D.text : D.muted,
                  }}
                >
                  <Icon className="w-3 h-3" style={{ color: active ? meta.color : D.muted }} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center text-sm"
            style={{ background: "rgba(10,12,24,0.6)", border: `1px solid ${D.border}`, color: D.muted }}
          >
            Žiadne položky pre tento filter.
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((r) => {
              const meta = KIND_META[r.kind] ?? KIND_META.general;
              const Icon = meta.Icon;
              return (
                <li
                  key={r.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(10,12,24,0.7)",
                    border: `1px solid ${r.status === "NEW" ? meta.color + "55" : D.border}`,
                  }}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${meta.color}22` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[0.65rem]" style={{ color: D.muted }}>
                        <span className="font-semibold uppercase tracking-widest" style={{ color: meta.color }}>
                          {meta.label}
                        </span>
                        <span>·</span>
                        <span>{new Date(r.createdAt).toLocaleString("sk-SK")}</span>
                        {r.rating && (
                          <>
                            <span>·</span>
                            <span>{["😡", "🙁", "😐", "🙂", "😍"][r.rating - 1]}</span>
                          </>
                        )}
                        <span className="ml-auto px-1.5 py-0.5 rounded text-[0.6rem]"
                          style={{
                            background: r.status === "NEW" ? "rgba(139,92,246,0.2)" : "rgba(148,163,184,0.15)",
                            color: r.status === "NEW" ? D.violet : D.muted,
                          }}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: D.text }}>
                        {r.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[0.65rem]" style={{ color: D.mutedDark }}>
                        {r.userEmail ? (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {r.userName ?? r.userEmail}
                            <a href={`mailto:${r.userEmail}`} className="flex items-center gap-0.5 hover:underline" style={{ color: D.muted }}>
                              <Mail className="w-3 h-3" /> {r.userEmail}
                            </a>
                          </span>
                        ) : (
                          <span>Anonymný</span>
                        )}
                        {r.page && (
                          <a
                            href={r.page}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> {r.page.replace(/^https?:\/\//, "").slice(0, 60)}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {r.status !== "ARCHIVED" && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: `1px dashed ${D.border}` }}>
                      {r.status === "NEW" && (
                        <ActionButton onClick={() => setStatus(r.id, "SEEN")} color={D.indigo} Icon={Eye} label="Označ ako prečítané" />
                      )}
                      <ActionButton onClick={() => setStatus(r.id, "ACTIONED")} color={D.emerald} Icon={Check} label="Vyriešené" />
                      <ActionButton onClick={() => setStatus(r.id, "ARCHIVED")} color={D.mutedDark} Icon={Archive} label="Archív" />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  onClick, color, Icon, label,
}: {
  onClick: () => void; color: string; Icon: React.ElementType; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[0.65rem] font-semibold transition"
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      <Icon className="w-3 h-3" /> {label}
    </button>
  );
}
