// src/app/settings/billing/page.tsx
// Plán a fakturácia — Server Component. Loads plan + Stripe subscription
// state from DB and hands off to the Client Component for interactions
// (checkout redirect, portal redirect, success/cancel toast).

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BillingClient from "./BillingClient";

export const metadata = {
  title: "Plán a fakturácia",
};

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/settings/billing");
  }

  const [user, sub] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { email: true, plan: true, membershipTier: true },
    }),
    prisma.stripeSubscription.findUnique({
      where: { userId: session.userId },
      select: {
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        priceId: true,
        subscriptionId: true,
      },
    }),
  ]);

  return (
    <BillingClient
      plan={user?.plan ?? "basic"}
      tier={user?.membershipTier ?? "BASIC"}
      email={user?.email ?? ""}
      subscription={
        sub && sub.subscriptionId
          ? {
              status: sub.status,
              currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
              cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
              priceId: sub.priceId,
            }
          : null
      }
    />
  );
}
