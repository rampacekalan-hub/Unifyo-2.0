// src/app/api/health/route.ts
// Lightweight health check for uptime monitors (UptimeRobot, BetterStack…).
// Public response is deliberately minimal — just "ok" / "degraded" + 200/503.
// Detailed diagnostics (which subsystem failed, what env vars are missing) are
// returned only when the caller provides the HEALTH_TOKEN via header.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = req.headers.get("x-health-token");
  const verbose =
    !!process.env.HEALTH_TOKEN && token === process.env.HEALTH_TOKEN;

  // Fast DB ping (timeout 3s)
  let dbOk = false;
  let dbDetail = "";
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("db ping timeout")), 3000),
      ),
    ]);
    dbOk = true;
  } catch (e) {
    dbDetail = e instanceof Error ? e.message : "unknown";
  }

  const envOk =
    !!process.env.JWT_SECRET &&
    process.env.JWT_SECRET.length >= 32 &&
    !!process.env.DATABASE_URL;

  const allOk = dbOk && envOk;

  // Public response — intentionally terse, no secrets / versions / host info.
  if (!verbose) {
    return NextResponse.json(
      { status: allOk ? "ok" : "degraded" },
      {
        status: allOk ? 200 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  // Verbose response (authenticated monitors only)
  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks: {
        database: { ok: dbOk, ...(dbDetail ? { detail: dbDetail } : {}) },
        jwt_secret: {
          ok:
            !!process.env.JWT_SECRET &&
            process.env.JWT_SECRET.length >= 32,
        },
        database_url: { ok: !!process.env.DATABASE_URL },
        openai_key: { ok: !!process.env.OPENAI_API_KEY },
        smtp: {
          ok:
            !!process.env.SMTP_HOST &&
            !!process.env.SMTP_USER &&
            !!process.env.SMTP_PASSWORD,
        },
      },
    },
    {
      status: allOk ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
