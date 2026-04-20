// src/app/api/referral/claim/route.ts
// POST { code } — links the current logged-in user to a referrer by code.
// Used by the register page AFTER sign-up when the user is in-session and
// we couldn't credit them inline (edge case). Idempotent: returns 409 if
// this user is already credited to someone.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getSiteConfig } from "@/config/site-settings";

const schema = z.object({ code: z.string().min(4).max(32) });
const { security } = getSiteConfig();

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const limited = await rateLimit(req, security.rateLimit.auth, "referral-claim");
  if (limited) return limited;

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatný kód." }, { status: 400 });
  }

  const code = parsed.data.code.trim();

  try {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (!referrer) {
      return NextResponse.json({ error: "Kód neexistuje." }, { status: 404 });
    }
    if (referrer.id === session.userId) {
      return NextResponse.json(
        { error: "Nemôžeš použiť vlastný kód." },
        { status: 400 },
      );
    }

    const existing = await prisma.referral.findUnique({
      where: { referredUserId: session.userId },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Tento účet už je prepojený s pozvánkou." },
        { status: 409 },
      );
    }

    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: session.userId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[referral:claim]", e);
    return NextResponse.json(
      { error: "Nepodarilo sa uplatniť kód." },
      { status: 500 },
    );
  }
}
