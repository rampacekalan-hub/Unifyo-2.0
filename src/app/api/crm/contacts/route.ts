import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const q = new URL(req.url).searchParams.get("q") ?? "";
    const contacts = await prisma.crmContact.findMany({
      where: {
        userId: session.userId,
        ...(q ? { OR: [
          { name: { contains: q, mode: "insensitive" } },
          { company: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ]} : {}),
      },
      orderBy: { updatedAt: "desc" },
      include: { notes: { orderBy: { createdAt: "desc" }, take: 5 } },
    });
    return NextResponse.json(contacts);
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const { name, company, email, phone } = await req.json();
    if (!name) return NextResponse.json({ error: "Meno je povinné" }, { status: 400 });
    const contact = await prisma.crmContact.create({
      data: { userId: session.userId, name, company, email, phone },
    });
    return NextResponse.json(contact);
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const { id, name, company, email, phone } = await req.json();
    await prisma.crmContact.updateMany({
      where: { id, userId: session.userId },
      data: { name, company, email, phone },
    });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const { id } = await req.json();
    await prisma.crmContact.deleteMany({ where: { id, userId: session.userId } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}
