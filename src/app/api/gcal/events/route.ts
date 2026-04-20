// src/app/api/gcal/events/route.ts
// Returns the user's Google Calendar events for a time window. The
// /calendar page merges these with local CalendarTask rows.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getValidAccessToken, listCalendarEvents } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const token = await getValidAccessToken(session.userId);
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 409 });
  }

  const { searchParams } = new URL(req.url);
  // Defaults: now → +30 days. UI can override.
  const timeMin = searchParams.get("from")
    ? new Date(searchParams.get("from")!)
    : new Date();
  const timeMax = searchParams.get("to")
    ? new Date(searchParams.get("to")!)
    : new Date(Date.now() + 30 * 24 * 3600 * 1000);

  try {
    const events = await listCalendarEvents(token, { timeMin, timeMax, maxResults: 100 });
    return NextResponse.json({ events });
  } catch (e) {
    console.error("[gcal:events]", e);
    return NextResponse.json({ error: "gcal_failed" }, { status: 502 });
  }
}
