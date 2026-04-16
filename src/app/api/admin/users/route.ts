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
    const today = new Date().toISOString().slice(0, 10);
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        membershipTier: true,
        createdAt: true,
        _count: { select: { aiRequests: true } },
        dailyUsage: {
          where: { date: today },
          select: { count: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    type RawUser = typeof users[number];
    const mapped = (users as RawUser[]).map((row) => {
      const { dailyUsage, ...u } = row;
      return { ...u, todayUsage: dailyUsage[0]?.count ?? 0 };
    });

    return NextResponse.json({ users: mapped });
  } catch (error) {
    console.error("[ADMIN_USERS]", error);
    return NextResponse.json({ error: "Chyba pri načítaní používateľov" }, { status: 500 });
  }
}
