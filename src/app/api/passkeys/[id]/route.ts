// src/app/api/passkeys/[id]/route.ts
// Delete a single passkey owned by the current user. We match on
// (id, userId) so a stolen id alone can't remove someone else's key.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;
  await prisma.passkey.deleteMany({ where: { id, userId: session.userId } });
  return NextResponse.json({ ok: true });
}
