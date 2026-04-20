// src/lib/referral.ts
// Referral code helpers. Codes are 6-char base62 — ~57 billion combos,
// plenty for a solo-dev launch. On collision we retry up to a few times;
// if we still can't insert, the caller surfaces a 500.

import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { getSiteConfig } from "@/config/site-settings";

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generateReferralCode(length = 6): string {
  const buf = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
}

// Ensure the given user has a referralCode; return it. Handles the
// race where two concurrent requests try to assign the same code by
// retrying on unique-constraint violations.
export async function ensureReferralCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (!existing) throw new Error("User not found");
  if (existing.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    try {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
      return updated.referralCode!;
    } catch {
      // Unique collision on code — retry with a fresh one. If the user
      // already has one (concurrent request won the race), read & return.
      const again = await prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      });
      if (again?.referralCode) return again.referralCode;
    }
  }
  throw new Error("Could not allocate referral code");
}

export function referralShareUrl(code: string): string {
  const base = getSiteConfig().url.replace(/\/$/, "");
  return `${base}/register?ref=${code}`;
}
