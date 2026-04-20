"use client";
// Subtle "install as PWA" chip shown in the bottom-right once the browser
// fires `beforeinstallprompt`. Tapping it calls prompt(); X dismisses it.

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

// Non-standard event type — not exported from lib.dom in every TS lib version.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  text: "#eef2ff",
  muted: "#94a3b8",
  indigoBorder: "rgba(99,102,241,0.22)",
};

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    // Hide once installed
    const installedHandler = () => setDeferred(null);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (!deferred || dismissed) return null;

  const handleInstall = async () => {
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      setDeferred(null);
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-2xl px-3 py-2"
      style={{
        background: "rgba(15,18,32,0.92)",
        border: `1px solid ${D.indigoBorder}`,
        boxShadow: "0 10px 30px rgba(99,102,241,0.25)",
        backdropFilter: "blur(8px)",
      }}
      role="region"
      aria-label="Inštalácia aplikácie"
    >
      <button
        onClick={handleInstall}
        className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium"
        style={{
          background: `linear-gradient(135deg, ${D.indigo}, ${D.violet})`,
          color: "white",
        }}
      >
        <Download className="h-3.5 w-3.5" />
        Nainštaluj aplikáciu
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="flex h-7 w-7 items-center justify-center rounded-lg"
        style={{ color: D.muted }}
        aria-label="Zavrieť"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
