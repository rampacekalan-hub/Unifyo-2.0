// src/lib/ai/userContext.ts
// Builds a "here's what's going on in the user's business" block that
// we inject into the AI system prompt on every turn. Gives the model
// real grounding — names, counts, deadlines — so it can answer
// questions like "čo s Petrom" without being oblivious.
//
// Privacy note: this data belongs to the user and stays between their
// browser session and OpenAI inside that single request. We don't log
// it. The long-term memory pipeline (neuralMemory) still stores the
// anonymised version — this block is NOT written anywhere.

import { prisma } from "@/lib/prisma";

export async function buildUserBusinessContext(userId: string): Promise<string> {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 3600_000);
  const today = now.toISOString().slice(0, 10);

  const [user, recentContacts, openDeals, upcomingTasks, recentCalls] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, company: true, industry: true, email: true },
    }),
    prisma.crmContact.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        name: true, company: true, email: true, phone: true,
        notes: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true },
        },
      },
    }),
    prisma.crmDeal.findMany({
      where: { userId, stage: { in: ["LEAD", "QUALIFIED", "PROPOSAL"] } },
      orderBy: { lastActivityAt: "desc" },
      take: 10,
      select: {
        title: true,
        stage: true,
        expectedValue: true,
        expectedCloseAt: true,
        note: true,
        contact: { select: { name: true } },
      },
    }),
    prisma.calendarTask.findMany({
      where: { userId, done: false, date: { gte: today } },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 10,
      select: { title: true, date: true, time: true, description: true },
    }),
    prisma.callRecording.findMany({
      where: { userId, status: "DONE", createdAt: { gte: new Date(now.getTime() - 14 * 24 * 3600_000) } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { title: true, createdAt: true, summary: true },
    }),
  ]);

  if (!user) return "";

  const lines: string[] = [];
  lines.push("## KONTEXT POUŽÍVATEĽA");
  lines.push(`Meno: ${user.name ?? "(neuvedené)"}`);
  if (user.company) lines.push(`Firma: ${user.company}`);
  if (user.industry) lines.push(`Odvetvie: ${user.industry}`);

  if (recentContacts.length > 0) {
    lines.push("");
    lines.push("## POSLEDNÉ KONTAKTY V CRM (top 10)");
    for (const c of recentContacts) {
      const parts = [c.name];
      if (c.company) parts.push(`(${c.company})`);
      if (c.email) parts.push(`· ${c.email}`);
      if (c.phone) parts.push(`· ${c.phone}`);
      lines.push(`• ${parts.join(" ")}`);
      const latestNote = c.notes?.[0]?.content;
      if (latestNote) lines.push(`  Poznámka: ${truncate(latestNote, 120)}`);
    }
  }

  if (openDeals.length > 0) {
    lines.push("");
    lines.push("## OTVORENÉ DEALY");
    for (const d of openDeals) {
      const eur = d.expectedValue ? ` · ${Math.round(d.expectedValue / 100)} €` : "";
      const who = d.contact?.name ? ` · ${d.contact.name}` : "";
      const due = d.expectedCloseAt
        ? ` · termín ${new Date(d.expectedCloseAt).toLocaleDateString("sk-SK")}`
        : "";
      lines.push(`• [${d.stage}] ${d.title}${who}${eur}${due}`);
      if (d.note) lines.push(`  Poznámka: ${truncate(d.note, 120)}`);
    }
  }

  if (upcomingTasks.length > 0) {
    lines.push("");
    lines.push("## NADCHÁDZAJÚCE ÚLOHY");
    for (const t of upcomingTasks) {
      const when = `${t.date}${t.time ? " " + t.time : ""}`;
      lines.push(`• ${when} — ${t.title}`);
      if (t.description) lines.push(`  ${truncate(t.description, 120)}`);
    }
  }

  if (recentCalls.length > 0) {
    lines.push("");
    lines.push("## POSLEDNÉ HOVORY (14 dní)");
    for (const c of recentCalls) {
      const when = new Date(c.createdAt).toLocaleDateString("sk-SK");
      lines.push(`• ${when} — ${c.title}`);
      if (c.summary) lines.push(`  Zhrnutie: ${truncate(c.summary, 180)}`);
    }
  }

  lines.push("");
  lines.push("Používaj tieto údaje keď ti k niečomu pomáhajú — neuvádzaj ich všetky zbytočne.");

  // Hard cap so we don't blow the context window on power users.
  return truncate(lines.join("\n"), 6000);

  // `in7Days` was originally intended for upcoming-task cutoff; we now
  // include everything from today onwards for broader grounding. Keep
  // the var so the import stays lint-clean in case we re-tighten.
  void in7Days;
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 3) + "...";
}
