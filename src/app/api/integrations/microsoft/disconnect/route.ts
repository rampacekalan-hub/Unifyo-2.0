// src/app/api/integrations/microsoft/disconnect/route.ts
// Revoke the refresh token on Microsoft's side and drop the DB row.
// If revoke fails (e.g. token already expired) we still delete locally
// — the UI state has to match what the user sees.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  // Microsoft doesn't expose a single "revoke" endpoint for v2.0 the
  // way Google does — tokens are invalidated when the user removes
  // the app at https://myaccount.microsoft.com/privacy/applicationaccess
  // or when the refresh token expires. We just delete the stored copy.
  await prisma.microsoftIntegration.deleteMany({ where: { userId: session.userId } });
  return NextResponse.json({ ok: true });
}
