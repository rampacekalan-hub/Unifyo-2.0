// src/app/api/calendar/events/route.ts
// Provider-agnostic calendar event listing. Routes by user.calendarProvider.
// Returns shape compatible with the existing GoogleCalendarEvent type so
// existing UI code can consume it without a refactor.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resolveProvider } from "@/lib/userProvider";
import { getValidAccessToken, listCalendarEvents } from "@/lib/google";
import { getValidMsAccessToken, listOutlookCalendarEvents } from "@/lib/microsoft";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const provider = await resolveProvider(session.userId, "calendar");
  if (!provider) {
    return NextResponse.json({ error: "not_connected" }, { status: 409 });
  }

  const { searchParams } = new URL(req.url);
  const timeMin = searchParams.get("from")
    ? new Date(searchParams.get("from")!)
    : new Date();
  const timeMax = searchParams.get("to")
    ? new Date(searchParams.get("to")!)
    : new Date(Date.now() + 30 * 24 * 3600 * 1000);

  try {
    if (provider === "google") {
      const token = await getValidAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      const events = await listCalendarEvents(token, { timeMin, timeMax, maxResults: 100 });
      return NextResponse.json({ provider, events });
    }
    if (provider === "microsoft") {
      const token = await getValidMsAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      const events = await listOutlookCalendarEvents(token, { timeMin, timeMax, maxResults: 100 });
      return NextResponse.json({ provider, events });
    }
    return NextResponse.json({ error: "provider_unsupported" }, { status: 501 });
  } catch (e) {
    console.error("[calendar:events]", e);
    const m = e instanceof Error ? e.message : "";
    if (/:\s*403/.test(m))
      return NextResponse.json({ error: "api_disabled" }, { status: 503 });
    return NextResponse.json({ error: "calendar_failed" }, { status: 502 });
  }
}
