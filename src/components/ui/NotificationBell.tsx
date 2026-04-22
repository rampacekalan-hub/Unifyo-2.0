"use client";
// src/components/ui/NotificationBell.tsx
// In-app notification center — bell icon with unread badge + dropdown.
// Portal + fixed positioning mirrors ChatHistory.tsx to avoid stacking
// context overlap with the dashboard chrome. Polls every 30s while open
// so a stale dropdown stays fresh; fetches once on mount for the badge.

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  text: "#eef2ff",
  muted: "#94a3b8",
  border: "rgba(99,102,241,0.22)",
  rose: "#f43f5e",
};

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string;
  readAt: string | null;
};

function timeago(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "teraz";
  if (m < 60) return `pred ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `pred ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `pred ${d} d`;
  return new Date(iso).toLocaleDateString("sk-SK", { day: "numeric", month: "short" });
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Anchor the portal dropdown to the button's viewport position.
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setAnchor({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  const fetchItems = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setItems(await res.json());
    } catch { /* ignore */ }
    if (!silent) setLoading(false);
  }, []);

  // Initial load — populates the badge even when dropdown is closed.
  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Poll every 30s while open to keep the list fresh.
  useEffect(() => {
    if (!open) return;
    fetchItems();
    const t = setInterval(() => fetchItems(true), 30_000);
    return () => clearInterval(t);
  }, [open, fetchItems]);

  const unread = items.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    // Optimistic — server is source of truth on next fetch.
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch { /* ignore — optimistic state is good enough */ }
  };

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error();
      toast.success("Označené ako prečítané");
    } catch {
      toast.error("Operácia zlyhala");
    }
  };

  const handlePick = async (n: Notif) => {
    if (!n.read) markRead(n.id);
    if (n.href) {
      setOpen(false);
      router.push(n.href);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = items;
    setItems((cur) => cur.filter((n) => n.id !== id));
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems(prev);
      toast.error("Zmazanie zlyhalo");
    }
  };

  const dropdown = mounted && open && anchor ? createPortal(
    <AnimatePresence>
      <div
        key="scrim"
        className="fixed inset-0"
        onClick={() => setOpen(false)}
        style={{ background: "var(--app-surface-2)", zIndex: 2147483000 }}
      />
      <motion.div
        key="panel"
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className="fixed w-[340px] max-h-[70vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          top: anchor.top,
          right: anchor.right,
          zIndex: 2147483001,
          background: "#0a0c18",
          border: `1px solid ${D.border}`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.65), 0 0 24px rgba(99,102,241,0.22)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${D.border}` }}
        >
          <span className="text-[0.65rem] font-semibold uppercase tracking-widest" style={{ color: D.muted }}>
            Notifikácie
          </span>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="px-2 py-1 rounded-lg text-[0.65rem] font-medium"
              style={{
                background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
                color: "white",
                boxShadow: "0 0 10px rgba(99,102,241,0.35)",
              }}
            >
              Označiť všetko ako prečítané
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="px-4 py-3 space-y-2.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="space-y-1.5"
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                >
                  <div className="h-3 rounded-md" style={{ background: "rgba(99,102,241,0.12)", width: "70%" }} />
                  <div className="h-2 rounded-md" style={{ background: "rgba(99,102,241,0.07)", width: "40%" }} />
                </motion.div>
              ))}
            </div>
          )}
          {!loading && items.length === 0 && (
            <p className="px-4 py-8 text-xs text-center" style={{ color: D.muted }}>
              Zatiaľ žiadne notifikácie.
            </p>
          )}
          {!loading && items.map((n) => (
            <div
              key={n.id}
              onClick={() => handlePick(n)}
              className="group flex items-start gap-2 px-4 py-2.5 cursor-pointer transition-colors"
              style={{
                background: !n.read ? "rgba(99,102,241,0.08)" : "transparent",
                borderBottom: `1px solid rgba(99,102,241,0.08)`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = !n.read ? "rgba(99,102,241,0.08)" : "transparent"; }}
            >
              <div className="pt-1.5 flex-shrink-0" style={{ width: 8 }}>
                {!n.read && (
                  <span
                    className="block rounded-full"
                    style={{ width: 8, height: 8, background: D.indigo, boxShadow: "0 0 8px rgba(99,102,241,0.7)" }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: D.text }}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="text-[0.7rem] mt-0.5 line-clamp-2" style={{ color: D.muted }}>
                    {n.body}
                  </p>
                )}
                <p className="text-[0.65rem] mt-0.5" style={{ color: D.muted }}>
                  {timeago(n.createdAt)}
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(n.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity flex-shrink-0"
                aria-label="Zmazať"
              >
                <Trash2 className="w-3 h-3" style={{ color: D.rose }} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  ) : null;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[0.7rem] font-medium transition-colors"
        style={{
          background: open ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.06)",
          border: `1px solid ${D.border}`,
          color: D.text,
        }}
        aria-label="Notifikácie"
      >
        <Bell className="w-3.5 h-3.5" style={{ color: D.indigo }} />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-[0.6rem] font-semibold"
            style={{
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
              color: "white",
              boxShadow: "0 0 8px rgba(99,102,241,0.55)",
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {dropdown}
    </div>
  );
}
