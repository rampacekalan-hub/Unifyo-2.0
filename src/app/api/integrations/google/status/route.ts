// src/app/api/integrations/google/status/route.ts
// Lightweight read — is Google connected, which email, since when?
// Used by settings UI to render "Connect" vs "Disconnect" button.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getGoogleIntegrationStatus } from "@/lib/google";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const status = await getGoogleIntegrationStatus(session.userId);
  return NextResponse.json(status);
}
