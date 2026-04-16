import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

// Seed defaults — used only on first GET if DB is empty
const SEED_PLANS = [
  {
    tier: "BASIC",
    label: "Basic",
    dailyRequests: 50,
    memorySlots: 200,
    contextWindow: 5,
    userPolicies: 2,
    price: 8.99,
    description: "Pre začínajúcich podnikateľov",
  },
  {
    tier: "PREMIUM",
    label: "Premium",
    dailyRequests: 500,
    memorySlots: 2000,
    contextWindow: 20,
    userPolicies: 5,
    price: 18.99,
    description: "Pre aktívnych podnikateľov",
  },
  {
    tier: "ENTERPRISE",
    label: "Enterprise",
    dailyRequests: null,
    memorySlots: 10000,
    contextWindow: 50,
    userPolicies: 20,
    price: 48.99,
    description: "Pre tímy a firmy",
  },
];

const planPatchSchema = z.object({
  tier: z.enum(["BASIC", "PREMIUM", "ENTERPRISE"]),
  label: z.string().min(1).max(100).optional(),
  dailyRequests: z.number().int().positive().nullable().optional(),
  memorySlots: z.number().int().positive().optional(),
  contextWindow: z.number().int().min(1).max(200).optional(),
  userPolicies: z.number().int().min(1).max(100).optional(),
  price: z.number().min(0).optional(),
  description: z.string().max(500).optional(),
});

// GET — return all 3 plans (seed if missing)
export async function GET(req: NextRequest) {
  try {
    const { session, response } = await requireAuth(req);
    if (response) return response;
    if (!isAdmin(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let plans = await prisma.membershipPlan.findMany({ orderBy: { price: "asc" } });

    if (plans.length === 0) {
      await prisma.membershipPlan.createMany({ data: SEED_PLANS });
      plans = await prisma.membershipPlan.findMany({ orderBy: { price: "asc" } });
    }

    return NextResponse.json({ plans });
  } catch (err) {
    console.error("[membership-plans GET]", err);
    return NextResponse.json({ error: "Failed to fetch plans", detail: String(err) }, { status: 500 });
  }
}

// PATCH — update one plan
export async function PATCH(req: NextRequest) {
  try {
    const { session, response } = await requireAuth(req);
    if (response) return response;
    if (!isAdmin(session.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => null);
    const parsed = planPatchSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

    const { tier, ...data } = parsed.data;

    const plan = await prisma.membershipPlan.upsert({
      where: { tier },
      update: data,
      create: {
        ...SEED_PLANS.find((s) => s.tier === tier)!,
        ...data,
        tier,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminEmail: session.email,
        action: "PLAN_UPDATE",
        targetId: tier,
        after: JSON.parse(JSON.stringify(data)),
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (err) {
    console.error("[membership-plans PATCH]", err);
    return NextResponse.json({ error: "Failed to update plan", detail: String(err) }, { status: 500 });
  }
}
