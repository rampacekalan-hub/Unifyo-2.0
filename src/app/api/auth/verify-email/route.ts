// src/app/api/auth/verify-email/route.ts
// POST with { token } — marks the associated user as verified.
// Returns generic errors so scanning a range of tokens doesn't reveal
// which userIds exist.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireSameOrigin } from "@/lib/csrf";
import { getSiteConfig } from "@/config/site-settings";
import { consumeToken } from "@/lib/tokens";

const { security } = getSiteConfig();
const schema = z.object({ token: z.string().min(16).max(200) });

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const limited = await rateLimit(req, security.rateLimit.auth, "verify-email");
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Odkaz je neplatný." },
        { status: 400 },
      );
    }

    const userId = await consumeToken(parsed.data.token, "email_verify");
    if (!userId) {
      return NextResponse.json(
        { error: "Odkaz je neplatný alebo expiroval." },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[verify-email]", e);
    return NextResponse.json({ error: "Nepodarilo sa." }, { status: 500 });
  }
}
