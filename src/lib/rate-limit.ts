// src/lib/rate-limit.ts
// Persistent rate-limiter backed by Postgres (`RateLimitHit` tabuľka).
//
// Prečo Postgres a nie Redis: zachovávame "no-third-party" filozofiu projektu.
// Jedna dedikovaná DB + jeden indexovaný select + insert na hit je lacnejšie
// ako nasadiť Redis a udržiavať ho. Pri >100 req/s by som uvažoval o Redis,
// zatiaľ to ani s Claude hatersama nepríde.
//
// Mechanika:
//  1. SELECT COUNT(*) WHERE key=? AND createdAt >= now() - windowMs
//  2. Ak count >= max → 429
//  3. Inak INSERT nový hit
//  4. 1% chance lazy cleanup starších ako 1h (= drží tabuľku malú, žiadny cron)
//
// Fail-open: Ak DB zlyhá, POVOLÍME request (lepšie ako zablokovať celú app).
// Zalogujeme warning — dá sa vidieť v serveri aj v /admin/errors cez
// instrumentation onRequestError, ak to zhodí route handler.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const CLEANUP_PROBABILITY = 0.01; // 1%
const CLEANUP_MAX_AGE_MS = 60 * 60 * 1000; // 1h

function getIp(req: NextRequest | Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Vráti 429 response ak limit prekročený, inak null.
 * Kľúč = `${prefix}:${ip}`.
 */
export async function rateLimit(
  req: NextRequest | Request,
  config: RateLimitConfig,
  prefix: string,
): Promise<NextResponse | null> {
  const ip = getIp(req);
  const key = `${prefix}:${ip}`;
  const windowStart = new Date(Date.now() - config.windowMs);

  try {
    const count = await prisma.rateLimitHit.count({
      where: { key, createdAt: { gte: windowStart } },
    });

    if (count >= config.maxRequests) {
      // Najstarší hit v okne určuje reset time.
      const oldest = await prisma.rateLimitHit.findFirst({
        where: { key, createdAt: { gte: windowStart } },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      });
      const resetAt = oldest
        ? oldest.createdAt.getTime() + config.windowMs
        : Date.now() + config.windowMs;
      const retryAfterSec = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

      return NextResponse.json(
        { error: "Príliš veľa pokusov. Skúste to neskôr." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSec),
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(resetAt),
          },
        },
      );
    }

    // Zaznamenaj hit. Fire-and-forget je lákavé, ale bez čakania by
    // rýchlejšie requesty dokázali prelomiť limit (race). Tak aspoň await.
    await prisma.rateLimitHit.create({ data: { key } });

    // Lazy cleanup — občasné zametanie staršej histórie.
    if (Math.random() < CLEANUP_PROBABILITY) {
      prisma.rateLimitHit
        .deleteMany({
          where: { createdAt: { lt: new Date(Date.now() - CLEANUP_MAX_AGE_MS) } },
        })
        .catch((e) => {
          console.warn("[rate-limit] cleanup failed:", e);
        });
    }

    return null;
  } catch (e) {
    // Fail-open — DB outage nesmie zhodiť celú app.
    console.warn("[rate-limit] DB error, failing open:", e);
    return null;
  }
}
