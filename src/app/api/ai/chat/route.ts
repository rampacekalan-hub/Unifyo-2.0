import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

const chatSchema = z.object({
  message: z.string().min(1, "Správa nesmie byť prázdna").max(2000, "Správa je príliš dlhá"),
  module: z.enum(["dashboard", "calendar", "email", "crm", "calls"]).default("dashboard"),
});

export async function POST(req: NextRequest) {
  // 1. Rate limit (AI tier — 30 req/min)
  const limited = rateLimit(req, config.security.rateLimit.ai, "ai-chat");
  if (limited) return limited;

  // 2. Auth check
  const { session, response: authError } = await requireAuth(req);
  if (authError) return authError;

  // 3. Input validation
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný formát požiadavky" }, { status: 400 });
  }

  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { message, module } = parsed.data;

  // 4. Check credits — never let request through with 0 credits
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { credits: true, plan: true },
  });

  if (!user) {
    return NextResponse.json({ error: config.texts.errorStates.sessionExpired }, { status: 401 });
  }

  if (user.credits <= 0) {
    return NextResponse.json({ error: config.texts.errorStates.noCredits }, { status: 402 });
  }

  // 5. Build system prompt from System Core
  const systemPrompt = [config.ai.systemPrompts.base, config.ai.systemPrompts[module]].join("\n\n");

  // 6. Call OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: config.texts.errorStates.aiUnavailable }, { status: 503 });
  }

  let aiResponse: string;
  let tokensUsed = 0;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.defaultModel,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errData = await openaiRes.json().catch(() => ({}));
      console.error("[AI_CHAT] OpenAI error:", errData);
      return NextResponse.json({ error: config.texts.errorStates.aiUnavailable }, { status: 502 });
    }

    const data = await openaiRes.json();
    aiResponse = data.choices?.[0]?.message?.content ?? "";
    tokensUsed = data.usage?.total_tokens ?? 0;
  } catch (err) {
    console.error("[AI_CHAT] Network error:", err);
    return NextResponse.json({ error: config.texts.errorStates.networkError }, { status: 503 });
  }

  // 7. Deduct 1 credit + log AiRequest — atomic via transaction
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.userId },
        data: { credits: { decrement: 1 } },
      }),
      prisma.aiRequest.create({
        data: {
          userId: session.userId,
          module,
          tokens: tokensUsed,
        },
      }),
    ]);
  } catch (err) {
    console.error("[AI_CHAT] DB transaction error:", err);
    // AI already responded — log error but still return response
  }

  return NextResponse.json({
    response: aiResponse,
    creditsRemaining: Math.max(0, user.credits - 1),
    tokensUsed,
  });
}
