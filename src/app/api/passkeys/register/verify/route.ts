// src/app/api/passkeys/register/verify/route.ts
// Phase 2 of registration. Browser POSTs the attestation response; we
// verify it against the challenge we put in the cookie, then persist
// the credential. We reject if the cookie is missing/expired.

import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getRpConfig,
  readChallengeCookie,
  clearChallengeCookie,
  CHALLENGE_COOKIE_REGISTER,
} from "@/lib/webauthn";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { session, response: authResp } = await requireAuth(req);
  if (authResp) return authResp;

  const { rpID, origin } = getRpConfig();
  const challenge = await readChallengeCookie(CHALLENGE_COOKIE_REGISTER);
  if (!challenge) {
    return NextResponse.json({ error: "challenge_missing" }, { status: 400 });
  }

  let body: { response?: unknown; deviceName?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.response) {
    return NextResponse.json({ error: "missing_response" }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      // Browser's RegistrationResponseJSON; SimpleWebAuthn keeps its own
      // type, we lean on it at runtime.
      response: body.response as Parameters<typeof verifyRegistrationResponse>[0]["response"],
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (e) {
    console.error("[passkey:register:verify]", e);
    await clearChallengeCookie(CHALLENGE_COOKIE_REGISTER);
    return NextResponse.json({ error: "verification_failed" }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    await clearChallengeCookie(CHALLENGE_COOKIE_REGISTER);
    return NextResponse.json({ error: "not_verified" }, { status: 400 });
  }

  const info = verification.registrationInfo;
  const { credential, credentialDeviceType, credentialBackedUp } = info;

  // `credential.id` is base64url. `credential.publicKey` is Uint8Array.
  // v13 renamed the fields — keep the destructuring defensive so a minor
  // bump doesn't break us silently.
  const credentialId: string = credential.id;
  const publicKey: Uint8Array = credential.publicKey;
  const counter: number = credential.counter ?? 0;
  const transports: string | null = credential.transports?.join(",") ?? null;

  const deviceName = (body.deviceName ?? "").toString().trim().slice(0, 60) || null;

  try {
    await prisma.passkey.create({
      data: {
        userId: session.userId,
        credentialId,
        publicKey: Buffer.from(publicKey),
        counter: BigInt(counter),
        transports,
        deviceName,
        backedUp: !!credentialBackedUp,
        deviceType: credentialDeviceType ?? null,
      },
    });
  } catch (e) {
    console.error("[passkey:register:verify] persist", e);
    await clearChallengeCookie(CHALLENGE_COOKIE_REGISTER);
    return NextResponse.json({ error: "persist_failed" }, { status: 500 });
  }

  await clearChallengeCookie(CHALLENGE_COOKIE_REGISTER);
  return NextResponse.json({ ok: true });
}
