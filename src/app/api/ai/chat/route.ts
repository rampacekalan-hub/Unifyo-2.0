import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { requireAiAccess } from "@/lib/verification-gate";
import { getSiteConfig } from "@/config/site-settings";
import {
  checkDailyLimit,
  incrementDailyUsage,
  neuralInfer,
} from "@/lib/ai/neural-core";
import type { MembershipTier } from "@/lib/ai/neural-core";

const config = getSiteConfig();

const chatSchema = z.object({
  message: z.string().min(1, "Správa nesmie byť prázdna").max(2000, "Správa je príliš dlhá"),
  module: z.enum(["dashboard", "calendar", "email", "crm", "calls"]).default("dashboard"),
  sessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // 1. Rate limit
  const limited = await rateLimit(req, config.security.rateLimit.ai, "ai-chat");
  if (limited) return limited;

  // 2. Auth
  const { session, response: authError } = await requireAuth(req);
  if (authError) return authError;

  // 2b. Verification gate — prvých UNVERIFIED_AI_TRIAL (=10) requestov
  // funguje bez overeného emailu (trial experience). Potom 402.
  const gate = await requireAiAccess(session.userId);
  if (!gate.ok && gate.response) return gate.response;

  // 3. Input validation
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Neplatný formát požiadavky" }, { status: 400 }); }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { message, module, sessionId } = parsed.data;

  // 4. Load user + tier
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { membershipTier: true, plan: true },
  });

  if (!user) {
    return NextResponse.json({ error: config.texts.errorStates.sessionExpired }, { status: 401 });
  }

  const tier = user.membershipTier as MembershipTier;

  // 5. Daily limit check (tier-based)
  const { allowed, used, limit } = await checkDailyLimit(session.userId, tier);
  if (!allowed) {
    return NextResponse.json(
      { error: config.texts.errorStates.dailyLimitReached, used, limit },
      { status: 402 }
    );
  }

  // 6. Neural inference (memory + context + sanitised GPT call)
  const basePrompt = config.ai.systemPrompts.base;
  const modulePrompt = config.ai.systemPrompts[module] ?? "";

  // Pre-flight: check API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.error("[AI_CHAT] OPENAI_API_KEY is not set in environment");
    return NextResponse.json({
      error: "AI nie je nakonfigurované — chýba OPENAI_API_KEY. Kontaktuj administrátora.",
      code: "MISSING_API_KEY",
    }, { status: 503 });
  }

  let result;
  try {
    result = await neuralInfer(
      {
        userId: session.userId,
        sessionId: sessionId ?? `${session.userId}-${Date.now()}`,
        module,
        tier,
      },
      message,
      basePrompt,
      modulePrompt
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "AI_UNAVAILABLE") {
      return NextResponse.json({
        error: "AI služba je momentálne nedostupná. Skúste to znova o chvíľu.",
        code: "AI_UNAVAILABLE",
      }, { status: 502 });
    }
    if (msg === "OPENAI_API_KEY not configured") {
      return NextResponse.json({
        error: "AI nie je nakonfigurované — chýba OPENAI_API_KEY.",
        code: "MISSING_API_KEY",
      }, { status: 503 });
    }
    console.error("[AI_CHAT] Neural inference error:", err);
    return NextResponse.json({
      error: "Interná chyba servera. Skúste to znova.",
      code: "INTERNAL_ERROR",
    }, { status: 503 });
  }

  // 7. Increment daily usage + log AiRequest
  try {
    await Promise.all([
      incrementDailyUsage(session.userId),
      prisma.aiRequest.create({
        data: { userId: session.userId, module, tokens: result.tokensUsed },
      }),
    ]);
  } catch (err) {
    console.error("[AI_CHAT] DB log error:", err);
  }

  const tierLimits = config.membership.tiers[tier];

  return NextResponse.json({
    response: result.answer,
    tokensUsed: result.tokensUsed,
    memoriesUsed: result.memoriesUsed,
    usage: {
      used: used + 1,
      limit: tierLimits.dailyRequests,
      tier,
    },
  });
}
