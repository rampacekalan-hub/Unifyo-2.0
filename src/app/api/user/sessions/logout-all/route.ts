// src/app/api/user/sessions/logout-all/route.ts
// "Odhlásiť všade inde" — bump User.tokenVersion, then re-issue a fresh
// cookie for THIS device with the new tv so the current session stays
// alive while every other outstanding JWT fails on next requireAuth.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, COOKIE_NAME, createToken, SESSION_MAX_AGE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  try {
    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: { tokenVersion: { increment: 1 } },
      select: { tokenVersion: true },
    });

    // Re-issue THIS device's cookie with the bumped tv so we keep this
    // session alive. Every OTHER device's JWT still has the old tv and
    // will fail the requireAuth check on next request → effective logout.
    const freshToken = await createToken({
      userId: session.userId,
      email: session.email,
      role: session.role,
      membershipTier: session.membershipTier,
      tv: updated.tokenVersion,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, freshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("[LOGOUT_ALL]", e);
    return NextResponse.json({ error: "Zlyhalo" }, { status: 500 });
  }
}
