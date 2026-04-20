// src/app/api/referral/route.ts
// GET — returns the current user's referral code (lazily generated),
// share URL, and their list of referrals (for /settings referral panel).

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureReferralCode, referralShareUrl } from "@/lib/referral";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  try {
    const code = await ensureReferralCode(session.userId);

    const rows = await prisma.referral.findMany({
      where: { referrerId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        createdAt: true,
        rewardedAt: true,
        referred: { select: { email: true } },
      },
    });

    const referrals = rows.map((r) => ({
      email: r.referred?.email ?? null,
      createdAt: r.createdAt.toISOString(),
      rewardedAt: r.rewardedAt ? r.rewardedAt.toISOString() : null,
    }));

    return NextResponse.json({
      code,
      shareUrl: referralShareUrl(code),
      referrals,
      count: referrals.length,
    });
  } catch (e) {
    console.error("[referral:GET]", e);
    return NextResponse.json(
      { error: "Nepodarilo sa načítať referral kód." },
      { status: 500 },
    );
  }
}
