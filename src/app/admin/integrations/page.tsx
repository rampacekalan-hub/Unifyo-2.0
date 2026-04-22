// src/app/admin/integrations/page.tsx
// Aggregated view of every "+ Chcem túto" click on
// /settings/integrations. Feedback.kind="idea" rows starting with
// "Chcem integráciu:" are grouped by the integration feature slug so
// the owner can see demand at a glance.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Mail, Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Integrations demand — Admin" };

interface Row {
  feature: string;
  name: string;
  count: number;
  voters: { email: string | null; name: string | null; at: string }[];
}

export default async function AdminIntegrationsPage() {
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

  // Pull every integration-demand feedback. We don't join on user —
  // anonymous votes (pre-signup) should also count. Include user if
  // present so we know who to email when an integration ships.
  const items = await prisma.feedback.findMany({
    where: {
      kind: "idea",
      message: { startsWith: "Chcem integráciu:" },
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
  });

  // Group by the feature slug inside parentheses. Example message:
  // "Chcem integráciu: Microsoft Outlook (outlook)" → feature=outlook,
  // name="Microsoft Outlook".
  const byFeature = new Map<string, Row>();
  for (const f of items) {
    const match = f.message.match(/^Chcem integráciu:\s*(.+?)\s*\((.+?)\)\s*$/);
    const name = match?.[1] ?? "(Neznáme)";
    const feature = match?.[2] ?? "unknown";
    if (!byFeature.has(feature)) {
      byFeature.set(feature, { feature, name, count: 0, voters: [] });
    }
    const row = byFeature.get(feature)!;
    row.count++;
    row.voters.push({
      email: f.user?.email ?? null,
      name: f.user?.name ?? null,
      at: f.createdAt.toISOString(),
    });
  }
  const rows = [...byFeature.values()].sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--app-bg)", color: "var(--app-text)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/admin"
            className="p-2 rounded-lg"
            style={{ background: "var(--app-surface-2)", border: "1px solid var(--app-border)", color: "var(--app-text-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Dopyt po integráciách</h1>
            <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
              Koľko ľudí kliklo „Chcem túto" pre každú plánovanú integráciu.
              Zoznam voterov je tu, aby si im vedel poslať e-mail keď integrácia ide live.
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center text-sm"
            style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)", color: "var(--app-text-muted)" }}
          >
            Zatiaľ žiadne hlasy.
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li
                key={r.feature}
                className="rounded-2xl p-4"
                style={{ background: "var(--app-surface)", border: "1px solid var(--app-border)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" style={{ color: "var(--brand-primary)" }} />
                    <strong style={{ color: "var(--app-text)" }}>{r.name}</strong>
                    <span className="text-[11px]" style={{ color: "var(--app-text-subtle)" }}>
                      {r.feature}
                    </span>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: "var(--brand-primary-soft)",
                      color: "var(--brand-primary)",
                      border: "1px solid color-mix(in oklab, var(--brand-primary) 35%, transparent)",
                    }}
                  >
                    {r.count} {r.count === 1 ? "hlas" : r.count < 5 ? "hlasy" : "hlasov"}
                  </span>
                </div>

                {/* Voter list with a one-click mailto so you can bulk-notify */}
                <details className="text-xs">
                  <summary
                    className="cursor-pointer select-none"
                    style={{ color: "var(--app-text-muted)" }}
                  >
                    Zobraziť voterov
                  </summary>
                  <div className="mt-2 space-y-1">
                    {r.voters.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-[11px] py-1"
                        style={{ color: "var(--app-text-muted)" }}
                      >
                        {v.email ? (
                          <a
                            href={`mailto:${v.email}?subject=${encodeURIComponent(`${r.name} je live v Unifyo!`)}`}
                            className="flex items-center gap-1 hover:underline"
                            style={{ color: "var(--brand-primary)" }}
                          >
                            <Mail className="w-3 h-3" />
                            {v.name ?? v.email}
                          </a>
                        ) : (
                          <span style={{ color: "var(--app-text-subtle)" }}>Anonymný</span>
                        )}
                        <span style={{ color: "var(--app-text-subtle)" }}>
                          · {new Date(v.at).toLocaleDateString("sk-SK")}
                        </span>
                      </div>
                    ))}

                    {/* Bulk mailto — all voter emails comma-separated */}
                    {r.voters.some((v) => v.email) && (
                      <a
                        href={`mailto:${r.voters.map((v) => v.email).filter(Boolean).join(",")}?subject=${encodeURIComponent(`${r.name} je live v Unifyo!`)}&body=${encodeURIComponent(`Ahoj,\n\nsľúbený update: ${r.name} integrácia je dostupná v Unifyo.\nOtvor ju v Nastaveniach → Integrácie.\n\n— Unifyo`)}`}
                        className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-md text-[10px] font-semibold"
                        style={{
                          background: "var(--brand-gradient)",
                          color: "#fff",
                        }}
                      >
                        <Mail className="w-3 h-3" />
                        Notify všetkých
                      </a>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
