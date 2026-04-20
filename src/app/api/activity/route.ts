// src/app/api/activity/route.ts
// Returns last N days of per-day activity for the ActivityTimeline widget.
// We fetch raw rows in one window and bucket them in Node — this keeps the
// query plan simple (single index seek per table) and avoids date_trunc
// math that would otherwise vary by DB timezone.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ymdInBratislava, startOfBratislavaDayUTC, addDaysYmd } from "@/lib/tz";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const daysRaw = Number(searchParams.get("days") ?? "7");
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(1, daysRaw), 31) : 7;

  try {
    const userId = session.userId;

    // Build list of the last `days` calendar days in Bratislava, ending today.
    // We step through YMD strings (via addDaysYmd's noon-UTC anchor) instead of
    // subtracting 24h from a UTC instant — that naive approach drops or
    // duplicates a day on DST transitions.
    const todayYmd = ymdInBratislava();
    const daysList: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      daysList.push(addDaysYmd(todayYmd, -i));
    }

    const windowStart = startOfBratislavaDayUTC(daysList[0]);

    const [contacts, tasksCreated, tasksDone, aiReqs] = await Promise.all([
      prisma.crmContact.findMany({
        where: { userId, createdAt: { gte: windowStart } },
        select: { createdAt: true },
      }),
      prisma.calendarTask.findMany({
        where: { userId, createdAt: { gte: windowStart } },
        select: { createdAt: true },
      }),
      prisma.calendarTask.findMany({
        where: { userId, done: true, updatedAt: { gte: windowStart } },
        select: { updatedAt: true },
      }),
      prisma.aiRequest.findMany({
        where: { userId, createdAt: { gte: windowStart } },
        select: { createdAt: true },
      }),
    ]);

    // Zero-init buckets so empty days render as zero rows.
    const buckets = new Map<string, { date: string; contacts: number; tasks: number; tasksDone: number; aiMessages: number }>();
    for (const d of daysList) {
      buckets.set(d, { date: d, contacts: 0, tasks: 0, tasksDone: 0, aiMessages: 0 });
    }

    const bump = (ts: Date, key: "contacts" | "tasks" | "tasksDone" | "aiMessages") => {
      const d = ymdInBratislava(ts);
      const b = buckets.get(d);
      if (b) b[key]++;
    };
    contacts.forEach((c) => bump(c.createdAt, "contacts"));
    tasksCreated.forEach((t) => bump(t.createdAt, "tasks"));
    tasksDone.forEach((t) => bump(t.updatedAt, "tasksDone"));
    aiReqs.forEach((r) => bump(r.createdAt, "aiMessages"));

    return NextResponse.json(Array.from(buckets.values()));
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
