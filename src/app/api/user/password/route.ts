// src/app/api/user/password/route.ts
// POST — change password. Verifies current password, enforces min length,
// updates hash, and bumps tokenVersion so every other session is
// invalidated on next requireAuth check. The current request's cookie
// is re-issued with the new tokenVersion so the user stays signed in here.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný vstup" }, { status: 400 });
  }

  const { currentPassword, newPassword } = (body ?? {}) as {
    currentPassword?: unknown;
    newPassword?: unknown;
  };

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return NextResponse.json({ error: "Chýbajú povinné polia" }, { status: 400 });
  }
  if (newPassword.length < 10) {
    return NextResponse.json(
      { error: "Nové heslo musí mať aspoň 10 znakov" },
      { status: 400 }
    );
  }
  if (newPassword.length > 200) {
    return NextResponse.json({ error: "Nové heslo je príliš dlhé" }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "Nové heslo musí byť iné ako súčasné" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, password: true, role: true, membershipTier: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Užívateľ neexistuje" }, { status: 404 });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Súčasné heslo je nesprávne" }, { status: 401 });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hash,
        tokenVersion: { increment: 1 },
      },
      select: { tokenVersion: true },
    });

    // Re-issue this device's cookie so the user isn't logged out here.
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      membershipTier: user.membershipTier,
      tv: updated.tokenVersion,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[USER/PASSWORD]", e);
    return NextResponse.json({ error: "Zmena hesla zlyhala" }, { status: 500 });
  }
}
