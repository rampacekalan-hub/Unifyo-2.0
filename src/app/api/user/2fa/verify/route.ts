// src/app/api/user/2fa/verify/route.ts
// POST — finalize 2FA activation. Requires a valid TOTP code for the
// pending secret; on success flips twoFactorEnabledAt and generates 10
// single-use backup codes returned to the client exactly once.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { verifyTotp, generateBackupCodes } from "@/lib/twofactor";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný vstup" }, { status: 400 });
  }
  const { code } = (body ?? {}) as { code?: unknown };
  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "Zadaj 6-ciferný kód" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, twoFactorSecret: true, twoFactorEnabledAt: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Užívateľ neexistuje" }, { status: 404 });
    }
    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Najprv spusť nastavenie 2FA" },
        { status: 400 }
      );
    }
    if (user.twoFactorEnabledAt) {
      return NextResponse.json({ error: "2FA je už aktívne" }, { status: 409 });
    }

    const ok = verifyTotp(user.twoFactorSecret, code, user.email);
    if (!ok) {
      return NextResponse.json({ error: "Nesprávny kód" }, { status: 401 });
    }

    const { codes, hashes } = generateBackupCodes(10);
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        twoFactorEnabledAt: new Date(),
        twoFactorBackupCodes: hashes,
      },
    });

    return NextResponse.json({ ok: true, backupCodes: codes });
  } catch (e) {
    console.error("[2FA/VERIFY]", e);
    return NextResponse.json({ error: "Overenie zlyhalo" }, { status: 500 });
  }
}
