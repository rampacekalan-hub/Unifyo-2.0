import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  // DB connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true };
  } catch (e) {
    checks.database = { ok: false, detail: e instanceof Error ? e.message : "unknown" };
  }

  // OpenAI key present
  checks.openai_key = {
    ok: !!process.env.OPENAI_API_KEY,
    detail: process.env.OPENAI_API_KEY ? "configured" : "MISSING — set OPENAI_API_KEY in .env",
  };

  // JWT secret
  checks.jwt_secret = {
    ok: !!process.env.JWT_SECRET,
    detail: process.env.JWT_SECRET ? "configured" : "MISSING — set JWT_SECRET in .env",
  };

  const allOk = Object.values(checks).every(c => c.ok);

  return NextResponse.json(
    { status: allOk ? "ok" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
