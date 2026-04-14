import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { adminStore, logAdminAction, publishSSE } from "@/lib/admin-store";
import { z } from "zod";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });

  return NextResponse.json({ toggles: adminStore.toggles });
}

const toggleSchema = z.object({
  module: z.string().min(1),
  enabled: z.boolean(),
});

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });

  const body = await req.json();
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { module, enabled } = parsed.data;
  adminStore.toggles[module] = enabled;

  const detail = `Module "${module}" → ${enabled ? "ENABLED" : "DISABLED"}`;
  const entry = logAdminAction(session.email, "MODULE_TOGGLE", detail);

  publishSSE("admin_log", entry);
  publishSSE("toggles", { toggles: adminStore.toggles });

  console.log(`[SECURITY_AUDIT] ADMIN_TOGGLE | admin=${session.email} | ${detail} | ts=${new Date().toISOString()}`);

  return NextResponse.json({ success: true, toggles: adminStore.toggles });
}
