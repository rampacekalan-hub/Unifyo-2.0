import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getSession();

  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    notFound();
  }

  const [users, totalRequests, planCounts, recentRequests] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true, email: true, name: true,
        role: true, plan: true, credits: true, createdAt: true,
        _count: { select: { aiRequests: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
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
