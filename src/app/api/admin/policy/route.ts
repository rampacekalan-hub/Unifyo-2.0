import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

const policySchema = z.object({
  name:     z.string().min(1).max(200),
  rule:     z.string().min(5).max(2000),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  context:  z.enum(["all", "personal", "work"]).default("all"),
  isActive: z.boolean().default(true),
});

// GET — list all policies
export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });
  try {
    const policies = await prisma.neuralPolicy.findMany({
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ policies });
  } catch (err) {
    console.error("[POLICY GET]", err);
    return NextResponse.json({ error: "Databáza nedostupná" }, { status: 503 });
  }
}

// POST — create policy
export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });
  
  const body = await req.json().catch(() => null);
  const parsed = policySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const policy = await prisma.neuralPolicy.create({
      data: { ...parsed.data, createdBy: session.email },
    });
    await prisma.auditLog.create({
      data: { adminEmail: session.email, action: "POLICY_CREATE", targetId: policy.id, after: parsed.data as object },
    });
    return NextResponse.json({ success: true, policy });
  } catch (err) {
    console.error("[POLICY POST]", err);
    return NextResponse.json({ error: "Databáza nedostupná" }, { status: 503 });
  }
}

// PATCH — update policy
export async function PATCH(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });
  
  const body = await req.json().catch(() => null);
  const id: string = body?.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  
  const parsed = policySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  try {
    const before = await prisma.neuralPolicy.findUnique({ where: { id } });
    const updated = await prisma.neuralPolicy.update({ where: { id }, data: parsed.data });
    await prisma.auditLog.create({
      data: { adminEmail: session.email, action: "POLICY_UPDATE", targetId: id, before: before as object, after: parsed.data as object },
    });
    return NextResponse.json({ success: true, policy: updated });
  } catch (err) {
    console.error("[POLICY PATCH]", err);
    return NextResponse.json({ error: "Databáza nedostupná" }, { status: 503 });
  }
}

// DELETE — remove policy
export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });
  
  const { id }: { id: string } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const before = await prisma.neuralPolicy.findUnique({ where: { id } });
    await prisma.neuralPolicy.delete({ where: { id } });
    await prisma.auditLog.create({
      data: { adminEmail: session.email, action: "POLICY_DELETE", targetId: id, before: before as object },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POLICY DELETE]", err);
    return NextResponse.json({ error: "Databáza nedostupná" }, { status: 503 });
  }
}
