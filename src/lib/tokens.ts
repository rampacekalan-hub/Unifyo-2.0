// src/lib/tokens.ts
// Cryptographically-secure one-time tokens for password reset + email
// verification. We generate 32 random bytes, expose the base64url form
// to the user (in the email link), and store only its SHA-256 hash in
// the DB. A database leak therefore cannot hand out working tokens.

import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type TokenPurpose = "password_reset" | "email_verify";

const TTL_MINUTES: Record<TokenPurpose, number> = {
  password_reset: 60,        // 1 hour — user should act immediately
  email_verify: 60 * 24 * 7, // 7 days — less urgent
};

export interface IssuedToken {
  raw: string;
  expiresAt: Date;
}

export async function issueToken(
  userId: string,
  purpose: TokenPurpose,
): Promise<IssuedToken> {
  const raw = randomBytes(32).toString("base64url");
  const hash = hashToken(raw);
  const expiresAt = new Date(Date.now() + TTL_MINUTES[purpose] * 60_000);

  // Invalidate any previous unused tokens for this (user, purpose) so
  // only the newest link works. Prevents "which of the 5 emails is valid".
  await prisma.authToken.updateMany({
    where: { userId, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.authToken.create({
    data: { userId, tokenHash: hash, purpose, expiresAt },
  });

  return { raw, expiresAt };
}

/**
 * Verify a raw token. On success, returns the userId. Marks the token
 * used so it can't be replayed. Fails closed on any mismatch / expiry.
 */
export async function consumeToken(
  raw: string,
  purpose: TokenPurpose,
): Promise<string | null> {
  if (!raw || typeof raw !== "string" || raw.length < 16) return null;
  const hash = hashToken(raw);
  const row = await prisma.authToken.findUnique({ where: { tokenHash: hash } });
  if (!row) return null;
  if (row.purpose !== purpose) return null;
  if (row.usedAt) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;

  // Constant-time sanity check on the hash (defence in depth vs. any
  // future bug that might skip the unique-index lookup).
  const a = Buffer.from(hash);
  const b = Buffer.from(row.tokenHash);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  await prisma.authToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });
  return row.userId;
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
