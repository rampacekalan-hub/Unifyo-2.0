// src/lib/crypto-kv.ts
// Minimal symmetric encryption for storing third-party credentials
// (currently: Apple iCloud app-specific passwords). AES-256-GCM with
// the key from APP_ENCRYPTION_KEY — a 32-byte value, base64 or hex.
//
// Format on disk: "v1:<ivHex>:<tagHex>:<cipherHex>". The leading "v1:"
// makes future rotation cheap — just check the prefix on decrypt.

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

function getKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "APP_ENCRYPTION_KEY is not set — required to encrypt integration secrets.",
    );
  }
  // Accept base64, hex, or any length — we hash into a 32-byte key
  // so operators don't have to pick a perfectly-sized value.
  return createHash("sha256").update(raw, "utf8").digest();
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Malformed encrypted payload");
  }
  const key = getKey();
  const iv = Buffer.from(parts[1], "hex");
  const tag = Buffer.from(parts[2], "hex");
  const enc = Buffer.from(parts[3], "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString("utf8");
}
