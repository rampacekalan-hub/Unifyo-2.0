// src/app/api/auth/reset-password/route.ts
// Completes password reset: consumes the one-time token, hashes the new
// password, and increments tokenVersion to kick all existing sessions on
// other devices (if someone knew the old password, they're out now).

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireSameOrigin } from "@/lib/csrf";
import { getSiteConfig } from "@/config/site-settings";
import { consumeToken } from "@/lib/tokens";

const { security } = getSiteConfig();

const schema = z.object({
  token: z.string().min(16).max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const limited = await rateLimit(req, security.rateLimit.auth, "reset-password");
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Heslo musí mať aspoň 8 znakov." },
        { status: 400 },
      );
    }

    const userId = await consumeToken(parsed.data.token, "password_reset");
    if (!userId) {
      return NextResponse.json(
        { error: "Odkaz je neplatný alebo expiroval. Požiadaj o nový." },
        { status: 400 },
      );
    }

    const hash = await bcrypt.hash(parsed.data.password, security.bcryptRounds);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hash,
        // Kick every active session — reset means "I lost control, secure it".
        tokenVersion: { increment: 1 },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Heslo bolo zmenené. Môžeš sa prihlásiť.",
    });
  } catch (e) {
    console.error("[reset-password]", e);
    return NextResponse.json({ error: "Nepodarilo sa." }, { status: 500 });
  }
}
