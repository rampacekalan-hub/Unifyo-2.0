// src/app/api/today/route.ts
// Aggregates today's snapshot for the dashboard "Dnešok" widget.
// Date scoping uses Europe/Bratislava so "today" matches the user's wall
// clock, not UTC midnight. Counts use a UTC-converted start-of-day boundary.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ymdInBratislava, startOfBratislavaDayUTC } from "@/lib/tz";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  try {
    const userId = session.userId;
    const today = ymdInBratislava();
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
