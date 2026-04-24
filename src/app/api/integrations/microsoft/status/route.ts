// src/app/api/integrations/microsoft/status/route.ts
// Used by the integrations page to show connection state without
// leaking tokens to the client.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const row = await prisma.microsoftIntegration.findUnique({
    where: { userId: session.userId },
    select: { microsoftEmail: true, scopes: true, connectedAt: true },
  });
  if (!row) return NextResponse.json({ connected: false });
  return NextResponse.json({
    connected: true,
    email: row.microsoftEmail,
    scopes: row.scopes.split(/\s+/).filter(Boolean),
    connectedAt: row.connectedAt,
  });
}
