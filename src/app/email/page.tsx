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
  FileText,
  Star,
  Layers,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { SkeletonList } from "@/components/ui/Skeleton";

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

type Folder = "INBOX" | "SENT" | "STARRED" | "ALL";

const FOLDERS: Array<{ id: Folder; label: string; Icon: React.ElementType }> = [
  { id: "INBOX",   label: "Doručené",  Icon: Inbox },
  { id: "SENT",    label: "Odoslané",  Icon: Send },
  { id: "STARRED", label: "S hviezdou", Icon: Star },
  { id: "ALL",     label: "Všetky",    Icon: Layers },
];

export default function EmailPage() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const [active, setActive] = useState<MessageDetail | null>(null);
  const [loadingActive, setLoadingActive] = useState<string | null>(null);
  const [folder, setFolder] = useState<Folder>("INBOX");

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

  async function load(q?: string, f: Folder = folder) {
    setState({ kind: "loading" });
    try {
      const params = new URLSearchParams({ label: f });
      if (q) params.set("q", q);
      const res = await fetch(`/api/gmail/inbox?${params}`);
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

  // Reload when folder changes — keep the search query if the user had one.
  useEffect(() => {
    load(query.trim() || undefined, folder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  // `?compose=1&to=…&subject=…&body=…` — lets the dashboard / AI
  // hand the user an already-drafted e-mail. The user still has to
  // click "Odoslať" in the modal, so this can never silently send.
  const [prefill, setPrefill] = useState<{ to?: string; subject?: string; body?: string } | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("compose") === "1") {
      setPrefill({
        to: sp.get("to") ?? undefined,
        subject: sp.get("subject") ?? undefined,
        body: sp.get("body") ?? undefined,
      });
      setComposing(true);
      // Clean the URL so a refresh doesn't re-open the modal.
      window.history.replaceState(null, "", "/email");
    }
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

        {/* Folder tabs — Gmail label filter. Hidden in not-connected
            state since there's nothing to filter. */}
        {state.kind !== "not_connected" && (
          <div className="flex items-center gap-1 mb-3 overflow-x-auto no-scrollbar">
            {FOLDERS.map((f) => {
              const active = folder === f.id;
              const Icon = f.Icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setFolder(f.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap"
                  style={{
                    background: active ? "rgba(139,92,246,0.18)" : "var(--app-surface-2)",
                    border: `1px solid ${active ? "rgba(139,92,246,0.45)" : D.indigoBorder}`,
                    color: active ? D.text : D.muted,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

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
            prefill={prefill ?? undefined}
            onClose={() => { setComposing(false); setPrefill(null); }}
            onSent={() => {
              setComposing(false);
              setPrefill(null);
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
              // Build a quoted reply: sender → To, "Re: …" subject,
              // a blank line for the new message, then the original
              // body prefixed with "> " so the recipient has context.
              const replyTo = extractAddress(active.from);
              const subject = active.subject.startsWith("Re:")
                ? active.subject
                : `Re: ${active.subject}`;
              const originalBody = (active.text || active.snippet || "").trim();
              const quoted = originalBody
                ? "\n\n---\n" +
                  `Dňa ${new Date(active.date).toLocaleString("sk-SK")} napísal ${stripAddress(active.from)}:\n` +
                  originalBody.split("\n").map((l) => `> ${l}`).join("\n")
                : "";
              setPrefill({ to: replyTo, subject, body: quoted });
              setActive(null);
              setComposing(true);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

// ── States ───────────────────────────────────────────────────────
function LoadingCard() {
  // Skeleton list instead of a bare spinner — users see the inbox
  // shape materialising instead of staring at a loader.
  return <SkeletonList rows={5} />;
}

// Brand glyphs — inline SVG so we never ship a 404 image and they
// inherit the parent's font color when needed. Sized for 24px buckets.
function GmailLogo() {
  return (
    <svg width="28" height="22" viewBox="0 0 24 18" aria-hidden>
      <path fill="#4285F4" d="M0 18V4l5 3v11z" />
      <path fill="#34A853" d="M19 18v-11l5-3v14z" />
      <path fill="#FBBC04" d="M0 4l12 8 12-8v-2a2 2 0 00-2-2h-1L12 7 2 0H1a2 2 0 00-1 2z" />
      <path fill="#EA4335" d="M0 4v0L12 12 24 4l-1.5-2L12 9 1.5 2z" opacity=".95" />
      <path fill="#C5221F" d="M5 7L0 4v0L12 12l-7-5z" />
    </svg>
  );
}
function OutlookLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <rect x="2" y="6" width="28" height="20" rx="2" fill="#0F78D4" />
      <path fill="#fff" d="M14 24V8l16 4v8z" opacity=".15" />
      <path fill="#fff" d="M2 8l14 8 14-8v18a2 2 0 01-2 2H4a2 2 0 01-2-2z" opacity=".0" />
      <circle cx="10" cy="16" r="6" fill="#fff" />
      <text x="10" y="20" textAnchor="middle" fontFamily="Arial" fontWeight="bold" fontSize="9" fill="#0F78D4">O</text>
    </svg>
  );
}
function ICloudLogo() {
  return (
    <svg width="30" height="22" viewBox="0 0 32 22" aria-hidden>
      <path
        fill="#cbd5e1"
        d="M24.5 21H8a7 7 0 01-1.6-13.8A8 8 0 0122 6.5a5.5 5.5 0 012.5 14.5z"
      />
      <path
        fill="#94a3b8"
        d="M24.5 21H16V6.6A8 8 0 0122 6.5a5.5 5.5 0 012.5 14.5z"
        opacity=".5"
      />
    </svg>
  );
}

interface ProviderProps {
  href: string;
  Logo: React.FC;
  name: string;
  desc: string;
  accent: string;
}
function ProviderTile({ href, Logo, name, desc, accent }: ProviderProps) {
  return (
    <a
      href={href}
      className="group flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--app-surface)",
        border: "1px solid var(--app-border)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.25)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accent;
        e.currentTarget.style.boxShadow = `0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 28px ${accent}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--app-border)";
        e.currentTarget.style.boxShadow = "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.25)";
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--app-border)",
        }}
      >
        <Logo />
      </div>
      <div className="text-center">
        <div className="text-sm font-bold mb-0.5" style={{ color: "var(--app-text)" }}>
          {name}
        </div>
        <div className="text-[11px]" style={{ color: D.muted }}>
          {desc}
        </div>
      </div>
      <span
        className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors"
        style={{
          background: `${accent}1f`,
          color: accent,
          border: `1px solid ${accent}55`,
        }}
      >
        Pripojiť →
      </span>
    </a>
  );
}

function NotConnectedCard() {
  return (
    <div
      className="rounded-3xl p-8"
      style={{
        background:
          "radial-gradient(120% 100% at 50% 0%, rgba(99,102,241,0.10), rgba(139,92,246,0.04) 50%, transparent 80%)," +
          " var(--app-surface-2)",
        border: "1px solid var(--app-border)",
      }}
    >
      <div className="text-center mb-6">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
          }}
        >
          <Inbox className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-lg font-bold mb-1" style={{ color: "var(--app-text)" }}>
          Prepoj svoju schránku
        </h2>
        <p className="text-[13px] max-w-md mx-auto" style={{ color: D.muted }}>
          Bezpečné OAuth prepojenie. Tokeny šifrujeme, nikdy nečítame heslo.
          Kedykoľvek odpojíš v Nastaveniach.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
        <ProviderTile
          href="/api/integrations/google/start"
          Logo={GmailLogo}
          name="Gmail"
          desc="Google Workspace · @gmail.com"
          accent="#ea4335"
        />
        <ProviderTile
          href="/api/integrations/microsoft/start"
          Logo={OutlookLogo}
          name="Outlook"
          desc="Microsoft 365 · @outlook.com"
          accent="#0F78D4"
        />
        <ProviderTile
          href="/settings/integrations#apple"
          Logo={ICloudLogo}
          name="iCloud Mail"
          desc="Apple ID · @icloud.com"
          accent="#94a3b8"
        />
      </div>

      <div className="flex items-center justify-center gap-2 mt-6 text-[11px]" style={{ color: D.mutedDark }}>
        <span className="w-1 h-1 rounded-full" style={{ background: "#10b981" }} />
        Šifrované cez TLS · žiadne dáta neopúšťajú EU
      </div>
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

function ComposeModal({
  onClose, onSent, prefill,
}: {
  onClose: () => void;
  onSent: () => void;
  prefill?: { to?: string; subject?: string; body?: string };
}) {
  const [to, setTo] = useState(prefill?.to ?? "");
  const [subject, setSubject] = useState(prefill?.subject ?? "");
  const [body, setBody] = useState(prefill?.body ?? "");
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

  const [savingDraft, setSavingDraft] = useState(false);
  async function saveDraft() {
    if (savingDraft || (!subject.trim() && !body.trim())) return;
    setSavingDraft(true);
    try {
      const res = await fetch("/api/gmail/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.hint || json.error || `HTTP ${res.status}`);
      toast.success("Uložené do Gmail Drafts — nájdeš ho aj v Gmail appke.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Uloženie zlyhalo");
    } finally {
      setSavingDraft(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg p-5 rounded-t-2xl sm:rounded-2xl max-h-[94vh] overflow-y-auto"
        style={{
          background: "var(--app-surface)",
          border: `1px solid ${D.indigoBorder}`,
        }}
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
              className="text-xs font-semibold px-3 py-2 rounded-xl"
              style={{ background: "rgba(148,163,184,0.08)", color: D.muted, border: `1px solid ${D.indigoBorder}` }}
            >
              Zrušiť
            </button>
            <button
              onClick={saveDraft}
              disabled={savingDraft || sending || (!subject.trim() && !body.trim())}
              className="text-xs font-semibold px-3 py-2 rounded-xl inline-flex items-center gap-1.5 disabled:opacity-50"
              style={{
                background: "rgba(99,102,241,0.08)",
                color: D.indigo,
                border: `1px solid ${D.indigoBorder}`,
              }}
              title="Uložiť ako koncept v Gmail Drafts"
            >
              {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Uložiť koncept
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
function extractAddress(h: string): string {
  // "Ján Novák <jan@x.sk>" → "jan@x.sk"; fallback to whole string.
  const m = h.match(/<([^>]+)>/);
  return m?.[1]?.trim() || h.trim();
}
function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("sk-SK", { day: "numeric", month: "short" });
}
