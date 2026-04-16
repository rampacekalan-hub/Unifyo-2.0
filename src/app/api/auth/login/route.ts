// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getSiteConfig } from "@/config/site-settings";

const { security } = getSiteConfig();

export async function POST(req: NextRequest) {
  // Rate limiting
  const limited = rateLimit(req, security.rateLimit.auth, "login");
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
      select: { id: true, email: true, name: true, role: true, membershipTier: true, password: true },
    });

    // Konštantný čas — ochrana pred timing attack
    const dummyHash = "$2b$12$dummyhashfordummytimingprotection.padding";
    const passwordMatch = await bcrypt.compare(
      password,
      user?.password ?? dummyHash
    );

    if (!user || !passwordMatch) {
      return NextResponse.json(
        { error: "Nesprávny e-mail alebo heslo" },
        { status: 401 }
      );
    }

    // Aktualizuj lastActiveAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    // Nastavenie session
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      membershipTier: user.membershipTier,
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
