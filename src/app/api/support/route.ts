// src/app/api/support/route.ts
// List user's tickets + open a new one. All tiers can open tickets,
// but per-tier SLA differs (Basic: best effort, Pro: 24h, Enterprise:
// 4h). The SLA policy lives in pricing copy — code only stores the
// priority flag from the user.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_CATEGORY = new Set(["billing", "bug", "how-to", "feature", "general"]);
const VALID_PRIORITY = new Set(["low", "normal", "high", "urgent"]);

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, subject: true, status: true, priority: true,
      category: true, createdAt: true, updatedAt: true,
      _count: { select: { replies: true } },
    },
  });
  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  let body: { subject?: string; body?: string; category?: string; priority?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 });
  }

  const subject = body.subject?.trim();
  const messageBody = body.body?.trim();
  if (!subject || !messageBody) {
    return NextResponse.json({ error: "Chýba predmet alebo správa" }, { status: 400 });
  }

  const category = body.category && VALID_CATEGORY.has(body.category) ? body.category : "general";
  let priority = body.priority && VALID_PRIORITY.has(body.priority) ? body.priority : "normal";
  // Urgent is Enterprise-only; downgrade if abused.
  const tier = session.membershipTier ?? "BASIC";
  if (priority === "urgent" && tier !== "ENTERPRISE") priority = "high";

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.userId,
      subject: subject.slice(0, 200),
      body: messageBody.slice(0, 10_000),
      category,
      priority,
    },
  });
  return NextResponse.json(ticket, { status: 201 });
}
