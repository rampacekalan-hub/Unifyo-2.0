// src/app/api/integrations/google/start/route.ts
// Kick off Google OAuth. Generates a random `state` cookie (CSRF + mapping
// back to the logged-in user after callback) and redirects to consent.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth";
import {
  GOOGLE_SCOPES,
  getGoogleClientCreds,
  getGoogleRedirectUri,
} from "@/lib/google";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const creds = getGoogleClientCreds();
  if (!creds) {
    return NextResponse.json(
      { error: "Google OAuth nie je nakonfigurovaný na serveri" },
      { status: 503 },
    );
  }

  // Stateful CSRF protection: random token set as httpOnly cookie and
  // echoed in the `state` query param. Callback checks they match.
  const stateToken = randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("unifyo_google_oauth_state", stateToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 min to complete consent
  });

  // Optional `?from=onboarding` — callback redirects into the wizard
  // instead of /settings/integrations. Anything else is ignored (we
  // don't accept arbitrary `next` URLs to avoid open-redirect risk).
  const from = req.nextUrl.searchParams.get("from") === "onboarding" ? "onboarding" : "settings";
  cookieStore.set("unifyo_google_oauth_return", from, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  // Stash the userId in the state too so callback can tie this flow back
  // to the correct user even if the session cookie has rotated.
  const statePayload = `${stateToken}.${session.userId}`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", creds.clientId);
  authUrl.searchParams.set("redirect_uri", getGoogleRedirectUri());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", GOOGLE_SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  // `prompt=consent` forces Google to re-issue a refresh_token even if the
  // user already granted access — otherwise subsequent reconnects give us
  // only an access_token and refresh flow breaks.
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("state", statePayload);

  return NextResponse.redirect(authUrl.toString());
}
