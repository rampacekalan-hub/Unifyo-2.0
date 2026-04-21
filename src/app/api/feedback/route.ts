// src/app/api/feedback/route.ts
// Public-ish endpoint — accepts feedback from the floating widget.
// Optional auth (attach userId if signed in), hard rate-limited by IP
// to prevent form spam. No replies or retrieval API here; owner reads
// feedback from /admin only.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ALLOWED_KINDS = new Set(["bug", "idea", "praise", "general"]);

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  // 5 submissions per IP per 10 min — deliberate honks, not abuse.
  const rl = await rateLimit(req, { maxRequests: 5, windowMs: 600_000 }, "feedback");
  if (rl) return rl;

  let body: { message?: string; kind?: string; rating?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  if (message.length < 3 || message.length > 5000) {
    return NextResponse.json({ error: "message_length" }, { status: 400 });
  }
  const kind = ALLOWED_KINDS.has(body.kind ?? "") ? body.kind! : "general";
  const rating =
    typeof body.rating === "number" && body.rating >= 1 && body.rating <= 5
      ? Math.round(body.rating)
      : null;

  const session = await getSession().catch(() => null);
  const page = req.headers.get("referer") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;

  await prisma.feedback.create({
    data: {
      userId: session?.userId ?? null,
      kind,
      message,
      rating,
      page,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true });
}
