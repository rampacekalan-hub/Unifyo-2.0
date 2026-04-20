// src/lib/stripe.ts
// Single Stripe client + helpers. Kept small on purpose — the heavy
// lifting lives in the route handlers so this module has no side effects
// on import (safe to pull into edge code if we ever need it).

import Stripe from "stripe";
import type { MembershipTier, Plan } from "@prisma/client";

const SECRET = process.env.STRIPE_SECRET_KEY;

// Lazy init — throws only when actually used, so builds / test envs
// without Stripe keys still compile.
let _client: Stripe | null = null;
export function stripe(): Stripe {
  if (!SECRET) {
    throw new Error("STRIPE_SECRET_KEY is not set — billing disabled");
  }
  if (_client) return _client;
  _client = new Stripe(SECRET, {
    // Pin API version — otherwise Stripe silently upgrades us and a field
    // we depend on might change shape. Update deliberately.
    apiVersion: "2026-03-25.dahlia",
    typescript: true,
    appInfo: { name: "Unifyo 2.0", version: "0.1.0" },
  });
  return _client;
}

export function isStripeConfigured(): boolean {
  return Boolean(
    SECRET &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.STRIPE_PRICE_PRO,
  );
}

// ── Plan ↔ price mapping ─────────────────────────────────────────
// Keep this aligned with `config.pricing` in site-settings.ts. The price
// id is what Stripe expects at checkout; the Plan + MembershipTier are
// what we store on the User row after a successful subscription.
export interface PlanDef {
  plan: Plan;
  tier: MembershipTier;
  priceId: string | undefined;
  label: string;
}

export function getPlanDefs(): PlanDef[] {
  return [
    {
      plan: "basic",
      tier: "BASIC",
      priceId: process.env.STRIPE_PRICE_BASIC,
      label: "Basic",
    },
    {
      plan: "pro",
      tier: "PREMIUM",
      priceId: process.env.STRIPE_PRICE_PRO,
      label: "Pro",
    },
    {
      plan: "enterprise",
      tier: "ENTERPRISE",
      priceId: process.env.STRIPE_PRICE_ENTERPRISE,
      label: "Enterprise",
    },
  ];
}

/** Map a Stripe price id back to the plan + tier it represents. Returns
 *  null if we don't recognize the price — callers treat this as "ignore
 *  this subscription, probably legacy or misconfigured". */
export function resolvePlanFromPrice(priceId: string | null | undefined):
  | { plan: Plan; tier: MembershipTier }
  | null {
  if (!priceId) return null;
  const match = getPlanDefs().find((p) => p.priceId === priceId);
  return match ? { plan: match.plan, tier: match.tier } : null;
}

export function getPlanDefByPlanId(planId: string): PlanDef | null {
  return getPlanDefs().find((p) => p.plan === planId) ?? null;
}

// ── Customer lookup / creation ───────────────────────────────────
import { prisma } from "@/lib/prisma";

/** Ensures a Stripe Customer exists for this user and returns the id.
 *  The first call creates the customer + StripeSubscription shell row;
 *  subsequent calls reuse the stored id. `email` is copied to Stripe so
 *  the dashboard shows something useful. */
export async function ensureStripeCustomer(
  userId: string,
  email: string,
): Promise<string> {
  const existing = await prisma.stripeSubscription.findUnique({
    where: { userId },
    select: { customerId: true },
  });
  if (existing?.customerId) return existing.customerId;

  const customer = await stripe().customers.create({
    email,
    metadata: { unifyoUserId: userId },
  });
  await prisma.stripeSubscription.upsert({
    where: { userId },
    create: {
      userId,
      customerId: customer.id,
      status: "incomplete",
    },
    update: { customerId: customer.id },
  });
  return customer.id;
}

/** Apply a subscription update (from webhook or a manual refresh) to our
 *  mirror row + the User row. Idempotent — calling it twice with the
 *  same subscription is a no-op. */
export async function syncSubscriptionToDb(
  sub: Stripe.Subscription,
): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const priceId = sub.items.data[0]?.price?.id ?? null;
  const mapped = resolvePlanFromPrice(priceId);

  // currentPeriodEnd lives on the subscription item in API version
  // 2025-09-30.clover — Stripe moved it off the top-level object.
  const periodEnd = sub.items.data[0]?.current_period_end ?? null;

  const sr = await prisma.stripeSubscription.findUnique({
    where: { customerId },
    select: { userId: true },
  });
  if (!sr) {
    // Subscription exists on Stripe's side but we have no user mapping —
    // could happen if someone pastes our webhook URL elsewhere. Ignore.
    console.warn("[stripe:sync] no local row for customer", customerId);
    return;
  }

  await prisma.stripeSubscription.update({
    where: { userId: sr.userId },
    data: {
      subscriptionId: sub.id,
      priceId,
      status: sub.status,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });

  // Active-ish statuses unlock the paid tier; anything else reverts to
  // BASIC. We keep BASIC users on plan=basic too so downgrades are clean.
  const isActive = sub.status === "active" || sub.status === "trialing";
  if (isActive && mapped) {
    await prisma.user.update({
      where: { id: sr.userId },
      data: { plan: mapped.plan, membershipTier: mapped.tier },
    });
  } else {
    await prisma.user.update({
      where: { id: sr.userId },
      data: { plan: "basic", membershipTier: "BASIC" },
    });
  }
}
