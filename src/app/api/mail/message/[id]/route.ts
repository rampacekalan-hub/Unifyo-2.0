// src/app/api/mail/message/[id]/route.ts
// Provider-agnostic single-message GET. Routes by user.emailProvider.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resolveProvider } from "@/lib/userProvider";
import { getValidAccessToken, getGmailMessage, markGmailRead } from "@/lib/google";
import { getValidMsAccessToken, getOutlookMessage, markOutlookRead } from "@/lib/microsoft";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;

  const provider = await resolveProvider(session.userId, "email");
  if (!provider) return NextResponse.json({ error: "not_connected" }, { status: 409 });

  try {
    if (provider === "google") {
      const token = await getValidAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      const msg = await getGmailMessage(token, id);
      // Background mark-as-read — don't fail the read on a modify scope error.
      markGmailRead(token, id).catch(() => {});
      return NextResponse.json(msg);
    }
    if (provider === "microsoft") {
      const token = await getValidMsAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      const msg = await getOutlookMessage(token, id);
      markOutlookRead(token, id).catch(() => {});
      return NextResponse.json(msg);
    }
    return NextResponse.json({ error: "provider_unsupported" }, { status: 501 });
  } catch (e) {
    console.error("[mail:message]", e);
    const m = e instanceof Error ? e.message : "";
    if (/:\s*403/.test(m))
      return NextResponse.json({ error: "api_disabled" }, { status: 503 });
    if (/:\s*404/.test(m))
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ error: "mail_failed" }, { status: 502 });
  }
}
