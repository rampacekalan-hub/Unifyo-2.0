// src/app/api/calendar/event/route.ts
// POST /api/calendar/event — create a new event on the user's active
// calendar provider (or an explicit `destination`). The companion
// PATCH/DELETE for an existing event lives in [id]/route.ts.
//
// Body shape:
//   { summary, description?, location?, start, end, allDay?, destination? }
// `destination` may be "google" | "microsoft" | "apple"; if omitted we
// fall back to resolveProvider(userId, "calendar"). The route returns
// the composite id the rest of the app uses, so the client can stitch
// it into the local cache without re-fetching.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { resolveProvider } from "@/lib/userProvider";
import { getValidAccessToken, createCalendarEvent } from "@/lib/google";
import { getValidMsAccessToken, createOutlookEvent } from "@/lib/microsoft";
import { createAppleEvent } from "@/lib/apple";

export const dynamic = "force-dynamic";

interface CreateBody {
  summary?: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  destination?: "google" | "microsoft" | "apple";
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const rl = await rateLimit(req, { maxRequests: 60, windowMs: 3600_000 }, "calendar-create");
  if (rl) return rl;

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.summary || !body.start || !body.end) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const provider =
    body.destination ?? (await resolveProvider(session.userId, "calendar"));
  if (!provider) {
    return NextResponse.json({ error: "not_connected" }, { status: 409 });
  }

  const ev = {
    summary: body.summary,
    description: body.description,
    location: body.location,
    start: body.start,
    end: body.end,
    allDay: !!body.allDay,
  };

  try {
    if (provider === "google") {
      const token = await getValidAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      const r = await createCalendarEvent(token, ev);
      return NextResponse.json({ ok: true, provider, id: r.id, htmlLink: r.htmlLink });
    }
    if (provider === "microsoft") {
      const token = await getValidMsAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      const r = await createOutlookEvent(token, ev);
      return NextResponse.json({ ok: true, provider, id: r.id, htmlLink: r.htmlLink });
    }
    // apple
    const r = await createAppleEvent(session.userId, ev);
    return NextResponse.json({ ok: true, provider, id: r.id });
  } catch (e) {
    console.error("[calendar:create]", e);
    return NextResponse.json({ error: "create_failed" }, { status: 502 });
  }
}
