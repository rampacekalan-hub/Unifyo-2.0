// src/app/api/agents/[id]/route.ts
// PATCH (rename, edit prompt, toggle active) + DELETE for a single
// custom agent. Owner-only. Tier check unnecessary on these — if the
// row already exists and belongs to the user, they had Pro at create
// time; downgrades just stop them creating new ones via POST /api/agents.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await ctx.params;

  const agent = await prisma.customAgent.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!agent) return NextResponse.json({ error: "Nenájdené" }, { status: 404 });

  let body: {
    name?: string;
    description?: string | null;
    systemPrompt?: string;
    icon?: string;
    color?: string;
    isActive?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim().slice(0, 60);
  if ("description" in body) data.description = body.description?.toString().trim().slice(0, 200) || null;
  if (typeof body.systemPrompt === "string" && body.systemPrompt.trim()) data.systemPrompt = body.systemPrompt.trim().slice(0, 4000);
  if (typeof body.icon === "string") data.icon = body.icon.slice(0, 30);
  if (typeof body.color === "string") data.color = body.color.slice(0, 20);
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const updated = await prisma.customAgent.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  const { session, response } = await requireAuth(req);
  if (response) return response;
  const { id } = await ctx.params;

  const agent = await prisma.customAgent.findFirst({
    where: { id, userId: session.userId },
    select: { id: true },
  });
  if (!agent) return NextResponse.json({ error: "Nenájdené" }, { status: 404 });

  await prisma.customAgent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
