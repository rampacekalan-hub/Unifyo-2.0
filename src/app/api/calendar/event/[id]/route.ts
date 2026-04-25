// src/app/api/calendar/event/[id]/route.ts
// Unified PATCH/DELETE for a single calendar event. Routes to Google,
// Microsoft, or Apple based on the id encoding. We explicitly do NOT
// trust user.calendarProvider here — the id itself tells us where the
// event came from, which is correct even if the user has since flipped
// their default provider.
//
// Id encodings:
//   Google     "<calendarId>::<eventId>"   (no provider prefix — legacy)
//   Apple      "apple::<base64url(resourceUrl)>"
//   Microsoft  "<eventId>"                 (Graph IDs are opaque + URL-safe)
//
// We disambiguate Google vs Microsoft by ::-presence: Google IDs always
// include "::" (we synthesize them in listCalendarEvents); Microsoft IDs
// do not. Apple is explicit.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import {
  getValidAccessToken,
  updateCalendarEvent as updateGoogleEvent,
  deleteCalendarEvent as deleteGoogleEvent,
} from "@/lib/google";
import {
  getValidMsAccessToken,
  updateOutlookEvent,
  deleteOutlookEvent,
} from "@/lib/microsoft";
import { updateAppleEvent, deleteAppleEvent } from "@/lib/apple";

export const dynamic = "force-dynamic";

type Routed =
  | { kind: "google"; id: string }
  | { kind: "microsoft"; id: string }
  | { kind: "apple"; url: string };

function routeId(id: string): Routed | null {
  if (id.startsWith("apple::")) {
    const b64 = id.slice("apple::".length);
    try {
      const url = Buffer.from(b64, "base64url").toString("utf-8");
      if (!url.startsWith("https://")) return null;
      return { kind: "apple", url };
    } catch {
      return null;
    }
  }
  if (id.startsWith("g:")) {
    // Frontend prefixes Google task ids with "g:" when stitching with
    // local CalendarTask rows. Strip before forwarding.
    return { kind: "google", id: id.slice(2) };
  }
  if (id.includes("::")) return { kind: "google", id };
  return { kind: "microsoft", id };
}

interface PatchBody {
  summary?: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const rl = await rateLimit(req, { maxRequests: 60, windowMs: 3600_000 }, "calendar-edit");
  if (rl) return rl;

  const { id } = await params;
  const routed = routeId(decodeURIComponent(id));
  if (!routed) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    if (routed.kind === "google") {
      const token = await getValidAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      await updateGoogleEvent(token, routed.id, body);
      return NextResponse.json({ ok: true });
    }
    if (routed.kind === "microsoft") {
      const token = await getValidMsAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      await updateOutlookEvent(token, routed.id, body);
      return NextResponse.json({ ok: true });
    }
    // apple
    await updateAppleEvent(session.userId, routed.url, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[calendar:patch]", e);
    return NextResponse.json({ error: "patch_failed" }, { status: 502 });
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
  const rl = await rateLimit(req, { maxRequests: 60, windowMs: 3600_000 }, "calendar-edit");
  if (rl) return rl;

  const { id } = await params;
  const routed = routeId(decodeURIComponent(id));
  if (!routed) return NextResponse.json({ error: "invalid_id" }, { status: 400 });

  try {
    if (routed.kind === "google") {
      const token = await getValidAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      await deleteGoogleEvent(token, routed.id);
      return NextResponse.json({ ok: true });
    }
    if (routed.kind === "microsoft") {
      const token = await getValidMsAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      await deleteOutlookEvent(token, routed.id);
      return NextResponse.json({ ok: true });
    }
    // apple
    await deleteAppleEvent(session.userId, routed.url);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[calendar:delete]", e);
    return NextResponse.json({ error: "delete_failed" }, { status: 502 });
  }
}
