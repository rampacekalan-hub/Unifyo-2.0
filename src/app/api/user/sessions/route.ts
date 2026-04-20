// src/app/api/user/sessions/route.ts
// Returns the user's recent login events + minimal "current session" info.
// JWT sessions aren't tracked server-side, so we can't list other devices
// authoritatively; instead we expose the audit trail (LoginEvent) for the
// last 30 days and offer global logout. Events with matching userAgent +
// IP as the current request are flagged so the UI can highlight "this
// device".

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  try {
    const currentUa = req.headers.get("user-agent") ?? null;
    const currentIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await prisma.loginEvent.findMany({
      where: { userId: session.userId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, ip: true, userAgent: true, success: true, createdAt: true },
    });

    const annotated = events.map((e) => ({
      ...e,
      isCurrent:
        e.success &&
        !!currentUa &&
        e.userAgent === currentUa &&
        e.ip === currentIp,
    }));

    return NextResponse.json(
      {
        current: { userAgent: currentUa, ip: currentIp },
        events: annotated,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[SESSIONS]", e);
    return NextResponse.json({ error: "Nepodarilo sa načítať" }, { status: 500 });
  }
}
