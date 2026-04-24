// src/app/admin/errors/[id]/page.tsx
// Detail jedného ErrorLog rowu. Odkaz sem je aj v alert emaile.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveFingerprint, reopenFingerprint } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminErrorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    notFound();
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPERADMIN")) {
    notFound();
  }

  const { id } = await params;
  const row = await prisma.errorLog.findUnique({ where: { id } });
  if (!row) notFound();

  // Okolité occurences s rovnakým fingerprint — užitočné vidieť pattern.
  const siblings = await prisma.errorLog.findMany({
    where: { fingerprint: row.fingerprint, id: { not: row.id } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, createdAt: true, url: true, userEmail: true },
  });
  const totalCount = await prisma.errorLog.count({ where: { fingerprint: row.fingerprint } });

  const B = {
    bg: "#080b12",
    surface: "rgba(15,18,32,0.85)",
    border: "rgba(139,92,246,0.18)",
    text: "var(--app-text)",
    muted: "var(--app-text-muted)",
    dim: "#64748b",
    violet: "#a78bfa",
    violetDeep: "#7c3aed",
    red: "#ef4444",
    green: "#10b981",
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 11, color: B.dim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
      {children}
    </div>
  );
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 16 }}>
      <Label>{label}</Label>
      <div style={{ fontSize: 14, color: B.text, wordBreak: "break-word" }}>{children}</div>
    </div>
  );

  return (
    <main style={{ background: B.bg, minHeight: "100vh", color: B.text, padding: "32px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Link href="/admin/errors" style={{ color: B.violet, textDecoration: "none", fontSize: 13 }}>
          ← Error log
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "12px 0 20px" }}>
          {row.name ? `${row.name}: ` : ""}
          {row.message}
        </h1>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <span
            style={{
              fontSize: 12,
              fontFamily: "monospace",
              color: B.violet,
              padding: "4px 10px",
              borderRadius: 6,
              background: "rgba(124,58,237,0.12)",
            }}
          >
            {row.fingerprint}
          </span>
          <span
            style={{
              fontSize: 12,
              color: B.muted,
              padding: "4px 10px",
              borderRadius: 6,
              background: "rgba(148,163,184,0.08)",
            }}
          >
            {row.source}
          </span>
          <span
            style={{
              fontSize: 12,
              color: B.muted,
              padding: "4px 10px",
              borderRadius: 6,
              background: "rgba(148,163,184,0.08)",
            }}
          >
            ×{totalCount} occurences
          </span>
          {row.resolved ? (
            <span style={{ fontSize: 12, color: B.green, padding: "4px 10px" }}>
              ✓ vyriešené {row.resolvedAt ? new Date(row.resolvedAt).toLocaleString("sk") : ""}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: B.red, padding: "4px 10px" }}>● otvorené</span>
          )}
        </div>

        <div
          style={{
            background: B.surface,
            border: `1px solid ${B.border}`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <Field label="Čas">{new Date(row.createdAt).toLocaleString("sk")}</Field>
          <Field label="URL">{row.url || "—"}</Field>
          <Field label="User">
            {row.userEmail || row.userId || <span style={{ color: B.dim }}>anonymný</span>}
          </Field>
          <Field label="User Agent">
            <span style={{ fontSize: 12, color: B.muted }}>{row.userAgent || "—"}</span>
          </Field>
          {row.digest && <Field label="Next.js digest">{row.digest}</Field>}
        </div>

        {row.stack && (
          <div
            style={{
              background: B.surface,
              border: `1px solid ${B.border}`,
              borderRadius: 14,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <Label>Stack trace</Label>
            <pre
              style={{
                fontSize: 12,
                fontFamily: "monospace",
                color: "#fca5a5",
                background: "rgba(239,68,68,0.05)",
                padding: 14,
                borderRadius: 8,
                overflow: "auto",
                margin: "8px 0 0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {row.stack}
            </pre>
          </div>
        )}

        {row.meta !== null && row.meta !== undefined && (
          <div
            style={{
              background: B.surface,
              border: `1px solid ${B.border}`,
              borderRadius: 14,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <Label>Meta</Label>
            <pre
              style={{
                fontSize: 12,
                fontFamily: "monospace",
                color: B.muted,
                background: "rgba(148,163,184,0.06)",
                padding: 14,
                borderRadius: 8,
                overflow: "auto",
                margin: "8px 0 0",
              }}
            >
              {JSON.stringify(row.meta, null, 2)}
            </pre>
          </div>
        )}

        {siblings.length > 0 && (
          <div
            style={{
              background: B.surface,
              border: `1px solid ${B.border}`,
              borderRadius: 14,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <Label>Ďalšie occurences ({siblings.length} z {totalCount - 1})</Label>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {siblings.map((s) => (
                <Link
                  key={s.id}
                  href={`/admin/errors/${s.id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "8px 10px",
                    borderRadius: 8,
                    textDecoration: "none",
                    background: "rgba(139,92,246,0.05)",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: B.muted }}>{new Date(s.createdAt).toLocaleString("sk")}</span>
                  <span style={{ color: B.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {s.url || "—"}
                  </span>
                  <span style={{ color: B.dim }}>{s.userEmail || "anon"}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          {row.resolved ? (
            <form action={reopenAction.bind(null, row.fingerprint)}>
              <button
                type="submit"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: `1px solid ${B.border}`,
                  background: "rgba(139,92,246,0.08)",
                  color: B.text,
                  cursor: "pointer",
                }}
              >
                Reopen skupinu
              </button>
            </form>
          ) : (
            <form action={resolveAction.bind(null, row.fingerprint)}>
              <button
                type="submit"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "1px solid rgba(16,185,129,0.3)",
                  background: "rgba(16,185,129,0.12)",
                  color: B.green,
                  cursor: "pointer",
                }}
              >
                Vyriešiť celú skupinu
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

async function resolveAction(fingerprint: string) {
  "use server";
  await resolveFingerprint(fingerprint);
}
async function reopenAction(fingerprint: string) {
  "use server";
  await reopenFingerprint(fingerprint);
}
