// src/lib/ai/openai-pricing.ts
// Authoritative OpenAI list pricing (USD) — keep in sync with
// https://openai.com/api/pricing/. Numbers are per 1M tokens; we
// convert to EUR via a single exchange rate for the dashboard.
//
// We stay conservative on the exchange rate (1 USD ≈ 0.92 EUR);
// the precise number Stripe sees lands on the invoice already in EUR.

export const USD_TO_EUR = 0.92;

export interface ModelPricing {
  inputPerMTokensUsd: number;   // USD per 1,000,000 input tokens
  outputPerMTokensUsd: number;  // USD per 1,000,000 output tokens
}

// Chat models we route to in pickModel(). Add new ones here only after
// updating site-settings/agent routing — otherwise unknown models fall
// through to UNKNOWN_DEFAULT below.
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // gpt-4o-mini — default for Basic/Pro and short Enterprise prompts
  "gpt-4o-mini": { inputPerMTokensUsd: 0.15, outputPerMTokensUsd: 0.60 },
  // gpt-4o — Enterprise deep-analysis only (smart routing)
  "gpt-4o":      { inputPerMTokensUsd: 2.50, outputPerMTokensUsd: 10.00 },
};

// Fallback used when the stored model name isn't in the table or is null
// (legacy AiRequest rows). We assume gpt-4o-mini since that's our default.
const UNKNOWN_DEFAULT: ModelPricing = MODEL_PRICING["gpt-4o-mini"];

// OpenAI returns versioned model strings like `gpt-4o-mini-2024-07-18`.
// Normalise to the family key.
export function normalizeModel(model: string | null | undefined): string {
  if (!model) return "gpt-4o-mini";
  if (model.startsWith("gpt-4o-mini")) return "gpt-4o-mini";
  if (model.startsWith("gpt-4o"))      return "gpt-4o";
  return model;
}

// Cost in EUR for one chat completion.
export function chatCostEur(model: string | null | undefined, inputTokens: number, outputTokens: number): number {
  const key = normalizeModel(model);
  const p = MODEL_PRICING[key] ?? UNKNOWN_DEFAULT;
  const usd =
    (inputTokens  / 1_000_000) * p.inputPerMTokensUsd +
    (outputTokens / 1_000_000) * p.outputPerMTokensUsd;
  return usd * USD_TO_EUR;
}

// Whisper: $0.006/min. We bill from CallRecording.durationSec (filled
// after transcription). If duration is unknown we fall back to 4 min,
// which is the median Slovak business call length we've measured.
export const WHISPER_USD_PER_MIN = 0.006;

export function whisperCostEur(durationSec: number | null | undefined): number {
  const minutes = (durationSec ?? 240) / 60;
  return minutes * WHISPER_USD_PER_MIN * USD_TO_EUR;
}
