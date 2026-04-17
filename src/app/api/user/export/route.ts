// src/app/api/user/export/route.ts
// GDPR data export — returns the authenticated user's full profile + related
// records as JSON. Password, sessions, and other secrets are never included.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  try {
    const [user, contacts, tasks, conversations, aiRequests, memories, policies] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: session.userId },
          select: {
            id: true, email: true, name: true, role: true, plan: true,
            membershipTier: true, createdAt: true, updatedAt: true, lastActiveAt: true,
          },
        }),
        prisma.crmContact.findMany({
          where: { userId: session.userId },
          include: { notes: true },
        }),
        prisma.calendarTask.findMany({ where: { userId: session.userId } }),
        prisma.conversation.findMany({
          where: { userId: session.userId },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        }),
        prisma.aiRequest.findMany({ where: { userId: session.userId } }),
        prisma.neuralMemory.findMany({ where: { userId: session.userId } }),
        prisma.userPolicy.findMany({ where: { userId: session.userId } }),
      ]);

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      format: "unifyo-v1",
      user,
      crmContacts: contacts,
      calendarTasks: tasks,
      conversations,
      aiRequests,
      neuralMemories: memories,
      userPolicies: policies,
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[EXPORT] failed:", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
