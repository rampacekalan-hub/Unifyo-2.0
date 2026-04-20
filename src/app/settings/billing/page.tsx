// src/app/settings/billing/page.tsx
// Plán a fakturácia — Server Component, loads plan from session/DB then
// hands off to a Client Component for the interactive pieces (waitlist
// CTA, copy-to-clipboard, etc.). No Stripe wired yet — just visuals.

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BillingClient from "./BillingClient";

export const metadata = {
  title: "Plán a fakturácia",
};

export default async function BillingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/settings/billing");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, plan: true, membershipTier: true },
  });

  return (
    <BillingClient
      plan={user?.plan ?? "basic"}
      tier={user?.membershipTier ?? "BASIC"}
      email={user?.email ?? ""}
    />
  );
}
