import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

const DEFAULT_CREDITS = config.ai.requestLimits.basic;
const DEFAULT_PLAN = "basic" as const;

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, config.security.rateLimit.auth, "register");
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Účet s týmto e-mailom už existuje" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name ?? null,
        plan: DEFAULT_PLAN,
        credits: DEFAULT_CREDITS,
      },
    });

    await createSession({ userId: user.id, email: user.email });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json(
      { error: "Nastala chyba servera. Skúste to znova neskôr." },
      { status: 500 }
    );
  }
}
