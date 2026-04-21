// src/app/api/integrations/google/callback/route.ts
// OAuth callback: validate state, exchange code for tokens, upsert the
// GoogleIntegration row, redirect user back to /settings with status flag.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
} from "@/lib/google";

export const dynamic = "force-dynamic";

function redirectTo(path: string): NextResponse {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://unifyo.online";
  return NextResponse.redirect(`${base}${path}`);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errParam = searchParams.get("error");

  if (errParam) {
    return redirectTo(`/settings/integrations?error=${encodeURIComponent(errParam)}`);
  }
  if (!code || !state) {
    return redirectTo("/settings/integrations?error=missing_code");
  }

  // State check: cookie holds the random token; the state param is
  // `<token>.<userId>`. Both must match or we bail.
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("unifyo_google_oauth_state")?.value;
  const returnHint = cookieStore.get("unifyo_google_oauth_return")?.value;
  const fromOnboarding = returnHint === "onboarding";
  cookieStore.delete("unifyo_google_oauth_state");
  cookieStore.delete("unifyo_google_oauth_return");
  const errBase = fromOnboarding ? "/onboarding?step=3" : "/settings/integrations";
  const errSep = fromOnboarding ? "&" : "?";
  const okPath = fromOnboarding
    ? "/onboarding?step=3&google=connected"
    : "/settings/integrations?connected=google";
  if (!stateCookie) {
    return redirectTo(`${errBase}${errSep}error=state_expired`);
  }
  const [stateToken, userId] = state.split(".");
  if (!stateToken || !userId || stateToken !== stateCookie) {
    return redirectTo(`${errBase}${errSep}error=state_mismatch`);
  }

  // Exchange code → tokens.
  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (e) {
    console.error("[google:callback] token exchange failed", e);
    return redirectTo(`${errBase}${errSep}error=token_exchange`);
  }

  if (!tokens.refresh_token) {
    // Happens if the user previously consented and Google skipped the
    // offline-access grant. We force prompt=consent on /start to avoid
    // this — if we still end up here the Google app needs re-verification.
    return redirectTo(`${errBase}${errSep}error=no_refresh_token`);
  }

  // Verify identity on Google's side. `userinfo.email` scope is requested
  // in /start so this call always succeeds for freshly granted tokens.
  let info;
  try {
    info = await fetchGoogleUserInfo(tokens.access_token);
  } catch (e) {
    console.error("[google:callback] userinfo failed", e);
    return redirectTo(`${errBase}${errSep}error=userinfo`);
  }

  // Confirm the user still exists (edge case: account deleted mid-flow).
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    return redirectTo("/login?error=account_gone");
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  try {
    await prisma.googleIntegration.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        googleEmail: info.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scopes: tokens.scope,
      },
      update: {
        googleEmail: info.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scopes: tokens.scope,
      },
    });
  } catch (e) {
    console.error("[google:callback] upsert failed", e);
    return redirectTo(`${errBase}${errSep}error=db_error`);
  }

  return redirectTo(okPath);
}
