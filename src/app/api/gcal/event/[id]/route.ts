// src/app/api/gcal/event/[id]/route.ts
// PATCH — edit Google Calendar event. DELETE — remove it.
// `id` is the composite "calendarId::eventId" that listCalendarEvents
// returns. We pass it straight through to the helpers so they can
// target the right calendar (a user with multiple calendars can edit
// in any of them).

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import {
  getValidAccessToken,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  // Write-endpoints are rate-limited so a runaway script can't spam
  // a user's calendar. 60/h is generous for a person editing events.
  const rl = await rateLimit(req, { maxRequests: 60, windowMs: 3600_000 }, "gcal-edit");
  if (rl) return rl;

  const token = await getValidAccessToken(session.userId);
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });

  const { id } = await params;
  let body: {
    summary?: string; description?: string; location?: string;
    start?: string; end?: string; allDay?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    await updateCalendarEvent(token, id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[gcal:patch]", e);
    const msg = e instanceof Error ? e.message : "";
    if (/:\s*403/.test(msg)) {
      return NextResponse.json(
        { error: "calendar_api_disabled", hint: "Zapni Google Calendar API v GCP." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "gcal_patch_failed" }, { status: 502 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const rl = await rateLimit(req, { maxRequests: 60, windowMs: 3600_000 }, "gcal-edit");
  if (rl) return rl;

  const token = await getValidAccessToken(session.userId);
  if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });

  const { id } = await params;
  try {
    await deleteCalendarEvent(token, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[gcal:delete]", e);
    return NextResponse.json({ error: "gcal_delete_failed" }, { status: 502 });
  }
}
