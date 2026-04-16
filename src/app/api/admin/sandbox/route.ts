import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { storeSimulated } from "@/lib/ai/neural-core";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

const sandboxSchema = z.object({
  userInput:   z.string().min(1).max(2000),
  aiResponse:  z.string().min(1).max(4000),
  userId:      z.string().optional(),
  module:      z.string().default("sandbox"),
});

// POST /api/admin/sandbox — run Brain Sandbox simulation
export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });

  let body: unknown = null;
  try { body = await req.json(); } catch { /* empty body */ }

  const parsed = sandboxSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { userInput, aiResponse, userId, module } = parsed.data;

  const ctx = {
    userId:    userId ?? session.userId,
    sessionId: `sandbox-${Date.now()}`,
    module,
    tier:      "ENTERPRISE" as const,
  };

  try {
    const result = await storeSimulated(ctx, userInput, aiResponse);
    console.log(`[AUDIT] BRAIN_SANDBOX admin=${session.email} module=${module}`);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[SANDBOX] storeSimulated failed:", msg);
    return NextResponse.json(
      { error: "Pipeline failed", detail: msg },
      { status: 500 }
    );
  }
}

// GET /api/admin/sandbox?userId=...&query=... — Mind-Reader: suggest related memories
export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });

  const url = new URL(req.url);
  const query   = url.searchParams.get("query") ?? "";
  const userId  = url.searchParams.get("userId") ?? session.userId;

  if (!query.trim()) {
    return NextResponse.json({ suggestions: [] });
  }

  // Extract keywords (simple split, min 4 chars, skip stopwords)
  const STOP = new Set(["som","bol","bola","mam","mala","bol","the","and","that","this","with","from","have","akan"]);
  const keywords = query
    .toLowerCase()
    .replace(/[^a-záčďéěíňóřšťúůýž\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w))
    .slice(0, 8);

  if (keywords.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // Fetch recent relevant memories for this user
    const memories = await prisma.neuralMemory.findMany({
      where: {
        userId,
        role: "assistant",
        isSimulated: false,
        OR: keywords.map((kw) => ({
          anonymizedContent: { contains: kw, mode: "insensitive" as const },
        })),
      },
      orderBy: { importance: "desc" },
      take: 5,
      select: {
        id: true,
        module: true,
        anonymizedContent: true,
        summary: true,
        context: true,
        emotionalTone: true,
        confidenceScore: true,
        createdAt: true,
      },
    });

    type MemRow = typeof memories[number];
    const suggestions = memories.map((m: MemRow) => ({
      id: m.id,
      label: m.summary ?? (m.anonymizedContent ?? "").slice(0, 100),
      context: m.context,
      emotionalTone: m.emotionalTone,
      confidence: m.confidenceScore,
      module: m.module,
      date: m.createdAt,
    }));

    return NextResponse.json({ suggestions });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ suggestions: [], error: msg });
  }
}
