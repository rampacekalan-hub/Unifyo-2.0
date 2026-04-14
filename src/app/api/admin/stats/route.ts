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
    const [totalUsers, totalRequests, planCounts, recentRequests] = await Promise.all([
      prisma.user.count(),
      prisma.aiRequest.count(),
      prisma.user.groupBy({ by: ["plan"], _count: { plan: true } }),
      prisma.aiRequest.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true } } },
      }),
    ]);

    return NextResponse.json({ totalUsers, totalRequests, planCounts, recentRequests });
  } catch (error) {
    console.error("[ADMIN_STATS]", error);
    return NextResponse.json({ error: "Chyba pri načítaní štatistík" }, { status: 500 });
  }
}
