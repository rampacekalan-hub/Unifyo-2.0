// src/app/api/integrations/provider-preference/route.ts
// GET — read user's email/calendar provider preferences + connection map.
// POST — pin a provider for one surface ({ surface, provider }) or clear it.
//
// The settings UI uses GET to render the chooser radios and POST to save.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { resolveProvider, setProviderPreference } from "@/lib/userProvider";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const u = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      emailProvider: true,
      calendarProvider: true,
      googleIntegration: { select: { id: true } },
      microsoftIntegration: { select: { id: true } },
      appleIntegration: { select: { id: true } },
    },
  });
  if (!u) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [emailEffective, calendarEffective] = await Promise.all([
    resolveProvider(session.userId, "email"),
    resolveProvider(session.userId, "calendar"),
  ]);

  return NextResponse.json({
    connected: {
      google: !!u.googleIntegration,
      microsoft: !!u.microsoftIntegration,
      apple: !!u.appleIntegration,
    },
    pinned: {
      email: u.emailProvider,
      calendar: u.calendarProvider,
    },
    effective: {
      email: emailEffective,
      calendar: calendarEffective,
    },
  });
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  let body: { surface?: string; provider?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const surface = body.surface;
  if (surface !== "email" && surface !== "calendar") {
    return NextResponse.json({ error: "invalid_surface" }, { status: 400 });
  }
  const provider = body.provider;
  if (
    provider !== null &&
    provider !== "google" &&
    provider !== "microsoft" &&
    provider !== "apple"
  ) {
    return NextResponse.json({ error: "invalid_provider" }, { status: 400 });
  }

  await setProviderPreference(session.userId, surface, provider);
  return NextResponse.json({ ok: true });
}
