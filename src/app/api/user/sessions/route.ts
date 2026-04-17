// src/app/api/user/sessions/route.ts
// Returns the user's recent login events + minimal "current session" info.
// JWT sessions aren't tracked server-side, so we can't list other devices;
// instead we expose the audit trail (LoginEvent) and offer global logout.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  try {
    const events = await prisma.loginEvent.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, ip: true, userAgent: true, success: true, createdAt: true },
    });

    return NextResponse.json({
      current: {
        userAgent: req.headers.get("user-agent") ?? null,
        ip:
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          req.headers.get("x-real-ip") ||
          null,
      },
      events,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[SESSIONS]", e);
    return NextResponse.json({ error: "Nepodarilo sa načítať" }, { status: 500 });
  }
}
