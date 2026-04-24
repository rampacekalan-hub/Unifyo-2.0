// src/app/api/integrations/apple/connect/route.ts
// Store Apple iCloud CalDAV credentials after verifying them against
// caldav.icloud.com. Password is encrypted at rest with APP_ENCRYPTION_KEY.
// The flow is just a form POST — Apple has no OAuth for iCloud, users
// generate an app-specific password at https://appleid.apple.com.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { verifyAppleCredentials } from "@/lib/apple";
import { encryptSecret } from "@/lib/crypto-kv";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  // Tight limit — brute-forcing Apple passwords isn't our problem but
  // we don't want our server used as an oracle either.
  const rl = await rateLimit(req, { maxRequests: 5, windowMs: 600_000 }, "apple-connect");
  if (rl) return rl;

  let body: { appleId?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const appleId = (body.appleId ?? "").trim();
  const password = (body.password ?? "").trim();
  if (!appleId.includes("@") || password.length < 10) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 400 });
  }

  let discovery;
  try {
    discovery = await verifyAppleCredentials(appleId, password);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "auth_failed") {
      return NextResponse.json(
        { error: "auth_failed", hint: "Overenie Apple ID zlyhalo. Použil si app-specific password?" },
        { status: 401 },
      );
    }
    console.error("[apple:connect]", e);
    return NextResponse.json({ error: "caldav_unreachable" }, { status: 502 });
  }

  let passwordEnc: string;
  try {
    passwordEnc = encryptSecret(password);
  } catch (e) {
    console.error("[apple:connect] encryption failed", e);
    return NextResponse.json(
      { error: "encryption_unavailable", hint: "APP_ENCRYPTION_KEY nie je nastavený." },
      { status: 503 },
    );
  }

  try {
    await prisma.appleIntegration.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        appleId,
        passwordEnc,
        principalUrl: discovery.principalUrl,
        calendarHomeUrl: discovery.calendarHomeUrl,
      },
      update: {
        appleId,
        passwordEnc,
        principalUrl: discovery.principalUrl,
        calendarHomeUrl: discovery.calendarHomeUrl,
      },
    });
  } catch (e) {
    console.error("[apple:connect] upsert failed", e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email: appleId });
}
