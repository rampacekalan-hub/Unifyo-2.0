"use client";
// src/app/calls/page.tsx
// Calls — Fáza A. Upload an audio file (MP3/M4A/WAV ≤ 50 MB), we push
// it through Whisper + GPT summariser and land it in the list. Click
// any row for transcript + key points + action items. Everything is
// synchronous for now; long uploads block the UI until done.

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  Phone, Upload, Loader2, Check, X, Clock, AlertCircle, Trash2,
  Sparkles, FileAudio, ListChecks, Quote,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  sky: "#22d3ee",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  text: "#eef2ff",
  muted: "#94a3b8",
  mutedDark: "#64748b",
  border: "rgba(99,102,241,0.22)",
};

interface CallRow {
  id: string;
  title: string;
  status: "UPLOADED" | "TRANSCRIBING" | "DONE" | "FAILED";
  durationSec: number | null;
  createdAt: string;
  summary: string | null;
}

interface CallDetail extends CallRow {
  transcript: string | null;
  keyPoints: string[] | null;
  actionItems: Array<{ title: string; ownerHint?: string }> | null;
  originalName?: string;
  sizeBytes?: number;
  mimeType?: string;
  errorMessage?: string | null;
}

function formatDuration(sec: number | null): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("sk-SK", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default function CallsPage() {
  const [rows, setRows] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [active, setActive] = useState<CallDetail | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/calls");
      if (res.ok) setRows(await res.json());
    } catch {
      toast.error("Nepodarilo sa načítať hovory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onFilePicked = async (f: File | null) => {
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) {
      toast.error("Súbor je väčší ako 50 MB");
      return;
    }
    const fd = new FormData();
    fd.append("file", f);
    fd.append("title", f.name.replace(/\.[^.]+$/, ""));

    setUploading(true);
    setProgress("Nahrávam…");
    try {
      // Give the user a tiny delayed message so they know we're still
      // alive during the long Whisper step.
      const t = setTimeout(() => setProgress("Prepisujem a sumarizujem…"), 3000);
      const res = await fetch("/api/calls", { method: "POST", body: fd });
      clearTimeout(t);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "upload_failed");
      toast.success("Hovor spracovaný");
      await load();
      if (data?.id) {
        setActive(data as CallDetail);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload zlyhal");
    } finally {
      setUploading(false);
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const openDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/calls/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setActive({
        ...data,
        keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
        actionItems: Array.isArray(data.actionItems) ? data.actionItems : [],
      });
    } catch {
      toast.error("Detail sa nepodarilo načítať");
    }
  };

  const deleteRow = async (id: string) => {
    if (!confirm("Zmazať tento hovor aj s prepisom?")) return;
    try {
      const res = await fetch(`/api/calls/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Zmazané");
      setActive(null);
      setRows((r) => r.filter((x) => x.id !== id));
    } catch {
      toast.error("Mazanie zlyhalo");
    }
  };

  return (
    <AppLayout title="Hovory" subtitle="Hovory —">
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
        {/* Hero / upload */}
        <div
          className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.14), rgba(139,92,246,0.10))",
            border: `1px solid ${D.border}`,
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
                boxShadow: "0 0 20px rgba(139,92,246,0.35)",
              }}
            >
              <Phone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: D.text }}>
                Prepis + AI zhrnutie hovoru
              </h1>
              <p className="text-xs sm:text-sm mb-4" style={{ color: D.muted }}>
                Nahraj audio (MP3, M4A, WAV, OGG, max 50 MB) — dostaneš slovenský prepis,
                krátke zhrnutie a úlohy ktoré z hovoru vyplynuli.
              </p>

              <input
                ref={fileRef}
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm,.flac"
                className="hidden"
                onChange={(e) => onFilePicked(e.target.files?.[0] ?? null)}
                disabled={uploading}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
                  color: "white",
                  boxShadow: "0 0 18px rgba(99,102,241,0.4)",
                }}
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {progress ?? "Spracovávam…"}</>
                ) : (
                  <><Upload className="w-4 h-4" /> Nahrať hovor</>
                )}
              </button>
              {uploading && (
                <p className="mt-2 text-[0.7rem]" style={{ color: D.muted }}>
                  Nezatváraj okno. Dlhšie hovory môžu trvať 1–3 minúty.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div
          className="rounded-2xl p-4 sm:p-5"
          style={{ background: "rgba(10,12,24,0.6)", border: `1px solid ${D.border}` }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: D.muted }}>
            Tvoje hovory
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: D.muted }} />
            </div>
          ) : rows.length === 0 ? (
            <EmptyCalls />
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => openDetail(r.id)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition"
                    style={{
                      background: "rgba(5,7,15,0.6)",
                      border: `1px solid ${D.border}`,
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(99,102,241,0.14)" }}
                    >
                      <FileAudio className="w-4 h-4" style={{ color: D.indigo }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: D.text }}>
                        {r.title}
                      </div>
                      <div className="text-[0.65rem] flex items-center gap-2" style={{ color: D.muted }}>
                        <Clock className="w-3 h-3" /> {formatDate(r.createdAt)}
                        {r.durationSec ? <>· {formatDuration(r.durationSec)}</> : null}
                      </div>
                    </div>
                    <StatusPill status={r.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {active && (
          <CallDetailOverlay row={active} onClose={() => setActive(null)} onDelete={deleteRow} />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function StatusPill({ status }: { status: CallRow["status"] }) {
  const cfg =
    status === "DONE"
      ? { bg: "rgba(16,185,129,0.14)", color: D.emerald, label: "Hotovo", Icon: Check }
      : status === "FAILED"
      ? { bg: "rgba(244,63,94,0.14)", color: D.rose, label: "Zlyhalo", Icon: AlertCircle }
      : { bg: "rgba(245,158,11,0.14)", color: D.amber, label: "Spracúvam", Icon: Loader2 };
  const Icon = cfg.Icon;
  return (
    <span
      className="text-[0.65rem] font-medium flex items-center gap-1 px-2 py-1 rounded-md flex-shrink-0"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <Icon className={`w-3 h-3 ${status === "TRANSCRIBING" || status === "UPLOADED" ? "animate-spin" : ""}`} />
      {cfg.label}
    </span>
  );
}

function EmptyCalls() {
  return (
    <div
      className="flex flex-col items-center text-center py-10 px-4 rounded-xl"
      style={{ border: `1px dashed ${D.border}` }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: "rgba(99,102,241,0.12)" }}
      >
        <Sparkles className="w-5 h-5" style={{ color: D.violet }} />
      </div>
      <p className="text-sm font-medium mb-1" style={{ color: D.text }}>
        Zatiaľ žiadne hovory
      </p>
      <p className="text-xs max-w-sm" style={{ color: D.muted }}>
        Nahraj prvé audio a AI ti vráti prepis, kľúčové body a úlohy z hovoru.
      </p>
    </div>
  );
}

function CallDetailOverlay({
  row, onClose, onDelete,
}: {
  row: CallDetail; onClose: () => void; onDelete: (id: string) => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80]"
        style={{ background: "rgba(3,4,10,0.7)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.25 }}
        className="fixed right-0 top-0 bottom-0 z-[81] w-full sm:max-w-xl overflow-y-auto"
        style={{
          background: "rgba(10,12,24,0.97)",
          borderLeft: `1px solid ${D.border}`,
        }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
          style={{ background: "rgba(10,12,24,0.95)", borderBottom: `1px solid ${D.border}`, backdropFilter: "blur(18px)" }}
        >
          <div className="min-w-0 flex-1 pr-3">
            <h2 className="text-sm font-semibold truncate" style={{ color: D.text }}>{row.title}</h2>
            <p className="text-[0.7rem]" style={{ color: D.muted }}>
              {formatDate(row.createdAt)} · {formatDuration(row.durationSec)}
            </p>
          </div>
          <button
            onClick={() => onDelete(row.id)}
            className="p-2 rounded-lg mr-1"
            style={{ color: D.rose }}
            title="Zmazať"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg"
            style={{ color: D.muted }}
            aria-label="Zavrieť"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {row.status === "FAILED" && (
            <div className="p-3 rounded-xl text-xs"
              style={{ background: "rgba(244,63,94,0.10)", border: "1px solid rgba(244,63,94,0.35)", color: "#fca5a5" }}>
              <strong>Spracovanie zlyhalo.</strong>
              <div className="mt-1">{row.errorMessage ?? "Skús to znova s iným súborom."}</div>
            </div>
          )}

          {row.summary && (
            <Panel title="Zhrnutie" Icon={Sparkles}>
              <p className="text-sm leading-relaxed" style={{ color: D.text }}>{row.summary}</p>
            </Panel>
          )}

          {row.keyPoints && row.keyPoints.length > 0 && (
            <Panel title="Kľúčové body" Icon={ListChecks}>
              <ul className="space-y-1.5">
                {row.keyPoints.map((p, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: D.text }}>
                    <span style={{ color: D.violet }}>•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {row.actionItems && row.actionItems.length > 0 && (
            <Panel title="Úlohy z hovoru" Icon={Check}>
              <ul className="space-y-1.5">
                {row.actionItems.map((a, i) => (
                  <li key={i} className="text-sm flex gap-2 items-start" style={{ color: D.text }}>
                    <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: D.emerald }} />
                    <span className="flex-1">
                      {a.title}
                      {a.ownerHint && (
                        <span className="ml-2 text-[0.65rem]" style={{ color: D.muted }}>
                          ({a.ownerHint})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {row.transcript && (
            <Panel title="Prepis" Icon={Quote}>
              <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: D.muted }}>
                {row.transcript}
              </p>
            </Panel>
          )}
        </div>
      </motion.aside>
    </>
  );
}

function Panel({
  title, Icon, children,
}: {
  title: string; Icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl p-4"
      style={{ background: "rgba(5,7,15,0.6)", border: `1px solid ${D.border}` }}
    >
      <h3 className="text-[0.7rem] font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: D.muted }}>
        <Icon className="w-3.5 h-3.5" /> {title}
      </h3>
      {children}
    </section>
  );
}
