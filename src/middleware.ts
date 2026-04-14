import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "unifyo-secret-change-in-production-min-32-chars"
);
const COOKIE_NAME = "unifyo_session";

interface JwtPayload {
  userId: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPERADMIN";
}

// Routes requiring any authenticated user
const PROTECTED = ["/dashboard"];

// Routes inaccessible when already logged in
const AUTH_ONLY = ["/login", "/register"];

// Routes requiring ADMIN or SUPERADMIN role
const ADMIN_ONLY = ["/admin"];

async function getSessionPayload(req: NextRequest): Promise<JwtPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));
  const isAdminOnly = ADMIN_ONLY.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAuthOnly && !isAdminOnly) return NextResponse.next();

  const session = await getSessionPayload(req);

  // --- Admin routes: 404 for everyone except ADMIN/SUPERADMIN ---
  if (isAdminOnly) {
    const isAdmin = session?.role === "ADMIN" || session?.role === "SUPERADMIN";
    if (!isAdmin) {
      // Return 404 — attacker cannot know this route exists
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
  }

  // --- Protected routes: redirect to login ---
  if (isProtected && !session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Auth-only routes: redirect logged-in users to dashboard ---
  if (isAuthOnly && session) {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
