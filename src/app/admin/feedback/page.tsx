// src/app/admin/feedback/page.tsx
// Admin-only view of everything sent via the FeedbackWidget. Newest
// first, filterable by status. Same two-layer auth gate as /admin.

import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FeedbackAdmin from "./FeedbackAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Feedback — Admin" };

export default async function AdminFeedbackPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    notFound();
  }
  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPERADMIN")) {
    notFound();
  }

  const items = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  const rows = items.map((f) => ({
    id: f.id,
    kind: f.kind,
    message: f.message,
    rating: f.rating,
    page: f.page,
    userAgent: f.userAgent,
    status: f.status,
    createdAt: f.createdAt.toISOString(),
    userEmail: f.user?.email ?? null,
    userName: f.user?.name ?? null,
  }));

  return <FeedbackAdmin initial={rows} />;
}
