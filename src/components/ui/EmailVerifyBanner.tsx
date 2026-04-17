"use client";
// src/components/ui/EmailVerifyBanner.tsx
// Shown at the top of the main content when the user hasn't verified
// their email yet. Dismissable for this tab via sessionStorage — stays
// hidden until reload so the user isn't nagged mid-task.

import { useEffect, useState } from "react";
import { Mail, Loader2, X } from "lucide-react";
import { toast } from "sonner";

const DISMISS_KEY = "unifyo.verify-banner.dismissed";

export default function EmailVerifyBanner() {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch { /* noop */ }

    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/user/me");
        if (!alive || !res.ok) return;
        const data = await res.json();
        setVerified(Boolean(data?.user?.emailVerifiedAt));
      } catch { /* silent */ }
    })();
    return () => { alive = false; };
  }, []);

  async function resend() {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      if (res.ok) toast.success("Poslali sme ti nový overovací email");
      else toast.error("Nepodarilo sa poslať");
    } catch {
      toast.error("Sieťová chyba");
    } finally {
      setSending(false);
    }
  }

  function hide() {
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* noop */ }
    setDismissed(true);
  }

  // Render nothing until we know, and nothing if verified / dismissed.
  if (verified !== false || dismissed) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 mx-4 md:mx-6 mt-3 rounded-xl"
      style={{
        background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.35)",
      }}
    >
      <Mail className="w-4 h-4 flex-shrink-0" style={{ color: "#f59e0b" }} />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-semibold" style={{ color: "#fef3c7" }}>
          Over si emailovú adresu
        </span>
        <span className="text-xs ml-2" style={{ color: "#fbbf24" }}>
          Poslali sme ti odkaz — skontroluj schránku.
        </span>
      </div>
      <button
        onClick={resend}
        disabled={sending}
        className="text-xs font-semibold px-3 py-1 rounded-lg transition-all disabled:opacity-60"
        style={{
          background: "rgba(245,158,11,0.16)",
          border: "1px solid rgba(245,158,11,0.45)",
          color: "#fbbf24",
        }}
      >
        {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Poslať znova"}
      </button>
      <button
        onClick={hide}
        className="p-1 rounded hover:bg-white/5"
        aria-label="Zavrieť"
      >
        <X className="w-3.5 h-3.5" style={{ color: "#fbbf24" }} />
      </button>
    </div>
  );
}
