// src/lib/share.ts
// Helpers for public read-only share links. Token is derived from 16
// random bytes encoded as base64url (22 chars after stripping padding).

import { getSiteConfig } from "@/config/site-settings";

export type ShareResourceType = "task" | "contact";

export function isShareResourceType(v: unknown): v is ShareResourceType {
  return v === "task" || v === "contact";
}

// Generate URL-safe token using Web Crypto (works in edge + node).
export function generateShareToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // Base64 → base64url, strip padding. 16 bytes → 22 chars.
  let b64: string;
  if (typeof Buffer !== "undefined") {
    b64 = Buffer.from(bytes).toString("base64");
  } else {
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    b64 = btoa(s);
  }
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function shareUrl(token: string): string {
  const base = getSiteConfig().url.replace(/\/$/, "");
  return `${base}/s/${token}`;
}

// State discriminator — used by public page and GET /api/s/:token.
export type ShareState = "active" | "revoked" | "expired";

export function shareLinkState(link: {
  revokedAt: Date | null;
  expiresAt: Date | null;
}): ShareState {
  if (link.revokedAt) return "revoked";
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return "expired";
  return "active";
}
