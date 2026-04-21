// src/app/api/cron/daily/route.ts
// Daily automation runner — hit by the server's crontab once every
// morning. Validates a shared secret (header or `?key=`), walks every
// user with automations enabled, runs their selected recipes. Logs a
// tally so the caller can see what happened without needing auth.
//
// Crontab example (Hetzner root crontab, UTC):
//   0 6 * * * curl -fsS -H "X-Cron-Secret: $CRON_SECRET" \
//     https://unifyo.online/api/cron/daily >> /var/log/unifyo-cron.log 2>&1
// 6:00 UTC = 7:00 CET / 8:00 CEST — lands in inbox just before work.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAutomation, type AutomationId } from "@/lib/automation";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // Most digests send in under 30s; buffer for a few hundred users.

function authed(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // require explicit setup
  const header = req.headers.get("x-cron-secret");
  const queryKey = req.nextUrl.searchParams.get("key");
  return header === secret || queryKey === secret;
}

interface UserRow {
  id: string;
  preferences: unknown;
}

function enabledRecipes(prefs: unknown): AutomationId[] {
  if (!prefs || typeof prefs !== "object") return [];
  const a = (prefs as { automations?: Record<string, boolean> }).automations;
  if (!a) return [];
  const out: AutomationId[] = [];
  if (a["daily-digest"]) out.push("daily-digest");
  if (a["stale-deal"]) out.push("stale-deal");
  // "new-sender-to-crm" runs per-email, not nightly.
  return out;
}

export async function GET(req: NextRequest) {
  return handle(req);
}
export async function POST(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  if (!authed(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const users: UserRow[] = await prisma.user.findMany({
    where: {
      preferences: { not: undefined },
    },
    select: { id: true, preferences: true },
  });

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const u of users) {
    const recipes = enabledRecipes(u.preferences);
    if (recipes.length === 0) {
      skipped++;
      continue;
    }
    for (const r of recipes) {
      try {
        await runAutomation(u.id, r);
        ok++;
      } catch (e) {
        failed++;
        errors.push(`${u.id}:${r}:${e instanceof Error ? e.message : "?"}`);
      }
    }
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    scanned: users.length,
    ok,
    skipped,
    failed,
    errors: errors.slice(0, 20),
  });
}
