// src/app/api/s/[token]/route.ts
// PUBLIC endpoint — returns the shared resource data in read-only form.
// No auth. Returns 404 if the token is unknown, 410 if revoked/expired.

import { NextRequest, NextResponse } from "next/server";
import { loadSharedByToken } from "@/lib/shareLoader";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const res = await loadSharedByToken(token);
    if (res.status === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (res.status !== "active") {
      return NextResponse.json({ error: res.status }, { status: 410 });
    }
    return NextResponse.json(res.data);
  } catch (e) {
    console.error("[s:GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
