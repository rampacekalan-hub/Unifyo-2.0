import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, config.security.rateLimit.auth, "login");
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, password: true, role: true } });
    if (!user) {
      return NextResponse.json(
        { error: "Nesprávny e-mail alebo heslo" },
        { status: 401 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log(`[SECURITY_AUDIT] LOGIN_FAILED | ip=${ip} | email=${email} | reason=wrong_password | ts=${new Date().toISOString()}`);
      return NextResponse.json(
        { error: "Nesprávny e-mail alebo heslo" },
        { status: 401 }
      );
    }

    await createSession({ userId: user.id, email: user.email, role: user.role });

    console.log(`[SECURITY_AUDIT] LOGIN_SUCCESS | ip=${ip} | userId=${user.id} | email=${user.email} | role=${user.role} | ts=${new Date().toISOString()}`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[LOGIN]", error);
    const msg = error instanceof Error ? error.message : "";
    const isDbError =
      msg.includes("connect") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("P1001") ||
      msg.includes("P1002") ||
      msg.includes("P1008");
    return NextResponse.json(
      { error: isDbError
          ? "Databázové systémy sú dočasne offline. Skúste to neskôr."
          : "Nastala chyba servera. Skúste to znova neskôr." },
      { status: 500 }
    );
  }
}
