// src/app/api/integrations/microsoft/start/route.ts
// Begin Microsoft OAuth. Sets a CSRF state cookie and redirects to the
// Microsoft consent screen. Mirrors the Google /start pattern.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth";
import { buildAuthUrl, getMicrosoftClientCreds } from "@/lib/microsoft";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  if (!getMicrosoftClientCreds()) {
    return NextResponse.json(
      { error: "Microsoft OAuth nie je nakonfigurovaný na serveri" },
      { status: 503 },
    );
  }

  const stateToken = randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("unifyo_ms_oauth_state", stateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  // `state` = <token>.<userId> so the callback can tie back even if the
  // session cookie rotated between /start and /callback.
  return NextResponse.redirect(buildAuthUrl(`${stateToken}.${session.userId}`));
}
