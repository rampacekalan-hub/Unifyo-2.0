// src/app/status/page.tsx
// Public system status page. No auth. Re-renders at most every 30s (see
// `revalidate` below) so a traffic spike doesn't turn this into a DB probe
// firehose. Each check is a cheap existence/ping probe.

import Link from "next/link";
import { Check, AlertTriangle, X as XIcon, Database, Cpu, Mail, Globe2 } from "lucide-react";
import NeuralBackground from "@/components/ui/NeuralBackground";
import { getSiteConfig } from "@/config/site-settings";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

const D = {
  indigo:       "#6366f1",
  indigoBorder: "rgba(99,102,241,0.22)",
  violet:       "#8b5cf6",
  text:         "var(--app-text)",
  muted:        "var(--app-text-muted)",
  emerald:      "#10b981",
  amber:        "#f59e0b",
  rose:         "#ef4444",
};

type Status = "ok" | "degraded" | "down";

interface Check {
  key: string;
  name: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  status: Status;
  note: string;
}

async function runChecks(): Promise<Check[]> {
  // Web — if this rendered, we are up.
  const web: Check = {
    key: "web",
    name: "Web",
    Icon: Globe2,
    status: "ok",
    note: "Aplikácia beží",
  };

  // Databáza — SELECT 1 with a soft timeout so the page never hangs longer
  // than a second on a flaky DB.
  let db: Check;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
    ]);
    db = { key: "db", name: "Databáza", Icon: Database, status: "ok", note: "Pripojenie v poriadku" };
  } catch {
    db = { key: "db", name: "Databáza", Icon: Database, status: "down", note: "Pripojenie zlyhalo" };
  }

  // AI — env presence only. Cheap and no external call on every revalidation.
  const ai: Check = {
    key: "ai",
    name: "AI",
    Icon: Cpu,
    status: process.env.OPENAI_API_KEY ? "ok" : "degraded",
    note: process.env.OPENAI_API_KEY ? "Kľúč nastavený" : "Chýba OPENAI_API_KEY",
  };

  // Email — SMTP creds presence (see src/lib/email.ts — same vars).
  const smtpReady = !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASSWORD;
  const email: Check = {
    key: "email",
    name: "Email (SMTP)",
    Icon: Mail,
    status: smtpReady ? "ok" : "degraded",
    note: smtpReady ? "SMTP nakonfigurované" : "SMTP údaje chýbajú",
  };

  return [web, db, ai, email];
}

function overall(checks: Check[]): Status {
  if (checks.some((c) => c.status === "down")) return "down";
  if (checks.some((c) => c.status === "degraded")) return "degraded";
  return "ok";
}

function badge(status: Status): { label: string; color: string; bg: string; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> } {
  if (status === "ok") return { label: "Všetky systémy v prevádzke", color: D.emerald, bg: "rgba(16,185,129,0.12)", Icon: Check };
  if (status === "degraded") return { label: "Čiastočne obmedzená prevádzka", color: D.amber, bg: "rgba(245,158,11,0.12)", Icon: AlertTriangle };
  return { label: "Výpadok služby", color: D.rose, bg: "rgba(239,68,68,0.12)", Icon: XIcon };
}

export default async function StatusPage() {
  const config = getSiteConfig();
  const checks = await runChecks();
  const top = overall(checks);
  const b = badge(top);
  const BIcon = b.Icon;
  const now = new Date();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#05070f", color: D.text }}>
      <NeuralBackground themeEngine={config.branding.themeEngine} />

      <main className="relative z-10 max-w-3xl mx-auto px-5 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="text-[0.65rem] tracking-widest uppercase font-semibold"
            style={{ color: D.muted }}
          >
            ← Unifyo
          </Link>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
            Stav systému{" "}
            <span
              style={{
                background: `linear-gradient(90deg,${D.violet},#38bdf8)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Unifyo
            </span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: D.muted }}>
            Aktualizuje sa automaticky každých 30 sekúnd.
          </p>
        </div>

        {/* Big status badge */}
        <section
          className="rounded-2xl p-5 mb-6 flex items-center gap-4"
          style={{
            background: b.bg,
            border: `1px solid ${b.color}55`,
            boxShadow: `0 0 32px ${b.color}22`,
          }}
          aria-live="polite"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${b.color}22`, border: `1px solid ${b.color}55` }}
          >
            <BIcon className="w-6 h-6" style={{ color: b.color }} />
          </div>
          <div>
            <div className="text-[0.65rem] tracking-widest uppercase font-semibold" style={{ color: b.color }}>
              Aktuálny stav
            </div>
            <div className="text-lg font-bold mt-0.5">{b.label}</div>
          </div>
        </section>

        {/* Grid of 4 checks */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--app-surface)",
            border: `1px solid ${D.indigoBorder}`,
            backdropFilter: "blur(16px)",
          }}
        >
          <ul className="divide-y" style={{ borderColor: D.indigoBorder }}>
            {checks.map((c) => {
              const cb = badge(c.status);
              const CIcon = c.Icon;
              return (
                <li
                  key={c.key}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderColor: D.indigoBorder }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.10)", border: `1px solid ${D.indigoBorder}` }}
                  >
                    <CIcon className="w-4 h-4" style={{ color: D.indigo }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-xs" style={{ color: D.muted }}>
                      {c.note}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.65rem] font-semibold tracking-wider uppercase"
                      style={{
                        background: cb.bg,
                        color: cb.color,
                        border: `1px solid ${cb.color}44`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: cb.color, boxShadow: `0 0 8px ${cb.color}` }}
                      />
                      {c.status === "ok" ? "OK" : c.status === "degraded" ? "Obmedzené" : "Výpadok"}
                    </span>
                    <time
                      className="text-[0.6rem]"
                      style={{ color: D.muted }}
                      dateTime={now.toISOString()}
                    >
                      {now.toLocaleTimeString("sk-SK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </time>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Footer */}
        <footer className="mt-8 text-xs space-y-1.5" style={{ color: D.muted }}>
          <div>
            Posledná kontrola:{" "}
            <time dateTime={now.toISOString()} className="font-mono">
              {now.toISOString()}
            </time>
          </div>
          <div>
            Sledovanie incidentov: <span style={{ color: D.text }}>@unifyo_sk</span> na X{" "}
            <span className="opacity-70">(už čoskoro)</span>
          </div>
          <div>
            JSON endpoint pre monitory:{" "}
            <Link href="/api/status" className="underline" style={{ color: D.indigo }}>
              /api/status
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
