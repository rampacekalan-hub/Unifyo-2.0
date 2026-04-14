import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  if (session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        credits: true,
        createdAt: true,
        _count: { select: { aiRequests: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ users });
  } catch (error) {
    console.error("[ADMIN_USERS]", error);
    return NextResponse.json({ error: "Chyba pri načítaní používateľov" }, { status: 500 });
  }
}
