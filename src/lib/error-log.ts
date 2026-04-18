// src/lib/error-log.ts
// Interný "Sentry-lite" — zápis chýb do DB + email notifikácia.
//
// Fingerprint = SHA-256 (16 hex) z normalizovaného mena + first stack frame.
// Tým groupujeme similar errors (napr. 500× "TypeError: x is undefined"
// z toho istého riadku = 1 skupina), aj keď sa líšia v detailoch.
//
// Email notification cooldown = 24h per fingerprint. Takže keď sa produkcia
// rozbije pre 500 userov, dostaneš 1 email, nie 500.

import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendErrorAlert } from "@/lib/email";

const NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_MESSAGE = 2000;
const MAX_STACK = 10_000;

export type ErrorSource = "client" | "server" | "edge";

export interface LogErrorInput {
  source: ErrorSource;
  name?: string | null;
  message: string;
  stack?: string | null;
  url?: string | null;
  userAgent?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  digest?: string | null;
  level?: "error" | "warn";
  meta?: unknown;
}

// Z "at Object.render (/app/.next/server/chunks/abc.js:1:12345)" vyberie
// len "/app/.next/server/chunks/abc.js:1:12345" — stable enough pre grouping.
function firstFrame(stack: string | null | undefined): string {
  if (!stack) return "";
  const lines = stack.split("\n");
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("Error") || line.startsWith(`${lines[0]}`)) continue;
    const m = line.match(/\(([^)]+)\)|at\s+(.+)/);
    if (m) return (m[1] || m[2] || "").trim();
  }
  return "";
}

// Normalizácia — strip UUID/cuid-like IDs, čísla, hexy. Týmto zabezpečíme že
// "User abc123 not found" a "User def456 not found" dostanú rovnaký fingerprint.
function normalize(s: string): string {
  return s
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "<uuid>")
    .replace(/\bc[a-z0-9]{24,}\b/gi, "<cuid>")
    .replace(/\b\d{4,}\b/g, "<num>")
    .replace(/0x[0-9a-f]+/gi, "<hex>")
    .slice(0, 300);
}

export function makeFingerprint(input: {
  name?: string | null;
  message: string;
  stack?: string | null;
}): string {
  const key = [
    input.name || "Error",
    normalize(input.message),
    firstFrame(input.stack).replace(/:\d+/g, ":<line>"), // strip exact line numbers too
  ].join("|");
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 16);
}

function clip(s: string | null | undefined, max: number): string | null {
  if (!s) return null;
  return s.length > max ? s.slice(0, max) + "…[truncated]" : s;
}

/**
 * Zaznamená chybu do DB a rozhodne, či treba poslať email.
 * Nikdy nehádže — ak logging zlyhá, log na console a pokračujeme (aby sa
 * failing error handler sám nestal ďalším errorom).
 */
export async function logError(input: LogErrorInput): Promise<void> {
  try {
    const message = clip(input.message, MAX_MESSAGE) || "(no message)";
    const stack = clip(input.stack, MAX_STACK);
    const fingerprint = makeFingerprint({
      name: input.name ?? null,
      message,
      stack,
    });

    // Je toto prvý výskyt v cooldown okne?
    const sinceIso = new Date(Date.now() - NOTIFY_COOLDOWN_MS);
    const recentNotified = await prisma.errorLog.findFirst({
      where: {
        fingerprint,
        notifiedAt: { gte: sinceIso },
      },
      select: { id: true },
    });
    const shouldNotify = !recentNotified;

    const row = await prisma.errorLog.create({
      data: {
        fingerprint,
        source: input.source,
        level: input.level ?? "error",
        name: input.name ?? null,
        message,
        stack,
        url: clip(input.url, 500),
        userAgent: clip(input.userAgent, 500),
        userId: input.userId ?? null,
        userEmail: input.userEmail ?? null,
        digest: input.digest ?? null,
        meta: (input.meta as object) ?? undefined,
        notifiedAt: shouldNotify ? new Date() : null,
      },
    });

    if (shouldNotify) {
      // Fire-and-forget — nepotrebujeme čakať, a ak email padne, nechceme
      // aby to zablokovalo error response zákazníkovi.
      sendErrorAlert({
        id: row.id,
        fingerprint,
        source: row.source,
        name: row.name,
        message: row.message,
        stack: row.stack,
        url: row.url,
        userEmail: row.userEmail,
        createdAt: row.createdAt,
      }).catch((e) => {
        console.error("[error-log] alert email failed:", e);
      });
    }
  } catch (e) {
    console.error("[error-log] failed to log:", e);
  }
}
