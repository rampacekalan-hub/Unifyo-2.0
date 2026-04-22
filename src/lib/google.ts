// src/lib/google.ts
// Google OAuth + Gmail + Calendar helpers.
//
// Dizajn:
// - Access tokeny majú životnosť ~1h. Refresh token je dlhodobý (získaný
//   raz pri consent flow s prompt=consent + access_type=offline).
// - `getValidAccessToken(userId)` vráti platný token — ak je starý <60s,
//   zavolá refresh a uloží nový do DB.
// - Gmail + Calendar helpery volajú Google REST API priamo, bez SDK —
//   Google Node SDK je 2MB+ závislosť, REST stačí pre naše potreby.

import { prisma } from "@/lib/prisma";
import type { GoogleIntegration } from "@prisma/client";

// ── Scopes (musí presne matchovať to, čo request-ujeme v /start) ──
export const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export function getGoogleRedirectUri(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://unifyo.online";
  return `${base}/api/integrations/google/callback`;
}

export function getGoogleClientCreds():
  | { clientId: string; clientSecret: string }
  | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

// ── OAuth token exchange ─────────────────────────────────────────
export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: "Bearer";
  id_token?: string;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const creds = getGoogleClientCreds();
  if (!creds) throw new Error("Google OAuth credentials not configured");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const creds = getGoogleClientCreds();
  if (!creds) throw new Error("Google OAuth credentials not configured");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google token refresh failed: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<{ email: string; name?: string }> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`userinfo failed: ${res.status}`);
  const json = (await res.json()) as { email: string; name?: string };
  return { email: json.email, name: json.name };
}

// ── Token store (DB-backed, per-user) ────────────────────────────
/** Returns a valid access token for the given user, refreshing if needed.
 *  Returns null when the user has no integration at all. Throws when the
 *  refresh call itself fails — caller should treat as "disconnect & prompt
 *  re-consent" (happens if user revoked access on their Google side). */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const integ = await prisma.googleIntegration.findUnique({ where: { userId } });
  if (!integ) return null;
  // 60-second buffer so we don't hand out a token that expires mid-request.
  if (integ.expiresAt.getTime() > Date.now() + 60_000) {
    return integ.accessToken;
  }
  const refreshed = await refreshAccessToken(integ.refreshToken);
  const updated = await prisma.googleIntegration.update({
    where: { userId },
    data: {
      accessToken: refreshed.access_token,
      expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      // Google sometimes rotates the refresh_token — honor that if present.
      ...(refreshed.refresh_token ? { refreshToken: refreshed.refresh_token } : {}),
    },
  });
  return updated.accessToken;
}

export async function getGoogleIntegrationStatus(userId: string): Promise<{
  connected: boolean;
  email?: string;
  connectedAt?: Date;
  scopes?: string[];
}> {
  const integ = await prisma.googleIntegration.findUnique({ where: { userId } });
  if (!integ) return { connected: false };
  return {
    connected: true,
    email: integ.googleEmail,
    connectedAt: integ.connectedAt,
    scopes: integ.scopes.split(" ").filter(Boolean),
  };
}

// ── Gmail helpers ────────────────────────────────────────────────
export interface GmailMessageSummary {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: string; // ISO
  unread: boolean;
}

interface GmailListResponse {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

interface GmailFullMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: {
    headers?: { name: string; value: string }[];
  };
}

function headerOf(headers: { name: string; value: string }[] | undefined, name: string): string {
  if (!headers) return "";
  const h = headers.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value ?? "";
}

export async function listGmailInbox(
  accessToken: string,
  opts: {
    maxResults?: number;
    q?: string;
    /** Gmail label ids — "INBOX", "SENT", "DRAFT", "STARRED". Omit or
     *  pass "ALL" for the full message list (Gmail treats no label
     *  filter as "everything"). */
    label?: "INBOX" | "SENT" | "DRAFT" | "STARRED" | "ALL";
  } = {},
): Promise<GmailMessageSummary[]> {
  const label = opts.label ?? "INBOX";
  const params = new URLSearchParams({
    maxResults: String(opts.maxResults ?? 20),
    ...(label !== "ALL" ? { labelIds: label } : {}),
    ...(opts.q ? { q: opts.q } : {}),
  });
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!listRes.ok) throw new Error(`gmail list failed: ${listRes.status}`);
  const list = (await listRes.json()) as GmailListResponse;
  if (!list.messages?.length) return [];

  // Fetch metadata for each — 20 parallel requests is OK for Gmail quota.
  const details = await Promise.all(
    list.messages.map(async (m) => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!r.ok) return null;
      return (await r.json()) as GmailFullMessage;
    }),
  );

  return details
    .filter((x): x is GmailFullMessage => x !== null)
    .map((msg) => ({
      id: msg.id,
      threadId: msg.threadId,
      from: headerOf(msg.payload?.headers, "From"),
      to: headerOf(msg.payload?.headers, "To"),
      subject: headerOf(msg.payload?.headers, "Subject") || "(bez predmetu)",
      snippet: msg.snippet ?? "",
      date: msg.internalDate
        ? new Date(Number(msg.internalDate)).toISOString()
        : new Date().toISOString(),
      unread: Boolean(msg.labelIds?.includes("UNREAD")),
    }));
}

/** Fetch the full body of a single Gmail message. Returns both the
 *  HTML body (if present) and a plain-text fallback. Strips the MIME
 *  wrapper so the UI can drop the result straight into a panel.
 */
export async function getGmailMessage(
  accessToken: string,
  id: string,
): Promise<{
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  html: string | null;
  text: string | null;
  snippet: string;
}> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`gmail get failed: ${res.status}`);
  const msg = (await res.json()) as GmailFullMessage;

  // Walk the MIME tree collecting `text/plain` and `text/html` parts.
  // Gmail nests: root can be a single part or multipart/*; multipart
  // can contain more multiparts. Simple recursive reducer.
  const walk = (part?: {
    mimeType?: string;
    body?: { data?: string };
    parts?: Array<{ mimeType?: string; body?: { data?: string }; parts?: unknown[] }>;
  }, acc: { html: string | null; text: string | null } = { html: null, text: null }) => {
    if (!part) return acc;
    const mt = part.mimeType ?? "";
    const raw = part.body?.data;
    if (raw) {
      // Gmail base64url
      const decoded = Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
      if (mt === "text/html" && !acc.html) acc.html = decoded;
      else if (mt === "text/plain" && !acc.text) acc.text = decoded;
    }
    if (part.parts) {
      for (const p of part.parts) {
        // Recursive cast — typing is loose since Gmail MIME tree is heterogeneous.
        walk(p as typeof part, acc);
      }
    }
    return acc;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = walk(msg.payload as any);

  return {
    id: msg.id,
    threadId: msg.threadId,
    from: headerOf(msg.payload?.headers, "From"),
    to: headerOf(msg.payload?.headers, "To"),
    subject: headerOf(msg.payload?.headers, "Subject") || "(bez predmetu)",
    date: msg.internalDate
      ? new Date(Number(msg.internalDate)).toISOString()
      : new Date().toISOString(),
    html: body.html,
    text: body.text,
    snippet: msg.snippet ?? "",
  };
}

/** Mark a Gmail message as read by removing the UNREAD label. */
export async function markGmailRead(accessToken: string, id: string): Promise<void> {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
    },
  );
  if (!res.ok) throw new Error(`gmail modify failed: ${res.status}`);
}

/** List every calendar the user can read (primary + secondary + shared).
 *  Returns id, summary, primary flag, color — UI uses color to tint
 *  events and `primary` to highlight the main one. */
export async function listGoogleCalendars(
  accessToken: string,
): Promise<Array<{ id: string; summary: string; primary: boolean; backgroundColor?: string }>> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`calendarList failed: ${res.status}`);
  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      summaryOverride?: string;
      primary?: boolean;
      backgroundColor?: string;
      selected?: boolean;
    }>;
  };
  return (data.items ?? [])
    .filter((c) => c.selected !== false) // respect Google's "hidden" toggle
    .map((c) => ({
      id: c.id,
      summary: c.summaryOverride || c.summary || c.id,
      primary: !!c.primary,
      backgroundColor: c.backgroundColor,
    }));
}

/** Send a plain-text email via the authenticated user's Gmail account.
 *  Returns the created message id. */
export async function sendGmail(
  accessToken: string,
  opts: { to: string; subject: string; body: string; fromName?: string },
): Promise<{ id: string; threadId: string }> {
  const headerLines = [
    `To: ${opts.to}`,
    `Subject: ${encodeSubject(opts.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
  ];
  const raw = `${headerLines.join("\r\n")}\r\n\r\n${opts.body}`;
  const rawB64 = Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: rawB64 }),
    },
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`gmail send failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as { id: string; threadId: string };
}

/** RFC 2047 B-encoding for non-ASCII subjects so Gmail doesn't mangle
 *  diakritics like "Vďaka za schôdzu". */
function encodeSubject(s: string): string {
  if (/^[\x20-\x7e]*$/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, "utf-8").toString("base64")}?=`;
}

// ── Calendar helpers ─────────────────────────────────────────────
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string; // ISO
  end: string; // ISO
  htmlLink?: string;
  attendees?: { email: string; displayName?: string }[];
  location?: string;
  allDay: boolean;
  // Calendar metadata — set when the event comes from a named
  // calendar (not just "primary"). UI uses color to tint the pill.
  calendarId?: string;
  calendarName?: string;
  calendarColor?: string;
}

interface GCalApiEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { email: string; displayName?: string }[];
  status?: string;
}

export async function listCalendarEvents(
  accessToken: string,
  opts: {
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
    /** Explicit calendar IDs; omit to auto-fetch all visible calendars. */
    calendarIds?: string[];
  } = {},
): Promise<GoogleCalendarEvent[]> {
  // Decide which calendars to scan. Previously we only hit "primary",
  // which missed the user's work / shared / subscribed calendars —
  // owner called this out as a regression.
  let calendars: Array<{ id: string; summary: string; backgroundColor?: string }>;
  if (opts.calendarIds && opts.calendarIds.length > 0) {
    calendars = opts.calendarIds.map((id) => ({ id, summary: id }));
  } else {
    try {
      calendars = await listGoogleCalendars(accessToken);
    } catch {
      // Fallback to primary if the list call fails (scope issue etc.)
      calendars = [{ id: "primary", summary: "Primary" }];
    }
  }

  const perCal = Math.max(20, Math.ceil((opts.maxResults ?? 100) / Math.max(1, calendars.length)));
  const timeMin = (opts.timeMin ?? new Date()).toISOString();
  const timeMax = opts.timeMax?.toISOString();

  const results = await Promise.all(
    calendars.map(async (cal) => {
      const params = new URLSearchParams({
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: String(perCal),
        timeMin,
        ...(timeMax ? { timeMax } : {}),
      });
      try {
        const res = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${params}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!res.ok) return [];
        const json = (await res.json()) as { items?: GCalApiEvent[] };
        return (json.items ?? [])
          .filter((e) => e.status !== "cancelled")
          .map<GoogleCalendarEvent>((e) => ({
            id: `${cal.id}::${e.id}`,
            summary: e.summary ?? "(bez názvu)",
            description: e.description,
            location: e.location,
            htmlLink: e.htmlLink,
            attendees: e.attendees,
            start: e.start?.dateTime ?? e.start?.date ?? "",
            end: e.end?.dateTime ?? e.end?.date ?? "",
            allDay: Boolean(e.start?.date && !e.start?.dateTime),
            calendarId: cal.id,
            calendarName: cal.summary,
            calendarColor: cal.backgroundColor,
          }));
      } catch {
        return [];
      }
    }),
  );

  // Merge + sort by start — client may want everything chronological.
  const all = results.flat();
  all.sort((a, b) => (a.start || "").localeCompare(b.start || ""));
  return all;
}

/** Disconnect — revoke tokens on Google side (best effort) and remove row. */
export async function disconnectGoogle(userId: string): Promise<void> {
  const integ = await prisma.googleIntegration.findUnique({ where: { userId } });
  if (!integ) return;
  // Best-effort revocation — if it fails (token already invalid) we still
  // delete the DB row. User intent is "disconnect", not "ensure revoked".
  try {
    await fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(integ.refreshToken)}`,
      { method: "POST" },
    );
  } catch (e) {
    console.warn("[google:revoke] failed", e);
  }
  await prisma.googleIntegration.delete({ where: { userId } });
}

export type { GoogleIntegration };
