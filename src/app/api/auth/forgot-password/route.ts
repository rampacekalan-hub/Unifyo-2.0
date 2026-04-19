// src/app/api/auth/forgot-password/route.ts
// Starts the password-reset flow. ALWAYS returns 200 regardless of whether
// the email exists — otherwise an attacker can enumerate registered users
// by watching for different response codes or timings.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireSameOrigin } from "@/lib/csrf";
import { getSiteConfig } from "@/config/site-settings";
import { issueToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";

const { security } = getSiteConfig();

const schema = z.object({
  email: z.string().email().max(254),
});

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  // Tight rate limit — this is a heavy endpoint (DB + external email).
  const limited = await rateLimit(req, security.rateLimit.auth, "forgot-password");
  if (limited) return limited;

  const GENERIC_OK = NextResponse.json({
    ok: true,
    message: "Ak taký účet existuje, poslali sme email s inštrukciami.",
  });

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return GENERIC_OK; // don't leak validation hint

    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // Fire-and-forget email so the response time is identical whether or
    // not the account exists. We still await the token insert to keep the
    // race window narrow, but the email send is background.
    if (user) {
      try {
        const { raw } = await issueToken(user.id, "password_reset");
        // Don't await — keep timing uniform. Errors logged inside.
        sendPasswordResetEmail(user.email, raw).catch((e) =>
          console.error("[forgot-password] send failed:", e),
        );
      } catch (e) {
        console.error("[forgot-password] issue failed:", e);
      }
    }

    return GENERIC_OK;
  } catch (e) {
    console.error("[forgot-password]", e);
    return GENERIC_OK; // still don't leak
  }
}
