// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { requireSameOrigin } from "@/lib/csrf";
import { getSiteConfig } from "@/config/site-settings";

const { security } = getSiteConfig();

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  // Rate limiting
  const limited = await rateLimit(req, security.rateLimit.auth, "login");
  if (limited) return limited;

  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Neplatný e-mail alebo heslo" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Nájdi usera
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, membershipTier: true, password: true, tokenVersion: true },
    });

    // Konštantný čas — ochrana pred timing attack
    const dummyHash = "$2b$12$dummyhashfordummytimingprotection.padding";
    const passwordMatch = await bcrypt.compare(
      password,
      user?.password ?? dummyHash
    );

    // Audit: log failed attempt (if we know the user) before bailing.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    const ua = req.headers.get("user-agent") || null;

    if (!user || !passwordMatch) {
      if (user) {
        try {
          await prisma.loginEvent.create({
            data: { userId: user.id, ip, userAgent: ua, success: false },
          });
        } catch (e) { console.error("[LOGIN audit]", e); }
      }
      return NextResponse.json(
        { error: "Nesprávny e-mail alebo heslo" },
        { status: 401 }
      );
    }

    // Aktualizuj lastActiveAt + zaloguj úspešný login
    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      }),
      prisma.loginEvent.create({
        data: { userId: user.id, ip, userAgent: ua, success: true },
      }).catch((e) => console.error("[LOGIN audit]", e)),
    ]);

    // Nastavenie session — zahrň tokenVersion pre "Odhlásiť všade".
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      membershipTier: user.membershipTier,
      tv: user.tokenVersion,
    });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("[LOGIN]", err);
    return NextResponse.json(
      { error: "Prihlásenie zlyhalo. Skúste to neskôr." },
      { status: 500 }
    );
  }
}
