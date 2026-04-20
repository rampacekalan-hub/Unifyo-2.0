// src/app/api/notifications/route.ts
// In-app notification center — list + delete.
// requireAuth handles CSRF + session check; mutations are same-origin only.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    // Unread first, then newest — two orderBy clauses preserve that order.
    const rows = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        href: true,
        read: true,
        createdAt: true,
        readAt: true,
      },
    });
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const { id } = (await req.json().catch(() => ({}))) as { id?: string };
    if (!id) return NextResponse.json({ error: "Chýba id" }, { status: 400 });
    await prisma.notification.deleteMany({
      where: { id, userId: session.userId },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
