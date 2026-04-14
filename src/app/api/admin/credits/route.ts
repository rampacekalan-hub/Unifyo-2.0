import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminStore, logAdminAction, publishSSE } from "@/lib/admin-store";
import { z } from "zod";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

const schema = z.object({
  userId: z.string().min(1),
  delta: z.number().int().min(-10000).max(10000),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { userId, delta } = parsed.data;

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, credits: true },
    });
    if (!target) return NextResponse.json({ error: "Používateľ neexistuje" }, { status: 404 });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: delta } },
      select: { id: true, email: true, credits: true },
    });

    const sign = delta >= 0 ? "+" : "";
    const detail = `Credits ${sign}${delta} for ${target.email} (${target.name ?? "—"}) — new balance: ${updated.credits}`;
    const entry = logAdminAction(session.email, "CREDITS_UPDATE", detail);

    publishSSE("admin_log", entry);

    console.log(`[SECURITY_AUDIT] ADMIN_CREDITS | admin=${session.email} | userId=${userId} | delta=${sign}${delta} | newBalance=${updated.credits} | ts=${new Date().toISOString()}`);

    return NextResponse.json({ success: true, credits: updated.credits });
  } catch (error) {
    console.error("[ADMIN_CREDITS]", error);
    return NextResponse.json({ error: "Chyba servera" }, { status: 500 });
  }
}
