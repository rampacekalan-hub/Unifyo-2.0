// src/app/api/today/route.ts
// Aggregates today's snapshot for the dashboard "Dnešok" widget.
// Date scoping uses Europe/Bratislava so "today" matches the user's wall
// clock, not UTC midnight. Counts use a UTC-converted start-of-day boundary.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Returns "YYYY-MM-DD" in the Europe/Bratislava zone.
function todayInBratislava(now = new Date()): string {
  // `sv-SE` locale renders ISO-shaped dates, so we can just pick the y-m-d prefix.
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Bratislava",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

// UTC instant that corresponds to 00:00 in Europe/Bratislava for a given YYYY-MM-DD.
// Bratislava is UTC+1 (CET) or UTC+2 (CEST). Compute offset by diffing the
// "same wall time" as seen in Bratislava vs UTC.
function startOfBratislavaDayUTC(ymd: string): Date {
  // Parse as UTC midnight, then shift back by the BA offset for that date.
  const midnightUTC = new Date(`${ymd}T00:00:00Z`);
  const baWall = new Date(
    midnightUTC.toLocaleString("en-US", { timeZone: "Europe/Bratislava" }),
  );
  const offsetMs = baWall.getTime() - midnightUTC.getTime();
  // midnightUTC - offsetMs = instant that is midnight in BA
  return new Date(midnightUTC.getTime() - offsetMs);
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  try {
    const userId = session.userId;
    const today = todayInBratislava();
    const startOfToday = startOfBratislavaDayUTC(today);

    const [tasks, contactsAddedToday, tasksCompletedToday, aiMessagesToday] =
      await Promise.all([
        prisma.calendarTask.findMany({
          where: { userId, date: today, done: false },
          orderBy: [{ time: "asc" }, { createdAt: "asc" }],
          take: 10,
        }),
        prisma.crmContact.count({
          where: { userId, createdAt: { gte: startOfToday } },
        }),
        prisma.calendarTask.count({
          where: { userId, done: true, updatedAt: { gte: startOfToday } },
        }),
        prisma.aiRequest.count({
          where: { userId, createdAt: { gte: startOfToday } },
        }),
      ]);

    return NextResponse.json({
      tasks,
      contactsAddedToday,
      tasksCompletedToday,
      aiMessagesToday,
    });
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
