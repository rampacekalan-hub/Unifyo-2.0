// src/app/api/mail/send/route.ts
// Provider-agnostic send. Routes by user.emailProvider.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { resolveProvider } from "@/lib/userProvider";
import { getValidAccessToken, sendGmail } from "@/lib/google";
import { getValidMsAccessToken, sendOutlookMessage } from "@/lib/microsoft";

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const rl = await rateLimit(req, { maxRequests: 30, windowMs: 3600_000 }, "mail-send");
  if (rl) return rl;

  let body: { to?: string; subject?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný vstup" }, { status: 400 });
  }
  const to = typeof body.to === "string" ? body.to.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const bodyText = typeof body.body === "string" ? body.body : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))
    return NextResponse.json({ error: "Neplatná e-mailová adresa" }, { status: 400 });
  if (!subject)
    return NextResponse.json({ error: "Predmet je povinný" }, { status: 400 });
  if (!bodyText.trim())
    return NextResponse.json({ error: "Telo správy je prázdne" }, { status: 400 });

  const provider = await resolveProvider(session.userId, "email");
  if (!provider) return NextResponse.json({ error: "not_connected" }, { status: 409 });

  try {
    if (provider === "google") {
      const token = await getValidAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      const r = await sendGmail(token, { to, subject, body: bodyText });
      return NextResponse.json({ ok: true, provider, id: r.id, threadId: r.threadId });
    }
    if (provider === "microsoft") {
      const token = await getValidMsAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      await sendOutlookMessage(token, { to, subject, body: bodyText });
      return NextResponse.json({ ok: true, provider });
    }
    return NextResponse.json({ error: "provider_unsupported" }, { status: 501 });
  } catch (e) {
    console.error("[mail:send]", e);
    return NextResponse.json({ error: "mail_failed" }, { status: 502 });
  }
}
