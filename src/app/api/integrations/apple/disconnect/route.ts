// src/app/api/integrations/apple/disconnect/route.ts
// Just drop the DB row. App-specific passwords can be revoked by the
// user at appleid.apple.com; we can't do that server-side.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  await prisma.appleIntegration.deleteMany({ where: { userId: session.userId } });
  return NextResponse.json({ ok: true });
}
