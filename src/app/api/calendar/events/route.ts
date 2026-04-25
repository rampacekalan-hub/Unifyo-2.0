// src/app/api/calendar/events/route.ts
// Provider-agnostic calendar event listing. Routes by user.calendarProvider.
// Returns shape compatible with the existing GoogleCalendarEvent type so
// existing UI code can consume it without a refactor.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resolveProvider } from "@/lib/userProvider";
import { getValidAccessToken, listCalendarEvents } from "@/lib/google";
import { getValidMsAccessToken, listOutlookCalendarEvents } from "@/lib/microsoft";
import { listAppleEvents } from "@/lib/apple";

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
    if (provider === "apple") {
      const apple = await listAppleEvents(
        session.userId,
        timeMin.toISOString(),
        timeMax.toISOString(),
      );
      // Project AppleEvent → unified GoogleCalendarEvent shape so the
      // /calendar UI can consume it without provider awareness. We
      // encode the CalDAV resource URL into the id ("apple::<b64url>")
      // because mutations need it but the UI treats id as opaque.
      const events = apple.map((e) => {
        const compositeId = e.url
          ? `apple::${Buffer.from(e.url).toString("base64url")}`
          : `apple::${e.uid}`;
        const startIso = e.allDay
          ? new Date(`${e.start}T00:00:00Z`).toISOString()
          : new Date(e.start + "Z").toISOString();
        const endIso = e.allDay
          ? new Date(`${e.end}T00:00:00Z`).toISOString()
          : new Date(e.end + "Z").toISOString();
        return {
          id: compositeId,
          summary: e.summary,
          description: e.description,
          start: startIso,
          end: endIso,
          allDay: e.allDay,
          calendarName: e.calendarName ?? "iCloud",
        };
      });
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
