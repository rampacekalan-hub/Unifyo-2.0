// src/app/api/admin/finance/route.ts
// Admin financial overview — per-user revenue / AI cost / request counts
// + global aggregates (this month, this year, all-time).
//
// Revenue source of truth:
//   1. Payment table (filled by `invoice.paid` Stripe webhook) — exact
//      cents Stripe collected, in EUR.
//   2. Fallback: StripeSubscription.createdAt × tier price — only used
//      when there are no Payment rows yet (fresh deploy / dev DB).
//
// AI cost source of truth:
//   - AiRequest.model + inputTokens + outputTokens → exact OpenAI list
//     price (see lib/ai/openai-pricing.ts). Legacy rows without model
//     fall back to gpt-4o-mini blended.
//   - CallRecording.durationSec × Whisper $0.006/min.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getSiteConfig } from "@/config/site-settings";
import {
  chatCostEur,
  whisperCostEur,
  MODEL_PRICING,
  USD_TO_EUR,
} from "@/lib/ai/openai-pricing";

export const dynamic = "force-dynamic";

function planPriceEur(plan: string | null | undefined): number {
  const config = getSiteConfig();
  const row = config.pricing.find((p) => p.id === plan);
  return row?.price ?? 0;
}

function monthsBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  if (ms <= 0) return 0;
  return ms / (1000 * 60 * 60 * 24 * 30.4375);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
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

  // Per-user AI cost (sum of exact per-row cost) + request counts, by window.
  // We can't compute chatCostEur in SQL, so we fetch lean rows and reduce
  // in memory. Bounded by AiRequest indexes on (userId, createdAt).
  const aiSelect = { userId: true, model: true, inputTokens: true, outputTokens: true, tokens: true } as const;

  const [aiAllRows, aiMonthRows, aiYearRows, callsAllRows, callsMonthRows, callsYearRows, payAll, payMonth, payYear] = await Promise.all([
    prisma.aiRequest.findMany({ select: aiSelect }),
    prisma.aiRequest.findMany({ select: aiSelect, where: { createdAt: { gte: startOfMonth } } }),
    prisma.aiRequest.findMany({ select: aiSelect, where: { createdAt: { gte: startOfYear } } }),
    prisma.callRecording.findMany({ select: { userId: true, durationSec: true } }),
    prisma.callRecording.findMany({ select: { userId: true, durationSec: true }, where: { createdAt: { gte: startOfMonth } } }),
    prisma.callRecording.findMany({ select: { userId: true, durationSec: true }, where: { createdAt: { gte: startOfYear } } }),
    prisma.payment.groupBy({ by: ["userId"], where: { status: "paid" }, _sum: { amountCents: true } }),
    prisma.payment.groupBy({ by: ["userId"], where: { status: "paid", paidAt: { gte: startOfMonth } }, _sum: { amountCents: true } }),
    prisma.payment.groupBy({ by: ["userId"], where: { status: "paid", paidAt: { gte: startOfYear } }, _sum: { amountCents: true } }),
  ]);

  type AiRow = { userId: string; model: string | null; inputTokens: number; outputTokens: number; tokens: number };
  type CallRow = { userId: string; durationSec: number | null };

  function reduceAi(rows: AiRow[]) {
    const byUser = new Map<string, { count: number; tokens: number; cost: number }>();
    let totalRequests = 0;
    let totalTokens = 0;
    let totalCost = 0;
    const byModel = new Map<string, { count: number; tokens: number; cost: number }>();
    for (const r of rows) {
      const cost = chatCostEur(r.model, r.inputTokens || 0, r.outputTokens || 0);
      // Legacy rows have no input/output split — approximate by splitting
      // total tokens 70/30 input/output (typical chat ratio).
      const fallbackCost =
        r.inputTokens === 0 && r.outputTokens === 0 && r.tokens > 0
          ? chatCostEur(r.model, Math.round(r.tokens * 0.7), Math.round(r.tokens * 0.3))
          : 0;
      const finalCost = cost > 0 ? cost : fallbackCost;
      const u = byUser.get(r.userId) ?? { count: 0, tokens: 0, cost: 0 };
      u.count += 1;
      u.tokens += r.tokens || (r.inputTokens || 0) + (r.outputTokens || 0);
      u.cost += finalCost;
      byUser.set(r.userId, u);
      totalRequests += 1;
      totalTokens += u.tokens;
      totalCost += finalCost;
      const mKey = r.model ?? "unknown";
      const m = byModel.get(mKey) ?? { count: 0, tokens: 0, cost: 0 };
      m.count += 1;
      m.tokens += r.tokens || (r.inputTokens || 0) + (r.outputTokens || 0);
      m.cost += finalCost;
      byModel.set(mKey, m);
    }
    return { byUser, totalRequests, totalTokens, totalCost, byModel };
  }

  function reduceCalls(rows: CallRow[]) {
    const byUser = new Map<string, { count: number; cost: number; minutes: number }>();
    let totalCount = 0;
    let totalMinutes = 0;
    let totalCost = 0;
    for (const r of rows) {
      const cost = whisperCostEur(r.durationSec);
      const minutes = (r.durationSec ?? 240) / 60;
      const u = byUser.get(r.userId) ?? { count: 0, cost: 0, minutes: 0 };
      u.count += 1;
      u.cost += cost;
      u.minutes += minutes;
      byUser.set(r.userId, u);
      totalCount += 1;
      totalMinutes += minutes;
      totalCost += cost;
    }
    return { byUser, totalCount, totalMinutes, totalCost };
  }

  const aiA = reduceAi(aiAllRows);
  const aiM = reduceAi(aiMonthRows);
  const aiY = reduceAi(aiYearRows);
  const callsA = reduceCalls(callsAllRows);
  const callsM = reduceCalls(callsMonthRows);
  const callsY = reduceCalls(callsYearRows);

  const idx = <T extends { userId: string }>(rows: T[]) =>
    Object.fromEntries(rows.map((r) => [r.userId, r])) as Record<string, T>;
  const payAllIdx = idx(payAll);
  const payMonthIdx = idx(payMonth);
  const payYearIdx = idx(payYear);
  const hasPayments = payAll.length > 0;

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
    revenueSource: "payments" | "estimated";
    net:      { all: number; month: number; year: number };
  };

  const perUser: Row[] = users.map((u) => {
    const aA = aiA.byUser.get(u.id);
    const aM = aiM.byUser.get(u.id);
    const aY = aiY.byUser.get(u.id);
    const cA = callsA.byUser.get(u.id);
    const cM = callsM.byUser.get(u.id);
    const cY = callsY.byUser.get(u.id);

    const reqAll = aA?.count ?? 0;
    const reqMonth = aM?.count ?? 0;
    const reqYear = aY?.count ?? 0;
    const tokAll = aA?.tokens ?? 0;
    const tokMonth = aM?.tokens ?? 0;
    const tokYear = aY?.tokens ?? 0;
    const callAll = cA?.count ?? 0;
    const callMonth = cM?.count ?? 0;
    const callYear = cY?.count ?? 0;

    const costAll   = (aA?.cost ?? 0) + (cA?.cost ?? 0);
    const costMonth = (aM?.cost ?? 0) + (cM?.cost ?? 0);
    const costYear  = (aY?.cost ?? 0) + (cY?.cost ?? 0);

    // Revenue: prefer Payment ledger; fall back to subscription estimate.
    let revAll = 0, revMonth = 0, revYear = 0;
    let source: "payments" | "estimated" = "payments";
    const payAllSum = payAllIdx[u.id]?._sum.amountCents ?? 0;
    const payMonthSum = payMonthIdx[u.id]?._sum.amountCents ?? 0;
    const payYearSum = payYearIdx[u.id]?._sum.amountCents ?? 0;

    if (hasPayments) {
      revAll = payAllSum / 100;
      revMonth = payMonthSum / 100;
      revYear = payYearSum / 100;
    } else {
      source = "estimated";
      const sub = u.stripeSubscription;
      const planPrice = planPriceEur(u.plan);
      const isPaying =
        planPrice > 0 &&
        sub != null &&
        ["active", "trialing", "past_due"].includes(sub.status);
      if (isPaying && sub) {
        const monthsAll = Math.max(1, Math.floor(monthsBetween(sub.createdAt, now)));
        revAll = monthsAll * planPrice;
        revMonth = sub.createdAt <= now ? planPrice : 0;
        const yearWindowStart = sub.createdAt > startOfYear ? sub.createdAt : startOfYear;
        const monthsYear = Math.max(0, Math.floor(monthsBetween(yearWindowStart, now)) + 1);
        revYear = Math.min(monthsAll, monthsYear) * planPrice;
      }
    }

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      plan: u.plan,
      membershipTier: u.membershipTier,
      createdAt: u.createdAt.toISOString(),
      subscriptionStatus: u.stripeSubscription?.status ?? null,
      requests: { all: reqAll, month: reqMonth, year: reqYear },
      tokens:   { all: tokAll, month: tokMonth, year: tokYear },
      calls:    { all: callAll, month: callMonth, year: callYear },
      cost:     { all: round(costAll), month: round(costMonth), year: round(costYear) },
      revenue:  { all: round(revAll), month: round(revMonth), year: round(revYear) },
      revenueSource: source,
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

  // Per-model breakdown for the current month — gives admin a sense of
  // smart-routing impact (% of traffic on gpt-4o vs mini).
  const modelBreakdown = Array.from(aiM.byModel.entries()).map(([model, v]) => ({
    model,
    requests: v.count,
    tokens: v.tokens,
    cost: round(v.cost),
  })).sort((a, b) => b.cost - a.cost);

  return NextResponse.json({
    asOf: now.toISOString(),
    revenueSource: hasPayments ? "payments" : "estimated",
    pricing: {
      usdToEur: USD_TO_EUR,
      models: Object.fromEntries(Object.entries(MODEL_PRICING).map(([k, v]) => [
        k,
        { inputPerMUsd: v.inputPerMTokensUsd, outputPerMUsd: v.outputPerMTokensUsd },
      ])),
      whisperUsdPerMin: 0.006,
    },
    totals,
    modelBreakdown,
    perUser,
  });
}

function sumKey(
  rows: Array<{
    revenue: { all: number; month: number; year: number };
    cost: { all: number; month: number; year: number };
    net: { all: number; month: number; year: number };
  }>,
  key: "revenue" | "cost" | "net",
) {
  return {
    all:   round(rows.reduce((s, r) => s + r[key].all, 0)),
    month: round(rows.reduce((s, r) => s + r[key].month, 0)),
    year:  round(rows.reduce((s, r) => s + r[key].year, 0)),
  };
}
