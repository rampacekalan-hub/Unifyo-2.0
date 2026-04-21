// src/lib/automation.ts
// Implementations of the built-in automation recipes. Each recipe is a
// pure function that takes `userId` + returns a human-readable result
// line. Enablement is stored in User.preferences.automations — a
// plain object keyed by rule id. No cron wired yet; /api/automation/run
// invokes the selected recipe on demand so the user can test it.

import { prisma } from "@/lib/prisma";
import { sendGenericEmail } from "@/lib/email";

export type AutomationId = "daily-digest" | "stale-deal" | "new-sender-to-crm";

export interface AutomationRecipe {
  id: AutomationId;
  title: string;
  description: string;
  runnable: boolean; // Does "Run now" work today, or is it cron-only / pending?
  runLabel: string;
}

export const RECIPES: AutomationRecipe[] = [
  {
    id: "daily-digest",
    title: "Ranný súhrn do e-mailu",
    description:
      "Každé ráno o 8:00 ti príde e-mail s dnešnými úlohami, pripomienkami a otvorenými dealmi.",
    runnable: true,
    runLabel: "Poslať testovací súhrn",
  },
  {
    id: "stale-deal",
    title: "Upozornenie na zaseknutý deal",
    description:
      "Ak sa deal nehýbe 14 dní, dostaneš e-mail s tipom na ďalší krok.",
    runnable: true,
    runLabel: "Skontrolovať hneď",
  },
  {
    id: "new-sender-to-crm",
    title: "Nový odosielateľ z Gmailu do CRM",
    description:
      "Keď ti napíše niekto kto ešte nie je v CRM, pridáme ho automaticky ako kontakt.",
    runnable: false,
    runLabel: "Beží na pozadí",
  },
];

// ── Daily digest ─────────────────────────────────────────────────

async function runDailyDigest(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) return "Užívateľ nenájdený.";

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 24 * 3600_000).toISOString().slice(0, 10);

  const [tasksToday, openDeals, newContacts] = await Promise.all([
    prisma.calendarTask.findMany({
      where: { userId, date: { in: [today, tomorrow] }, done: false },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 15,
      select: { title: true, date: true, time: true },
    }),
    prisma.crmDeal.count({
      where: { userId, stage: { in: ["LEAD", "QUALIFIED", "PROPOSAL"] } },
    }),
    prisma.crmContact.count({
      where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600_000) } },
    }),
  ]);

  const name = user.name?.split(" ")[0] ?? "";
  const taskLines = tasksToday.length
    ? tasksToday
        .map((t) => `• ${t.date}${t.time ? " " + t.time : ""} — ${t.title}`)
        .join("\n")
    : "Nemáš naplánované žiadne úlohy.";

  const subject = `Ranný súhrn · ${today}`;
  const text = [
    `Dobré ráno${name ? ", " + name : ""}.`,
    "",
    "📅 Dnes + zajtra:",
    taskLines,
    "",
    `💼 Otvorené dealy: ${openDeals}`,
    `👤 Nové kontakty (7d): ${newContacts}`,
    "",
    "Skvelý deň!",
    "— Unifyo",
  ].join("\n");
  const html = `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1f2937">
  <h2 style="color:#6366f1;margin:0 0 12px">Dobré ráno${name ? ", " + name : ""} ☀️</h2>
  <h3 style="color:#334155;margin:16px 0 6px;font-size:14px">Dnes + zajtra</h3>
  <pre style="font-family:ui-monospace,Menlo,monospace;background:#f1f5f9;padding:12px;border-radius:8px;white-space:pre-wrap;margin:0">${escapeHtml(taskLines)}</pre>
  <p style="margin:16px 0 4px"><strong>Otvorené dealy:</strong> ${openDeals}</p>
  <p style="margin:4px 0"><strong>Nové kontakty (7d):</strong> ${newContacts}</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
  <p style="color:#94a3b8;font-size:12px;margin:0">Ak už takýto e-mail nechceš, vypni ho v Nastaveniach → Automations.</p>
</div>`;

  await sendGenericEmail({ to: user.email, subject, html, text, tag: "digest" });
  return `Poslané na ${user.email}.`;
}

// ── Stale deal alert ──────────────────────────────────────────────

async function runStaleDealCheck(userId: string): Promise<string> {
  const cutoff = new Date(Date.now() - 14 * 24 * 3600_000);
  const stale = await prisma.crmDeal.findMany({
    where: {
      userId,
      stage: { in: ["LEAD", "QUALIFIED", "PROPOSAL"] },
      lastActivityAt: { lt: cutoff },
    },
    orderBy: { lastActivityAt: "asc" },
    take: 10,
    select: { title: true, stage: true, lastActivityAt: true },
  });

  if (stale.length === 0) {
    return "Všetky dealy sa hýbu — žiadne zaseknuté.";
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return "Užívateľ nenájdený.";

  const lines = stale
    .map(
      (d) =>
        `• [${d.stage}] ${d.title} — bez pohybu ${Math.floor(
          (Date.now() - new Date(d.lastActivityAt).getTime()) / 86_400_000,
        )} dní`,
    )
    .join("\n");
  const text = `Máš ${stale.length} zaseknutých dealov:\n\n${lines}\n\nSkús sa im dnes pozrieť.\n— Unifyo`;
  await sendGenericEmail({
    to: user.email,
    subject: `⚠️ ${stale.length} zaseknutých dealov`,
    html: `<pre style="font-family:ui-monospace,Menlo;font-size:13px;line-height:1.6">${escapeHtml(text)}</pre>`,
    text,
    tag: "stale-deal",
  });
  return `Poslané — ${stale.length} dealov.`;
}

// ── Dispatcher ────────────────────────────────────────────────────

export async function runAutomation(
  userId: string,
  id: AutomationId,
): Promise<string> {
  switch (id) {
    case "daily-digest":
      return runDailyDigest(userId);
    case "stale-deal":
      return runStaleDealCheck(userId);
    case "new-sender-to-crm":
      return "Táto automatizácia sa spúšťa automaticky pri prijatí nových mailov.";
    default:
      return "Neznáma automatizácia.";
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
