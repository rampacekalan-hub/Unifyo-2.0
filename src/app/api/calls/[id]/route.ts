// src/app/api/calls/[id]/route.ts
// GET — full detail (transcript + summary + keyPoints + actionItems).
// DELETE — remove row + disk file. Hard-scoped to the owning user.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { deleteCallFile } from "@/lib/calls";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;

  const row = await prisma.callRecording.findFirst({
    where: { id, userId: session.userId },
  });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;

  const row = await prisma.callRecording.findFirst({
    where: { id, userId: session.userId },
    select: { id: true, filePath: true },
  });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.callRecording.delete({ where: { id: row.id } });
  await deleteCallFile(row.filePath);
  return NextResponse.json({ ok: true });
}
