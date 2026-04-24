// src/app/api/passkeys/register/options/route.ts
// Phase 1 of passkey registration. User is already logged in — we ask
// the browser to create a new credential for them and return the WebAuthn
// PublicKeyCredentialCreationOptions. We stash the challenge in a
// short-lived cookie so verify can check it without a server-side store.

import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getRpConfig,
  setChallengeCookie,
  CHALLENGE_COOKIE_REGISTER,
  base64urlToBytes,
} from "@/lib/webauthn";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const { rpID, rpName } = getRpConfig();

  // Exclude keys already registered for this user so the browser doesn't
  // offer to overwrite them.
  const existing = await prisma.passkey.findMany({
    where: { userId: session.userId },
    select: { credentialId: true, transports: true },
  });

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(session.userId),
    userName: session.email,
    userDisplayName: session.email,
    attestationType: "none",
    // Resident (discoverable) credentials let the user pick an account
    // on the login screen without typing their email first.
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
    excludeCredentials: existing.map((p) => ({
      id: p.credentialId,
      transports: p.transports
        ? (p.transports.split(",").filter(Boolean) as AuthenticatorTransport[])
        : undefined,
    })),
  });

  await setChallengeCookie(CHALLENGE_COOKIE_REGISTER, options.challenge);
  return NextResponse.json(options);
}

// Unused, keeps TS happy when imported types differ.
type AuthenticatorTransport = "ble" | "cable" | "hybrid" | "internal" | "nfc" | "smart-card" | "usb";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _keepBytes = base64urlToBytes;
