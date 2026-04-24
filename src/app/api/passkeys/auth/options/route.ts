// src/app/api/passkeys/auth/options/route.ts
// Phase 1 of passwordless login. No session yet — anyone can call this.
// We return generic authentication options with an empty allowCredentials
// list so the browser uses *discoverable* credentials: the user picks an
// account from the OS / password manager picker without typing an email.

import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import {
  getRpConfig,
  setChallengeCookie,
  CHALLENGE_COOKIE_AUTH,
} from "@/lib/webauthn";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, { maxRequests: 10, windowMs: 60_000 }, "passkey-auth-options");
  if (rl) return rl;

  const { rpID } = getRpConfig();
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    // Empty → discoverable credential flow (passkey picker).
    allowCredentials: [],
  });
  await setChallengeCookie(CHALLENGE_COOKIE_AUTH, options.challenge);
  return NextResponse.json(options);
}
