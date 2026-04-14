import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, plan: true, credits: true },
  });

  if (!user) redirect("/login");

  return (
    <DashboardClient
      user={user}
      welcomeMessage={config.texts.dashboard.welcome}
      aiReadyMessage={config.texts.dashboard.aiReady}
    />
  );
}
