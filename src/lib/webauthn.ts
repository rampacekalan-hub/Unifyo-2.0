// src/lib/webauthn.ts
// WebAuthn / passkey configuration and helpers. Two bits of shared
// state across the flow:
//   1. RP (relying party) identity — derived from APP_URL so the same
//      code works locally and on unifyo.online.
//   2. Challenge round-trip — stashed in a short-lived httpOnly cookie
//      so register/verify and auth-options/auth-verify don't need a
//      server-side store. Cookies are scoped to the challenge flow,
//      cleared after use, and expire in 5 minutes regardless.
//
// We intentionally keep challenges opaque (just the random string from
// @simplewebauthn) rather than wrapping them in a JWT — the cookie is
// same-site strict, httpOnly, short-lived. A tampered value just fails
// verification, which is the correct outcome.

import { cookies } from "next/headers";

const DEFAULT_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";

export function getRpConfig(): { rpID: string; rpName: string; origin: string } {
  let origin: string;
  try {
    const u = new URL(DEFAULT_APP_URL);
    origin = u.origin;
    const rpID = u.hostname; // e.g. "unifyo.online" or "localhost"
    return { rpID, rpName: "Unifyo", origin };
  } catch {
    origin = "http://localhost:3000";
    return { rpID: "localhost", rpName: "Unifyo", origin };
  }
}

// Cookie names are flow-specific so a stale registration challenge can
// never satisfy an authentication verify (or vice versa).
export const CHALLENGE_COOKIE_REGISTER = "unifyo_wa_reg";
export const CHALLENGE_COOKIE_AUTH = "unifyo_wa_auth";

export async function setChallengeCookie(name: string, challenge: string): Promise<void> {
  const jar = await cookies();
  jar.set(name, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 300, // 5 min — WebAuthn UI rarely takes more
  });
}

export async function readChallengeCookie(name: string): Promise<string | null> {
  const jar = await cookies();
  return jar.get(name)?.value ?? null;
}

export async function clearChallengeCookie(name: string): Promise<void> {
  const jar = await cookies();
  jar.delete(name);
}

// ── Base64url helpers ─────────────────────────────────────────────────
// Browser WebAuthn API uses base64url for every binary blob on the wire.
// We store `publicKey` as raw bytes (Prisma `Bytes` → Buffer) but
// `credentialId` as base64url string since that's how it comes in and
// goes out — avoids per-request decode/encode.
export function bytesToBase64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}
export function base64urlToBytes(b64u: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64u, "base64url"));
}
