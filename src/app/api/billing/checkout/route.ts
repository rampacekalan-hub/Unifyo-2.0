// src/app/api/billing/checkout/route.ts
// Create a Stripe Checkout Session for the requested plan and return its
// URL. Client redirects the browser there. Supports subscription mode
// only — one-time payments aren't in our pricing yet.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import {
  ensureStripeCustomer,
  getPlanDefByPlanId,
  isStripeConfigured,
  stripe,
} from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  // Guard against stripe-customer-spam — 20 checkout creates per hour
  // per IP is a lot for a real person; anything more is a bot.
  const rl = await rateLimit(req, { maxRequests: 20, windowMs: 3600_000 }, "billing-checkout");
  if (rl) return rl;

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Platby nie sú nakonfigurované" }, { status: 503 });
  }

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný vstup" }, { status: 400 });
  }
  const planDef = body.plan ? getPlanDefByPlanId(body.plan) : null;
  if (!planDef || !planDef.priceId) {
    return NextResponse.json({ error: "Neznámy plán" }, { status: 400 });
  }
  if (planDef.plan === "basic") {
    return NextResponse.json({ error: "Basic je zadarmo — bez potreby platby" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  if (!user) return NextResponse.json({ error: "User gone" }, { status: 404 });

  const customerId = await ensureStripeCustomer(session.userId, user.email);

  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://unifyo.online";

  try {
    const checkout = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: planDef.priceId, quantity: 1 }],
      // Stripe fires `checkout.session.completed` → we read subscription
      // id from there. `client_reference_id` gives us an extra breadcrumb
      // in case the customer-id mapping ever gets tangled.
      client_reference_id: session.userId,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      // Redirect targets — success is the billing page with a flag so UI
      // can show a success toast; cancel returns to the same page silently.
      success_url: `${base}/settings/billing?checkout=success`,
      cancel_url: `${base}/settings/billing?checkout=cancelled`,
    });
    if (!checkout.url) {
      throw new Error("Stripe vrátil session bez URL");
    }
    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    console.error("[stripe:checkout]", e);
    return NextResponse.json({ error: "Checkout zlyhal" }, { status: 500 });
  }
}
