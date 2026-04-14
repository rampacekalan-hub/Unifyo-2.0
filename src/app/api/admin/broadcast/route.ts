import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { adminStore, logAdminAction, publishSSE, getActiveBroadcast } from "@/lib/admin-store";
import { z } from "zod";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

const schema = z.object({
  text: z.string().min(1).max(500),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { text, startsAt, expiresAt } = parsed.data;

  const msg = {
    id: `${Date.now()}`,
    text,
    ts: new Date().toISOString(),
    adminEmail: session.email,
    startsAt: startsAt ?? null,
    expiresAt: expiresAt ?? null,
  };

  adminStore.broadcast = msg;

  const scheduledInfo = expiresAt ? ` | expires=${expiresAt}` : "";
  const entry = logAdminAction(session.email, "BROADCAST", `"${text}"${scheduledInfo}`);
  publishSSE("broadcast", msg);
  publishSSE("admin_log", entry);

  console.log(`[SECURITY_AUDIT] ADMIN_BROADCAST | admin=${session.email} | msg="${text}"${scheduledInfo} | ts=${new Date().toISOString()}`);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });

  const prev = adminStore.broadcast;
  adminStore.broadcast = null;
  publishSSE("broadcast_clear", {});

  if (prev) {
    const entry = logAdminAction(session.email, "BROADCAST_CANCEL", `"${prev.text}" zrušený manuálne`);
    publishSSE("admin_log", entry);
  }

  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;

  return NextResponse.json({ broadcast: getActiveBroadcast() });
}
