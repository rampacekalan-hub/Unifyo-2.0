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

// ── Mail adapters (shape-compatible with lib/google Gmail helpers) ───
// These intentionally return the same TypeScript shapes as their Gmail
// equivalents so the unified /api/mail routes can hand back identical
// JSON regardless of provider — UI doesn't need provider awareness.

export interface OutlookMessageSummary {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  date: string; // ISO
  unread: boolean;
}

interface GraphMessage {
  id: string;
  conversationId?: string;
  subject?: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  isRead?: boolean;
  from?: { emailAddress?: { address?: string; name?: string } };
  toRecipients?: { emailAddress?: { address?: string; name?: string } }[];
  body?: { contentType?: "html" | "text"; content?: string };
}

function fmtAddr(a?: { address?: string; name?: string }): string {
  if (!a) return "";
  if (a.name && a.address) return `${a.name} <${a.address}>`;
  return a.address ?? a.name ?? "";
}

/** Map Gmail-style label names to Graph well-known folder names. */
function folderForLabel(label: "INBOX" | "SENT" | "DRAFT" | "STARRED" | "ALL"): string | null {
  switch (label) {
    case "INBOX": return "inbox";
    case "SENT": return "sentitems";
    case "DRAFT": return "drafts";
    case "STARRED": return null; // emulated below via $filter=flag
    case "ALL": return null;
  }
}

export async function listOutlookInbox(
  accessToken: string,
  opts: {
    maxResults?: number;
    q?: string;
    label?: "INBOX" | "SENT" | "DRAFT" | "STARRED" | "ALL";
  } = {},
): Promise<OutlookMessageSummary[]> {
  const label = opts.label ?? "INBOX";
  const folder = folderForLabel(label);
  const top = String(opts.maxResults ?? 20);

  // /me/mailFolders/{folder}/messages for INBOX/SENT/DRAFT, /me/messages for ALL+STARRED.
  const base = folder
    ? `${GRAPH_BASE}/me/mailFolders/${folder}/messages`
    : `${GRAPH_BASE}/me/messages`;

  const params = new URLSearchParams({
    $top: top,
    $select: "id,conversationId,subject,bodyPreview,receivedDateTime,isRead,from,toRecipients,flag",
    $orderby: "receivedDateTime desc",
  });
  if (opts.q) params.set("$search", `"${opts.q.replace(/"/g, '\\"')}"`);
  if (label === "STARRED") params.set("$filter", "flag/flagStatus eq 'flagged'");

  const url = `${base}?${params}`;
  // $search requires ConsistencyLevel: eventual — harmless when absent.
  const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
  if (opts.q) headers["ConsistencyLevel"] = "eventual";

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`outlook list failed: ${res.status}`);
  const data = (await res.json()) as { value?: GraphMessage[] };
  return (data.value ?? []).map((m) => ({
    id: m.id,
    threadId: m.conversationId ?? m.id,
    from: fmtAddr(m.from?.emailAddress),
    to: (m.toRecipients ?? []).map((r) => fmtAddr(r.emailAddress)).join(", "),
    subject: m.subject || "(bez predmetu)",
    snippet: m.bodyPreview ?? "",
    date: m.receivedDateTime ?? new Date().toISOString(),
    unread: m.isRead === false,
  }));
}

/** Fetch a single Outlook message — returns html OR text body. */
export async function getOutlookMessage(
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
    `${GRAPH_BASE}/me/messages/${encodeURIComponent(id)}?$select=id,conversationId,subject,bodyPreview,receivedDateTime,from,toRecipients,body`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`outlook get failed: ${res.status}`);
  const m = (await res.json()) as GraphMessage;
  const isHtml = m.body?.contentType === "html";
  return {
    id: m.id,
    threadId: m.conversationId ?? m.id,
    from: fmtAddr(m.from?.emailAddress),
    to: (m.toRecipients ?? []).map((r) => fmtAddr(r.emailAddress)).join(", "),
    subject: m.subject || "(bez predmetu)",
    date: m.receivedDateTime ?? new Date().toISOString(),
    html: isHtml ? (m.body?.content ?? null) : null,
    text: !isHtml ? (m.body?.content ?? null) : null,
    snippet: m.bodyPreview ?? "",
  };
}

/** Mark an Outlook message as read (mirrors markGmailRead). */
export async function markOutlookRead(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`${GRAPH_BASE}/me/messages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isRead: true }),
  });
  if (!res.ok) throw new Error(`outlook mark-read failed: ${res.status}`);
}

/** Send an email via Graph /me/sendMail. */
export async function sendOutlookMessage(
  accessToken: string,
  opts: { to: string; subject: string; body: string },
): Promise<void> {
  const res = await fetch(`${GRAPH_BASE}/me/sendMail`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: opts.subject,
        body: { contentType: "Text", content: opts.body },
        toRecipients: [{ emailAddress: { address: opts.to } }],
      },
      saveToSentItems: true,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`outlook send failed: ${res.status}:${err.slice(0, 200)}`);
  }
}

/** Save a draft. Graph creates the message in /me/messages with isDraft=true. */
export async function saveOutlookDraft(
  accessToken: string,
  opts: { to: string; subject: string; body: string },
): Promise<{ id: string }> {
  const res = await fetch(`${GRAPH_BASE}/me/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: opts.subject,
      body: { contentType: "Text", content: opts.body },
      toRecipients: [{ emailAddress: { address: opts.to } }],
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`outlook draft failed: ${res.status}:${err.slice(0, 200)}`);
  }
  const j = (await res.json()) as { id: string };
  return { id: j.id };
}

// ── Calendar adapter (shape-compatible with GoogleCalendarEvent) ─────

interface GraphEvent {
  id: string;
  subject?: string;
  bodyPreview?: string;
  webLink?: string;
  isAllDay?: boolean;
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  location?: { displayName?: string };
  attendees?: { emailAddress?: { address?: string; name?: string } }[];
}

export interface OutlookCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  htmlLink?: string;
  attendees?: { email: string; displayName?: string }[];
  location?: string;
  allDay: boolean;
  calendarId?: string;
  calendarName?: string;
  calendarColor?: string;
}

/** Create a new event on the user's default Outlook calendar. Mirrors
 *  the createCalendarEvent shape in lib/google so the unified route can
 *  pass the same body to either provider. */
export async function createOutlookEvent(
  accessToken: string,
  ev: {
    summary: string;
    description?: string;
    location?: string;
    start: string;
    end: string;
    allDay?: boolean;
  },
): Promise<{ id: string; htmlLink?: string }> {
  const body: Record<string, unknown> = {
    subject: ev.summary,
    isAllDay: !!ev.allDay,
    start: {
      dateTime: ev.allDay ? `${ev.start.slice(0, 10)}T00:00:00` : ev.start,
      timeZone: "UTC",
    },
    end: {
      dateTime: ev.allDay ? `${ev.end.slice(0, 10)}T00:00:00` : ev.end,
      timeZone: "UTC",
    },
    ...(ev.description ? { body: { contentType: "Text", content: ev.description } } : {}),
    ...(ev.location ? { location: { displayName: ev.location } } : {}),
  };
  const res = await fetch(`${GRAPH_BASE}/me/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`outlook event create failed: ${res.status} ${err.slice(0, 200)}`);
  }
  const j = (await res.json()) as { id: string; webLink?: string };
  return { id: j.id, htmlLink: j.webLink };
}

/** Update an Outlook calendar event. Patch shape mirrors updateCalendarEvent
 *  in lib/google so the unified /api/calendar/event/[id] route can pass
 *  the same body through regardless of provider. */
export async function updateOutlookEvent(
  accessToken: string,
  eventId: string,
  patch: {
    summary?: string;
    description?: string;
    location?: string;
    start?: string; // ISO datetime or "YYYY-MM-DD" for all-day
    end?: string;
    allDay?: boolean;
  },
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (patch.summary !== undefined) body.subject = patch.summary;
  if (patch.description !== undefined) body.body = { contentType: "Text", content: patch.description };
  if (patch.location !== undefined) body.location = { displayName: patch.location };
  if (patch.start) {
    body.start = patch.allDay
      ? { dateTime: `${patch.start.slice(0, 10)}T00:00:00`, timeZone: "UTC" }
      : { dateTime: patch.start, timeZone: "UTC" };
  }
  if (patch.end) {
    body.end = patch.allDay
      ? { dateTime: `${patch.end.slice(0, 10)}T00:00:00`, timeZone: "UTC" }
      : { dateTime: patch.end, timeZone: "UTC" };
  }
  if (patch.allDay !== undefined) body.isAllDay = patch.allDay;

  const res = await fetch(`${GRAPH_BASE}/me/events/${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`outlook event update failed: ${res.status} ${err.slice(0, 200)}`);
  }
}

/** Delete an Outlook calendar event. 204 = ok, 404 = already gone (treat as ok). */
export async function deleteOutlookEvent(accessToken: string, eventId: string): Promise<void> {
  const res = await fetch(`${GRAPH_BASE}/me/events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 404) {
    const err = await res.text().catch(() => "");
    throw new Error(`outlook event delete failed: ${res.status} ${err.slice(0, 200)}`);
  }
}

/** Read events from the user's primary Outlook calendar across a window. */
export async function listOutlookCalendarEvents(
  accessToken: string,
  opts: { timeMin?: Date; timeMax?: Date; maxResults?: number } = {},
): Promise<OutlookCalendarEvent[]> {
  const timeMin = (opts.timeMin ?? new Date()).toISOString();
  const timeMax = (opts.timeMax ?? new Date(Date.now() + 30 * 24 * 3600 * 1000)).toISOString();

  const params = new URLSearchParams({
    startDateTime: timeMin,
    endDateTime: timeMax,
    $top: String(opts.maxResults ?? 100),
    $orderby: "start/dateTime",
    $select: "id,subject,bodyPreview,webLink,isAllDay,start,end,location,attendees",
  });

  const res = await fetch(`${GRAPH_BASE}/me/calendarView?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // calendarView requires UTC time hint header for predictable results.
      Prefer: 'outlook.timezone="UTC"',
    },
  });
  if (!res.ok) throw new Error(`outlook calendar failed: ${res.status}`);
  const data = (await res.json()) as { value?: GraphEvent[] };
  return (data.value ?? []).map<OutlookCalendarEvent>((e) => ({
    id: e.id,
    summary: e.subject || "(bez názvu)",
    description: e.bodyPreview,
    start: e.start?.dateTime ? new Date(e.start.dateTime + "Z").toISOString() : "",
    end: e.end?.dateTime ? new Date(e.end.dateTime + "Z").toISOString() : "",
    htmlLink: e.webLink,
    location: e.location?.displayName,
    attendees: (e.attendees ?? [])
      .map((a) => a.emailAddress)
      .filter((x): x is { address?: string; name?: string } => !!x)
      .map((a) => ({ email: a.address ?? "", displayName: a.name })),
    allDay: !!e.isAllDay,
    calendarName: "Outlook",
  }));
}
