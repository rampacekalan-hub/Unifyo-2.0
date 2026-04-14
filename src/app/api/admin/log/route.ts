import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { adminStore } from "@/lib/admin-store";

function isAdmin(role: string) {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth(req);
  if (response) return response;
  if (!isAdmin(session.role)) return new NextResponse(null, { status: 404 });

  return NextResponse.json({ log: adminStore.log });
}
