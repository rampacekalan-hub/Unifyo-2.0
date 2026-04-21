// src/app/api/onboarding/complete/route.ts
// POST — saves the wizard output (profile + preferences) and marks the
// user as onboarded. Idempotent — re-posting just overwrites prefs.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { mergePrefs, type UserPrefs } from "@/lib/userPrefs";

export const dynamic = "force-dynamic";

interface Body {
  name?: string;
  company?: string;
  industry?: string;
  preferences?: Partial<UserPrefs>;
  skip?: boolean;
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const prefs = mergePrefs(body.preferences);

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        // Only touch profile fields if the wizard actually collected them
        // — skip-path can call us with just `{skip:true}`.
        ...(body.name?.trim() ? { name: body.name.trim() } : {}),
        ...(body.company !== undefined ? { company: body.company?.trim() || null } : {}),
        ...(body.industry !== undefined ? { industry: body.industry?.trim() || null } : {}),
        preferences: prefs as unknown as object,
        onboardingCompletedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[onboarding:complete]", e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
