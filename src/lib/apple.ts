// src/lib/apple.ts
// Minimal CalDAV helpers for Apple iCloud. No OAuth — we authenticate
// with HTTP Basic using the user's Apple ID + an app-specific password
// they generate at https://appleid.apple.com/account/manage (section:
// "App-Specific Passwords"). Store the password AES-256-GCM encrypted.
//
// iCloud discovery sequence:
//   1) PROPFIND https://caldav.icloud.com/.well-known/caldav → 301 to
//      a per-user principal URL (e.g. /1234567890/principal/).
//   2) PROPFIND principal url → calendar-home-set (the root that lists
//      every calendar on the account).
// We cache both URLs on the DB row so subsequent requests skip discovery.

import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/crypto-kv";

const ICLOUD_WELL_KNOWN = "https://caldav.icloud.com/.well-known/caldav";

function basicAuthHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

// Parse an href out of the first match in the body. Good enough for
// the two PROPFIND responses we care about — we deliberately don't
// pull in a full XML parser for this.
function firstHref(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>\\s*<(?:\\w+:)?href>([^<]+)</(?:\\w+:)?href>`, "i");
  const m = xml.match(re);
  return m?.[1] ?? null;
}

export async function verifyAppleCredentials(appleId: string, password: string): Promise<{
  principalUrl: string;
  calendarHomeUrl: string;
}> {
  const auth = basicAuthHeader(appleId, password);

  // 1) .well-known/caldav → principal URL via `current-user-principal`.
  const principalBody = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal/></d:prop></d:propfind>`;
  const r1 = await fetch(ICLOUD_WELL_KNOWN, {
    method: "PROPFIND",
    headers: {
      Authorization: auth,
      "Content-Type": "application/xml; charset=utf-8",
      Depth: "0",
    },
    body: principalBody,
    redirect: "follow",
  });
  if (r1.status === 401 || r1.status === 403) {
    throw new Error("auth_failed");
  }
  if (!r1.ok) {
    throw new Error(`principal_lookup:${r1.status}`);
  }
  const xml1 = await r1.text();
  const principalHref = firstHref(xml1, "(?:\\w+:)?current-user-principal");
  if (!principalHref) throw new Error("no_principal");
  // Absolute URL (iCloud returns relative path on caldav.icloud.com).
  const principalUrl = principalHref.startsWith("http")
    ? principalHref
    : `https://caldav.icloud.com${principalHref}`;

  // 2) PROPFIND principal → calendar-home-set.
  const homeBody = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop><c:calendar-home-set/></d:prop>
</d:propfind>`;
  const r2 = await fetch(principalUrl, {
    method: "PROPFIND",
    headers: {
      Authorization: auth,
      "Content-Type": "application/xml; charset=utf-8",
      Depth: "0",
    },
    body: homeBody,
  });
  if (!r2.ok) throw new Error(`home_lookup:${r2.status}`);
  const xml2 = await r2.text();
  const homeHref = firstHref(xml2, "(?:\\w+:)?calendar-home-set");
  if (!homeHref) throw new Error("no_home");
  const calendarHomeUrl = homeHref.startsWith("http")
    ? homeHref
    : `https://caldav.icloud.com${homeHref}`;

  return { principalUrl, calendarHomeUrl };
}

// Minimal event projection used by the inbox/calendar UI. We don't
// try to parse VTIMEZONE — iCloud events always carry a DTSTART that
// is either a date or an ISO-ish datetime with TZID, good enough for
// surfacing in the month grid.
export interface AppleEvent {
  uid: string;
  summary: string;
  description?: string;
  start: string;   // "YYYY-MM-DD" for all-day, else "YYYY-MM-DDTHH:MM:SS"
  end: string;
  allDay: boolean;
  calendarName?: string;
  // Full CalDAV resource URL for this event — used by PUT (update) and
  // DELETE. Populated by listAppleEvents so the UI can pass it back.
  url?: string;
  // Original ICS payload — needed when we PUT a partial update so we
  // can preserve fields we don't model in AppleEvent (RRULE, attendees…).
  ics?: string;
}

function parseIcsBlocks(ics: string): Record<string, string>[] {
  // Pull out every VEVENT block and flatten line continuations
  // (iCal folds long lines with CRLF+SP). We return each event as a
  // key→value record, dropping parameters after the semicolon for
  // keys we don't need the TZID off of.
  const unfolded = ics.replace(/\r\n[ \t]/g, "");
  const out: Record<string, string>[] = [];
  const blocks = unfolded.split(/BEGIN:VEVENT/).slice(1);
  for (const b of blocks) {
    const end = b.indexOf("END:VEVENT");
    const body = end === -1 ? b : b.slice(0, end);
    const rec: Record<string, string> = {};
    for (const line of body.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const colon = line.indexOf(":");
      if (colon === -1) continue;
      const rawKey = line.slice(0, colon);
      const key = rawKey.split(";")[0].toUpperCase();
      const value = line.slice(colon + 1);
      if (key === "DTSTART" || key === "DTEND") {
        // Remember whether it was a VALUE=DATE (all-day)
        rec[key] = value;
        rec[`${key}_PARAMS`] = rawKey.slice(key.length);
      } else {
        rec[key] = value;
      }
    }
    out.push(rec);
  }
  return out;
}

function formatIcsDate(raw: string, params: string | undefined): { value: string; allDay: boolean } {
  const allDay = /VALUE=DATE/i.test(params ?? "") || /^\d{8}$/.test(raw);
  if (allDay) {
    const d = raw.match(/(\d{4})(\d{2})(\d{2})/);
    return { value: d ? `${d[1]}-${d[2]}-${d[3]}` : raw, allDay: true };
  }
  // 20260422T143000 or 20260422T143000Z
  const m = raw.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!m) return { value: raw, allDay: false };
  return {
    value: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`,
    allDay: false,
  };
}

async function listCalendars(row: {
  appleId: string; password: string; calendarHomeUrl: string;
}): Promise<{ url: string; name: string }[]> {
  const auth = basicAuthHeader(row.appleId, row.password);
  const body = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:displayname/>
    <d:resourcetype/>
    <c:supported-calendar-component-set/>
  </d:prop>
</d:propfind>`;
  const res = await fetch(row.calendarHomeUrl, {
    method: "PROPFIND",
    headers: {
      Authorization: auth,
      "Content-Type": "application/xml; charset=utf-8",
      Depth: "1",
    },
    body,
  });
  if (!res.ok) throw new Error(`list_calendars:${res.status}`);
  const xml = await res.text();
  const out: { url: string; name: string }[] = [];
  // Rough response split — one <response> per calendar.
  const chunks = xml.split(/<(?:\w+:)?response>/).slice(1);
  for (const c of chunks) {
    if (!/VEVENT/i.test(c)) continue; // skip non-event collections
    const href = firstHref(`<response>${c}`, "response");
    const nameMatch = c.match(/<(?:\w+:)?displayname[^>]*>([^<]*)<\/(?:\w+:)?displayname>/i);
    if (href) {
      const url = href.startsWith("http") ? href : `https://caldav.icloud.com${href}`;
      out.push({ url, name: nameMatch?.[1] ?? "iCloud" });
    }
  }
  return out;
}

// Fetch events between two ISO timestamps across every event-carrying
// calendar on the account. Returns a flat list projected to AppleEvent.
export async function listAppleEvents(userId: string, startIso: string, endIso: string): Promise<AppleEvent[]> {
  const row = await prisma.appleIntegration.findUnique({ where: { userId } });
  if (!row || !row.calendarHomeUrl) return [];
  const password = decryptSecret(row.passwordEnc);

  const calendars = await listCalendars({
    appleId: row.appleId, password, calendarHomeUrl: row.calendarHomeUrl,
  });

  // CalDAV time-range strings use the 20260422T000000Z basic format.
  const toCalDav = (iso: string) =>
    iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const reportBody = `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${toCalDav(startIso)}" end="${toCalDav(endIso)}"/>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;

  const events: AppleEvent[] = [];
  const auth = basicAuthHeader(row.appleId, password);

  for (const cal of calendars) {
    const res = await fetch(cal.url, {
      method: "REPORT",
      headers: {
        Authorization: auth,
        "Content-Type": "application/xml; charset=utf-8",
        Depth: "1",
      },
      body: reportBody,
    });
    if (!res.ok) continue;
    const xml = await res.text();
    // Walk per <response> so we keep href ↔ calendar-data paired —
    // we need the resource URL for later PUT/DELETE.
    const responseChunks = xml.split(/<(?:\w+:)?response>/).slice(1);
    for (const chunk of responseChunks) {
      const hrefMatch = chunk.match(/<(?:\w+:)?href>([^<]+)<\/(?:\w+:)?href>/i);
      const dataMatch = chunk.match(/<(?:\w+:)?calendar-data[^>]*>([\s\S]*?)<\/(?:\w+:)?calendar-data>/i);
      if (!hrefMatch || !dataMatch) continue;
      const href = hrefMatch[1];
      const url = href.startsWith("http") ? href : `https://caldav.icloud.com${href}`;
      const ics = dataMatch[1].trim().replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      for (const rec of parseIcsBlocks(ics)) {
        const uid = rec["UID"];
        const summary = rec["SUMMARY"] ?? "(bez názvu)";
        const dtStart = rec["DTSTART"];
        const dtEnd = rec["DTEND"] ?? dtStart;
        if (!uid || !dtStart) continue;
        const start = formatIcsDate(dtStart, rec["DTSTART_PARAMS"]);
        const end = formatIcsDate(dtEnd, rec["DTEND_PARAMS"]);
        events.push({
          uid,
          summary,
          description: rec["DESCRIPTION"],
          start: start.value,
          end: end.value,
          allDay: start.allDay,
          calendarName: cal.name,
          url,
          ics,
        });
      }
    }
  }
  return events;
}

// ── CalDAV mutations ─────────────────────────────────────────────────
// The unified /api/calendar/event/[id] route encodes Apple events with
// composite id "apple::<base64url(url)>". updateAppleEvent rebuilds the
// full ICS (preserving original fields) and PUTs it back; deleteAppleEvent
// just DELETEs the resource. iCloud requires the original ETag isn't
// strictly needed for a same-actor write here, so we omit If-Match.

/** PUT a modified ICS to its CalDAV resource URL. Caller passes the
 *  original ICS so we can swap the SUMMARY/DTSTART/DTEND/etc lines while
 *  preserving everything else (UID, RRULE, ORGANIZER, …). */
export async function updateAppleEvent(
  userId: string,
  eventUrl: string,
  patch: {
    summary?: string;
    description?: string;
    location?: string;
    start?: string; // ISO datetime or "YYYY-MM-DD"
    end?: string;
    allDay?: boolean;
  },
): Promise<void> {
  const row = await prisma.appleIntegration.findUnique({ where: { userId } });
  if (!row) throw new Error("not_connected");
  const password = decryptSecret(row.passwordEnc);
  const auth = basicAuthHeader(row.appleId, password);

  // Fetch current ICS so we have the latest payload to patch.
  const cur = await fetch(eventUrl, {
    method: "GET",
    headers: { Authorization: auth, Accept: "text/calendar" },
  });
  if (!cur.ok) throw new Error(`apple_get:${cur.status}`);
  let ics = await cur.text();

  // Helpers — splice or append a property inside the first VEVENT block.
  const setProp = (key: string, value: string) => {
    const re = new RegExp(`(^|\\n)${key}(?:;[^:\\n]*)?:[^\\n]*`, "i");
    if (re.test(ics)) {
      ics = ics.replace(re, `$1${key}:${value}`);
    } else {
      ics = ics.replace(/END:VEVENT/i, `${key}:${value}\r\nEND:VEVENT`);
    }
  };
  const fmtDateOnly = (iso: string) => iso.slice(0, 10).replace(/-/g, "");
  const fmtDateTime = (iso: string) => {
    // Convert "2026-04-25T15:30:00.000Z" → "20260425T153000Z" (UTC basic).
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      "T" +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      "Z"
    );
  };

  if (patch.summary !== undefined) setProp("SUMMARY", patch.summary);
  if (patch.description !== undefined) setProp("DESCRIPTION", patch.description.replace(/\n/g, "\\n"));
  if (patch.location !== undefined) setProp("LOCATION", patch.location);
  if (patch.start) {
    if (patch.allDay) {
      // VALUE=DATE form requires the ;VALUE=DATE param on the property name.
      ics = ics.replace(/(^|\n)DTSTART(?:;[^:\n]*)?:[^\n]*/i, `$1DTSTART;VALUE=DATE:${fmtDateOnly(patch.start)}`);
    } else {
      ics = ics.replace(/(^|\n)DTSTART(?:;[^:\n]*)?:[^\n]*/i, `$1DTSTART:${fmtDateTime(patch.start)}`);
    }
  }
  if (patch.end) {
    if (patch.allDay) {
      ics = ics.replace(/(^|\n)DTEND(?:;[^:\n]*)?:[^\n]*/i, `$1DTEND;VALUE=DATE:${fmtDateOnly(patch.end)}`);
    } else {
      ics = ics.replace(/(^|\n)DTEND(?:;[^:\n]*)?:[^\n]*/i, `$1DTEND:${fmtDateTime(patch.end)}`);
    }
  }

  // Bump LAST-MODIFIED so iCloud rebuilds its caches.
  setProp("LAST-MODIFIED", fmtDateTime(new Date().toISOString()));

  const put = await fetch(eventUrl, {
    method: "PUT",
    headers: {
      Authorization: auth,
      "Content-Type": "text/calendar; charset=utf-8",
    },
    body: ics,
  });
  if (!put.ok) throw new Error(`apple_put:${put.status}`);
}

/** DELETE an event by its CalDAV resource URL. */
export async function deleteAppleEvent(userId: string, eventUrl: string): Promise<void> {
  const row = await prisma.appleIntegration.findUnique({ where: { userId } });
  if (!row) throw new Error("not_connected");
  const password = decryptSecret(row.passwordEnc);
  const auth = basicAuthHeader(row.appleId, password);
  const res = await fetch(eventUrl, { method: "DELETE", headers: { Authorization: auth } });
  if (!res.ok && res.status !== 404) throw new Error(`apple_delete:${res.status}`);
}

export { encryptSecret };
