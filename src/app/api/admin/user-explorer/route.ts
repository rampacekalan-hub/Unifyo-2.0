import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

// GET /api/admin/user-explorer — full user table with stats
// GET /api/admin/user-explorer?insights=<userId> — GDPR-safe insights for one user
export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });

  const url = new URL(req.url);
  const insightsUserId = url.searchParams.get("insights");

  try {
  // ── Insights for single user (GDPR-safe: NO raw content) ──
  if (insightsUserId) {
    const [toneBreakdown, contextBreakdown, totalMemories, totalRequests, recentRequests] =
      await Promise.all([
        prisma.neuralMemory.groupBy({
          by: ["emotionalTone"],
          where: { userId: insightsUserId, isSimulated: false },
          _count: { id: true },
        }),
        prisma.neuralMemory.groupBy({
          by: ["context"],
          where: { userId: insightsUserId, isSimulated: false },
          _count: { id: true },
        }),
        prisma.neuralMemory.count({ where: { userId: insightsUserId, isSimulated: false } }),
        prisma.aiRequest.count({ where: { userId: insightsUserId } }),
        prisma.aiRequest.groupBy({
          by: ["createdAt"],
          where: {
            userId: insightsUserId,
            createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
          },
          _count: { id: true },
          _sum: { tokens: true },
          orderBy: { createdAt: "asc" },
        }),
      ]);

    // Build daily buckets for activity chart
    const dailyBuckets: Record<string, number> = {};
    for (const row of recentRequests) {
      const d = row.createdAt.toISOString().slice(0, 10);
      dailyBuckets[d] = (dailyBuckets[d] ?? 0) + (row._count.id ?? 0);
    }

    const totalTokens = await prisma.aiRequest.aggregate({
      where: { userId: insightsUserId },
      _sum: { tokens: true },
    });

    return NextResponse.json({
      insights: {
        userId: insightsUserId,
        totalMemories,
        totalRequests,
        totalTokens: totalTokens._sum.tokens ?? 0,
        minutesSaved: totalRequests * 2,
        toneBreakdown: toneBreakdown.map((r: { emotionalTone: string; _count: { id: number } }) => ({ tone: r.emotionalTone, count: r._count.id })),
        contextBreakdown: contextBreakdown.map((r: { context: string; _count: { id: number } }) => ({ context: r.context, count: r._count.id })),
        dailyBuckets,
      },
    });
  }

  // ── Full user table ──
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      plan: true,
      membershipTier: true,
      lastActiveAt: true,
      createdAt: true,
      _count: { select: { aiRequests: true } },
    },
  });

  // Attach memory counts
  const memoryCounts = await prisma.neuralMemory.groupBy({
    by: ["userId"],
    where: { userId: { not: null }, isSimulated: false },
    _count: { id: true },
  });
  const mcMap: Record<string, number> = {};
  for (const r of memoryCounts) if (r.userId) mcMap[r.userId] = r._count.id;

  type UserRow = typeof users[number];
  const table = users.map((u: UserRow) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    plan: u.plan,
    membershipTier: u.membershipTier,
    lastActiveAt: u.lastActiveAt,
    createdAt: u.createdAt,
    requestCount: u._count.aiRequests,
    memoryCount: mcMap[u.id] ?? 0,
  }));

  return NextResponse.json({ users: table });
  } catch (err) {
    console.error("[USER_EXPLORER]", err);
    return NextResponse.json({ error: "Databáza nedostupná" }, { status: 503 });
  }
}
