// src/lib/microsoft.ts
// Microsoft Graph OAuth + helpers. Mirrors the shape of lib/google.ts so
// the calling code (inbox route, calendar route, etc.) is consistent.
//
// Config: MS_CLIENT_ID, MS_CLIENT_SECRET, MS_REDIRECT_URI
// (falls back to NEXT_PUBLIC_APP_URL + /api/integrations/microsoft/callback).
// Tenant = "common" so both personal (outlook.com) and work
// (Microsoft 365) accounts can sign in.

import { prisma } from "@/lib/prisma";

export const MS_SCOPES = [
  "openid",
  "offline_access",
  "User.Read",
  "Mail.Read",
  "Mail.Send",
  "Calendars.ReadWrite",
].join(" ");

const AUTH_BASE = "https://login.microsoftonline.com/common/oauth2/v2.0";
const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export function getMicrosoftClientCreds(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.MS_CLIENT_ID;
  const clientSecret = process.env.MS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function getMicrosoftRedirectUri(): string {
  if (process.env.MS_REDIRECT_URI) return process.env.MS_REDIRECT_URI;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://unifyo.online").replace(/\/$/, "");
  return `${base}/api/integrations/microsoft/callback`;
}

export function buildAuthUrl(state: string): string {
  const creds = getMicrosoftClientCreds();
  if (!creds) throw new Error("microsoft_not_configured");
  const url = new URL(`${AUTH_BASE}/authorize`);
  url.searchParams.set("client_id", creds.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", getMicrosoftRedirectUri());
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", MS_SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  id_token?: string;
  token_type: string;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const creds = getMicrosoftClientCreds();
  if (!creds) throw new Error("microsoft_not_configured");
  const body = new URLSearchParams({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    code,
    redirect_uri: getMicrosoftRedirectUri(),
    grant_type: "authorization_code",
    scope: MS_SCOPES,
  });
  const res = await fetch(`${AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`token_exchange:${res.status}:${await res.text().catch(() => "")}`);
  return (await res.json()) as TokenResponse;
}

async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const creds = getMicrosoftClientCreds();
  if (!creds) throw new Error("microsoft_not_configured");
  const body = new URLSearchParams({
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: MS_SCOPES,
  });
  const res = await fetch(`${AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`refresh:${res.status}:${await res.text().catch(() => "")}`);
  return (await res.json()) as TokenResponse;
}

export async function fetchMicrosoftUserInfo(accessToken: string): Promise<{ email: string; displayName?: string }> {
  const res = await fetch(`${GRAPH_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`userinfo:${res.status}`);
  const j = (await res.json()) as { mail?: string; userPrincipalName?: string; displayName?: string };
  const email = j.mail ?? j.userPrincipalName;
  if (!email) throw new Error("userinfo_no_email");
  return { email, displayName: j.displayName };
}

// Return a still-valid access token, refreshing 60s before expiry.
// Returns null if the user isn't connected so callers can 409.
export async function getValidMsAccessToken(userId: string): Promise<string | null> {
  const row = await prisma.microsoftIntegration.findUnique({ where: { userId } });
  if (!row) return null;
  if (row.expiresAt.getTime() - Date.now() > 60_000) {
    return row.accessToken;
  }
  try {
    const fresh = await refreshTokens(row.refreshToken);
    const expiresAt = new Date(Date.now() + fresh.expires_in * 1000);
    await prisma.microsoftIntegration.update({
      where: { userId },
      data: {
        accessToken: fresh.access_token,
        // MS rotates refresh tokens on each refresh — persist the new one.
        refreshToken: fresh.refresh_token ?? row.refreshToken,
        expiresAt,
        scopes: fresh.scope,
      },
    });
    return fresh.access_token;
  } catch (e) {
    console.error("[microsoft:refresh]", e);
    return null;
  }
}

// Thin wrappers around Graph. Caller must have a valid token.
export async function msGraphGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`graph_get:${path}:${res.status}`);
  return (await res.json()) as T;
}
