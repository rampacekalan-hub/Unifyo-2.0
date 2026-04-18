"use client";
// src/app/verify-email/page.tsx
// Lands from the verification email, auto-POSTs the token to the API,
// then shows success/failure. User just has to click once and done.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { getSiteConfig } from "@/config/site-settings";
import AuthBrand, { GradientTitle } from "@/components/auth/AuthBrand";

const { branding } = getSiteConfig();
const B = branding.colors;

type State = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: B.background }} />}>
      <VerifyEmailInner />
    </Suspense>
  );
}

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || token.length < 16) {
      setState("error");
      setMessage("Odkaz je neplatný.");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!alive) return;
        if (res.ok) {
          setState("success");
        } else {
          setState("error");
          setMessage(data.error ?? "Overenie zlyhalo.");
        }
      } catch {
        if (alive) {
          setState("error");
          setMessage("Sieťová chyba. Skús to znova.");
        }
      }
    })();
    return () => { alive = false; };
  }, [token]);

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: B.background }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-sm text-center"
      >
        <AuthBrand subtitle="Overenie emailu" />

        <div
          className="rounded-2xl p-8"
          style={{
            background: B.surface,
            border: `1px solid ${B.border}`,
          }}
        >
          {state === "loading" && (
            <>
              <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin" style={{ color: B.primary }} />
              <GradientTitle before="" accent="Overujem…" className="text-lg font-black tracking-tight" />
            </>
          )}
          {state === "success" && (
            <>
              <div
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.35)",
                }}
              >
                <CheckCircle2 className="w-8 h-8" style={{ color: "#10b981" }} />
              </div>
              <GradientTitle
                before="Email"
                accent="overený"
                className="text-xl font-black tracking-tight mb-2"
              />
              <p className="text-xs leading-relaxed" style={{ color: B.textMuted }}>
                Tvoj účet je plne aktivovaný. Môžeš pokračovať v Unifyo.
              </p>
              <Link
                href="/dashboard"
                className="inline-block mt-5 px-5 py-2.5 rounded-xl text-xs font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${B.primary}, #5b21b6)`,
                  color: "#fff",
                }}
              >
                Pokračovať na dashboard
              </Link>
            </>
          )}
          {state === "error" && (
            <>
              <div
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: "rgba(244,63,94,0.12)",
                  border: "1px solid rgba(244,63,94,0.35)",
                }}
              >
                <XCircle className="w-8 h-8" style={{ color: "#f43f5e" }} />
              </div>
              <GradientTitle
                before="Odkaz"
                accent="nefunguje"
                className="text-xl font-black tracking-tight mb-2"
              />
              <p className="text-xs leading-relaxed" style={{ color: B.textMuted }}>
                {message || "Odkaz je neplatný alebo expiroval."}
              </p>
              <Link
                href="/settings"
                className="inline-block mt-5 px-5 py-2.5 rounded-xl text-xs font-semibold"
                style={{
                  background: "rgba(99,102,241,0.12)",
                  border: `1px solid ${B.border}`,
                  color: B.text,
                }}
              >
                Poslať nový odkaz v Nastaveniach
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}
