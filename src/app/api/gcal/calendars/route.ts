// src/app/api/gcal/calendars/route.ts
// GET — list every Google calendar the user has read access to. Used by
// the calendar page to let the user tick/untick which ones to show and
// to colour events according to their owning calendar.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getValidAccessToken, listGoogleCalendars } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const token = await getValidAccessToken(session.userId);
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 409 });
  }

  try {
    const calendars = await listGoogleCalendars(token);
    return NextResponse.json({ calendars });
  } catch (e) {
    console.error("[gcal:calendars]", e);
    const m = e instanceof Error ? e.message : "";
    if (/:\s*403/.test(m)) {
      return NextResponse.json(
        { error: "calendar_api_disabled", hint: "Zapni Google Calendar API v Google Cloud Console." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "gcal_failed" }, { status: 502 });
  }
}
