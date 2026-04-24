// src/app/api/integrations/votes/route.ts
// GET — list feature slugs the current user has already "Chcem túto"d.
// DELETE — remove the user's vote for a given feature (un-vote).
//
// Votes are stored in the Feedback table as kind="idea" with a message
// of the form "Chcem integráciu: <Name> (<slug>)". We don't add a new
// table — the admin aggregator already reads this shape, so persistence
// and the admin dashboard stay in sync automatically.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SLUG_RE = /^Chcem integráciu:\s*.+?\s*\(([\w-]+)\)\s*$/;

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  // Only need rows for the current user. Parse slug out of the message.
  const rows = await prisma.feedback.findMany({
    where: {
      userId: session.userId,
      kind: "idea",
      message: { startsWith: "Chcem integráciu:" },
    },
    select: { message: true },
  });
  const features = new Set<string>();
  for (const r of rows) {
    const m = r.message.match(SLUG_RE);
    if (m?.[1]) features.add(m[1]);
  }
  return NextResponse.json({ features: [...features] });
}

export async function DELETE(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const feature = new URL(req.url).searchParams.get("feature")?.trim();
  if (!feature || !/^[\w-]{1,40}$/.test(feature)) {
    return NextResponse.json({ error: "bad_feature" }, { status: 400 });
  }

  // Delete every "Chcem integráciu" row this user has whose slug matches.
  // We match with `contains "(slug)"` since message is free-text; safe
  // because userId+kind already scopes the query.
  const result = await prisma.feedback.deleteMany({
    where: {
      userId: session.userId,
      kind: "idea",
      message: {
        startsWith: "Chcem integráciu:",
        endsWith: `(${feature})`,
      },
    },
  });
  return NextResponse.json({ ok: true, deleted: result.count });
}
