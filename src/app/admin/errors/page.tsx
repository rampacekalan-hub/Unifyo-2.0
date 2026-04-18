// src/app/admin/errors/page.tsx
// Admin viewer interného Sentry-lite. Groupuje occurrences by fingerprint,
// filter: all | unresolved | resolved.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveFingerprint, reopenFingerprint } from "./actions";

export const dynamic = "force-dynamic";

type Filter = "unresolved" | "resolved" | "all";

export default async function AdminErrorsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
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

  const sp = await searchParams;
  const filter: Filter =
    sp.filter === "resolved" ? "resolved" : sp.filter === "all" ? "all" : "unresolved";

  // Agregácia by fingerprint. Prisma groupBy nevie vrátiť sample row,
  // takže to spravíme v dvoch krokoch: group + fetch latest per fp.
  const grouped = await prisma.errorLog.groupBy({
    by: ["fingerprint"],
    where:
      filter === "all"
        ? {}
        : filter === "resolved"
          ? { resolved: true }
          : { resolved: false },
    _count: { _all: true },
    _max: { createdAt: true },
    orderBy: { _max: { createdAt: "desc" } },
    take: 200,
  });

  const fingerprints = grouped.map((g) => g.fingerprint);
  const latestRows = fingerprints.length
    ? await prisma.errorLog.findMany({
        where: { fingerprint: { in: fingerprints } },
        orderBy: { createdAt: "desc" },
        distinct: ["fingerprint"],
        select: {
          id: true,
          fingerprint: true,
          source: true,
          name: true,
          message: true,
          url: true,
          resolved: true,
          createdAt: true,
        },
      })
    : [];
  const latestByFp = new Map(latestRows.map((r) => [r.fingerprint, r]));

  const rows = grouped.map((g) => {
    const latest = latestByFp.get(g.fingerprint);
    return {
      fingerprint: g.fingerprint,
      count: g._count._all,
      lastSeen: g._max.createdAt,
      latest,
    };
  });

  const B = {
    bg: "#080b12",
    surface: "rgba(15,18,32,0.85)",
    border: "rgba(139,92,246,0.18)",
    text: "#eef2ff",
    muted: "#94a3b8",
    dim: "#64748b",
    violet: "#a78bfa",
    violetDeep: "#7c3aed",
    red: "#ef4444",
    green: "#10b981",
  };

  return (
    <main style={{ background: B.bg, minHeight: "100vh", color: B.text, padding: "32px 20px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 8 }}>
          <Link href="/admin" style={{ color: B.violet, textDecoration: "none", fontSize: 13 }}>
            ← Admin
          </Link>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 8px" }}>
          Error log
        </h1>
        <p style={{ color: B.muted, margin: "0 0 24px", fontSize: 14 }}>
          Interný Sentry-lite. Skupinuje similar errors podľa fingerprint (SHA-256 z name + first frame).
        </p>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {(["unresolved", "resolved", "all"] as const).map((f) => {
            const active = filter === f;
            return (
              <Link
                key={f}
                href={`/admin/errors?filter=${f}`}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  background: active ? "rgba(124,58,237,0.2)" : "rgba(139,92,246,0.06)",
                  border: `1px solid ${active ? B.violetDeep : B.border}`,
                  color: active ? B.text : B.muted,
                }}
              >
                {f === "unresolved" ? "Nevyriešené" : f === "resolved" ? "Vyriešené" : "Všetky"}
              </Link>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <div
            style={{
              background: B.surface,
              border: `1px solid ${B.border}`,
              borderRadius: 16,
              padding: 48,
              textAlign: "center",
              color: B.muted,
            }}
          >
            Žiadne chyby v tejto kategórii. 🎉
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((r) => {
              const l = r.latest;
              return (
                <div
                  key={r.fingerprint}
                  style={{
                    background: B.surface,
                    border: `1px solid ${B.border}`,
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "monospace",
                            color: B.violet,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "rgba(124,58,237,0.1)",
                          }}
                        >
                          {r.fingerprint}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: B.dim,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: "rgba(148,163,184,0.08)",
                          }}
                        >
                          {l?.source ?? "?"}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: r.count > 10 ? B.red : B.muted,
                          }}
                        >
                          ×{r.count}
                        </span>
                        {l?.resolved && (
                          <span style={{ fontSize: 11, color: B.green, fontWeight: 600 }}>
                            ✓ vyriešené
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: B.text,
                          marginBottom: 4,
                          wordBreak: "break-word",
                        }}
                      >
                        {l?.name ? `${l.name}: ` : ""}
                        {l?.message ?? "(no message)"}
                      </div>
                      <div style={{ fontSize: 12, color: B.dim, wordBreak: "break-all" }}>
                        {l?.url ?? "—"} · posledná {r.lastSeen ? formatRel(r.lastSeen) : "?"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {l && (
                        <Link
                          href={`/admin/errors/${l.id}`}
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            padding: "6px 12px",
                            borderRadius: 8,
                            textDecoration: "none",
                            color: B.text,
                            background: "rgba(139,92,246,0.12)",
                            border: `1px solid ${B.border}`,
                          }}
                        >
                          Detail
                        </Link>
                      )}
                      {l?.resolved ? (
                        <form action={reopenWithFp.bind(null, r.fingerprint)}>
                          <button
                            type="submit"
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: `1px solid ${B.border}`,
                              background: "rgba(139,92,246,0.06)",
                              color: B.muted,
                              cursor: "pointer",
                            }}
                          >
                            Reopen
                          </button>
                        </form>
                      ) : (
                        <form action={resolveWithFp.bind(null, r.fingerprint)}>
                          <button
                            type="submit"
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "1px solid rgba(16,185,129,0.3)",
                              background: "rgba(16,185,129,0.1)",
                              color: B.green,
                              cursor: "pointer",
                            }}
                          >
                            Vyriešiť
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

// Server action adapters — <form action> pošle FormData, tu len wrappujeme
// naše typed server actions (berú string fingerprint).
async function resolveWithFp(fingerprint: string) {
  "use server";
  await resolveFingerprint(fingerprint);
}
async function reopenWithFp(fingerprint: string) {
  "use server";
  await reopenFingerprint(fingerprint);
}

function formatRel(d: Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}d`;
}
