import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const RAW_SECRET = process.env.JWT_SECRET ?? "unifyo-secret-change-in-production-min-32-chars";

// Enforce minimum secret strength at startup
if (RAW_SECRET.length < 32) {
  throw new Error("[AUTH] JWT_SECRET must be at least 32 characters. Set a strong secret in .env");
}

const JWT_SECRET = new TextEncoder().encode(RAW_SECRET);
const COOKIE_NAME = "unifyo_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 dní — rotate on sensitive role changes

export interface SessionPayload {
  userId: string;
  email: string;
  role: "USER" | "ADMIN" | "SUPERADMIN";
}

export async function createSession(payload: SessionPayload) {
  // role must always be present — default USER for safety
  if (!payload.role) (payload as SessionPayload).role = "USER";
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Use in API route handlers to enforce authentication.
 * Returns { session } if valid, or { response } with 401 to return immediately.
 */
export async function requireAuth(
  req: import("next/server").NextRequest
): Promise<
  | { session: SessionPayload; response: null }
  | { session: null; response: import("next/server").NextResponse }
> {
  const { NextResponse } = await import("next/server");
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return {
      session: null,
      response: NextResponse.json({ error: "Neautorizovaný prístup" }, { status: 401 }),
    };
  }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { session: payload as unknown as SessionPayload, response: null };
  } catch {
    return {
      session: null,
      response: NextResponse.json({ error: "Neplatná alebo expirovaná session" }, { status: 401 }),
    };
  }
}
