// src/app/api/cron/task-notifier/route.ts
// Protected cron endpoint — creates in-app notifications for tasks whose
// scheduled time is within [-10min, +15min] of now (Europe/Bratislava).
//
// Hit this every 5 minutes via system cron on Hetzner:
//   */5 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://unifyo.online/api/cron/task-notifier >/dev/null

import { NextRequest, NextResponse } from "next/server";
import { runTaskNotifier } from "@/lib/workers/task-notifier";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/task-notifier] CRON_SECRET not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runTaskNotifier();
    return NextResponse.json(result);
  } catch (e) {
    console.error("[cron/task-notifier]", e);
    return NextResponse.json({ error: "Worker failed" }, { status: 500 });
  }
}
