// src/lib/workers/task-notifier.ts
// Scans CalendarTask rows for due/soon-due items and creates in-app
// Notifications (bell icon). Idempotent per-task-per-hour: we skip a task
// if a `task_due` Notification for it was created in the last 60 minutes.
//
// Time window:
//  • Task.date must equal today's YYYY-MM-DD in Europe/Bratislava.
//  • Task.time must be set.
//  • Task.time is within [now - 10min, now + 15min] in Europe/Bratislava.
//
// Deduplication:
//  • Notifications have no `meta` column in current schema, so we encode the
//    task id in the body as a trailing `[task:xxx]` marker. The UI strips it.

import { prisma } from "@/lib/prisma";

const TZ = "Europe/Bratislava";

/** Returns [YYYY-MM-DD, HH:MM] for `now` in Europe/Bratislava. */
function bratislavaDateTime(now: Date): { date: string; minutes: number } {
  // Intl parts give us the calendar date & clock in the target TZ regardless
  // of the server's local timezone. Using "en-CA" yields YYYY-MM-DD format.
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hh = Number(timeParts.find((p) => p.type === "hour")?.value ?? 0);
  const mm = Number(timeParts.find((p) => p.type === "minute")?.value ?? 0);
  return { date: dateStr, minutes: hh * 60 + mm };
}

function parseHHMM(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export interface TaskNotifierResult {
  processed: number;
  created: number;
}

export async function runTaskNotifier(): Promise<TaskNotifierResult> {
  const now = new Date();
  const { date, minutes: nowMin } = bratislavaDateTime(now);

  // Candidates: today's tasks that aren't done and have a time.
  const candidates = await prisma.calendarTask.findMany({
    where: {
      date,
      done: false,
      NOT: { time: null },
    },
    select: { id: true, title: true, date: true, time: true, userId: true },
  });

  let created = 0;
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  for (const task of candidates) {
    if (!task.time) continue;
    const taskMin = parseHHMM(task.time);
    if (taskMin === null) continue;
    const diff = taskMin - nowMin; // minutes
    // Already passed by <10 min OR coming up within 15 min.
    if (diff > 15 || diff < -10) continue;

    // Dedup marker stored in body: "...[task:<id>]".
    const marker = `[task:${task.id}]`;
    const existing = await prisma.notification.findFirst({
      where: {
        userId: task.userId,
        type: "task_due",
        createdAt: { gte: hourAgo },
        body: { contains: marker },
      },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        userId: task.userId,
        type: "task_due",
        title: `Úloha čoskoro: ${task.title}`,
        body: `${task.date} ${task.time} ${marker}`,
        href: "/calendar",
      },
    });
    created++;
  }

  return { processed: candidates.length, created };
}
