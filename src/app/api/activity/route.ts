// src/app/api/activity/route.ts
// Returns last N days of per-day activity for the ActivityTimeline widget.
// We fetch raw rows in one window and bucket them in Node — this keeps the
// query plan simple (single index seek per table) and avoids date_trunc
// math that would otherwise vary by DB timezone.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function ymdInBratislava(d: Date): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Bratislava",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${day}`;
}

function startOfBratislavaDayUTC(ymd: string): Date {
  const midnightUTC = new Date(`${ymd}T00:00:00Z`);
  const baWall = new Date(midnightUTC.toLocaleString("en-US", { timeZone: "Europe/Bratislava" }));
  const offsetMs = baWall.getTime() - midnightUTC.getTime();
  return new Date(midnightUTC.getTime() - offsetMs);
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const { searchParams } = new URL(req.url);
  const daysRaw = Number(searchParams.get("days") ?? "7");
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(1, daysRaw), 31) : 7;

  try {
    const userId = session.userId;
    const now = new Date();

    // Build list of the last `days` calendar days in Bratislava, ending today.
    const todayYmd = ymdInBratislava(now);
    const daysList: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      daysList.push(ymdInBratislava(d));
    }
    // Ensure today is definitely included even if DST arithmetic nudged us
    // (the loop above is correct in all real cases — this is a safety net).
    if (!daysList.includes(todayYmd)) daysList.push(todayYmd);

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
