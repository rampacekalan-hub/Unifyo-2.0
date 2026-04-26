// src/app/api/analytics/summary/route.ts
// Aggregates cheap counters from the user's own data so the analytics
// page can render without fanning out to 8 endpoints. Every query is
// indexed and scoped to the session user — no global scans.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const userId = session.userId;

  // Pro+ feature. Basic users see an upgrade nudge instead.
  const tier = session.membershipTier ?? "BASIC";
  if (tier === "BASIC") {
    return NextResponse.json(
      { error: "Analytika je dostupná v Pro a Enterprise.", code: "TIER_LOCKED", requiredTier: "PRO" },
      { status: 403 },
    );
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600_000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 3600_000);

  const [
    contacts, contactsWeek,
    deals, dealsWon, dealsLost, openDealsValue,
    tasks, tasksOpen,
    calls, callsMonth,
    conversations, messagesMonth,
    aiUsageToday,
  ] = await Promise.all([
    prisma.crmContact.count({ where: { userId } }),
    prisma.crmContact.count({ where: { userId, createdAt: { gte: weekAgo } } }),
    prisma.crmDeal.count({ where: { userId } }),
    prisma.crmDeal.count({ where: { userId, stage: "WON" } }),
    prisma.crmDeal.count({ where: { userId, stage: "LOST" } }),
    prisma.crmDeal.aggregate({
      where: { userId, stage: { in: ["LEAD", "QUALIFIED", "PROPOSAL"] } },
      _sum: { expectedValue: true },
    }),
    prisma.calendarTask.count({ where: { userId } }),
    prisma.calendarTask.count({ where: { userId, done: false } }),
    prisma.callRecording.count({ where: { userId } }),
    prisma.callRecording.count({ where: { userId, createdAt: { gte: monthAgo } } }),
    prisma.conversation.count({ where: { userId } }),
    prisma.conversationMsg.count({
      where: { conversation: { userId }, createdAt: { gte: monthAgo } },
    }),
    prisma.dailyUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: now.toISOString().slice(0, 10),
        },
      },
      select: { count: true },
    }).catch(() => null),
  ]);

  return NextResponse.json({
    contacts: { total: contacts, new7d: contactsWeek },
    deals: {
      total: deals,
      won: dealsWon,
      lost: dealsLost,
      openValueCents: openDealsValue._sum.expectedValue ?? 0,
      winRate: deals > 0 ? Math.round((dealsWon / Math.max(1, dealsWon + dealsLost)) * 100) : 0,
    },
    tasks: { total: tasks, open: tasksOpen },
    calls: { total: calls, last30d: callsMonth },
    chat: { conversations, messages30d: messagesMonth },
    aiToday: { requests: aiUsageToday?.count ?? 0 },
  });
}
