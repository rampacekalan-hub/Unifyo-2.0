// src/app/api/integrations/microsoft/callback/route.ts
// OAuth callback for Microsoft Graph — validate state, exchange code,
// upsert MicrosoftIntegration row, redirect to /settings/integrations
// with a status flag.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForTokens,
  fetchMicrosoftUserInfo,
} from "@/lib/microsoft";

export const dynamic = "force-dynamic";

function redirectTo(path: string): NextResponse {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://unifyo.online";
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

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("unifyo_ms_oauth_state")?.value;
  cookieStore.delete("unifyo_ms_oauth_state");
  if (!stateCookie) {
    return redirectTo("/settings/integrations?error=state_expired");
  }
  const [stateToken, userId] = state.split(".");
  if (!stateToken || !userId || stateToken !== stateCookie) {
    return redirectTo("/settings/integrations?error=state_mismatch");
  }

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (e) {
    console.error("[microsoft:callback] token exchange failed", e);
    return redirectTo("/settings/integrations?error=token_exchange");
  }

  if (!tokens.refresh_token) {
    return redirectTo("/settings/integrations?error=no_refresh_token");
  }

  let info;
  try {
    info = await fetchMicrosoftUserInfo(tokens.access_token);
  } catch (e) {
    console.error("[microsoft:callback] userinfo failed", e);
    return redirectTo("/settings/integrations?error=userinfo");
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    return redirectTo("/login?error=account_gone");
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  try {
    await prisma.microsoftIntegration.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        microsoftEmail: info.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scopes: tokens.scope,
      },
      update: {
        microsoftEmail: info.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scopes: tokens.scope,
      },
    });
  } catch (e) {
    console.error("[microsoft:callback] upsert failed", e);
    return redirectTo("/settings/integrations?error=db_error");
  }

  return redirectTo("/settings/integrations?connected=microsoft");
}
