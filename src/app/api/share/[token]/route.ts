// src/app/api/share/[token]/route.ts
// DELETE — revoke a share link (sets revokedAt). Scoped to the session user.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const { token } = await params;
    const link = await prisma.shareLink.findUnique({ where: { token } });
    if (!link || link.userId !== session.userId) {
      return NextResponse.json({ error: "Nenájdené" }, { status: 404 });
    }
    if (link.revokedAt) {
      return NextResponse.json({ ok: true, alreadyRevoked: true });
    }
    await prisma.shareLink.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[share:DELETE]", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
