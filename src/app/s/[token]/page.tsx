// src/app/s/[token]/page.tsx
// Public read-only view of a shared CalendarTask or CrmContact. No auth.
// Always dynamic — viewCount increments on every render and expiry must
// be evaluated against Date.now() rather than a cached build timestamp.

import Link from "next/link";
import { Calendar, Clock, User as UserIcon, Briefcase, FileText, Link2, AlertTriangle } from "lucide-react";
import NeuralBackground from "@/components/ui/NeuralBackground";
import { getSiteConfig } from "@/config/site-settings";
import { loadSharedByToken } from "@/lib/shareLoader";

export const dynamic = "force-dynamic";

const D = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  indigoBorder: "rgba(99,102,241,0.22)",
  text: "var(--app-text)",
  muted: "var(--app-text-muted)",
  mutedDark: "#64748b",
  rose: "#ef4444",
};

export default async function SharedResourcePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const config = getSiteConfig();
  const res = await loadSharedByToken(token);

  if (res.status !== "active") {
    return <UnavailablePage reason={res.status} themeEngine={config.branding.themeEngine} />;
  }

  const { data } = res;

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "#0a0c18", color: D.text }}
    >
      <NeuralBackground themeEngine={config.branding.themeEngine} />

      <main className="relative z-10 max-w-2xl mx-auto px-5 py-10 sm:py-16">
        {/* Brand */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-extrabold tracking-tight"
            style={{
              background: `linear-gradient(90deg,${D.violet},#38bdf8)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Unifyo
          </Link>
          <span
            className="text-[0.6rem] tracking-widest uppercase font-semibold px-2 py-1 rounded-full"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: `1px solid ${D.indigoBorder}`,
              color: D.muted,
            }}
          >
            <Link2 className="inline w-3 h-3 mr-1" />
            Zdieľaný náhľad
          </span>
        </div>

        <p className="text-sm mb-4" style={{ color: D.muted }}>
          Zdieľané{" "}
          <span className="font-semibold" style={{ color: D.text }}>
            {data.owner}
          </span>
        </p>

        {/* Content card */}
        <section
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: "#0a0c18",
            border: `1px solid ${D.indigoBorder}`,
            boxShadow: "0 0 40px rgba(99,102,241,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          {data.resourceType === "task" ? <TaskCard data={data} /> : <ContactCard data={data} />}
        </section>

        {/* Footer CTA */}
        <footer className="mt-10 text-center">
          <p className="text-sm mb-3" style={{ color: D.muted }}>
            Vytvorené v{" "}
            <span className="font-semibold" style={{ color: D.text }}>
              Unifyo
            </span>{" "}
            — tvoj AI business asistent.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
              color: "white",
              boxShadow: "0 0 24px rgba(99,102,241,0.35)",
            }}
          >
            Vyskúšaj zdarma →
          </Link>
        </footer>
      </main>
    </div>
  );
}

// ── Task card ─────────────────────────────────────────────────────
function TaskCard({
  data,
}: {
  data: {
    resourceType: "task";
    title: string;
    date: string;
    time: string | null;
    description: string | null;
  };
}) {
  const dateStr = formatDateSK(data.date);
  return (
    <div>
      <div className="flex items-center gap-2 mb-3" style={{ color: D.muted }}>
        <Calendar className="w-4 h-4" />
        <span className="text-[0.65rem] tracking-widest uppercase font-semibold">Úloha</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-5" style={{ color: D.text }}>
        {data.title}
      </h1>
      <div className="flex flex-wrap gap-3 mb-6">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
          style={{
            background: "rgba(99,102,241,0.1)",
            border: `1px solid ${D.indigoBorder}`,
            color: D.text,
          }}
        >
          <Calendar className="w-4 h-4" style={{ color: D.indigo }} />
          {dateStr}
        </span>
        {data.time && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm"
            style={{
              background: "rgba(99,102,241,0.1)",
              border: `1px solid ${D.indigoBorder}`,
              color: D.text,
            }}
          >
            <Clock className="w-4 h-4" style={{ color: D.indigo }} />
            {data.time}
          </span>
        )}
      </div>
      {data.description && (
        <div
          className="rounded-xl p-4 text-sm whitespace-pre-wrap"
          style={{
            background: "rgba(99,102,241,0.06)",
            border: `1px solid ${D.indigoBorder}`,
            color: D.text,
          }}
        >
          {data.description}
        </div>
      )}
    </div>
  );
}

// ── Contact card ──────────────────────────────────────────────────
function ContactCard({
  data,
}: {
  data: {
    resourceType: "contact";
    name: string;
    company: string | null;
    notes: { content: string; createdAt: string }[];
  };
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3" style={{ color: D.muted }}>
        <UserIcon className="w-4 h-4" />
        <span className="text-[0.65rem] tracking-widest uppercase font-semibold">Kontakt</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: D.text }}>
        {data.name}
      </h1>
      {data.company && (
        <p className="mt-1 flex items-center gap-1.5 text-sm" style={{ color: D.muted }}>
          <Briefcase className="w-3.5 h-3.5" />
          {data.company}
        </p>
      )}

      <div className="mt-6">
        <div
          className="text-[0.65rem] tracking-widest uppercase font-semibold mb-2 flex items-center gap-1.5"
          style={{ color: D.muted }}
        >
          <FileText className="w-3.5 h-3.5" />
          Posledné poznámky
        </div>
        {data.notes.length === 0 ? (
          <p className="text-sm" style={{ color: D.mutedDark }}>
            Zatiaľ žiadne poznámky.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.notes.map((n, i) => (
              <li
                key={i}
                className="rounded-xl p-3 text-sm"
                style={{
                  background: "rgba(99,102,241,0.06)",
                  border: `1px solid ${D.indigoBorder}`,
                  color: D.text,
                }}
              >
                <p className="whitespace-pre-wrap">{n.content}</p>
                <p className="mt-1.5 text-[10px]" style={{ color: D.mutedDark }}>
                  {new Date(n.createdAt).toLocaleString("sk-SK")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Unavailable page ─────────────────────────────────────────────
function UnavailablePage({
  reason,
  themeEngine,
}: {
  reason: "not_found" | "revoked" | "expired";
  themeEngine: ReturnType<typeof getSiteConfig>["branding"]["themeEngine"];
}) {
  const title = "Odkaz už nie je dostupný";
  const subtitle =
    reason === "revoked"
      ? "Majiteľ tento odkaz zrušil."
      : reason === "expired"
        ? "Platnosť odkazu vypršala."
        : "Odkaz neexistuje alebo bol odstránený.";
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "#0a0c18", color: D.text }}
    >
      <NeuralBackground themeEngine={themeEngine} />
      <main className="relative z-10 max-w-md mx-auto px-5 py-20 sm:py-28 text-center">
        <div
          className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(239,68,68,0.12)", border: `1px solid ${D.rose}44` }}
        >
          <AlertTriangle className="w-6 h-6" style={{ color: D.rose }} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: D.text }}>
          {title}
        </h1>
        <p className="text-sm mb-8" style={{ color: D.muted }}>
          {subtitle}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            background: `linear-gradient(135deg,${D.indigo},${D.violet})`,
            color: "white",
            boxShadow: "0 0 24px rgba(99,102,241,0.35)",
          }}
        >
          Späť na Unifyo →
        </Link>
      </main>
    </div>
  );
}

// Format "YYYY-MM-DD" as "19. apríl 2026" (Slovak).
function formatDateSK(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return iso;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("sk-SK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
