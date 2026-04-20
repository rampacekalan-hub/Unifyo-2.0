// src/app/api/onboarding/status/route.ts
// Aggregates the 5 onboarding checks into a single roundtrip so the
// dashboard widget doesn't fan out to 5 separate endpoints on mount.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  try {
    const userId = session.userId;

    // Run all checks in parallel. Each is a cheap existence probe —
    // no full table scans; we only need a boolean.
    const [user, contact, convWithMsg, task] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, emailVerifiedAt: true },
      }),
      prisma.crmContact.findFirst({
        where: { userId },
        select: { id: true },
      }),
      prisma.conversation.findFirst({
        where: { userId, messages: { some: {} } },
        select: { id: true },
      }),
      prisma.calendarTask.findFirst({
        where: { userId },
        select: { id: true },
      }),
    ]);

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      emailVerified: !!user.emailVerifiedAt,
      hasContact: !!contact,
      hasConversation: !!convWithMsg,
      hasTask: !!task,
      hasName: !!(user.name && user.name.trim()),
    });
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
