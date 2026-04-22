// src/app/api/gmail/message/[id]/route.ts
// GET — full body of a single Gmail message + auto-mark-as-read.
// The inbox list endpoint only returns metadata; this is where we get
// the HTML/text body for the detail panel.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getValidAccessToken,
  getGmailMessage,
  markGmailRead,
} from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await params;

  const token = await getValidAccessToken(session.userId);
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 409 });
  }

  try {
    const msg = await getGmailMessage(token, id);
    // Mark as read in the background — don't block the response on it,
    // and don't fail the whole request if modify returns a scope error.
    markGmailRead(token, id).catch(() => {});
    return NextResponse.json(msg);
  } catch (e) {
    console.error("[gmail:message]", e);
    const m = e instanceof Error ? e.message : "";
    if (/:\s*403/.test(m)) {
      return NextResponse.json(
        { error: "gmail_api_disabled", hint: "Zapni Gmail API v Google Cloud Console." },
        { status: 503 },
      );
    }
    if (/:\s*404/.test(m)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "gmail_failed" }, { status: 502 });
  }
}
