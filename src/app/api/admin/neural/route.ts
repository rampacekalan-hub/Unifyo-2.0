import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getNeuralStats, getThoughtStream, updateMemory, purgeUserMemories,
  getGovernance, setGovernance,
} from "@/lib/ai/neural-core";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

// GET /api/admin/neural — stats + thought stream + governance + roi + audit
export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "30"), 100);

  try {
  if (url.searchParams.get("governance") === "1") {
    return NextResponse.json({ governance: getGovernance() });
  }

  // Audit trail
  if (url.searchParams.get("audit") === "1") {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ logs });
  }

  // ROI stats
  if (url.searchParams.get("roi") === "1") {
    const since30d = new Date(Date.now() - 30 * 86_400_000);
    const [totalTokens, dailyActivity] = await Promise.all([
      prisma.aiRequest.aggregate({ _sum: { tokens: true } }),
      prisma.aiRequest.groupBy({
        by: ["createdAt"],
        _count: { id: true },
        _sum: { tokens: true },
        where: { createdAt: { gte: since30d } },
        orderBy: { createdAt: "asc" },
      }),
    ]);
    const totalTok = totalTokens._sum.tokens ?? 0;
    // Estimate: 1 request ≈ 2 min saved, avg 500 tokens/req
    const totalRequests = await prisma.aiRequest.count();
    const minutesSaved = totalRequests * 2;
    const costSaved = (totalTok / 1000) * 0.002; // GPT-4o-mini pricing
    // Daily buckets (group by date string)
    const buckets: Record<string, number> = {};
    for (const row of dailyActivity) {
      const d = row.createdAt.toISOString().slice(0, 10);
      buckets[d] = (buckets[d] ?? 0) + (row._count.id ?? 0);
    }
    return NextResponse.json({
      roi: { totalTokens: totalTok, totalRequests, minutesSaved, costSaved, dailyBuckets: buckets },
    });
  }

  const [stats, stream] = await Promise.all([
    getNeuralStats(24),
    getThoughtStream(limit),
  ]);

  return NextResponse.json({ stats, stream, governance: getGovernance() });
  } catch (err) {
    console.error("[NEURAL GET]", err);
    return NextResponse.json({ error: "Databáza nedostupná" }, { status: 503 });
  }
}

const patchSchema = z.object({
  id: z.string(),
  summary: z.string().min(1).max(2000),
  importance: z.number().min(0).max(1),
  confidenceScore: z.number().min(0).max(1).optional(),
});

const governanceSchema = z.object({
  governance: z.object({
    temperature: z.number().min(0).max(2).optional(),
    safetyLevel: z.number().min(0).max(1).optional(),
    persona: z.string().min(10).max(1000).optional(),
  }),
});

const purgeSchema = z.object({
  purge: z.literal(true),
  userId: z.string(),
});

const bulkSchema = z.object({
  bulk: z.literal(true),
  action: z.enum(["delete", "archive", "importance", "recategorize"]),
  ids: z.array(z.string()).min(1).max(200),
  value: z.union([z.number(), z.string()]).optional(), // importance value or new context
});

// PATCH /api/admin/neural — memory edit | governance update | purge | bulk actions
export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });

  const body = await req.json().catch(() => null);

  try {
  // Governance update
  const gov = governanceSchema.safeParse(body);
  if (gov.success) {
    setGovernance(gov.data.governance);
    await prisma.auditLog.create({ data: { adminEmail: session.email, action: "GOVERNANCE_UPDATE", after: gov.data.governance as object } });
    return NextResponse.json({ success: true, governance: getGovernance() });
  }

  // Emergency purge
  const purge = purgeSchema.safeParse(body);
  if (purge.success) {
    const count = await purgeUserMemories(purge.data.userId);
    await prisma.auditLog.create({ data: { adminEmail: session.email, action: "PURGE", metadata: { userId: purge.data.userId, count } } });
    return NextResponse.json({ success: true, deleted: count });
  }

  // Bulk actions
  const bulk = bulkSchema.safeParse(body);
  if (bulk.success) {
    const { action, ids, value } = bulk.data;
    let affected = 0;
    if (action === "delete") {
      const r = await prisma.neuralMemory.deleteMany({ where: { id: { in: ids } } });
      affected = r.count;
    } else if (action === "archive") {
      const r = await prisma.neuralMemory.updateMany({ where: { id: { in: ids } }, data: { isEdited: true, summary: "[ARCHIVED]" } });
      affected = r.count;
    } else if (action === "importance" && typeof value === "number") {
      const r = await prisma.neuralMemory.updateMany({ where: { id: { in: ids } }, data: { importance: value } });
      affected = r.count;
    } else if (action === "recategorize" && typeof value === "string") {
      const r = await prisma.neuralMemory.updateMany({ where: { id: { in: ids } }, data: { context: value } });
      affected = r.count;
    }
    await prisma.auditLog.create({
      data: { adminEmail: session.email, action: `BULK_${action.toUpperCase()}`, targetIds: ids, metadata: { value, affected } },
    });
    return NextResponse.json({ success: true, affected });
  }

  // Single memory edit
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { id, summary, importance, confidenceScore } = parsed.data;
  const before = await prisma.neuralMemory.findUnique({ where: { id }, select: { summary: true, importance: true, confidenceScore: true } });
  const updated = await updateMemory(id, summary, importance, confidenceScore);

  await prisma.auditLog.create({
    data: {
      adminEmail: session.email,
      action: "EDIT",
      targetId: id,
      before: before as object,
      after: { summary, importance, confidenceScore } as object,
    },
  });

  return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("[NEURAL PATCH]", err);
    return NextResponse.json({ error: "Databáza nedostupná" }, { status: 503 });
  }
}
