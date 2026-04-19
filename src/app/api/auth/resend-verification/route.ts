// src/app/api/auth/resend-verification/route.ts
// Authenticated — resends the verification email for the current user.
// Rate-limited to prevent mailbombing our own users or burning Resend quota.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getSiteConfig } from "@/config/site-settings";
import { issueToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

const { security } = getSiteConfig();

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, security.rateLimit.auth, "resend-verification");
  if (limited) return limited;

  const { session, response } = await requireAuth(req);
  if (response) return response;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, emailVerifiedAt: true },
    });
    if (!user) return NextResponse.json({ error: "Neznámy účet" }, { status: 404 });
    if (user.emailVerifiedAt) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    const { raw } = await issueToken(session.userId, "email_verify");
    await sendVerificationEmail(user.email, raw);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[resend-verification]", e);
    return NextResponse.json({ error: "Poslanie zlyhalo" }, { status: 500 });
  }
}
