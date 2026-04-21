// src/app/api/admin/feedback/[id]/route.ts
// Admin-only: flip status on a feedback row. Same two-layer auth check
// as every other admin endpoint — JWT role + live DB role re-check.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = new Set(["NEW", "SEEN", "ACTIONED", "ARCHIVED"]);

async function gate(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return { fail: response };
  if (session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
    return { fail: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPERADMIN")) {
    return { fail: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const gateResult = await gate(req);
  if ("fail" in gateResult) return gateResult.fail;
  const { id } = await params;

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.status || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: "bad_status" }, { status: 400 });
  }

  await prisma.feedback.update({ where: { id }, data: { status: body.status } });
  return NextResponse.json({ ok: true });
}
