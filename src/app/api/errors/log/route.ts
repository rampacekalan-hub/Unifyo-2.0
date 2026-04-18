// src/app/api/errors/log/route.ts
// Endpoint pre client-side error ingest. Browser sem POST-uje z error.tsx,
// global-error.tsx a globálnych handlerov (window.onerror, unhandledrejection).
//
// Rate-limit: 10 errorov / IP / 1 min — na zastavenie spammerov aj buggy
// komponentov ktoré by inak v nekonečnej slučke zahltili DB.

import { NextResponse } from "next/server";
import { logError, type ErrorSource } from "@/lib/error-log";
import { getSession } from "@/lib/auth";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const MAX_BODY_BYTES = 32_000;
const hits = new Map<string, number[]>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) {
    hits.set(ip, arr);
    return false;
  }
  arr.push(now);
  hits.set(ip, arr);
  return true;
}

function getIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: Request) {
  const ip = getIp(req);
  if (!rateLimit(ip)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  // Explicit size cap — ochrana proti megabyte-size stack pseudo-chybám.
  const len = Number(req.headers.get("content-length") || "0");
  if (len > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "payload too large" }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const source = body.source === "edge" ? "edge" : "client";

  if (typeof body.message !== "string" || body.message.length === 0) {
    return NextResponse.json({ ok: false, error: "missing message" }, { status: 400 });
  }

  // Ak je user prihlásený, prilož identitu (pre rýchlejší support).
  const session = await getSession();

  await logError({
    source: source as ErrorSource,
    name: typeof body.name === "string" ? body.name : null,
    message: body.message,
    stack: typeof body.stack === "string" ? body.stack : null,
    url: typeof body.url === "string" ? body.url : req.headers.get("referer"),
    userAgent: req.headers.get("user-agent"),
    userId: session?.userId ?? null,
    userEmail: session?.email ?? null,
    digest: typeof body.digest === "string" ? body.digest : null,
    meta: typeof body.meta === "object" && body.meta !== null ? body.meta : undefined,
  });

  return NextResponse.json({ ok: true });
}
