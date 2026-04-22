// src/app/api/gmail/draft/route.ts
// POST — save an email as a Gmail draft (not send). Same auth + CSRF
// + rate-limit story as /api/gmail/send. Used by the AI "Uložiť ako
// návrh" CTA and the Compose modal's save-draft button.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { getValidAccessToken, saveGmailDraft } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  // Drafts don't hit anyone's inbox, so looser than /send but still
  // bounded — 100/hr/IP stops a script from filling someone's Drafts.
  const rl = await rateLimit(req, { maxRequests: 100, windowMs: 3600_000 }, "gmail-draft");
  if (rl) return rl;

  const token = await getValidAccessToken(session.userId);
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 409 });
  }

  let body: { to?: string; subject?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const to = (body.to ?? "").trim();
  const subject = (body.subject ?? "").trim();
  const text = (body.body ?? "").trim();
  if (!text && !subject) {
    return NextResponse.json({ error: "empty_draft" }, { status: 400 });
  }

  try {
    const draft = await saveGmailDraft(token, { to, subject, body: text });
    return NextResponse.json({ ok: true, draftId: draft.id });
  } catch (e) {
    console.error("[gmail:draft]", e);
    const msg = e instanceof Error ? e.message : "";
    if (/:\s*403/.test(msg)) {
      return NextResponse.json(
        { error: "gmail_api_disabled", hint: "Zapni Gmail API v Google Cloud Console." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "draft_failed" }, { status: 502 });
  }
}
