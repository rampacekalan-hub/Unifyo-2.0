"use client";
// src/app/email/page.tsx
// Gmail inbox + compose. Falls back to "not connected" state when the
// user hasn't linked Google yet, with a direct CTA to /settings/integrations.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Mail,
  Loader2,
  RefreshCw,
  Search,
  Send,
  X,
  Link2,
  Inbox,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

interface GmailMessageSummary {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
}

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "var(--app-text-subtle)",
  indigoDim: "rgba(99,102,241,0.08)",
  indigoBorder: "var(--app-border)",
};

type LoadState =
  | { kind: "loading" }
  | { kind: "not_connected" }
  | { kind: "error"; msg: string }
  | { kind: "ready"; messages: GmailMessageSummary[] };

interface MessageDetail {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  html: string | null;
  text: string | null;
  snippet: string;
}

export default function EmailPage() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [active, setActive] = useState<MessageDetail | null>(null);
  const [loadingActive, setLoadingActive] = useState<string | null>(null);

  async function openMessage(id: string) {
    // Fetch full body + mark as read. We preserve the list state so the
    // user can close the overlay and immediately click another item.
    setLoadingActive(id);
    try {
      const res = await fetch(`/api/gmail/message/${id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.hint ?? data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as MessageDetail;
      setActive(data);
      // Reflect "read" state in the list optimistically.
      setState((s) =>
        s.kind === "ready"
          ? { ...s, messages: s.messages.map((m) => (m.id === id ? { ...m, unread: false } : m)) }
          : s,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "E-mail sa nepodarilo otvoriť");
    } finally {
      setLoadingActive(null);
    }
  }

  async function load(q?: string) {
    setState({ kind: "loading" });
    try {
      const url = q ? `/api/gmail/inbox?q=${encodeURIComponent(q)}` : "/api/gmail/inbox";
      const res = await fetch(url);
      if (res.status === 409) {
        setState({ kind: "not_connected" });
        return;
      }
      if (!res.ok) {
        setState({ kind: "error", msg: `HTTP ${res.status}` });
        return;
      }
      const json = (await res.json()) as { messages: GmailMessageSummary[] };
      setState({ kind: "ready", messages: json.messages });
    } catch (e) {
      setState({ kind: "error", msg: e instanceof Error ? e.message : "Chyba" });
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AppLayout title="Email" subtitle="Email —">
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        {/* Header / toolbar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
                border: `1px solid ${D.indigoBorder}`,
              }}
            >
              <Mail className="w-4 h-4" style={{ color: D.indigo }} />
            </div>
            <h1 className="text-xl md:text-2xl font-black" style={{ color: D.text }}>
              Gmail
            </h1>
          </div>
          <div className="flex-1" />
          {state.kind === "ready" && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  load(query.trim() || undefined);
                }}
                className="flex items-center gap-2 rounded-xl px-3 py-1.5"
                style={{
                  background: "var(--app-surface-2)",
                  border: `1px solid ${D.indigoBorder}`,
                }}
              >
                <Search className="w-3.5 h-3.5" style={{ color: D.muted }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Hľadať…"
                  className="bg-transparent outline-none text-xs w-36"
                  style={{ color: D.text }}
                />
              </form>
              <button
                onClick={() => load(query.trim() || undefined)}
                className="p-2 rounded-xl"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  border: `1px solid ${D.indigoBorder}`,
                  color: D.indigo,
                }}
                title="Obnoviť"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setComposing(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
                  color: "#fff",
                  boxShadow: "0 0 14px rgba(99,102,241,0.3)",
                }}
              >
                <Send className="w-3.5 h-3.5" />
                Nový e-mail
              </button>
            </>
          )}
        </div>

        {state.kind === "loading" && <LoadingCard />}
        {state.kind === "not_connected" && <NotConnectedCard />}
        {state.kind === "error" && <ErrorCard msg={state.msg} onRetry={() => load()} />}
        {state.kind === "ready" && (
          <InboxList
            messages={state.messages}
            onOpen={openMessage}
            loadingId={loadingActive}
          />
        )}

        {composing && (
          <ComposeModal
            onClose={() => setComposing(false)}
            onSent={() => {
              setComposing(false);
              toast.success("E-mail odoslaný");
              load();
            }}
          />
        )}

        {active && (
          <MessageOverlay
            message={active}
            onClose={() => setActive(null)}
            onReply={() => {
              setActive(null);
              setComposing(true);
              // TODO: pre-fill Compose with reply subject & recipient.
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

// ── States ───────────────────────────────────────────────────────
function LoadingCard() {
  return (
    <div
      className="rounded-2xl p-8 flex items-center justify-center gap-3"
      style={{ background: "var(--app-surface-2)", border: `1px solid ${D.indigoBorder}` }}
    >
      <Loader2 className="w-4 h-4 animate-spin" style={{ color: D.indigo }} />
      <span className="text-xs" style={{ color: D.muted }}>
        Načítavam Gmail…
      </span>
    </div>
  );
}

function NotConnectedCard() {
  return (
    <div
      className="rounded-2xl p-8 text-center"
      style={{ background: "var(--app-surface-2)", border: `1px solid ${D.indigoBorder}` }}
    >
      <div
        className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.18))",
          border: `1px solid ${D.indigoBorder}`,
        }}
      >
        <Inbox className="w-6 h-6" style={{ color: D.indigo }} />
      </div>
      <h2 className="text-lg font-black mb-2" style={{ color: D.text }}>
        Pripoj Gmail
      </h2>
      <p className="text-xs mb-5 max-w-md mx-auto" style={{ color: D.muted }}>
        Všetky emaily uvidíš tu, bez prepínania kariet. AI ich priradí ku kontaktom
        a navrhne follow-up.
      </p>
      <Link
        href="/settings/integrations"
        className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
          color: "#fff",
        }}
      >
        <Link2 className="w-3.5 h-3.5" />
        Pripojiť Google
      </Link>
    </div>
  );
}

function ErrorCard({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{
        background: "rgba(239,68,68,0.04)",
        border: "1px solid rgba(239,68,68,0.2)",
      }}
    >
      <p className="text-sm font-semibold mb-1" style={{ color: "#ef4444" }}>
        Gmail nedostupný
      </p>
      <p className="text-[11px] mb-3" style={{ color: D.muted }}>
        {msg}
      </p>
      <button
        onClick={onRetry}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg"
        style={{ background: "rgba(99,102,241,0.08)", border: `1px solid ${D.indigoBorder}`, color: D.indigo }}
      >
        Skúsiť znovu
      </button>
    </div>
  );
}

function InboxList({
  messages, onOpen, loadingId,
}: {
  messages: GmailMessageSummary[];
  onOpen: (id: string) => void;
  loadingId: string | null;
}) {
  if (messages.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center text-xs"
        style={{ background: "var(--app-surface-2)", border: `1px solid ${D.indigoBorder}`, color: D.muted }}
      >
        Inbox je prázdny. ✨
      </div>
    );
  }
  return (
    <ul
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--app-surface-2)", border: `1px solid ${D.indigoBorder}` }}
    >
      {messages.map((m, i) => (
        <li key={m.id}>
          <button
            onClick={() => onOpen(m.id)}
            disabled={loadingId !== null}
            className="w-full px-4 py-3 flex items-start gap-3 transition-colors text-left hover:opacity-90"
            style={{
              borderTop: i === 0 ? "none" : `1px solid ${D.indigoBorder}`,
              background: m.unread ? "rgba(99,102,241,0.04)" : "transparent",
              cursor: "pointer",
            }}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
              style={{ background: m.unread ? D.indigo : "transparent", border: m.unread ? "none" : `1px solid ${D.mutedDark}` }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-xs font-semibold truncate"
                  style={{ color: m.unread ? D.text : D.muted, maxWidth: "14rem" }}
                >
                  {stripAddress(m.from)}
                </span>
                <span className="text-[10px] ml-auto flex-shrink-0" style={{ color: D.mutedDark }}>
                  {loadingId === m.id ? "…" : formatDate(m.date)}
                </span>
              </div>
              <div
                className="text-xs truncate mt-0.5"
                style={{ color: m.unread ? D.text : D.muted, fontWeight: m.unread ? 600 : 500 }}
              >
                {m.subject}
              </div>
              <div className="text-[11px] truncate mt-0.5" style={{ color: D.mutedDark }}>
                {m.snippet}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function MessageOverlay({
  message, onClose, onReply,
}: {
  message: MessageDetail;
  onClose: () => void;
  onReply: () => void;
}) {
  // Prefer HTML when Gmail gave us one — emails are usually styled and
  // stripping to plain text loses context. We render inside an iframe
  // srcDoc so Gmail's inline styles / images don't leak into our CSS.
  const hasHtml = !!message.html && message.html.length > 0;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[80]"
        style={{ background: "rgba(3,4,10,0.65)", backdropFilter: "blur(4px)" }}
      />
      <div
        className="fixed right-0 top-0 bottom-0 z-[81] w-full sm:max-w-2xl flex flex-col"
        style={{
          background: "var(--app-surface)",
          borderLeft: `1px solid ${D.indigoBorder}`,
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3 gap-3"
          style={{ borderBottom: `1px solid ${D.indigoBorder}` }}
        >
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold truncate" style={{ color: D.text }}>
              {message.subject}
            </h2>
            <p className="text-[0.7rem] truncate" style={{ color: D.muted }}>
              Od {stripAddress(message.from)} · {formatDate(message.date)}
            </p>
          </div>
          <button
            onClick={onReply}
            className="flex items-center gap-1 text-[0.7rem] font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{
              background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
              color: "white",
            }}
          >
            <Send className="w-3 h-3" /> Odpovedať
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg flex-shrink-0"
            style={{ color: D.muted }}
            aria-label="Zavrieť"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {hasHtml ? (
            <iframe
              title="E-mail"
              srcDoc={message.html!}
              sandbox=""
              className="w-full h-full"
              style={{ border: "none", minHeight: 400, background: "white" }}
            />
          ) : (
            <pre
              className="p-5 whitespace-pre-wrap text-sm"
              style={{ color: D.text, fontFamily: "ui-monospace, Menlo, monospace" }}
            >
              {message.text || message.snippet}
            </pre>
          )}
        </div>
      </div>
    </>
  );
}

function ComposeModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      onSent();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Odoslanie zlyhalo");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl p-5"
        style={{ background: "rgba(15,18,34,0.95)", border: `1px solid ${D.indigoBorder}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: D.text }}>
            Nový e-mail
          </h3>
          <button onClick={onClose} className="p-1">
            <X className="w-4 h-4" style={{ color: D.muted }} />
          </button>
        </div>
        <div className="space-y-3">
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Komu (email@…)"
            className="w-full text-xs px-3 py-2 rounded-lg outline-none"
            style={{ background: "var(--app-surface)", border: `1px solid ${D.indigoBorder}`, color: D.text }}
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Predmet"
            className="w-full text-xs px-3 py-2 rounded-lg outline-none"
            style={{ background: "var(--app-surface)", border: `1px solid ${D.indigoBorder}`, color: D.text }}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Správa…"
            rows={8}
            className="w-full text-xs px-3 py-2 rounded-lg outline-none resize-none"
            style={{ background: "var(--app-surface)", border: `1px solid ${D.indigoBorder}`, color: D.text }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 text-xs font-semibold px-3 py-2 rounded-xl"
              style={{ background: "rgba(148,163,184,0.08)", color: D.muted, border: `1px solid ${D.indigoBorder}` }}
            >
              Zrušiť
            </button>
            <button
              onClick={submit}
              disabled={sending || !to || !subject || !body.trim()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
                color: "#fff",
              }}
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Odoslať
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────
function stripAddress(h: string): string {
  // "Ján Novák <jan@x.sk>" → "Ján Novák"; fallback to address
  const m = h.match(/^(.*?)\s*<.+>$/);
  return m?.[1]?.trim() || h;
}
function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("sk-SK", { day: "numeric", month: "short" });
}
