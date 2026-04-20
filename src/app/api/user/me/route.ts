// src/app/api/user/me/route.ts
// Returns the current session user (for client-side header/sidebar rendering)
// and supports PATCH for profile name edits.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  membershipTier: true,
  emailVerifiedAt: true,
  twoFactorEnabledAt: true,
  createdAt: true,
} as const;

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: USER_SELECT,
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawName = (body as { name?: unknown })?.name;
  if (typeof rawName !== "string") {
    return NextResponse.json({ error: "Meno je povinné" }, { status: 400 });
  }
  const name = rawName.trim();
  if (name.length < 1 || name.length > 80) {
    return NextResponse.json(
      { error: "Meno musí mať 1 až 80 znakov" },
      { status: 400 },
    );
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { name },
    select: USER_SELECT,
  });

  return NextResponse.json({ user });
}
