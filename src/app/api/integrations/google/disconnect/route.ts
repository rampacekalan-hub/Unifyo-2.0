// src/app/api/integrations/google/disconnect/route.ts
// Revoke token on Google's side (best effort) and delete the integration row.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { disconnectGoogle } from "@/lib/google";

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  try {
    await disconnectGoogle(session.userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[google:disconnect]", e);
    return NextResponse.json({ error: "Odpojenie zlyhalo" }, { status: 500 });
  }
}
