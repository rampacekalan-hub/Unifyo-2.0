// src/app/api/agents/route.ts
// Custom AI agents — list + create. Pro/Enterprise only. Pro caps
// at 3 active agents, Enterprise at 10. Basic gets a TIER_LOCKED
// nudge instead. The actual chat-time integration reads the agent's
// systemPrompt and prepends it to the LLM message stack.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function tierLimit(tier: string): number | null {
  if (tier === "ENTERPRISE") return 10;
  if (tier === "PREMIUM" || tier === "PRO") return 3;
  return null; // BASIC = locked
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const tier = session.membershipTier ?? "BASIC";
  const limit = tierLimit(tier);
  if (limit === null) {
    return NextResponse.json(
      { error: "Vlastní AI agenti sú v Pro a Enterprise.", code: "TIER_LOCKED", requiredTier: "PRO" },
      { status: 403 },
    );
  }

  const rows = await prisma.customAgent.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ agents: rows, limit });
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;

  const tier = session.membershipTier ?? "BASIC";
  const limit = tierLimit(tier);
  if (limit === null) {
    return NextResponse.json(
      { error: "Vlastní AI agenti sú v Pro a Enterprise.", code: "TIER_LOCKED", requiredTier: "PRO" },
      { status: 403 },
    );
  }

  const count = await prisma.customAgent.count({ where: { userId: session.userId } });
  if (count >= limit) {
    return NextResponse.json(
      { error: `Limit ${limit} agentov vyčerpaný.`, code: "AGENT_LIMIT" },
      { status: 429 },
    );
  }

  let body: {
    name?: string;
    description?: string;
    systemPrompt?: string;
    icon?: string;
    color?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  const systemPrompt = body.systemPrompt?.trim();
  if (!name || !systemPrompt) {
    return NextResponse.json({ error: "Chýba názov alebo systémový prompt" }, { status: 400 });
  }

  const created = await prisma.customAgent.create({
    data: {
      userId: session.userId,
      name: name.slice(0, 60),
      description: body.description?.trim().slice(0, 200) || null,
      systemPrompt: systemPrompt.slice(0, 4000),
      icon: body.icon?.slice(0, 30) || "Bot",
      color: body.color?.slice(0, 20) || "#8b5cf6",
    },
  });
  return NextResponse.json(created, { status: 201 });
}
