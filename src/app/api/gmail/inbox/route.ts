// src/app/api/gmail/inbox/route.ts
// Returns the user's Gmail INBOX (max 20 latest) as a normalized list.
// Fails gracefully with 409 "not_connected" so UI can prompt to connect.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getValidAccessToken, listGmailInbox } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const token = await getValidAccessToken(session.userId);
  if (!token) {
    return NextResponse.json({ error: "not_connected" }, { status: 409 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const maxResults = Math.min(50, Number(searchParams.get("max") ?? 20));
  const labelRaw = searchParams.get("label");
  const label =
    labelRaw === "SENT" || labelRaw === "DRAFT" || labelRaw === "STARRED" || labelRaw === "ALL"
      ? labelRaw
      : "INBOX";

  try {
    const messages = await listGmailInbox(token, { maxResults, q, label });
    return NextResponse.json({ messages });
  } catch (e) {
    console.error("[gmail:inbox]", e);
    // 403 almost always means "Gmail API not enabled in GCP project".
    // Surface that to the UI so the admin can fix it instead of guessing.
    const msg = e instanceof Error ? e.message : "";
    if (/:\s*403/.test(msg)) {
      return NextResponse.json(
        {
          error: "gmail_api_disabled",
          hint: "Zapni Gmail API v Google Cloud Console (APIs & Services → Library → Gmail API → Enable).",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "gmail_failed" }, { status: 502 });
  }
}
