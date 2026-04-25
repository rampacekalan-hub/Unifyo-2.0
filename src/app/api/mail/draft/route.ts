// src/app/api/mail/draft/route.ts
// Provider-agnostic draft save. Routes by user.emailProvider.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { resolveProvider } from "@/lib/userProvider";
import { getValidAccessToken, saveGmailDraft } from "@/lib/google";
import { getValidMsAccessToken, saveOutlookDraft } from "@/lib/microsoft";
import { saveAppleDraft } from "@/lib/appleMail";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const rl = await rateLimit(req, { maxRequests: 100, windowMs: 3600_000 }, "mail-draft");
  if (rl) return rl;

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

  const provider = await resolveProvider(session.userId, "email");
  if (!provider) return NextResponse.json({ error: "not_connected" }, { status: 409 });

  try {
    if (provider === "google") {
      const token = await getValidAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      const draft = await saveGmailDraft(token, { to, subject, body: text });
      return NextResponse.json({ ok: true, provider, draftId: draft.id });
    }
    if (provider === "microsoft") {
      const token = await getValidMsAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      const draft = await saveOutlookDraft(token, { to, subject, body: text });
      return NextResponse.json({ ok: true, provider, draftId: draft.id });
    }
    if (provider === "apple") {
      const draft = await saveAppleDraft(session.userId, { to, subject, body: text });
      return NextResponse.json({ ok: true, provider, draftId: draft.id });
    }
    return NextResponse.json({ error: "provider_unsupported" }, { status: 501 });
  } catch (e) {
    console.error("[mail:draft]", e);
    return NextResponse.json({ error: "draft_failed" }, { status: 502 });
  }
}
