// src/lib/tz.ts
// Timezone helpers anchored to Europe/Bratislava.
//
// Why this exists: the obvious approach — `new Date(utc.toLocaleString("en-US",
// { timeZone: ... }))` — parses the re-formatted string through the JS engine's
// own local timezone, which silently corrupts the result when the server runs
// in a different zone. It also produces a ~1h gap twice a year during DST
// transitions. These helpers use `Intl.DateTimeFormat` directly (the only
// reliable zone-aware primitive in the runtime) and search for the correct
// UTC offset.

const BA = "Europe/Bratislava";

const YMD_FMT = new Intl.DateTimeFormat("sv-SE", {
  timeZone: BA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const YMD_HM_FMT = new Intl.DateTimeFormat("sv-SE", {
  timeZone: BA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Returns "YYYY-MM-DD" for the given instant in Europe/Bratislava. */
export function ymdInBratislava(d: Date = new Date()): string {
  // sv-SE formats as "YYYY-MM-DD" — safe to use directly.
  return YMD_FMT.format(d);
}

/**
 * UTC instant corresponding to 00:00 local time in Europe/Bratislava for the
 * given "YYYY-MM-DD". Handles CET (+01:00) and CEST (+02:00) correctly,
 * including DST transition days.
 */
export function startOfBratislavaDayUTC(ymd: string): Date {
  // Bratislava is always either +01:00 or +02:00. Try both and pick the one
  // whose wall-clock representation matches `ymd 00:00`.
  for (const offset of ["+01:00", "+02:00"] as const) {
    const candidate = new Date(`${ymd}T00:00:00${offset}`);
    if (Number.isNaN(candidate.getTime())) continue;
    const wall = YMD_HM_FMT.format(candidate); // "YYYY-MM-DD HH:MM"
    if (wall === `${ymd} 00:00`) return candidate;
  }
  // Spring-forward edge: 00:00 doesn't exist locally on the transition day
  // (clocks jump 02:00 → 03:00, not 00:00 → 01:00, so this branch is
  // essentially unreachable for Bratislava — but return a sane fallback).
  return new Date(`${ymd}T00:00:00+01:00`);
}

/** Adds N calendar days to a "YYYY-MM-DD" string, still in Bratislava terms. */
export function addDaysYmd(ymd: string, days: number): string {
  // Anchor at noon UTC to avoid any DST boundary landing on the result.
  const anchor = new Date(`${ymd}T12:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return ymdInBratislava(anchor);
}
