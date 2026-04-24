"use client";
// src/components/ui/ShareButton.tsx
// Reusable Share button used in CRM contact detail and Calendar task
// detail. Click → POST /api/share → copy returned URL to clipboard and
// toast. A small popover next to the button lets the user pick TTL.

import { useState, useRef, useEffect } from "react";
import { Link2, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

type TTLKey = "1d" | "7d" | "14d" | "infinite";

const TTL_OPTIONS: { key: TTLKey; label: string; days: number | null; toastLabel: string }[] = [
  { key: "1d", label: "24 hodín", days: 1, toastLabel: "24 hodín" },
  { key: "7d", label: "7 dní", days: 7, toastLabel: "7 dní" },
  { key: "14d", label: "14 dní", days: 14, toastLabel: "14 dní" },
  { key: "infinite", label: "Neobmedzene", days: null, toastLabel: "neobmedzene" },
];

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  indigoBorder: "rgba(99,102,241,0.22)",
  indigoDim: "rgba(99,102,241,0.08)",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
};

export default function ShareButton({
  resourceType,
  resourceId,
  className,
  fullWidth = false,
}: {
  resourceType: "task" | "contact";
  resourceId: string;
  className?: string;
  fullWidth?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [ttl, setTtl] = useState<TTLKey>("14d");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click.
  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setPopoverOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popoverOpen]);

  async function createLink(key: TTLKey) {
    setPopoverOpen(false);
    setLoading(true);
    const opt = TTL_OPTIONS.find((o) => o.key === key)!;
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId,
          ttlDays: opt.days ?? null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        toast.error(data?.error ?? "Nepodarilo sa vytvoriť odkaz");
        return;
      }
      try {
        await navigator.clipboard.writeText(data.url);
        toast.success(`Odkaz skopírovaný — platí ${opt.toastLabel}`);
      } catch {
        // Fallback for environments without clipboard permission.
        toast.success(`Odkaz vytvorený: ${data.url}`);
      }
    } catch {
      toast.error("Nepodarilo sa vytvoriť odkaz");
    } finally {
      setLoading(false);
    }
  }

  const widthClass = fullWidth ? "flex-1" : "";

  return (
    <div ref={rootRef} className={`relative inline-flex items-stretch ${widthClass} ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => createLink(ttl)}
        disabled={loading}
        className={`${fullWidth ? "flex-1" : ""} flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-l-xl text-sm font-medium disabled:opacity-50`}
        style={{
          background: D.indigoDim,
          border: `1px solid ${D.indigoBorder}`,
          borderRight: "none",
          color: D.text,
        }}
        title="Vytvoriť verejný zdieľaný odkaz"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
        <span>Zdieľať</span>
      </button>
      <button
        type="button"
        onClick={() => setPopoverOpen((v) => !v)}
        disabled={loading}
        aria-label="Zvoliť platnosť"
        className="px-2 rounded-r-xl disabled:opacity-50"
        style={{
          background: D.indigoDim,
          border: `1px solid ${D.indigoBorder}`,
          color: D.muted,
        }}
      >
        <ChevronDown className="w-4 h-4" />
      </button>

      {popoverOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 z-20 rounded-xl overflow-hidden min-w-[180px]"
          style={{
            background: "#0a0c18",
            border: `1px solid ${D.indigoBorder}`,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          <div
            className="px-3 py-2 text-[10px] tracking-widest uppercase font-semibold"
            style={{ color: D.muted, borderBottom: `1px solid ${D.indigoBorder}` }}
          >
            Platnosť
          </div>
          {TTL_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setTtl(opt.key);
                createLink(opt.key);
              }}
              className="w-full text-left px-3 py-2 text-sm transition-colors hover:brightness-125"
              style={{
                color: opt.key === ttl ? D.text : D.muted,
                background: opt.key === ttl ? "rgba(99,102,241,0.1)" : "transparent",
              }}
            >
              {opt.label}
              {opt.key === "14d" && (
                <span className="ml-2 text-[10px]" style={{ color: D.muted }}>
                  (predvolené)
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
