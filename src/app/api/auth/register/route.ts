// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { requireSameOrigin } from "@/lib/csrf";
import { getSiteConfig } from "@/config/site-settings";
import { issueToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

const { security } = getSiteConfig();

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  // Rate limiting
  const limited = await rateLimit(req, security.rateLimit.auth, "register");
  if (limited) return limited;

  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Neplatné údaje" },
        { status: 400 }
      );
    }

    const { email, password, name } = result.data;

    // Kontrola existujúceho usera
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Účet s týmto e-mailom už existuje" },
        { status: 409 }
      );
    }

    // Hash hesla
    const hashed = await bcrypt.hash(password, security.bcryptRounds);

    // Vytvorenie usera
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name: name ?? null,
        role: "USER",
        membershipTier: "BASIC",
      },
      select: { id: true, email: true, name: true, role: true, membershipTier: true },
    });

    // Nastavenie session — new users start at tokenVersion 0.
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      membershipTier: user.membershipTier,
      tv: 0,
    });

    // Fire off verification email — don't block signup on Resend latency.
    // Errors are logged; user can resend from Settings if it never arrived.
    try {
      const { raw } = await issueToken(user.id, "email_verify");
      sendVerificationEmail(user.email, raw).catch((e) =>
        console.error("[register] verify send failed:", e),
      );
    } catch (e) {
      console.error("[register] verify token failed:", e);
    }

    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error("[REGISTER]", err);
    return NextResponse.json(
      { error: "Registrácia zlyhala. Skúste to neskôr." },
      { status: 500 }
    );
  }
}
