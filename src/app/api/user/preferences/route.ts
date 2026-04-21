// src/app/api/user/preferences/route.ts
// Partial patch of User.preferences JSON. Shallow-merges into whatever
// is already there. Used by Settings theme toggle, Automation toggles
// and anywhere else we need "save one slice of prefs" without going
// through /api/onboarding/complete (which also re-stamps the onboarding
// timestamp, reserved for the wizard).

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { preferences: true },
  });
  const current = (existing?.preferences ?? {}) as Record<string, unknown>;

  // Shallow merge — good enough since the prefs shape is one level
  // deep for top-level fields and we want nested objects (like
  // `automations` or `notifications`) to be fully replaced per-call
  // when the caller sends them.
  const merged = { ...current, ...body };

  await prisma.user.update({
    where: { id: session.userId },
    data: { preferences: merged as object },
  });

  return NextResponse.json({ ok: true, preferences: merged });
}
