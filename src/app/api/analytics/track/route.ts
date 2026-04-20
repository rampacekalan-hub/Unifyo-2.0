// src/app/api/analytics/track/route.ts
// Self-hosted event collector. Public endpoint (no auth required) — fire-and-forget
// from the client via `track()` in src/lib/analytics.ts.
//
// Bezpečnosť / GDPR:
//  • Whitelist názvov udalostí — neznáme mená idú do koša (zabraňuje spamu
//    aj náhodnej PII v payloads cez custom názvy).
//  • IP anonymizácia: posledný oktet nahradený 0 (1.2.3.4 → 1.2.3.0).
//  • Rate limit 60 req/min/IP — bráni floodu aj pri bug-loope na klientovi.
//  • userId linknutý iba ak je platná session, inak null.

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireSameOrigin } from "@/lib/csrf";
import { getSession } from "@/lib/auth";

const ALLOWED_EVENTS = new Set<string>([
  "signup",
  "login",
  "first_contact_added",
  "first_task_created",
  "first_ai_message",
  "ai_message_sent",
  "contact_created",
  "task_created",
  "task_completed",
  "csv_import_completed",
  "onboarding_dismissed",
  "onboarding_completed",
  "referral_shared",
  "waitlist_joined",
  "page_viewed",
]);

// Anonymize IP: strip last octet for IPv4, zero last 80 bits for IPv6.
function anonymizeIp(ip: string | null | undefined): string | null {
  if (!ip || ip === "unknown") return null;
  // IPv4?
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (v4) return `${v4[1]}.${v4[2]}.${v4[3]}.0`;
  // IPv6 — naive: keep first 3 hextets, zero the rest.
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 3).join(":")}::`;
  }
  return null;
}

function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const limited = await rateLimit(
    req,
    { maxRequests: 60, windowMs: 60 * 1000 },
    "analytics",
  );
  if (limited) return limited;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      name?: unknown;
      props?: unknown;
    };

    const name = typeof body.name === "string" ? body.name : "";
    if (!ALLOWED_EVENTS.has(name)) {
      return NextResponse.json(
        { ok: false, error: "Unknown event name" },
        { status: 400 },
      );
    }

    const props =
      body.props && typeof body.props === "object" && !Array.isArray(body.props)
        ? (body.props as Record<string, unknown>)
        : null;

    const session = await getSession();
    const ip = anonymizeIp(getClientIp(req));
    const userAgent = req.headers.get("user-agent")?.slice(0, 512) ?? null;

    await prisma.analyticsEvent.create({
      data: {
        userId: session?.userId ?? null,
        name,
        props: props ? (props as Prisma.InputJsonValue) : Prisma.JsonNull,
        ip,
        userAgent,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[analytics/track]", e);
    return NextResponse.json(
      { ok: false, error: "Track failed" },
      { status: 500 },
    );
  }
}
