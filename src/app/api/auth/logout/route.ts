// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

export async function POST(req: Request) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

// Fallback — if someone lands here via GET (direct URL, old bookmark, form fallback),
// clear session and redirect to /login instead of showing raw JSON.
export async function GET(req: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", req.url));
}
