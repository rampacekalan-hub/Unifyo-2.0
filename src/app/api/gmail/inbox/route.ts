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

  try {
    const messages = await listGmailInbox(token, { maxResults, q });
    return NextResponse.json({ messages });
  } catch (e) {
    console.error("[gmail:inbox]", e);
    return NextResponse.json({ error: "gmail_failed" }, { status: 502 });
  }
}
