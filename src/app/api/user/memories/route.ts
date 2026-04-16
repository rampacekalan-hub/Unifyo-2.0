import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  id: z.string(),
  summary: z.string().min(1).max(2000).optional(),
  importance: z.number().min(0).max(1).optional(),
});

// GET — own memories (anonymizedContent only — no raw content)
export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "40"), 100);
  const context = url.searchParams.get("context") ?? undefined;

  const memories = await prisma.neuralMemory.findMany({
    where: {
      userId: session.userId,
      isSimulated: false,
      ...(context ? { context } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      module: true,
      role: true,
      anonymizedContent: true,
      summary: true,
      context: true,
      emotionalTone: true,
      confidenceScore: true,
      importance: true,
      isEdited: true,
      relevanceTTL: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ memories });
}

// PATCH — edit own memory (summary / importance only)
export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { id, summary, importance } = parsed.data;

  // Ownership check — CRITICAL
  const mem = await prisma.neuralMemory.findUnique({ where: { id }, select: { userId: true } });
  if (!mem || mem.userId !== session.userId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.neuralMemory.update({
    where: { id },
    data: {
      ...(summary !== undefined ? { summary, isEdited: true } : {}),
      ...(importance !== undefined ? { importance } : {}),
    },
  });
  return NextResponse.json({ success: true, updated });
}

// DELETE — delete own memory
export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const { id }: { id: string } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Ownership check
  const mem = await prisma.neuralMemory.findUnique({ where: { id }, select: { userId: true } });
  if (!mem || mem.userId !== session.userId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.neuralMemory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
