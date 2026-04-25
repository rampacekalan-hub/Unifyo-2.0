// src/app/api/mail/inbox/route.ts
// Provider-agnostic inbox listing. Routes to Gmail or Outlook depending
// on the user's emailProvider preference (resolveProvider). Returns a
// uniform { messages: [] } shape so callers don't need provider awareness.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { resolveProvider } from "@/lib/userProvider";
import { getValidAccessToken, listGmailInbox } from "@/lib/google";
import { getValidMsAccessToken, listOutlookInbox } from "@/lib/microsoft";
import { listAppleInbox } from "@/lib/appleMail";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const provider = await resolveProvider(session.userId, "email");
  if (!provider) {
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
    if (provider === "google") {
      const token = await getValidAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      const messages = await listGmailInbox(token, { maxResults, q, label });
      return NextResponse.json({ provider, messages });
    }
    if (provider === "microsoft") {
      const token = await getValidMsAccessToken(session.userId);
      if (!token) return NextResponse.json({ error: "not_connected" }, { status: 409 });
      const messages = await listOutlookInbox(token, { maxResults, q, label });
      return NextResponse.json({ provider, messages });
    }
    if (provider === "apple") {
      const messages = await listAppleInbox(session.userId, { maxResults, q, label });
      return NextResponse.json({ provider, messages });
    }
    return NextResponse.json({ error: "provider_unsupported" }, { status: 501 });
  } catch (e) {
    console.error("[mail:inbox]", e);
    const msg = e instanceof Error ? e.message : "";
    if (/:\s*403/.test(msg)) {
      return NextResponse.json(
        {
          error: "api_disabled",
          hint: "API providera je vypnuté alebo bez scope. Skús Disconnect/Connect znova.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "mail_failed" }, { status: 502 });
  }
}
