import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { requireAiAccess } from "@/lib/verification-gate";
import { getSiteConfig } from "@/config/site-settings";
import { checkDailyLimit, incrementDailyUsage, retrieveContext, storeMemory, getActivePolicies, getUserPolicies } from "@/lib/ai/neural-core";
import type { MembershipTier } from "@/lib/ai/neural-core";
import { buildUserBusinessContext } from "@/lib/ai/userContext";

const config = getSiteConfig();

const schema = z.object({
  message: z.string().min(1).max(2000),
  module: z.enum(["dashboard", "calendar", "email", "crm", "calls"]).default("dashboard"),
  sessionId: z.string().optional(),
  // Last-few-messages context lookup key. Without it every turn
  // feels like the AI has amnesia.
  conversationId: z.string().optional(),
  prefs: z.object({
    style: z.enum(["concise", "friendly", "formal"]).default("friendly"),
    temperature: z.number().min(0).max(1).default(0.6),
    memoryEnabled: z.boolean().default(true),
  }).optional(),
});

const STYLE_INSTRUCTIONS: Record<"concise" | "friendly" | "formal", string> = {
  concise:  "ŠTÝL: Odpovedaj stručne, v krátkych vetách. Maximálne 2–3 vety, žiadne zbytočné zdvorilosti ani vysvetľovanie. Príď rovno k veci.",
  friendly: "ŠTÝL: Odpovedaj priateľsky, ľudsky a vyvážene — ako skúsený asistent. Môžeš použiť emoji, ale s mierou.",
  formal:   "ŠTÝL: Odpovedaj formálne a profesionálne, v úplných vetách. Vykanie, žiadne emoji, žiadne hovorové skratky.",
};

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, config.security.rateLimit.ai, "ai-stream");
  if (limited) return limited;

  const { session, response: authError } = await requireAuth(req);
  if (authError) return authError;

  const gate = await requireAiAccess(session.userId);
  if (!gate.ok && gate.response) return gate.response;

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Neplatný formát" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { message, module, sessionId, conversationId, prefs } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { membershipTier: true } });
  if (!user) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const tier = user.membershipTier as MembershipTier;

  const { allowed, used, limit } = await checkDailyLimit(session.userId, tier);
  if (!allowed) return NextResponse.json({ error: config.texts.errorStates.dailyLimitReached, used, limit }, { status: 402 });

  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "AI nie je nakonfigurované — chýba OPENAI_API_KEY.", code: "MISSING_API_KEY" }, { status: 503 });

  const ctx = { userId: session.userId, sessionId: sessionId ?? `${session.userId}-${Date.now()}`, module, tier };

  // Load context — skip memory retrieval if user disabled it in preferences.
  const memoryEnabled = prefs?.memoryEnabled ?? true;
  const memories = memoryEnabled ? await retrieveContext(ctx) : [];
  if (memoryEnabled) await storeMemory(ctx, "user", message);

  const memContext = memories.length > 0 ? (memories[0].context as "personal" | "work") : "work";
  const [globalPolicies, userPolicies] = await Promise.all([getActivePolicies(memContext), getUserPolicies(ctx.userId)]);

  const policyLines = globalPolicies.map(p => `[POLICY: ${p.name}] ${p.rule}`).join("\n");
  const userPolicyLines = userPolicies.map(p => `[USER PREF: ${p.name}] ${p.rule}`).join("\n");
  const ctxLines = memories.map(m => `[${m.role === "assistant" ? "AI" : "User"}] ${m.content}`).join("\n");

  const styleInstr = prefs ? STYLE_INSTRUCTIONS[prefs.style] : "";

  // Real business data — CRM contacts, open deals, upcoming tasks —
  // so the AI knows who "Peter" is and what deadlines loom. Previously
  // this was missing and the model only saw anonymised memories.
  const businessContext = await buildUserBusinessContext(session.userId).catch(() => "");

  // Pull the last 6 messages from the same conversation so the model
  // can see what we just said. Without this every turn is amnesic.
  const history = conversationId
    ? await prisma.conversationMsg.findMany({
        where: { conversationId, conversation: { userId: session.userId } },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { role: true, content: true },
      }).catch(() => [])
    : [];
  const historyMessages = history.reverse().map((m) => ({
    role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
    content: m.content,
  }));

  const systemPrompt = [
    policyLines,
    userPolicyLines,
    "Si Personal Neural OS pre život a prácu. Si diskrétny, empatický a zameraný na výsledky.",
    config.ai.systemPrompts.base,
    config.ai.systemPrompts[module] ?? "",
    styleInstr,
    businessContext,
    memories.length > 0 ? `\n--- Dlhodobá pamäť ---\n${ctxLines}\n--- Koniec pamäte ---` : "",
  ].filter(Boolean).join("\n\n");

  // Update lastActiveAt async
  prisma.user.update({ where: { id: session.userId }, data: { lastActiveAt: new Date() } }).catch(() => {});

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: config.ai.defaultModel,
      max_tokens: config.ai.maxTokens,
      temperature: prefs?.temperature ?? config.ai.temperature,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        // RAW (un-anonymised) message goes to OpenAI for THIS turn so
        // the assistant can reason over real names/numbers. Anonymised
        // copy is what we store long-term via `storeMemory()`.
        { role: "user", content: message },
      ],
    }),
  });

  if (!openaiRes.ok || !openaiRes.body) {
    const err = await openaiRes.json().catch(() => ({}));
    console.error("[AI_STREAM] OpenAI error:", err);
    return NextResponse.json({ error: "AI služba je momentálne nedostupná.", code: "AI_UNAVAILABLE" }, { status: 502 });
  }

  // Stream response back to client
  const encoder = new TextEncoder();
  let fullContent = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = openaiRes.body!.getReader();
      const dec = new TextDecoder();
      // CRITICAL: OpenAI SSE lines can split across TCP chunks. We MUST buffer
      // until we see `\n`, otherwise partial `data: {...}` lines fail JSON.parse
      // and get silently dropped — characters visibly missing from the reply.
      let buffer = "";

      const processLine = (rawLine: string) => {
        const line = rawLine.trim();
        if (!line.startsWith("data: ")) return;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            fullContent += delta;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
          }
          const tokensUsed = json.usage?.total_tokens ?? 0;
          if (tokensUsed > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tokens: tokensUsed, done: true, used: used + 1, limit })}\n\n`));
          }
        } catch { /* skip malformed chunks */ }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += dec.decode(value, { stream: true });
          // Process only up to the LAST complete newline; keep remainder buffered.
          let nlIdx = buffer.indexOf("\n");
          while (nlIdx !== -1) {
            const line = buffer.slice(0, nlIdx);
            buffer = buffer.slice(nlIdx + 1);
            processLine(line);
            nlIdx = buffer.indexOf("\n");
          }
        }
        // Flush anything left after stream end.
        if (buffer.trim()) processLine(buffer);
      } finally {
        // After stream: store memory (if enabled) + log + increment
        if (fullContent) {
          const tasks: Promise<unknown>[] = [
            incrementDailyUsage(session.userId),
            prisma.aiRequest.create({ data: { userId: session.userId, module, tokens: 0 } }),
          ];
          if (memoryEnabled) tasks.push(storeMemory(ctx, "assistant", fullContent));
          Promise.all(tasks).catch(e => console.error("[AI_STREAM] post-stream DB error:", e));
          // Final done signal with usage
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, used: used + 1, limit })}\n\n`));
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
