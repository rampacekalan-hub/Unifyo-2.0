// src/app/api/billing/portal/route.ts
// Redirects the user to Stripe's Customer Portal — where they can update
// card, view invoices, cancel subscription. Delegates all UI to Stripe.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured, stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Platby nie sú nakonfigurované" }, { status: 503 });
  }

  const sub = await prisma.stripeSubscription.findUnique({
    where: { userId: session.userId },
    select: { customerId: true },
  });
  if (!sub?.customerId) {
    return NextResponse.json({ error: "Žiadne predplatné — kúp si prvé" }, { status: 400 });
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://unifyo.online";

  try {
    const portal = await stripe().billingPortal.sessions.create({
      customer: sub.customerId,
      return_url: `${base}/settings/billing`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (e) {
    console.error("[stripe:portal]", e);
    return NextResponse.json({ error: "Portál sa nepodarilo otvoriť" }, { status: 500 });
  }
}
