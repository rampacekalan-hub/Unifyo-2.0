// src/app/api/admin/finance/route.ts
// Admin financial overview — per-user revenue / AI cost / request counts
// + global aggregates (this month, this year, all-time).
//
// Revenue model: there is no Payment table yet, so we approximate from
// StripeSubscription.createdAt + plan price. A user that has been on a
// paid plan for N full months counts as N × monthlyPrice. This is good
// enough for an internal dashboard — the precise number is in Stripe.
//
// AI cost model: we don't store per-request input/output tokens, only
// total tokens. We apply a blended rate per active model. For a more
// pessimistic estimate the calling code can switch the rate constant.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getSiteConfig } from "@/config/site-settings";

export const dynamic = "force-dynamic";

// Blended €/token (all-in approx; mini-mostly traffic).
// gpt-4o-mini ≈ $0.40/1M blended → ~€0.00000037/token.
// Bumped slightly to account for Enterprise gpt-4o promotion (~10% of traffic).
const COST_PER_TOKEN_EUR = 0.0000005;

// Whisper: $0.006/min → ~€0.0055/min. We don't store duration, so
// estimate 4 min/call (typical Slovak business call).
const COST_PER_CALL_EUR = 0.022;

function planPriceEur(plan: string | null | undefined): number {
  const config = getSiteConfig();
  const row = config.pricing.find((p) => p.id === plan);
  return row?.price ?? 0;
}

function monthsBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  if (ms <= 0) return 0;
  // Approximate calendar months — close enough for a dashboard.
  return ms / (1000 * 60 * 60 * 24 * 30.4375);
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
    return new NextResponse(null, { status: 404 });
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      membershipTier: true,
      createdAt: true,
      stripeSubscription: {
        select: {
          status: true,
          createdAt: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Pull aggregate AI usage in three time windows in parallel.
  const [aiAll, aiMonth, aiYear, callsAll, callsMonth, callsYear] = await Promise.all([
    prisma.aiRequest.groupBy({
      by: ["userId"],
      _count: { _all: true },
      _sum: { tokens: true },
    }),
    prisma.aiRequest.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: startOfMonth } },
      _count: { _all: true },
      _sum: { tokens: true },
    }),
    prisma.aiRequest.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: startOfYear } },
      _count: { _all: true },
      _sum: { tokens: true },
    }),
    prisma.callRecording.groupBy({
      by: ["userId"],
      _count: { _all: true },
    }),
    prisma.callRecording.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: startOfMonth } },
      _count: { _all: true },
    }),
    prisma.callRecording.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: startOfYear } },
      _count: { _all: true },
    }),
  ]);

  const idx = <T extends { userId: string }>(rows: T[]) =>
    Object.fromEntries(rows.map((r) => [r.userId, r])) as Record<string, T>;

  const aiAllIdx = idx(aiAll);
  const aiMonthIdx = idx(aiMonth);
  const aiYearIdx = idx(aiYear);
  const callsAllIdx = idx(callsAll);
  const callsMonthIdx = idx(callsMonth);
  const callsYearIdx = idx(callsYear);

  type Row = {
    id: string;
    email: string;
    name: string | null;
    plan: string;
    membershipTier: string;
    createdAt: string;
    subscriptionStatus: string | null;
    requests: { all: number; month: number; year: number };
    tokens:   { all: number; month: number; year: number };
    calls:    { all: number; month: number; year: number };
    cost:     { all: number; month: number; year: number };
    revenue:  { all: number; month: number; year: number };
    net:      { all: number; month: number; year: number };
  };

  const perUser: Row[] = users.map((u) => {
    const aiA = aiAllIdx[u.id];
    const aiM = aiMonthIdx[u.id];
    const aiY = aiYearIdx[u.id];
    const cA = callsAllIdx[u.id];
    const cM = callsMonthIdx[u.id];
    const cY = callsYearIdx[u.id];

    const reqAll = aiA?._count._all ?? 0;
    const reqMonth = aiM?._count._all ?? 0;
    const reqYear = aiY?._count._all ?? 0;
    const tokAll = aiA?._sum.tokens ?? 0;
    const tokMonth = aiM?._sum.tokens ?? 0;
    const tokYear = aiY?._sum.tokens ?? 0;
    const callAll = cA?._count._all ?? 0;
    const callMonth = cM?._count._all ?? 0;
    const callYear = cY?._count._all ?? 0;

    const costAll = tokAll * COST_PER_TOKEN_EUR + callAll * COST_PER_CALL_EUR;
    const costMonth = tokMonth * COST_PER_TOKEN_EUR + callMonth * COST_PER_CALL_EUR;
    const costYear = tokYear * COST_PER_TOKEN_EUR + callYear * COST_PER_CALL_EUR;

    // Revenue: only count if subscription is active/trialing/past_due (i.e. still
    // in a billed state). A cancelled BASIC user contributes nothing.
    const sub = u.stripeSubscription;
    const planPrice = planPriceEur(u.plan);
    const isPaying =
      planPrice > 0 &&
      sub != null &&
      ["active", "trialing", "past_due"].includes(sub.status);

    let revAll = 0;
    let revMonth = 0;
    let revYear = 0;
    if (isPaying && sub) {
      const billStart = sub.createdAt;
      const monthsAll = Math.max(1, Math.floor(monthsBetween(billStart, now)));
      revAll = monthsAll * planPrice;

      // Month: 1 monthly invoice, but only if subscription was active before now.
      revMonth = billStart <= now ? planPrice : 0;

      // Year: months elapsed in current calendar year, capped by months active.
      const yearWindowStart = billStart > startOfYear ? billStart : startOfYear;
      const monthsYear = Math.max(0, Math.floor(monthsBetween(yearWindowStart, now)) + 1);
      revYear = Math.min(monthsAll, monthsYear) * planPrice;
    }

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      plan: u.plan,
      membershipTier: u.membershipTier,
      createdAt: u.createdAt.toISOString(),
      subscriptionStatus: sub?.status ?? null,
      requests: { all: reqAll, month: reqMonth, year: reqYear },
      tokens:   { all: tokAll, month: tokMonth, year: tokYear },
      calls:    { all: callAll, month: callMonth, year: callYear },
      cost:     { all: round(costAll), month: round(costMonth), year: round(costYear) },
      revenue:  { all: round(revAll), month: round(revMonth), year: round(revYear) },
      net: {
        all:   round(revAll - costAll),
        month: round(revMonth - costMonth),
        year:  round(revYear - costYear),
      },
    };
  });

  const totals = {
    users: perUser.length,
    paying: perUser.filter((u) => u.revenue.month > 0).length,
    revenue: sumKey(perUser, "revenue"),
    cost:    sumKey(perUser, "cost"),
    net:     sumKey(perUser, "net"),
    requests: {
      all:   perUser.reduce((s, u) => s + u.requests.all, 0),
      month: perUser.reduce((s, u) => s + u.requests.month, 0),
      year:  perUser.reduce((s, u) => s + u.requests.year, 0),
    },
    calls: {
      all:   perUser.reduce((s, u) => s + u.calls.all, 0),
      month: perUser.reduce((s, u) => s + u.calls.month, 0),
      year:  perUser.reduce((s, u) => s + u.calls.year, 0),
    },
  };

  return NextResponse.json({
    asOf: now.toISOString(),
    rates: { costPerTokenEur: COST_PER_TOKEN_EUR, costPerCallEur: COST_PER_CALL_EUR },
    totals,
    perUser,
  });
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function sumKey(
  rows: Array<{ revenue: { all: number; month: number; year: number }; cost: { all: number; month: number; year: number }; net: { all: number; month: number; year: number } }>,
  key: "revenue" | "cost" | "net",
) {
  return {
    all:   round(rows.reduce((s, r) => s + r[key].all, 0)),
    month: round(rows.reduce((s, r) => s + r[key].month, 0)),
    year:  round(rows.reduce((s, r) => s + r[key].year, 0)),
  };
}
