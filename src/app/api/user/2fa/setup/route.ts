// src/app/api/user/2fa/setup/route.ts
// POST — generate a new TOTP secret for the current user and stash it as
// a PENDING secret (twoFactorSecret set, twoFactorEnabledAt still null).
// Returns the base32 secret, otpauth URL, and a ready-to-render QR as a
// data URL. The client must POST to /api/user/2fa/verify with a valid
// code to finish activation.

import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { generateSecret, otpauthUrl } from "@/lib/twofactor";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, twoFactorEnabledAt: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Užívateľ neexistuje" }, { status: 404 });
    }
    if (user.twoFactorEnabledAt) {
      return NextResponse.json(
        { error: "2FA je už aktívne. Najprv ho vypni." },
        { status: 409 }
      );
    }

    const { base32 } = generateSecret();
    const label = user.email;
    const url = otpauthUrl(base32, label);
    const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 240 });

    await prisma.user.update({
      where: { id: session.userId },
      data: { twoFactorSecret: base32 },
    });

    return NextResponse.json({
      secret: base32,
      otpauthUrl: url,
      qrDataUrl,
    });
  } catch (e) {
    console.error("[2FA/SETUP]", e);
    return NextResponse.json({ error: "Nepodarilo sa pripraviť 2FA" }, { status: 500 });
  }
}
