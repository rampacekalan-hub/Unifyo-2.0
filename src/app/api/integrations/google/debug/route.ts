// src/app/api/integrations/google/debug/route.ts
// Public debug — returns the exact redirect_uri the server will send to
// Google. Used to diagnose `redirect_uri_mismatch`. Safe to expose: the
// callback URL is public by nature (it ends up in every OAuth request).

import { NextResponse } from "next/server";
import { getGoogleClientCreds, getGoogleRedirectUri } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  const creds = getGoogleClientCreds();
  return NextResponse.json({
    redirect_uri: getGoogleRedirectUri(),
    client_id_prefix: creds?.clientId?.slice(0, 24) ?? null,
    configured: !!creds,
    app_url: process.env.NEXT_PUBLIC_APP_URL ?? null,
  });
}
