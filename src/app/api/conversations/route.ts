import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const convs = await prisma.conversation.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, title: true, updatedAt: true, createdAt: true },
    });
    return NextResponse.json(convs);
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const body = await req.json().catch(() => ({}));
    const conv = await prisma.conversation.create({
      data: { userId: session.userId, title: (body as { title?: string }).title ?? "Nová konverzácia" },
    });
    return NextResponse.json(conv);
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const { id, title } = await req.json();
    await prisma.conversation.updateMany({
      where: { id, userId: session.userId },
      data: { title },
    });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const { id } = await req.json();
    await prisma.conversation.deleteMany({ where: { id, userId: session.userId } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}
