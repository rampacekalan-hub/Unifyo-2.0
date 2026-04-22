"use client";
// src/components/ui/CommandPalette.tsx
// Global ⌘K / Ctrl+K palette — fulltext search + navigation + quick actions.
// Debounces remote queries (contacts, tasks, conversations), ranks results,
// keyboard-navigable, instant on local items (nav/actions).

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, LayoutDashboard, Users, CalendarDays, Mail, Settings, LogOut,
  MessageSquarePlus, UserPlus, CalendarPlus, Command, ArrowRight, History,
  CreditCard, Link2, Phone, Briefcase, Send, Plug,
} from "lucide-react";
import { chatActions } from "@/lib/chatStore";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  sky:    "#22d3ee",
  text:   "#eef2ff",
  muted:  "#94a3b8",
  mutedDark: "#475569",
  border: "rgba(99,102,241,0.22)",
  borderActive: "rgba(99,102,241,0.5)",
};

interface CmdItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  group: "Navigácia" | "Akcie" | "Kontakty" | "Úlohy" | "Rozhovory";
  onSelect: () => void;
  keywords?: string; // extra searchable text
}

function groupBy<T extends { group: string }>(arr: T[]): Array<[string, T[]]> {
  const map = new Map<string, T[]>();
  for (const a of arr) {
    if (!map.has(a.group)) map.set(a.group, []);
    map.get(a.group)!.push(a);
  }
  return Array.from(map.entries());
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function useIsMac(): boolean {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform ?? navigator.userAgent));
  }, []);
  return isMac;
}

export default function CommandPalette() {
  const router = useRouter();
  const isMac = useIsMac();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Remote search results
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; email?: string; phone?: string }>>([]);
  const [tasks, setTasks]       = useState<Array<{ id: string; title: string; date?: string; time?: string }>>([]);
  const [convos, setConvos]     = useState<Array<{ id: string; title: string }>>([]);

  // ── Global hotkey: Cmd/Ctrl+K toggles ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmdK = (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
      if (cmdK) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Focus input + reset on open ──
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // ── Remote search — debounced 250ms ──
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setContacts([]);
      setTasks([]);
      setConvos([]);
      return;
    }
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const [cRes, tRes, convRes] = await Promise.all([
          fetch(`/api/crm/contacts?q=${encodeURIComponent(q)}`, { signal: ctrl.signal }),
          fetch(`/api/calendar/tasks`, { signal: ctrl.signal }),
          fetch(`/api/conversations`, { signal: ctrl.signal }),
        ]);
        if (cRes.ok) {
          const cs = await cRes.json();
          setContacts(Array.isArray(cs) ? cs.slice(0, 5) : []);
        }
        if (tRes.ok) {
          const ts = await tRes.json();
          const qn = normalize(q);
          setTasks(
            (Array.isArray(ts) ? ts : [])
              .filter((x: { title?: string }) => x.title && normalize(x.title).includes(qn))
              .slice(0, 5)
          );
        }
        if (convRes.ok) {
          const cv = await convRes.json();
          const qn = normalize(q);
          setConvos(
            (Array.isArray(cv) ? cv : [])
              .filter((x: { title?: string }) => x.title && normalize(x.title).includes(qn))
              .slice(0, 5)
          );
        }
      } catch { /* aborted or network */ }
    }, 250);
    return () => { ctrl.abort(); window.clearTimeout(t); };
  }, [query, open]);

  const close = useCallback(() => setOpen(false), []);

  // ── Build items ──
  const staticItems: CmdItem[] = useMemo(() => [
    { id: "nav:overview",  label: "Prejsť na Prehľad",     icon: LayoutDashboard, group: "Navigácia", onSelect: () => { router.push("/dashboard-overview"); close(); } },
    { id: "nav:dashboard", label: "Prejsť do AI Chatu",    icon: LayoutDashboard, group: "Navigácia", onSelect: () => { router.push("/dashboard"); close(); } },
    { id: "nav:crm",       label: "Prejsť do CRM",         icon: Users,           group: "Navigácia", onSelect: () => { router.push("/crm"); close(); } },
    { id: "nav:calendar",  label: "Prejsť do Kalendára",   icon: CalendarDays,    group: "Navigácia", onSelect: () => { router.push("/calendar"); close(); } },
    { id: "nav:email",     label: "Prejsť do Emailov",     icon: Mail,            group: "Navigácia", onSelect: () => { router.push("/email"); close(); } },
    { id: "nav:pipeline",  label: "Prejsť do Pipeline",    icon: Briefcase,       group: "Navigácia", onSelect: () => { router.push("/pipeline"); close(); } },
    { id: "nav:calls",     label: "Prejsť do Hovorov",     icon: Phone,           group: "Navigácia", onSelect: () => { router.push("/calls"); close(); } },
    { id: "nav:billing",   label: "Plán a fakturácia",     icon: CreditCard,      group: "Navigácia", keywords: "stripe predplatné upgrade", onSelect: () => { router.push("/settings/billing"); close(); } },
    { id: "nav:integ",     label: "Integrácie",            icon: Plug,            group: "Navigácia", keywords: "gmail google calendar", onSelect: () => { router.push("/settings/integrations"); close(); } },
    { id: "act:newchat",   label: "Nový rozhovor",          hint: "Vyčistí chat",   icon: MessageSquarePlus, group: "Akcie", onSelect: () => { chatActions.newConversation(); router.push("/dashboard"); close(); } },
    { id: "act:newcontact",label: "Nový kontakt v CRM",     hint: "Otvorí CRM",     icon: UserPlus,          group: "Akcie", onSelect: () => { router.push("/crm?new=1"); close(); } },
    { id: "act:newtask",   label: "Nová úloha v Kalendári", hint: "Otvorí Kalendár",icon: CalendarPlus,      group: "Akcie", onSelect: () => { router.push("/calendar?new=1"); close(); } },
    { id: "act:compose",   label: "Napísať nový e-mail",    hint: "Gmail compose",  icon: Send,              group: "Akcie", keywords: "mail nový poslať", onSelect: () => { router.push("/email?compose=1"); close(); } },
    { id: "act:newdeal",   label: "Nový deal v Pipeline",   hint: "Obchodná príležitosť", icon: Briefcase,   group: "Akcie", onSelect: () => { router.push("/pipeline?new=1"); close(); } },
    { id: "act:connectg",  label: "Pripojiť Google účet",   hint: "Gmail + Kalendár", icon: Link2,           group: "Akcie", keywords: "oauth gmail calendar pripoj", onSelect: () => { window.location.href = "/api/integrations/google/start"; close(); } },
    { id: "nav:settings",  label: "Nastavenia",             icon: Settings, group: "Navigácia", onSelect: () => { router.push("/settings"); close(); } },
    { id: "act:logout",    label: "Odhlásiť sa",            icon: LogOut,   group: "Akcie", onSelect: async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); close(); } },
  ], [router, close]);

  const dynamicItems: CmdItem[] = useMemo(() => {
    const out: CmdItem[] = [];
    for (const c of contacts) {
      out.push({
        id: `contact:${c.id}`,
        label: c.name,
        hint: c.phone || c.email || "",
        icon: Users,
        group: "Kontakty",
        keywords: `${c.email ?? ""} ${c.phone ?? ""}`,
        onSelect: () => { router.push(`/crm?focus=${c.id}`); close(); },
      });
    }
    for (const t of tasks) {
      out.push({
        id: `task:${t.id}`,
        label: t.title,
        hint: [t.date, t.time].filter(Boolean).join(" · "),
        icon: CalendarDays,
        group: "Úlohy",
        onSelect: () => { router.push(`/calendar?focus=${t.id}`); close(); },
      });
    }
    for (const c of convos) {
      out.push({
        id: `conv:${c.id}`,
        label: c.title || "Bez názvu",
        icon: History,
        group: "Rozhovory",
        onSelect: async () => {
          try {
            const res = await fetch(`/api/conversations/${c.id}/messages`);
            if (res.ok) {
              const rows = await res.json();
              const mapped = rows.map((r: { id: string; role: string; content: string; tokens?: number; createdAt: string }) => ({
                id: r.id,
                role: r.role === "assistant" ? "ai" : (r.role as "user" | "ai"),
                content: r.content,
                tokens: r.tokens ?? 0,
                createdAt: new Date(r.createdAt).getTime(),
              }));
              chatActions.hydrateFromRemote(c.id, mapped);
            }
          } catch { /* ignore */ }
          router.push("/dashboard");
          close();
        },
      });
    }
    return out;
  }, [contacts, tasks, convos, router, close]);

  // ── Filter static items by query; dynamic already server-filtered ──
  const filtered: CmdItem[] = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return staticItems;
    const staticMatch = staticItems.filter((i) =>
      normalize(i.label + " " + (i.hint ?? "") + " " + (i.keywords ?? "")).includes(q)
    );
    return [...staticMatch, ...dynamicItems];
  }, [query, staticItems, dynamicItems]);

  const grouped = useMemo(() => groupBy(filtered), [filtered]);

  // Keep activeIdx in range when list shrinks/grows
  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(Math.max(0, filtered.length - 1));
  }, [filtered.length, activeIdx]);

  // Scroll active row into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLDivElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(filtered.length - 1, i + 1)); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      filtered[activeIdx]?.onSelect();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(3,4,10,0.65)", backdropFilter: "blur(6px)" }}
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="fixed left-1/2 top-[14vh] -translate-x-1/2 z-[101] w-[92vw] max-w-[620px] rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: "var(--app-surface)",
              border: `1px solid ${D.border}`,
              boxShadow: "0 20px 60px rgba(0,0,0,0.55), 0 0 28px rgba(99,102,241,0.22)",
              backdropFilter: "blur(28px)",
              maxHeight: "70vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search row */}
            <div
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ borderBottom: `1px solid ${D.border}` }}
            >
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: D.indigo }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Hľadaj alebo spusti akciu…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: D.text, caretColor: D.violet }}
              />
              <kbd
                className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[0.6rem] font-semibold"
                style={{ background: "rgba(99,102,241,0.1)", border: `1px solid ${D.border}`, color: D.muted }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-xs text-center" style={{ color: D.muted }}>
                  Nič nenájdené.
                </p>
              ) : (
                grouped.map(([group, items]) => (
                  <div key={group} className="py-1.5">
                    <p
                      className="px-4 py-1 text-[0.6rem] font-semibold uppercase tracking-widest"
                      style={{ color: D.mutedDark }}
                    >
                      {group}
                    </p>
                    {items.map((item) => {
                      const idx = filtered.indexOf(item);
                      const active = idx === activeIdx;
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          data-idx={idx}
                          onClick={item.onSelect}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className="flex items-center gap-3 px-4 py-2 cursor-pointer"
                          style={{
                            background: active ? "rgba(99,102,241,0.14)" : "transparent",
                            borderLeft: active ? `2px solid ${D.violet}` : "2px solid transparent",
                          }}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: active ? D.sky : D.muted }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate" style={{ color: D.text }}>
                              {item.label}
                            </p>
                            {item.hint && (
                              <p className="text-[0.65rem] mt-0.5 truncate" style={{ color: D.muted }}>
                                {item.hint}
                              </p>
                            )}
                          </div>
                          {active && (
                            <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: D.violet }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-2 flex-shrink-0"
              style={{ borderTop: `1px solid ${D.border}`, background: "var(--app-surface-2)" }}
            >
              <div className="flex items-center gap-3 text-[0.6rem]" style={{ color: D.muted }}>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.1)", border: `1px solid ${D.border}` }}>↑↓</kbd>
                  pohyb
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.1)", border: `1px solid ${D.border}` }}>↵</kbd>
                  vybrať
                </span>
              </div>
              <div className="flex items-center gap-1 text-[0.6rem]" style={{ color: D.muted }}>
                <Command className="w-3 h-3" />
                <span>{isMac ? "⌘K" : "Ctrl+K"} kedykoľvek</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
