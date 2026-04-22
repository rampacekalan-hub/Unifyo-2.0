// src/app/api/automation/run/route.ts
// Manually trigger an automation recipe. The cron-based nightly
// runner (not wired yet) will share the same dispatcher.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { runAutomation, type AutomationId } from "@/lib/automation";

export const dynamic = "force-dynamic";

const IDS = new Set<AutomationId>(["daily-digest", "stale-deal", "new-sender-to-crm"]);

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  // Each automation sends an email → bounded cost, but 10/hr/IP stops
  // someone from hammering the button to DDoS their own inbox.
  const rl = await rateLimit(req, { maxRequests: 10, windowMs: 3600_000 }, "automation-run");
  if (rl) return rl;

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.id || !IDS.has(body.id as AutomationId)) {
    return NextResponse.json({ error: "unknown_recipe" }, { status: 400 });
  }

  try {
    const result = await runAutomation(session.userId, body.id as AutomationId);
    // Stamp the last-run in User.preferences.automationRuns so the
    // automation page can show "Naposledy: pred 2 min · Poslané na
    // info@unifyo.online" instead of a blind toggle.
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { preferences: true },
      });
      const prefs = (user?.preferences ?? {}) as Record<string, unknown>;
      const runs = (prefs.automationRuns ?? {}) as Record<string, { at: string; result: string }>;
      runs[body.id as string] = { at: new Date().toISOString(), result };
      await prisma.user.update({
        where: { id: session.userId },
        data: { preferences: { ...prefs, automationRuns: runs } as object },
      });
    } catch {
      // Stamping is best-effort — don't fail the response.
    }
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error("[automation:run]", body.id, e);
    return NextResponse.json(
      { error: "run_failed", detail: e instanceof Error ? e.message : "unknown" },
      { status: 500 },
    );
  }
}
