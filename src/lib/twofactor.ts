// src/lib/twofactor.ts
// Helpers for TOTP 2FA: secret generation, code verification, backup codes.
// Uses `otpauth` (pure TS, no native deps). All secrets are base32.

import { Secret, TOTP } from "otpauth";
import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";

const ISSUER = "Unifyo";

// ── Secret generation ─────────────────────────────────────────
export function generateSecret(): { base32: string; secret: Secret } {
  const secret = new Secret({ size: 20 });
  return { base32: secret.base32, secret };
}

export function buildTotp(secretBase32: string, label: string): TOTP {
  return new TOTP({
    issuer: ISSUER,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
}

export function otpauthUrl(secretBase32: string, label: string): string {
  return buildTotp(secretBase32, label).toString();
}

// ── Code verification ─────────────────────────────────────────
// Accepts the current 30s window plus ±1 window to tolerate clock skew.
export function verifyTotp(secretBase32: string, code: string, label = "user"): boolean {
  const cleaned = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const totp = buildTotp(secretBase32, label);
  const delta = totp.validate({ token: cleaned, window: 1 });
  return delta !== null;
}

// ── Backup codes ──────────────────────────────────────────────
// Format: 8-char lowercase hex. We store SHA-256 hashes only; the raw
// codes are returned to the client exactly once after setup.
export function generateBackupCodes(count = 10): { codes: string[]; hashes: string[] } {
  const codes: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString("hex"); // 8 hex chars
    codes.push(raw);
    hashes.push(hashBackupCode(raw));
  }
  return { codes, hashes };
}

export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim().toLowerCase()).digest("hex");
}

// Returns the hash that matched, so the caller can remove it from the user's
// stored list. `null` if no match.
export function findBackupCodeMatch(code: string, hashes: string[]): string | null {
  const h = hashBackupCode(code);
  return hashes.includes(h) ? h : null;
}

// ── Challenge token (pre-2FA login) ───────────────────────────
// Short-lived JWT that proves the user already passed the password step.
// Redeemed at /api/auth/login/2fa.
const CHALLENGE_SECRET_RAW = process.env.JWT_SECRET ?? "unifyo-dev-secret-change-in-production-min-32-chars-xxxxx";
const CHALLENGE_SECRET = new TextEncoder().encode(CHALLENGE_SECRET_RAW);
const CHALLENGE_TTL_SECONDS = 5 * 60;

export async function createChallengeToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, typ: "2fa_challenge" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CHALLENGE_TTL_SECONDS}s`)
    .sign(CHALLENGE_SECRET);
}

export async function verifyChallengeToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, CHALLENGE_SECRET);
    if (payload.typ !== "2fa_challenge") return null;
    const sub = payload.sub;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}
