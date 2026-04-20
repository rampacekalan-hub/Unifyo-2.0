// src/app/api/notifications/read/route.ts
// Marks a single notification or all notifications as read for the session user.
// requireAuth enforces CSRF (same-origin) and auth.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const body = (await req.json().catch(() => ({}))) as {
      id?: string;
      all?: boolean;
    };
    const now = new Date();

    if (body.all) {
      await prisma.notification.updateMany({
        where: { userId: session.userId, read: false },
        data: { read: true, readAt: now },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.id) {
      await prisma.notification.updateMany({
        where: { id: body.id, userId: session.userId },
        data: { read: true, readAt: now },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "Chýba id alebo all" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
