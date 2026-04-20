// src/app/api/status/route.ts
// Lightweight JSON endpoint for external monitors (UptimeRobot etc).
// Matches the four checks shown on /status. Intentionally public — no
// secret, no internal detail.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let db = false;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
    ]);
    db = true;
  } catch {
    db = false;
  }

  const ai = !!process.env.OPENAI_API_KEY;
  const email =
    !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASSWORD;

  const allOk = db && ai && email;

  return NextResponse.json(
    {
      web: true,
      db,
      ai,
      email,
      checkedAt: new Date().toISOString(),
    },
    {
      status: allOk ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
