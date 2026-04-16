import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getMemoryOrbit } from "@/lib/ai/neural-core";

// GET /api/user/memory-orbit — user's own memory timeline
export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "40"), 60);

  const orbit = await getMemoryOrbit(session.userId, limit);
  return NextResponse.json({ orbit });
}
