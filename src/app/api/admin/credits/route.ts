import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction, publishSSE } from "@/lib/admin-store";
import { z } from "zod";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

const schema = z.object({
  userId: z.string().min(1),
  membershipTier: z.enum(["BASIC", "PREMIUM", "ENTERPRISE"]),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { userId, membershipTier } = parsed.data;

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!target) return NextResponse.json({ error: "Používateľ neexistuje" }, { status: 404 });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { membershipTier },
      select: { id: true, email: true },
    });

    const detail = `Tier zmenený: → ${membershipTier} pre ${target.email} (${target.name ?? "—"})`;
    const entry = logAdminAction(session.email, "TIER_UPDATE", detail);
    publishSSE("admin_log", entry);

    console.log(`[SECURITY_AUDIT] ADMIN_TIER | admin=${session.email} | userId=${userId} | ->${membershipTier} | ts=${new Date().toISOString()}`);

    void updated;
    return NextResponse.json({ success: true, membershipTier });
  } catch (error) {
    console.error("[ADMIN_TIER]", error);
    return NextResponse.json({ error: "Chyba servera" }, { status: 500 });
  }
}
