// src/lib/automation.ts
// Implementations of the built-in automation recipes. Each recipe is a
// pure function that takes `userId` + returns a human-readable result
// line. Enablement is stored in User.preferences.automations — a
// plain object keyed by rule id. No cron wired yet; /api/automation/run
// invokes the selected recipe on demand so the user can test it.

import { prisma } from "@/lib/prisma";
import { sendGenericEmail } from "@/lib/email";
import { getValidAccessToken, listCalendarEvents } from "@/lib/google";

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

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 24 * 3600_000).toISOString().slice(0, 10);
  const dayAfter = new Date(now.getTime() + 48 * 3600_000);

  // Fetch local tasks + Google events in parallel. Owner flagged the
  // digest saying "nemáš žiadne úlohy" even though Google Calendar was
  // full — we were only scanning local CalendarTask rows.
  const token = await getValidAccessToken(userId).catch(() => null);
  const [localTasks, googleEvents, openDeals, newContacts, topDeals] = await Promise.all([
    prisma.calendarTask.findMany({
      where: { userId, date: { in: [today, tomorrow] }, done: false },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 15,
      select: { title: true, date: true, time: true },
    }),
    token
      ? listCalendarEvents(token, { timeMin: now, timeMax: dayAfter, maxResults: 20 }).catch(() => [])
      : Promise.resolve([]),
    prisma.crmDeal.count({
      where: { userId, stage: { in: ["LEAD", "QUALIFIED", "PROPOSAL"] } },
    }),
    prisma.crmContact.count({
      where: { userId, createdAt: { gte: new Date(now.getTime() - 7 * 24 * 3600_000) } },
    }),
    prisma.crmDeal.findMany({
      where: { userId, stage: { in: ["LEAD", "QUALIFIED", "PROPOSAL"] } },
      orderBy: { lastActivityAt: "asc" },
      take: 3,
      select: { title: true, stage: true, contact: { select: { name: true } }, lastActivityAt: true },
    }),
  ]);

  // Normalise local + Google into one sortable list per day.
  type Item = { date: string; time: string | null; title: string; source: "local" | "google" };
  const items: Item[] = [
    ...localTasks.map((t) => ({ date: t.date, time: t.time, title: t.title, source: "local" as const })),
    ...googleEvents.map((e) => {
      const date = e.start.slice(0, 10);
      const time = e.allDay || !/T/.test(e.start) ? null : e.start.slice(11, 16);
      return { date, time, title: e.summary, source: "google" as const };
    }),
  ]
    .filter((i) => i.date === today || i.date === tomorrow)
    .sort((a, b) => (a.date + (a.time ?? "")).localeCompare(b.date + (b.time ?? "")));

  const todayItems = items.filter((i) => i.date === today);
  const tomorrowItems = items.filter((i) => i.date === tomorrow);

  const name = user.name?.split(" ")[0] ?? "";
  const subject = `Ranný súhrn · ${today}`;

  const textBlock = (arr: Item[]): string =>
    arr.length === 0
      ? "— nič naplánované"
      : arr.map((i) => `• ${i.time ? i.time + " · " : ""}${i.title}${i.source === "google" ? " (Google)" : ""}`).join("\n");

  const text = [
    `Dobré ráno${name ? ", " + name : ""}.`,
    "",
    "📅 DNES:",
    textBlock(todayItems),
    "",
    "📅 ZAJTRA:",
    textBlock(tomorrowItems),
    "",
    `💼 Otvorené dealy: ${openDeals}`,
    `👤 Noví kontakti (7d): ${newContacts}`,
    "",
    "Otvor Unifyo: https://unifyo.online/dashboard-overview",
    "— Unifyo",
  ].join("\n");

  // ── HTML design — branded, responsive, legible ──
  // Gmail strips <style>, so every rule is inline. We keep the layout
  // a single 600px centred card with a gradient header strip, light
  // panels per section, and a clear CTA button.
  const htmlBlock = (arr: Item[], accent: string): string =>
    arr.length === 0
      ? `<p style="margin:0;color:#94a3b8;font-size:13px;font-style:italic">— nič naplánované</p>`
      : `<ul style="list-style:none;padding:0;margin:0">${arr
          .map(
            (i) => `
    <li style="padding:8px 12px;margin:4px 0;background:#f8fafc;border-left:3px solid ${accent};border-radius:6px;display:flex;gap:8px">
      ${i.time ? `<strong style="color:${accent};font-size:13px;min-width:48px;display:inline-block">${escapeHtml(i.time)}</strong>` : ""}
      <span style="color:#0f172a;font-size:13px;flex:1">${escapeHtml(i.title)}${i.source === "google" ? `<span style="color:#94a3b8;font-size:11px;margin-left:6px">· Google</span>` : ""}</span>
    </li>`,
          )
          .join("")}</ul>`;

  const dealsBlock = topDeals.length
    ? `<ul style="list-style:none;padding:0;margin:8px 0 0">${topDeals
        .map((d) => {
          const days = Math.floor((Date.now() - new Date(d.lastActivityAt).getTime()) / 86_400_000);
          return `
    <li style="padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:12px;color:#475569">
      <span style="display:inline-block;padding:2px 6px;background:#e0e7ff;color:#4338ca;border-radius:4px;font-size:10px;font-weight:bold;margin-right:6px;text-transform:uppercase">${escapeHtml(d.stage)}</span>
      <strong style="color:#0f172a">${escapeHtml(d.title)}</strong>
      ${d.contact?.name ? `<span style="color:#94a3b8"> · ${escapeHtml(d.contact.name)}</span>` : ""}
      <span style="color:#f59e0b;float:right">${days} d bez pohybu</span>
    </li>`;
        })
        .join("")}</ul>`
    : `<p style="margin:8px 0 0;color:#94a3b8;font-size:12px;font-style:italic">Žiadne otvorené dealy.</p>`;

  const html = `<!DOCTYPE html>
<html lang="sk"><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(15,23,42,0.06)">

    <!-- Gradient header -->
    <div style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:28px 24px;color:#fff">
      <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;opacity:0.75">Unifyo · Ranný súhrn</p>
      <h1 style="margin:6px 0 0;font-size:22px;font-weight:800;letter-spacing:-0.01em">
        Dobré ráno${name ? `, ${escapeHtml(name)}` : ""} ☀️
      </h1>
      <p style="margin:6px 0 0;opacity:0.88;font-size:13px">${formatLongDate(now)}</p>
    </div>

    <!-- Body -->
    <div style="padding:24px">

      <section style="margin-bottom:22px">
        <h2 style="margin:0 0 10px;font-size:13px;color:#6366f1;text-transform:uppercase;letter-spacing:2px">📅 Dnes</h2>
        ${htmlBlock(todayItems, "#6366f1")}
      </section>

      <section style="margin-bottom:22px">
        <h2 style="margin:0 0 10px;font-size:13px;color:#8b5cf6;text-transform:uppercase;letter-spacing:2px">📅 Zajtra</h2>
        ${htmlBlock(tomorrowItems, "#8b5cf6")}
      </section>

      <!-- Stats grid -->
      <div style="display:flex;gap:10px;margin:22px 0">
        <div style="flex:1;background:#fef3c7;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#92400e">${openDeals}</div>
          <div style="font-size:11px;color:#92400e;text-transform:uppercase;letter-spacing:1px;margin-top:2px">Otvorené dealy</div>
        </div>
        <div style="flex:1;background:#dcfce7;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#166534">${newContacts}</div>
          <div style="font-size:11px;color:#166534;text-transform:uppercase;letter-spacing:1px;margin-top:2px">Noví kontakti (7d)</div>
        </div>
      </div>

      ${topDeals.length ? `
      <section style="margin-top:22px">
        <h2 style="margin:0 0 4px;font-size:13px;color:#f59e0b;text-transform:uppercase;letter-spacing:2px">⚠️ Potrebujú pohnúť</h2>
        ${dealsBlock}
      </section>` : ""}

      <!-- CTA -->
      <div style="margin-top:28px;text-align:center">
        <a href="https://unifyo.online/dashboard-overview" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px">
          Otvoriť Unifyo →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:16px 24px;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center">
        Tento e-mail ti posielame automaticky. Nechceš ho?
        <a href="https://unifyo.online/automation" style="color:#6366f1;text-decoration:none;font-weight:600">Vypni v Automatizáciách</a>
      </p>
    </div>
  </div>
</body></html>`;

  await sendGenericEmail({ to: user.email, subject, html, text, tag: "digest" });
  const totalItems = todayItems.length + tomorrowItems.length;
  return `Poslané na ${user.email} · ${totalItems} položiek, ${openDeals} dealov.`;
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString("sk-SK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
