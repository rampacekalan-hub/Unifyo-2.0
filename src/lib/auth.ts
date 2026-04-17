// src/lib/auth.ts
// Centrálna auth knižnica — JWT session management

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const SECRET_RAW = process.env.JWT_SECRET;
if (!SECRET_RAW || SECRET_RAW.length < 32) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[auth] JWT_SECRET must be set and at least 32 characters long in production."
    );
  }
  console.warn(
    "[auth] JWT_SECRET is missing or too short — using insecure dev fallback. DO NOT USE IN PRODUCTION."
  );
}
const JWT_SECRET = new TextEncoder().encode(
  SECRET_RAW ?? "unifyo-dev-secret-change-in-production-min-32-chars-xxxxx"
);

export const COOKIE_NAME = "unifyo_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 dní

export type UserRole = "USER" | "ADMIN" | "SUPERADMIN";
export type SessionTier = "BASIC" | "PREMIUM" | "ENTERPRISE";

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  membershipTier: SessionTier;
  // Snapshot of User.tokenVersion at issue time. requireAuth rejects the
  // token when this no longer matches the current DB value — enables
  // "Odhlásiť všade". Omit in legacy tokens issued before the feature.
  tv?: number;
}

// ── Vytvorenie JWT tokenu ─────────────────────────────────────
export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(JWT_SECRET);
}

// ── Overenie JWT tokenu ───────────────────────────────────────
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const p = payload as Partial<SessionPayload>;
    if (!p.userId || !p.email || !p.role) return null;
    return {
      userId: p.userId,
      email: p.email,
      role: p.role,
      membershipTier: p.membershipTier ?? "BASIC",
      tv: typeof p.tv === "number" ? p.tv : undefined,
    };
  } catch {
    return null;
  }
}

// ── Získanie aktuálnej session (server component) ─────────────
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ── Nastavenie session cookie ─────────────────────────────────
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

// ── Zmazanie session cookie (logout) ─────────────────────────
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ── Auth gate pre API routes ──────────────────────────────────
// Použitie:
//   const { session, response } = await requireAuth(req);
//   if (response) return response;
//   // tu je session typovo garantovaná ako SessionPayload
export type RequireAuthResult =
  | { session: SessionPayload; response: null }
  | { session: null; response: NextResponse };

export async function requireAuth(req: NextRequest): Promise<RequireAuthResult> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return {
      session: null,
      response: NextResponse.json({ error: "Neautorizované" }, { status: 401 }),
    };
  }
  const session = await verifyToken(token);
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "Neplatná session" }, { status: 401 }),
    };
  }
  // Token-version gate for "Odhlásiť všade". Lazy-import prisma to avoid
  // pulling DB client into edge middleware contexts that import this file.
  if (typeof session.tv === "number") {
    try {
      const { prisma } = await import("@/lib/prisma");
      const u = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { tokenVersion: true },
      });
      if (!u || u.tokenVersion !== session.tv) {
        return {
          session: null,
          response: NextResponse.json({ error: "Session bola odhlásená" }, { status: 401 }),
        };
      }
    } catch (e) {
      console.error("[requireAuth] tokenVersion check failed:", e);
      // Fail open on transient DB error — JWT signature already verified.
    }
  }
  return { session, response: null };
}

// ── Admin gate — zlyhá 404 (neprezrádza existenciu route) ─────
export async function requireAdmin(req: NextRequest): Promise<RequireAuthResult> {
  const result = await requireAuth(req);
  if (result.response) return result;
  if (result.session.role !== "ADMIN" && result.session.role !== "SUPERADMIN") {
    return {
      session: null,
      response: new NextResponse(null, { status: 404 }),
    };
  }
  return result;
}
