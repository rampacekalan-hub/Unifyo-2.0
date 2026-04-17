import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const tasks = await prisma.calendarTask.findMany({
      where: { userId: session.userId },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });
    return NextResponse.json(tasks);
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const { title, description, date, time } = await req.json();
    if (!title || !date) return NextResponse.json({ error: "Názov a dátum sú povinné" }, { status: 400 });
    const task = await prisma.calendarTask.create({
      data: { userId: session.userId, title, description, date, time },
    });
    return NextResponse.json(task);
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const { id, title, description, date, time, done } = await req.json();
    await prisma.calendarTask.updateMany({
      where: { id, userId: session.userId },
      data: { title, description, date, time, done },
    });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  try {
    const body = await req.json();
    const idList: string[] = Array.isArray(body.ids)
      ? body.ids.filter((x: unknown) => typeof x === "string")
      : typeof body.id === "string" ? [body.id] : [];
    if (idList.length === 0) return NextResponse.json({ error: "Missing id(s)" }, { status: 400 });
    const result = await prisma.calendarTask.deleteMany({
      where: { id: { in: idList }, userId: session.userId },
    });
    return NextResponse.json({ ok: true, deleted: result.count });
  } catch { return NextResponse.json({ error: "DB error" }, { status: 500 }); }
}
