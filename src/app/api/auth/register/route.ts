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
    // referralCode is an optional sibling field — not part of registerSchema
    // because the schema has a .refine() that makes .extend() awkward. Pull
    // it straight off the raw body and sanitise.
    const rawRef = typeof body?.referralCode === "string" ? body.referralCode.trim() : "";
    const referralCode = rawRef && rawRef.length <= 32 ? rawRef : null;

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

    // Seed a welcome notification for the bell center. Non-blocking — a
    // failed insert shouldn't break signup, so we log and continue.
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "welcome",
          title: "Vitaj v Unifyo 🎉",
          body: "Začni tým, že si pridáš prvý kontakt alebo napíš AI do chatu.",
          href: "/dashboard",
        },
      });
    } catch (e) {
      console.error("[register] welcome notification failed:", e);
    }

    // Referral crediting. An invalid/expired code must NEVER block signup —
    // we log and move on. If valid, we create the Referral row and drop a
    // notification on both sides.
    if (referralCode) {
      try {
        const referrer = await prisma.user.findUnique({
          where: { referralCode },
          select: { id: true },
        });
        if (!referrer) {
          console.warn("[register] referralCode not found:", referralCode);
        } else if (referrer.id === user.id) {
          // Impossible in practice (new id), but defensive.
          console.warn("[register] self-referral ignored");
        } else {
          await prisma.referral.create({
            data: {
              referrerId: referrer.id,
              referredUserId: user.id,
            },
          });
          try {
            await prisma.notification.createMany({
              data: [
                {
                  userId: referrer.id,
                  type: "referral",
                  title: "Niekto sa pridal cez tvoj odkaz 🎉",
                  body: "Keď spustíme Pro, dostanete obaja 30 dní zdarma.",
                  href: "/settings",
                },
                {
                  userId: user.id,
                  type: "referral",
                  title: "Vitaj — máš 30 dní Pro zdarma.",
                  body: "Pridal si sa cez odkaz od kolegu. Bonus aktivujeme pri spustení plateného plánu.",
                  href: "/settings/billing",
                },
              ],
            });
          } catch (e) {
            console.error("[register] referral notifications failed:", e);
          }
        }
      } catch (e) {
        console.error("[register] referral crediting failed:", e);
      }
    }

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
