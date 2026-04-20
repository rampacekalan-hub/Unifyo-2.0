// src/app/api/auth/login/2fa/route.ts
// Second step of 2FA login. Consumes the short-lived challenge token
// issued by /api/auth/login, verifies a TOTP code OR a single-use backup
// code, and — on success — issues the normal session cookie.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { requireSameOrigin } from "@/lib/csrf";
import { getSiteConfig } from "@/config/site-settings";
import {
  verifyChallengeToken,
  verifyTotp,
  findBackupCodeMatch,
} from "@/lib/twofactor";

const { security } = getSiteConfig();

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const limited = await rateLimit(req, security.rateLimit.auth, "login-2fa");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný vstup" }, { status: 400 });
  }
  const { challengeToken, code } = (body ?? {}) as {
    challengeToken?: unknown;
    code?: unknown;
  };
  if (typeof challengeToken !== "string" || typeof code !== "string") {
    return NextResponse.json({ error: "Chýbajú polia" }, { status: 400 });
  }

  const userId = await verifyChallengeToken(challengeToken);
  if (!userId) {
    return NextResponse.json(
      { error: "Overovací token vypršal. Prihlás sa znova." },
      { status: 401 }
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const ua = req.headers.get("user-agent") || null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        membershipTier: true,
        tokenVersion: true,
        twoFactorSecret: true,
        twoFactorEnabledAt: true,
        twoFactorBackupCodes: true,
      },
    });
    if (!user || !user.twoFactorEnabledAt || !user.twoFactorSecret) {
      return NextResponse.json({ error: "2FA nie je aktívne" }, { status: 400 });
    }

    const trimmed = code.trim();
    let verified = false;
    let consumedBackupHash: string | null = null;

    if (/^\d{6}$/.test(trimmed.replace(/\s+/g, ""))) {
      verified = verifyTotp(user.twoFactorSecret, trimmed, user.email);
    }
    if (!verified) {
      const match = findBackupCodeMatch(trimmed, user.twoFactorBackupCodes);
      if (match) {
        verified = true;
        consumedBackupHash = match;
      }
    }

    if (!verified) {
      try {
        await prisma.loginEvent.create({
          data: { userId: user.id, ip, userAgent: ua, success: false },
        });
      } catch (e) { console.error("[LOGIN-2FA audit]", e); }
      return NextResponse.json({ error: "Nesprávny kód" }, { status: 401 });
    }

    // Persist backup code consumption + mark session active.
    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: {
          lastActiveAt: new Date(),
          ...(consumedBackupHash
            ? {
                twoFactorBackupCodes: user.twoFactorBackupCodes.filter(
                  (h) => h !== consumedBackupHash
                ),
              }
            : {}),
        },
      }),
      prisma.loginEvent.create({
        data: { userId: user.id, ip, userAgent: ua, success: true },
      }).catch((e) => console.error("[LOGIN-2FA audit]", e)),
    ]);

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
      backupCodeConsumed: Boolean(consumedBackupHash),
      backupCodesRemaining: consumedBackupHash
        ? user.twoFactorBackupCodes.length - 1
        : user.twoFactorBackupCodes.length,
    });
  } catch (e) {
    console.error("[LOGIN-2FA]", e);
    return NextResponse.json({ error: "Overenie zlyhalo" }, { status: 500 });
  }
}
