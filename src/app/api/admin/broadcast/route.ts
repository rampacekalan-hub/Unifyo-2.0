import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { adminStore, logAdminAction, publishSSE } from "@/lib/admin-store";
import { z } from "zod";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

const schema = z.object({
  text: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const msg = {
    id: `${Date.now()}`,
    text: parsed.data.text,
    ts: new Date().toISOString(),
    adminEmail: session.email,
  };

  adminStore.broadcast = msg;

  const entry = logAdminAction(session.email, "BROADCAST", `"${msg.text}"`);
  publishSSE("broadcast", msg);
  publishSSE("admin_log", entry);

  console.log(`[SECURITY_AUDIT] ADMIN_BROADCAST | admin=${session.email} | msg="${msg.text}" | ts=${new Date().toISOString()}`);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });

  adminStore.broadcast = null;
  publishSSE("broadcast_clear", {});

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  return NextResponse.json({ broadcast: adminStore.broadcast });
}
