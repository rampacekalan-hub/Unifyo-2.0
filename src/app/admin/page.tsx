import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getSession();

  // Layer 1: JWT presence + role claim
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    console.log(`[SECURITY_AUDIT] ADMIN_PAGE_DENIED | userId=${session?.userId ?? "anonymous"} | ts=${new Date().toISOString()}`);
    notFound();
  }

  // Layer 2: Live DB verification — role may have been revoked since token was issued
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true },
  });

  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPERADMIN")) {
    console.log(`[SECURITY_AUDIT] ADMIN_PAGE_DB_REVOKED | userId=${session.userId} | dbRole=${dbUser?.role ?? "not_found"} | ts=${new Date().toISOString()}`);
    notFound();
  }

  const today = new Date().toISOString().slice(0, 10);

  const rawUsers = await prisma.user.findMany({
    select: {
      id: true, email: true, name: true,
      role: true, plan: true, membershipTier: true, createdAt: true,
      _count: { select: { aiRequests: true } },
      dailyUsage: { where: { date: today }, select: { count: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  type RawUser = typeof rawUsers[number];
  const users = rawUsers.map((row: RawUser) => {
    const { dailyUsage, ...u } = row;
    return { ...u, todayUsage: dailyUsage[0]?.count ?? 0 };
  });

  const [totalRequests, planCounts, recentRequests] = await Promise.all([
    prisma.aiRequest.count(),
    prisma.user.groupBy({ by: ["plan"], _count: { plan: true } }),
    prisma.aiRequest.findMany({
      take: 30,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } } },
    }),
  ]);

  return (
    <AdminClient
      adminEmail={session.email}
      users={users}
      stats={{
        totalUsers: users.length,
        totalRequests,
        planCounts,
      }}
      recentRequests={recentRequests}
    />
  );
}
