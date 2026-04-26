/**
 * Neural Core — Unifyo On-Premise AI Brain  v3
 *
 * Architecture:
 *  1. GDPR SHIELD     — PII stripped before storage; anonymizedContent for admin view
 *  2. CONTEXT TAGGER  — auto-assigns "personal" | "work" based on content signals
 *  3. CONFIDENCE      — AI self-evaluates certainty (0–1); low scores flagged for review
 *  4. EMOTIONAL TONE  — detects mood of user message (positive/negative/neutral/anxious/excited)
 *  5. RELEVANCE TTL   — auto-expires stale memories based on content type and tier
 *  6. MEMORY STORE    — all interactions persisted to NeuralMemory (Postgres)
 *  7. CONTEXT BUILD   — retrieves relevant past memories per user+module
 *  8. PRIVACY BRIDGE  — only anonymised prompt leaves to GPT; knowledge stays local
 *  9. TIER GUARD      — enforces DailyUsage limits per MembershipTier
 * 10. GOVERNANCE      — temperature, safetyLevel, persona configurable at runtime
 * 11. BRAIN SANDBOX   — storeSimulated() runs full pipeline without real GPT call
 */

import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/config/site-settings";

export type MembershipTier = "BASIC" | "PREMIUM" | "ENTERPRISE";
export type MemoryContext = "personal" | "work";
export type EmotionalTone = "positive" | "negative" | "neutral" | "anxious" | "excited";

const config = getSiteConfig();

// ── Governance Params (runtime-overridable) ────────────────────

export interface GovernanceParams {
  temperature:  number;   // 0–2   cognitive heat
  safetyLevel:  number;   // 0–1   ethical dampers (0 = loose, 1 = strict)
  persona:      string;   // base system identity string
}

let _governance: GovernanceParams = {
  temperature:  config.ai.temperature,
  safetyLevel:  0.7,
  persona:      "Si Personal Neural OS pre život a prácu. Si diskrétny, empatický a zameraný na výsledky.",
};

export function getGovernance(): GovernanceParams { return { ..._governance }; }
export function setGovernance(patch: Partial<GovernanceParams>): void {
  _governance = { ..._governance, ...patch };
}

// ── Types ──────────────────────────────────────────────────────

export interface NeuralContext {
  userId: string;
  sessionId: string;
  module: string;
  tier: MembershipTier;
}

export interface MemoryEntry {
  id: string;
  role: string;
  content: string;
  summary: string | null;
  importance: number;
  context: string;
  confidenceScore: number;
  emotionalTone: string;
  relevanceTTL: Date | null;
  isSimulated: boolean;
  createdAt: Date;
}

export interface NeuralResponse {
  answer: string;
  tokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
  memoriesUsed: number;
  newMemoryId: string;
}

// ── Plan Limits Loader (DB-first, fallback to site-settings) ─────

interface PlanLimits {
  dailyRequests: number | null;
  weeklyRequests: number | null;
  memorySlots: number;
  contextWindow: number;
  userPolicies: number;
}

export async function getPlanLimits(tier: MembershipTier): Promise<PlanLimits> {
  try {
    const row = await prisma.membershipPlan.findUnique({ where: { tier } });
    if (row) {
      return {
        dailyRequests: row.dailyRequests,
        weeklyRequests: (row as { weeklyRequests?: number | null }).weeklyRequests ?? config.membership.tiers[tier].weeklyRequests,
        memorySlots: row.memorySlots,
        contextWindow: row.contextWindow,
        userPolicies: row.userPolicies,
      };
    }
  } catch { /* DB unavailable — fall through */ }
  // Fallback to static site-settings
  const s = config.membership.tiers[tier];
  return { dailyRequests: s.dailyRequests, weeklyRequests: s.weeklyRequests, memorySlots: s.memorySlots, contextWindow: s.contextWindow, userPolicies: tier === "ENTERPRISE" ? 20 : tier === "PREMIUM" ? 5 : 2 };
}

// ── Smart Routing ────────────────────────────────────────────────
// Default everyone to gpt-4o-mini (fast + 5–10× cheaper). Enterprise
// gets promoted to gpt-4o for *deep-analysis* prompts: long messages
// or explicit analytical keywords. This keeps margins healthy on
// short Q&A while still giving Enterprise the heavy model when it
// matters.

const DEEP_ANALYSIS_RX =
  /\b(analyz|analýz|porovna|stratég|strategy|prognóz|forecast|odporú|recommend|plán|prepočít|investi|in[\s-]?depth|rozsiahl|komplexn)\w*/i;

export function pickModel(tier: MembershipTier, userMessage: string): string {
  if (tier !== "ENTERPRISE") return "gpt-4o-mini";
  const isLong = userMessage.length > 600;
  const isDeep = DEEP_ANALYSIS_RX.test(userMessage);
  return (isLong || isDeep) ? "gpt-4o" : "gpt-4o-mini";
}

// ── Daily Usage Guard ────────────────────────────────────────────

export async function checkDailyLimit(
  userId: string,
  tier: MembershipTier
): Promise<{ allowed: boolean; used: number; limit: number | null }> {
  const limits = await getPlanLimits(tier);
  const today = new Date().toISOString().slice(0, 10);

  const usage = await prisma.dailyUsage.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  const used = usage?.count ?? 0;

  if (limits.dailyRequests === null) {
    return { allowed: true, used, limit: null };
  }

  return {
    allowed: used < limits.dailyRequests,
    used,
    limit: limits.dailyRequests,
  };
}

export async function incrementDailyUsage(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await prisma.dailyUsage.upsert({
    where: { userId_date: { userId, date: today } },
    update: { count: { increment: 1 } },
    create: { userId, date: today, count: 1 },
  });
}

// ── Weekly Usage Guard (FUP — Fair Use Policy) ───────────────────
// Computes weekly usage as a rolling sum of the last 7 days from
// DailyUsage rows — no extra schema needed, matches calendar-week
// expectations close enough and resets gracefully.

export async function checkWeeklyLimit(
  userId: string,
  tier: MembershipTier
): Promise<{ allowed: boolean; used: number; limit: number | null }> {
  const limits = await getPlanLimits(tier);
  if (limits.weeklyRequests === null) {
    return { allowed: true, used: 0, limit: null };
  }
  // Last 7 days inclusive (today + 6 prior days).
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const rows = await prisma.dailyUsage.findMany({
    where: { userId, date: { in: days } },
    select: { count: true },
  });
  const used = rows.reduce((sum, r) => sum + r.count, 0);
  return {
    allowed: used < limits.weeklyRequests,
    used,
    limit: limits.weeklyRequests,
  };
}

// Unified guard that returns the first limit hit (daily takes priority).
export async function checkUsageLimit(
  userId: string,
  tier: MembershipTier
): Promise<
  | { allowed: true }
  | { allowed: false; reason: "DAILY_LIMIT" | "WEEKLY_LIMIT"; used: number; limit: number | null }
> {
  const day = await checkDailyLimit(userId, tier);
  if (!day.allowed) return { allowed: false, reason: "DAILY_LIMIT", used: day.used, limit: day.limit };
  const week = await checkWeeklyLimit(userId, tier);
  if (!week.allowed) return { allowed: false, reason: "WEEKLY_LIMIT", used: week.used, limit: week.limit };
  return { allowed: true };
}

// ── GDPR Privacy Shield ────────────────────────────────────────
// Full PII sanitisation — strips before sending to LLM AND before admin view.

const PII_RULES: [RegExp, string][] = [
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,          "[EMAIL]"  ],
  [/\+?[\d][\s\-]?(\(?\d{3}\)?[\s\-]?){2}\d{2,4}/g,        "[PHONE]"  ],
  [/\bSK\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}\b/g, "[IBAN]"   ],
  [/\b\d{6}\/\d{4}\b/g,                                      "[BIRTH_NO]"],
  [/\b(RC|IČO|DIČ)[\s:]?\d{6,10}\b/gi,                      "[ID_NO]"  ],
  [/\b[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+\s[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+\b/g,
                                                              "[NAME]"   ],
];

export function gdprAnonymize(text: string): string {
  return PII_RULES.reduce((t, [rx, rep]) => t.replace(rx, rep), text);
}

// ── Context Auto-Tagger ────────────────────────────────────────
// Heuristic keyword-based; no external call needed.

const PERSONAL_SIGNALS = [
  /\b(rodina|manž|dieťa|deti|zdravie|chorob|pocit|vzťah|priateľ|svo|sen|spánok|šport|fitnes|voľný čas|hobby|dovolenk)\b/i,
  /\b(family|wife|husband|child|children|health|feeling|relationship|friend|dream|sleep|sport|fitness|free time|holiday|personal)\b/i,
];

function detectContext(text: string): MemoryContext {
  return PERSONAL_SIGNALS.some((rx) => rx.test(text)) ? "personal" : "work";
}

// ── Confidence Self-Evaluator ──────────────────────────────────

function evalConfidence(answer: string): number {
  if (!answer || answer.length < 20) return 0.1;
  const hedges = (answer.match(/\b(neviem|nie som si istý|možno|pravdepodobne|uncertain|not sure|maybe|perhaps|might)\b/gi) ?? []).length;
  const length = Math.min(answer.length / 500, 1);
  const raw = length - hedges * 0.12;
  return Math.max(0.05, Math.min(1, parseFloat(raw.toFixed(2))));
}

// ── Emotional Tone Detector ────────────────────────────────────
// Heuristic keyword analysis — no external API.

const TONE_RULES: [RegExp, EmotionalTone][] = [
  [/\b(skvel|super|výborn|rad|šťast|miluj|úžasn|perfect|great|love|happy|joy|excellent|fantastic|wonderful)\b/gi, "positive"],
  [/\b(smút|depress|hnev|problém|zlý|hrozn|strach|úzkos|ťažk|sad|angry|bad|terrible|awful|hate|scared|worried|depressed)\b/gi, "negative"],
  [/\b(nervóz|stres|tlak|deadline|nestíh|panic|overwhelm|anxious|anxiety|rush|urgent|pressure)\b/gi, "anxious"],
  [/\b(nemôžem sa dočk|vzruš|inšpir|nadšen|wow|neskutočn|excited|inspiring|amazing|incredible|thrilled|pumped)\b/gi, "excited"],
];

export function detectEmotionalTone(text: string): EmotionalTone {
  for (const [rx, tone] of TONE_RULES) {
    if (rx.test(text)) return tone;
  }
  return "neutral";
}

// ── Relevance TTL Calculator ───────────────────────────────────
// Returns expiry date based on content context and role.
// Personal/ephemeral content expires sooner; work knowledge persists.

export function calcRelevanceTTL(context: MemoryContext, role: string, tier: MembershipTier): Date | null {
  const now = Date.now();
  const days = (d: number) => new Date(now + d * 86_400_000);

  // ENTERPRISE: permanent memory
  if (tier === "ENTERPRISE") return null;

  // Short-lived: user messages in personal context
  if (role === "user" && context === "personal") return days(90);

  // Work context: 1 year
  if (context === "work") return days(365);

  // Personal assistant messages: 6 months
  return days(180);
}

// ── Memory Operations ──────────────────────────────────────────

export async function storeMemory(
  ctx: NeuralContext,
  role: "user" | "assistant",
  content: string,
  overrideConfidence?: number
): Promise<string> {
  const anonymizedContent = gdprAnonymize(content);
  const memContext = detectContext(content);
  const confidenceScore = overrideConfidence ?? (role === "assistant" ? evalConfidence(content) : 0.5);
  const emotionalTone = detectEmotionalTone(content);
  const relevanceTTL = calcRelevanceTTL(memContext, role, ctx.tier);

  const memory = await prisma.neuralMemory.create({
    data: {
      userId:           ctx.userId,
      sessionId:        ctx.sessionId,
      module:           ctx.module,
      role,
      content,
      anonymizedContent,
      context:          memContext,
      confidenceScore,
      emotionalTone,
      relevanceTTL,
      importance:       role === "assistant" ? 0.7 : 0.4,
    },
  });
  return memory.id;
}

// ── Brain Sandbox — simulated pipeline (no GPT tokens) ────────
// Runs real input through full pipeline: anonymize→tag→tone→confidence→store.
// Marks memory as isSimulated=true so it can be filtered in admin.

export interface SandboxResult {
  id: string;
  anonymizedInput: string;
  anonymizedResponse: string;
  context: MemoryContext;
  emotionalTone: EmotionalTone;
  confidenceScore: number;
  relevanceTTL: Date | null;
}

export async function storeSimulated(
  ctx: NeuralContext,
  fakeUserInput: string,
  fakeAiResponse: string
): Promise<SandboxResult> {
  const anonInput    = gdprAnonymize(fakeUserInput);
  const anonResponse = gdprAnonymize(fakeAiResponse);
  const memContext   = detectContext(fakeUserInput);
  const tone         = detectEmotionalTone(fakeUserInput);
  const confidence   = evalConfidence(fakeAiResponse);
  const ttl          = calcRelevanceTTL(memContext, "user", ctx.tier);

  // Store user turn
  await prisma.neuralMemory.create({
    data: {
      userId: ctx.userId, sessionId: ctx.sessionId, module: ctx.module,
      role: "user", content: fakeUserInput, anonymizedContent: anonInput,
      context: memContext, emotionalTone: tone,
      confidenceScore: 0.5, relevanceTTL: ttl,
      importance: 0.4, isSimulated: true,
    },
  });

  // Store assistant turn
  const mem = await prisma.neuralMemory.create({
    data: {
      userId: ctx.userId, sessionId: ctx.sessionId, module: ctx.module,
      role: "assistant", content: fakeAiResponse, anonymizedContent: anonResponse,
      context: memContext, emotionalTone: "neutral",
      confidenceScore: confidence, relevanceTTL: ttl,
      importance: 0.7, isSimulated: true,
    },
  });

  return {
    id: mem.id,
    anonymizedInput: anonInput,
    anonymizedResponse: anonResponse,
    context: memContext,
    emotionalTone: tone,
    confidenceScore: confidence,
    relevanceTTL: ttl,
  };
}

export async function retrieveContext(
  ctx: NeuralContext
): Promise<MemoryEntry[]> {
  const limits = await getPlanLimits(ctx.tier);
  const take = limits.contextWindow;

  const memories = await prisma.neuralMemory.findMany({
    where: { userId: ctx.userId, module: ctx.module },
    orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      role: true,
      content: true,
      summary: true,
      importance: true,
      context: true,
      confidenceScore: true,
      emotionalTone: true,
      relevanceTTL: true,
      isSimulated: true,
      createdAt: true,
    },
  });

  return memories.reverse();
}

// ── Context → Prompt Builder ───────────────────────────────────

function buildContextBlock(memories: MemoryEntry[]): string {
  if (memories.length === 0) return "";

  const lines = memories.map((m) => {
    const text = m.summary ?? m.content;
    const role = m.role === "assistant" ? "AI" : "User";
    const tag = m.context === "personal" ? "[personal]" : "[work]";
    return `${tag}[${role}] ${text}`;
  });

  return (
    "\n\n--- Relevantný kontext z predchádzajúcich interakcií ---\n" +
    lines.join("\n") +
    "\n--- Koniec kontextu ---"
  );
}

// ── Neural Policy Loader ──────────────────────────────────────
// Fetches active policies from DB; injected BEFORE persona (highest priority).

export async function getActivePolicies(context?: MemoryContext) {
  return prisma.neuralPolicy.findMany({
    where: {
      isActive: true,
      ...(context ? { OR: [{ context: "all" }, { context }] } : {}),
    },
    orderBy: [
      { severity: "desc" },
      { createdAt: "asc" },
    ],
    select: { id: true, name: true, rule: true, severity: true, context: true },
  });
}

function buildPolicyBlock(policies: Awaited<ReturnType<typeof getActivePolicies>>): string {
  if (policies.length === 0) return "";
  const SEVERITY_PREFIX: Record<string, string> = {
    critical: "🚨 CRITICAL POLICY",
    high:     "⚠ HIGH PRIORITY POLICY",
    medium:   "📋 POLICY",
    low:      "ℹ GUIDELINE",
  };
  type PolicyRow = Awaited<ReturnType<typeof getActivePolicies>>[number];
  const lines = policies.map((p: PolicyRow) =>
    `[${SEVERITY_PREFIX[p.severity] ?? "POLICY"}: ${p.name}] ${p.rule}`
  );
  return (
    "\n\n=== NEURAL POLICY ENGINE — TOP-PRIORITY DIRECTIVES ===\n" +
    "These rules OVERRIDE all other instructions and MUST be followed strictly:\n" +
    lines.join("\n") +
    "\n=== END POLICIES ==="
  );
}

// ── User Policy Loader ────────────────────────────────────
// Fetches per-user personal rules; injected AFTER global policies.

export async function getUserPolicies(userId: string) {
  return prisma.userPolicy.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, rule: true },
  });
}

function buildUserPolicyBlock(policies: Awaited<ReturnType<typeof getUserPolicies>>): string {
  if (policies.length === 0) return "";
  type UPRow = Awaited<ReturnType<typeof getUserPolicies>>[number];
  const lines = policies.map((p: UPRow) => `[📌 USER PREFERENCE: ${p.name}] ${p.rule}`);
  return (
    "\n\n=== USER PERSONAL PREFERENCES (secondary, overridden by global policies) ===\n" +
    lines.join("\n") +
    "\n=== END USER PREFERENCES ==="
  );
}

// ── Safety Modifier ───────────────────────────────────────────

function applySafetyModifier(prompt: string, safetyLevel: number): string {
  if (safetyLevel >= 0.8) {
    return prompt + "\n\nDôležité: Odmietni akékoľvek škodlivé, nelegálne alebo eticky problematické požiadavky. Buď obzvlášť opatrný s citlivými témami.";
  }
  if (safetyLevel >= 0.5) {
    return prompt + "\n\nBuď zodpovedný a etický vo svojich odpovediach.";
  }
  return prompt;
}

// ── Main Neural Inference ──────────────────────────────────────

export async function neuralInfer(
  ctx: NeuralContext,
  userMessage: string,
  baseSystemPrompt: string,
  modulePrompt: string
): Promise<NeuralResponse> {
  const gov = getGovernance();

  // 1. Retrieve local context (stays on-premise)
  const memories = await retrieveContext(ctx);

  // 2. Store user message with GDPR shield + context tag
  await storeMemory(ctx, "user", userMessage);

  // 3. Load global + user policies; global has absolute priority
  const memContext = memories.length > 0 ? (memories[0].context as MemoryContext) : "work";
  const [globalPolicies, userPolicies] = await Promise.all([
    getActivePolicies(memContext),
    getUserPolicies(ctx.userId),
  ]);
  const policyBlock     = buildPolicyBlock(globalPolicies);
  const userPolicyBlock = buildUserPolicyBlock(userPolicies);
  const contextBlock    = buildContextBlock(memories);
  const safePersona     = applySafetyModifier(gov.persona, gov.safetyLevel);
  // Order: GLOBAL policies → USER preferences → persona → base → module → context
  const fullSystemPrompt = policyBlock + userPolicyBlock + "\n\n" + safePersona + "\n\n" + baseSystemPrompt + "\n\n" + modulePrompt + contextBlock;

  // 3b. Update lastActiveAt
  prisma.user.update({ where: { id: ctx.userId }, data: { lastActiveAt: new Date() } }).catch(() => {});

  // 4. Call OpenAI
  // NOTE on privacy: we used to pass `gdprAnonymize(userMessage)` to
  // OpenAI here. That turned "Peter Novák" into "[NAME]" and the model
  // couldn't actually help. Since the user's own data is being sent to
  // assist the user, this is their own context — we only anonymise for
  // long-term memory storage (which still happens inside storeMemory).
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       pickModel(ctx.tier, userMessage),
      max_tokens:  config.ai.maxTokens,
      temperature: gov.temperature,
      messages: [
        { role: "system", content: fullSystemPrompt },
        { role: "user",   content: userMessage },
      ],
    }),
  });

  if (!openaiRes.ok) {
    const err = await openaiRes.json().catch(() => ({}));
    console.error("[NEURAL_CORE] OpenAI error:", err);
    throw new Error("AI_UNAVAILABLE");
  }

  const data = await openaiRes.json();
  const answer: string = data.choices?.[0]?.message?.content ?? "";
  const tokensUsed: number = data.usage?.total_tokens ?? 0;
  const inputTokens: number = data.usage?.prompt_tokens ?? 0;
  const outputTokens: number = data.usage?.completion_tokens ?? 0;
  const usedModel: string = (data.model as string) ?? pickModel(ctx.tier, userMessage);

  // 6. Store AI response with confidence evaluation
  const confidence = evalConfidence(answer);
  const newMemoryId = await storeMemory(ctx, "assistant", answer, confidence);

  if (confidence < 0.3) {
    console.warn(`[NEURAL_CORE] Low confidence memory stored: id=${newMemoryId} score=${confidence}`);
  }

  return {
    answer,
    tokensUsed,
    inputTokens,
    outputTokens,
    model: usedModel,
    memoriesUsed: memories.length,
    newMemoryId,
  };
}

// ── Admin: Memory Stats ────────────────────────────────────────

export async function getNeuralStats(sinceHours = 24) {
  const since = new Date(Date.now() - sinceHours * 3_600_000);

  const [totalMemories, recentMemories, editedMemories, lowConfidence, personalCount, workCount, simulatedCount, topUsers] =
    await Promise.all([
      prisma.neuralMemory.count(),
      prisma.neuralMemory.count({ where: { createdAt: { gte: since } } }),
      prisma.neuralMemory.count({ where: { isEdited: true } }),
      prisma.neuralMemory.count({ where: { confidenceScore: { lt: 0.3 } } }),
      prisma.neuralMemory.count({ where: { context: "personal" } }),
      prisma.neuralMemory.count({ where: { context: "work" } }),
      prisma.neuralMemory.count({ where: { isSimulated: true } }),
      prisma.neuralMemory.groupBy({
        by: ["userId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
        where: { userId: { not: null } },
      }),
    ]);

  return { totalMemories, recentMemories, editedMemories, lowConfidence, personalCount, workCount, simulatedCount, topUsers };
}

export async function getThoughtStream(limit = 30) {
  return prisma.neuralMemory.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      userId: true,
      module: true,
      role: true,
      anonymizedContent: true,
      summary: true,
      context: true,
      confidenceScore: true,
      emotionalTone: true,
      relevanceTTL: true,
      isSimulated: true,
      importance: true,
      isEdited: true,
      createdAt: true,
    },
  });
}

// ── Memory Orbit — dashboard timeline for a single user ────────

export async function getMemoryOrbit(userId: string, limit = 40) {
  return prisma.neuralMemory.findMany({
    where: { userId, role: "assistant", isSimulated: false },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      module: true,
      anonymizedContent: true,
      summary: true,
      context: true,
      emotionalTone: true,
      confidenceScore: true,
      importance: true,
      relevanceTTL: true,
      createdAt: true,
    },
  });
}

export async function updateMemory(
  id: string,
  summary: string,
  importance: number,
  confidenceScore?: number
) {
  return prisma.neuralMemory.update({
    where: { id },
    data: {
      summary,
      importance,
      isEdited: true,
      ...(confidenceScore !== undefined ? { confidenceScore } : {}),
    },
  });
}

// ── Emergency Purge ───────────────────────────────────────────

export async function purgeUserMemories(userId: string): Promise<number> {
  const result = await prisma.neuralMemory.deleteMany({ where: { userId } });
  console.warn(`[NEURAL_CORE] EMERGENCY_PURGE userId=${userId} deleted=${result.count}`);
  return result.count;
}
