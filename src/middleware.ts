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

const PROTECTED  = ["/dashboard"];
const AUTH_ONLY  = ["/login", "/register"];
const ADMIN_ONLY = ["/admin"];

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

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
  const ip = getClientIp(req);

  const isProtected  = PROTECTED.some((p)  => pathname.startsWith(p));
  const isAuthOnly   = AUTH_ONLY.some((p)  => pathname.startsWith(p));
  const isAdminOnly  = ADMIN_ONLY.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAuthOnly && !isAdminOnly) return NextResponse.next();

  const session = await getSessionPayload(req);

  // ── Admin routes ─────────────────────────────────────────────
  if (isAdminOnly) {
    const isAdmin = session?.role === "ADMIN" || session?.role === "SUPERADMIN";

    if (!isAdmin) {
      // [SECURITY_AUDIT] — denied access logged, but 404 returned (obscurity)
      console.log(
        `[SECURITY_AUDIT] ADMIN_ACCESS_DENIED | ip=${ip} | userId=${session?.userId ?? "anonymous"} | role=${session?.role ?? "none"} | path=${pathname} | ts=${new Date().toISOString()}`
      );
      return new NextResponse(null, { status: 404 });
    }

    console.log(
      `[SECURITY_AUDIT] ADMIN_ACCESS_GRANTED | ip=${ip} | userId=${session.userId} | role=${session.role} | path=${pathname} | ts=${new Date().toISOString()}`
    );
    return NextResponse.next();
  }

  // ── Protected user routes ─────────────────────────────────────
  if (isProtected && !session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Auth-only routes ──────────────────────────────────────────
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
