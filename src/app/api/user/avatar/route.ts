// src/app/api/user/avatar/route.ts
// PUT — save an avatar dataURL (client already downscaled it). DELETE —
// remove. The dataURL is stored inline (≤30KB) because we don't need a
// separate asset server for a tiny profile picture. If users start
// uploading huge images we can move to filesystem later.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_DATAURL_BYTES = 60 * 1024; // 60KB encoded → ~45KB binary

export async function PUT(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  let body: { dataUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const dataUrl = (body.dataUrl ?? "").trim();
  if (!dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "not_a_data_url" }, { status: 400 });
  }
  if (dataUrl.length > MAX_DATAURL_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { avatarDataUrl: dataUrl },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  await prisma.user.update({
    where: { id: session.userId },
    data: { avatarDataUrl: null },
  });
  return NextResponse.json({ ok: true });
}
