// src/app/api/ai/focus/route.ts
// Daily "focus list" — picks 3-5 concrete next actions from the user's
// real data (overdue tasks, stale deals, today's events, new leads).
// No OpenAI call in this first pass — just deterministic ranking. Fast
// and predictable; we can add an LLM layer later that writes more
// human-sounding reasons. Rendered by the FocusWidget on the dashboard.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface FocusItem {
  id: string;
  kind: "task" | "deal" | "event" | "contact";
  title: string;
  reason: string;
  href: string;
  when?: string;   // display-friendly: "zajtra 14:00", "pred 5 dňami"
  urgency: "now" | "today" | "soon";
}

function daysAgo(iso: string | Date): number {
  const t = typeof iso === "string" ? new Date(iso).getTime() : iso.getTime();
  return Math.floor((Date.now() - t) / 86_400_000);
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const userId = session.userId;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 24 * 3600_000).toISOString().slice(0, 10);

  const [overdueTasks, todaysTasks, staleDeals, freshContacts, upcomingEvents] =
    await Promise.all([
      // Undone tasks with a past date — sorted oldest first, biggest pain.
      prisma.calendarTask.findMany({
        where: { userId, done: false, date: { lt: today } },
        orderBy: { date: "asc" },
        take: 5,
        select: { id: true, title: true, date: true, time: true },
      }),
      // Today's and tomorrow's undone tasks — "dnes a zajtra máš…".
      prisma.calendarTask.findMany({
        where: { userId, done: false, date: { in: [today, tomorrow] } },
        orderBy: [{ date: "asc" }, { time: "asc" }],
        take: 5,
        select: { id: true, title: true, date: true, time: true },
      }),
      // Deals stuck > 7 days in Lead/Qualified/Proposal — follow-up.
      prisma.crmDeal.findMany({
        where: {
          userId,
          stage: { in: ["LEAD", "QUALIFIED", "PROPOSAL"] },
          lastActivityAt: { lt: new Date(now.getTime() - 7 * 24 * 3600_000) },
        },
        orderBy: { lastActivityAt: "asc" },
        take: 3,
        select: { id: true, title: true, stage: true, lastActivityAt: true, contact: { select: { name: true } } },
      }),
      // Contacts created in the last 3 days without any deal — good
      // candidates to follow up on before they forget who we are.
      prisma.crmContact.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(now.getTime() - 3 * 24 * 3600_000) },
          deals: { none: {} },
        },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: { id: true, name: true, company: true, createdAt: true },
      }),
      // Today's calendar tasks are already covered; "upcoming" here
      // is local-task upcoming within 2h — "o chvíľu máš…".
      prisma.calendarTask.findMany({
        where: {
          userId,
          done: false,
          date: today,
        },
        orderBy: { time: "asc" },
        take: 3,
        select: { id: true, title: true, time: true },
      }),
    ]);

  const items: FocusItem[] = [];

  // Priority 1: overdue tasks. Red flag, always surface first.
  for (const t of overdueTasks.slice(0, 2)) {
    const d = daysAgo(new Date(t.date + "T00:00:00"));
    items.push({
      id: `task:${t.id}`,
      kind: "task",
      title: t.title,
      reason: d <= 1 ? "Včera, neuzavreté." : `Neuzavreté ${d} dní.`,
      href: `/calendar?focus=${t.id}`,
      when: `pred ${d} dňami`,
      urgency: "now",
    });
  }

  // Priority 2: today's tasks with times — "o 14:00 stretnutie".
  for (const t of todaysTasks) {
    if (items.length >= 5) break;
    if (t.date === today && t.time) {
      items.push({
        id: `task:${t.id}`,
        kind: t.time ? "event" : "task",
        title: t.title,
        reason: "Naplánované na dnes.",
        href: `/calendar?focus=${t.id}`,
        when: `dnes ${t.time}`,
        urgency: "today",
      });
    }
  }

  // Priority 3: stale deals.
  for (const d of staleDeals) {
    if (items.length >= 5) break;
    const days = daysAgo(d.lastActivityAt);
    items.push({
      id: `deal:${d.id}`,
      kind: "deal",
      title: d.title,
      reason: d.contact?.name
        ? `${d.contact.name} — bez pohybu ${days} dní.`
        : `Bez pohybu ${days} dní.`,
      href: `/pipeline`,
      when: `[${d.stage}]`,
      urgency: "today",
    });
  }

  // Priority 4: fresh contacts without deals (warm lead opportunity).
  for (const c of freshContacts) {
    if (items.length >= 5) break;
    const days = daysAgo(c.createdAt);
    items.push({
      id: `contact:${c.id}`,
      kind: "contact",
      title: c.name,
      reason: c.company
        ? `${c.company} — pridaný ${days === 0 ? "dnes" : `pred ${days} dňami`}, zatiaľ žiadny deal.`
        : `Pridaný ${days === 0 ? "dnes" : `pred ${days} dňami`}, zatiaľ žiadny deal.`,
      href: `/crm?focus=${c.id}`,
      when: days === 0 ? "dnes" : `pred ${days} d`,
      urgency: "soon",
    });
  }

  // Priority 5: any remaining today-tasks without times.
  for (const t of upcomingEvents) {
    if (items.length >= 5) break;
    if (!t.time && !items.find((x) => x.id === `task:${t.id}`)) {
      items.push({
        id: `task:${t.id}`,
        kind: "task",
        title: t.title,
        reason: "Dnes na zozname úloh.",
        href: `/calendar?focus=${t.id}`,
        when: "dnes",
        urgency: "today",
      });
    }
  }

  return NextResponse.json({ items: items.slice(0, 5) });
}
