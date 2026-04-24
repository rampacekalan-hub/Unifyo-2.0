// src/app/api/integrations/apple/status/route.ts
// Connection state for the integrations UI. Never returns the password.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const row = await prisma.appleIntegration.findUnique({
    where: { userId: session.userId },
    select: { appleId: true, connectedAt: true },
  });
  if (!row) return NextResponse.json({ connected: false });
  return NextResponse.json({
    connected: true,
    email: row.appleId,
    connectedAt: row.connectedAt,
  });
}
