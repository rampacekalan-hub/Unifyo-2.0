// src/app/api/user/2fa/disable/route.ts
// POST — turn 2FA off. Always requires the user's password. If 2FA is
// already enabled, also requires a valid TOTP code or an unused backup
// code (which is then consumed). Clears secret + backup codes and bumps
// tokenVersion so any lingering 2FA-satisfied sessions are invalidated.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth, setSessionCookie } from "@/lib/auth";
import { verifyTotp, findBackupCodeMatch } from "@/lib/twofactor";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný vstup" }, { status: 400 });
  }
  const { password, code } = (body ?? {}) as {
    password?: unknown;
    code?: unknown;
  };
  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Zadaj heslo" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        membershipTier: true,
        twoFactorSecret: true,
        twoFactorEnabledAt: true,
        twoFactorBackupCodes: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "Užívateľ neexistuje" }, { status: 404 });
    }

    const passOk = await bcrypt.compare(password, user.password);
    if (!passOk) {
      return NextResponse.json({ error: "Nesprávne heslo" }, { status: 401 });
    }

    let newBackupCodes = user.twoFactorBackupCodes;

    if (user.twoFactorEnabledAt) {
      if (typeof code !== "string" || !code.trim()) {
        return NextResponse.json(
          { error: "Zadaj overovací alebo záložný kód" },
          { status: 400 }
        );
      }
      const trimmed = code.trim();
      let verified = false;
      if (user.twoFactorSecret && /^\d{6}$/.test(trimmed.replace(/\s+/g, ""))) {
        verified = verifyTotp(user.twoFactorSecret, trimmed, user.email);
      }
      if (!verified) {
        const match = findBackupCodeMatch(trimmed, user.twoFactorBackupCodes);
        if (match) {
          verified = true;
          newBackupCodes = user.twoFactorBackupCodes.filter((h) => h !== match);
        }
      }
      if (!verified) {
        return NextResponse.json({ error: "Nesprávny kód" }, { status: 401 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        twoFactorBackupCodes: [],
        tokenVersion: { increment: 1 },
      },
      select: { tokenVersion: true },
    });
    // Reference newBackupCodes so the compiler is satisfied; the value is
    // discarded because we clear all codes on disable.
    void newBackupCodes;

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      membershipTier: user.membershipTier,
      tv: updated.tokenVersion,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[2FA/DISABLE]", e);
    return NextResponse.json({ error: "Vypnutie zlyhalo" }, { status: 500 });
  }
}
