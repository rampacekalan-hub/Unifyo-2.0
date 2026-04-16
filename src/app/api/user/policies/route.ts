import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanLimits } from "@/lib/ai/neural-core";
import { z } from "zod";

const policySchema = z.object({
  name: z.string().min(1).max(200),
  rule: z.string().min(3).max(1000),
  isActive: z.boolean().optional().default(true),
});

// GET — list own policies
export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  try {
    const policies = await prisma.userPolicy.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ policies });
  } catch {
    return NextResponse.json({ error: "Databáza nedostupná" }, { status: 503 });
  }
}

// POST — create own policy
export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json().catch(() => null);
  const parsed = policySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const [count, limits] = await Promise.all([
      prisma.userPolicy.count({ where: { userId: session.userId } }),
      getPlanLimits(session.membershipTier),
    ]);
    const maxPolicies = limits.userPolicies;
    if (count >= maxPolicies)
      return NextResponse.json({ error: `Max ${maxPolicies} políc pre tvoj tier (${session.membershipTier})` }, { status: 403 });
    const policy = await prisma.userPolicy.create({
      data: { userId: session.userId, ...parsed.data },
    });
    return NextResponse.json({ success: true, policy });
  } catch {
    return NextResponse.json({ error: "Databáza nedostupná" }, { status: 503 });
  }
}

// PATCH — update own policy
export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json().catch(() => null);
  const id: string = body?.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Ownership check — CRITICAL security
  try {
    const existing = await prisma.userPolicy.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    const parsed = policySchema.partial().safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const updated = await prisma.userPolicy.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, policy: updated });
  } catch {
    return NextResponse.json({ error: "Databáza nedostupná" }, { status: 503 });
  }
}

// DELETE — delete own policy
export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const { id }: { id: string } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const existing = await prisma.userPolicy.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.userPolicy.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Databáza nedostupná" }, { status: 503 });
  }
}
