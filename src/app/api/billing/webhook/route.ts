// src/app/api/billing/webhook/route.ts
// Stripe webhook — authoritative source for subscription state changes.
// We verify the signature, then route a small set of events through
// `syncSubscriptionToDb`. Everything else we just 200 to keep Stripe's
// delivery metrics clean.

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, syncSubscriptionToDb } from "@/lib/stripe";

export const dynamic = "force-dynamic";
// Webhook must read the RAW body for signature verification — Next.js
// by default parses JSON, which would mutate the payload. Route Handlers
// give us the raw `req.text()` so this is a one-liner.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe:webhook] STRIPE_WEBHOOK_SECRET missing");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    console.error("[stripe:webhook] bad signature", e);
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const sess = event.data.object as Stripe.Checkout.Session;
        // The subscription id on a completed checkout tells us what to
        // sync; without it the checkout was one-time/mode=payment and we
        // ignore (we don't sell one-time yet).
        if (sess.subscription) {
          const subId =
            typeof sess.subscription === "string"
              ? sess.subscription
              : sess.subscription.id;
          const sub = await stripe().subscriptions.retrieve(subId);
          await syncSubscriptionToDb(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscriptionToDb(sub);
        break;
      }
      case "invoice.payment_failed": {
        // Stripe will retry automatically. We'd surface a banner in-app
        // here later — for now just log so we see it in pm2 logs.
        const inv = event.data.object as Stripe.Invoice;
        console.warn(
          "[stripe:webhook] payment failed",
          { customer: inv.customer, invoice: inv.id },
        );
        break;
      }
      default:
        // All other events are fire-and-forget for now.
        break;
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[stripe:webhook] handler error", e);
    // Return 500 so Stripe retries — idempotent handlers make this safe.
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }
}
