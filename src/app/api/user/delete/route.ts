// src/app/api/user/delete/route.ts
// Self-service account deletion. Deletes the user and cascades to all owned
// records (contacts, tasks, conversations, memory, policies) per Prisma schema
// `onDelete: Cascade` relations. Also clears the session cookie.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  try {
    // Safety net: never let an admin/superadmin delete themselves via this
    // endpoint — they must demote themselves first. Avoids accidental lockout.
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    if (user?.role === "SUPERADMIN" || user?.role === "ADMIN") {
      return NextResponse.json(
        { error: "Administrátorský účet nie je možné zmazať cez Settings. Kontaktuj tím." },
        { status: 403 },
      );
    }

    await prisma.user.delete({ where: { id: session.userId } });

    // Clear session cookie.
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return res;
  } catch (e) {
    console.error("[DELETE USER] failed:", e);
    return NextResponse.json({ error: "Mazanie zlyhalo" }, { status: 500 });
  }
}
