// src/app/api/passkeys/auth/verify/route.ts
// Phase 2 of passwordless login. Browser posts the assertion; we look
// up the credential globally (passkeys are supposed to be unique), run
// @simplewebauthn verification, bump the counter, and issue a session
// cookie equivalent to what /api/auth/login sets. 2FA is *skipped* on
// passkey login on purpose — a hardware-bound credential + user
// verification already satisfies two factors.

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  getRpConfig,
  readChallengeCookie,
  clearChallengeCookie,
  CHALLENGE_COOKIE_AUTH,
} from "@/lib/webauthn";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, { maxRequests: 10, windowMs: 60_000 }, "passkey-auth-verify");
  if (rl) return rl;

  const challenge = await readChallengeCookie(CHALLENGE_COOKIE_AUTH);
  if (!challenge) {
    return NextResponse.json({ error: "challenge_missing" }, { status: 400 });
  }

  let body: { response?: { id?: string } & Record<string, unknown> };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const credentialId = body.response?.id;
  if (!credentialId || typeof credentialId !== "string") {
    await clearChallengeCookie(CHALLENGE_COOKIE_AUTH);
    return NextResponse.json({ error: "missing_credential_id" }, { status: 400 });
  }

  const passkey = await prisma.passkey.findUnique({
    where: { credentialId },
    include: {
      user: {
        select: {
          id: true, email: true, role: true, membershipTier: true, tokenVersion: true,
        },
      },
    },
  });
  if (!passkey) {
    await clearChallengeCookie(CHALLENGE_COOKIE_AUTH);
    return NextResponse.json({ error: "unknown_credential" }, { status: 401 });
  }

  const { rpID, origin } = getRpConfig();

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body.response as unknown as Parameters<typeof verifyAuthenticationResponse>[0]["response"],
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports
          ? (passkey.transports.split(",").filter(Boolean) as Parameters<
              typeof verifyAuthenticationResponse
            >[0]["credential"]["transports"])
          : undefined,
      },
    });
  } catch (e) {
    console.error("[passkey:auth:verify]", e);
    await clearChallengeCookie(CHALLENGE_COOKIE_AUTH);
    return NextResponse.json({ error: "verification_failed" }, { status: 401 });
  }

  if (!verification.verified) {
    await clearChallengeCookie(CHALLENGE_COOKIE_AUTH);
    return NextResponse.json({ error: "not_verified" }, { status: 401 });
  }

  // Persist new counter + usage timestamp. Platform authenticators
  // (iCloud, Google PM) report counter=0 forever — we still update
  // lastUsedAt so settings shows an accurate timeline.
  try {
    await prisma.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter ?? 0),
        lastUsedAt: new Date(),
      },
    });
  } catch (e) {
    // Non-fatal — log and continue. Session is still safe to issue.
    console.error("[passkey:auth:verify] counter update", e);
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const ua = req.headers.get("user-agent") || null;

  await Promise.all([
    prisma.user.update({
      where: { id: passkey.user.id },
      data: { lastActiveAt: new Date() },
    }),
    prisma.loginEvent
      .create({ data: { userId: passkey.user.id, ip, userAgent: ua, success: true } })
      .catch((e) => console.error("[passkey:auth:verify] audit", e)),
  ]);

  await setSessionCookie({
    userId: passkey.user.id,
    email: passkey.user.email,
    role: passkey.user.role,
    membershipTier: passkey.user.membershipTier,
    tv: passkey.user.tokenVersion,
  });
  await clearChallengeCookie(CHALLENGE_COOKIE_AUTH);

  return NextResponse.json({
    ok: true,
    user: { id: passkey.user.id, email: passkey.user.email, role: passkey.user.role },
  });
}
