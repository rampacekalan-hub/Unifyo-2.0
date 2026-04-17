// src/app/api/user/sessions/logout-all/route.ts
// Increments User.tokenVersion — every outstanding JWT (including this
// request's own cookie) becomes invalid on next requireAuth check.
// We also clear this device's cookie so the UI reflects the logout.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { tokenVersion: { increment: 1 } },
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return res;
  } catch (e) {
    console.error("[LOGOUT_ALL]", e);
    return NextResponse.json({ error: "Zlyhalo" }, { status: 500 });
  }
}
