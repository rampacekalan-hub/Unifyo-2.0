// src/app/api/gmail/send/route.ts
// Send a plain-text email from the user's connected Gmail account.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { getValidAccessToken, sendGmail } from "@/lib/google";

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  let body: { to?: string; subject?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný vstup" }, { status: 400 });
  }
  const to = typeof body.to === "string" ? body.to.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const bodyText = typeof body.body === "string" ? body.body : "";

  // Minimal RFC-style check — just enough to catch typos. Gmail does the
  // strict validation and will bounce invalid addresses.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "Neplatná e-mailová adresa" }, { status: 400 });
  }
  if (!subject) {
    return NextResponse.json({ error: "Predmet je povinný" }, { status: 400 });
  }
  if (!bodyText.trim()) {
    return NextResponse.json({ error: "Telo správy je prázdne" }, { status: 400 });
  }

  const token = await getValidAccessToken(session.userId);
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 409 });
  }

  try {
    const res = await sendGmail(token, { to, subject, body: bodyText });
    return NextResponse.json({ ok: true, id: res.id, threadId: res.threadId });
  } catch (e) {
    console.error("[gmail:send]", e);
    return NextResponse.json({ error: "gmail_failed" }, { status: 502 });
  }
}
