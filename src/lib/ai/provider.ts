import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "ai";

/**
 * AI Provider Factory
 *
 * Returns an AI SDK-compatible language model.
 *
 * PHASE 1 — OpenRouter (current)
 *   Set env vars: OPENROUTER_BASE_URL, OPENROUTER_API_KEY, OPENROUTER_MODEL
 *   Default model: arcee-ai/trinity-large-preview:free
 *   OpenRouter docs: https://openrouter.ai/docs
 *
 * PHASE 2 — Org internal provider (future)
 *   When ready, replace this function body with the org provider
 *   implementation that calls /token first, then /api/genai/model.
 *   All consumers of getAIModel() will work without any changes.
 */
export function getAIModel(): LanguageModelV1 {
  const baseURL =
    process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model =
    process.env.OPENROUTER_MODEL ?? "arcee-ai/trinity-large-preview:free";

  if (!apiKey) {
    throw new Error(
      "AI provider not configured. Set OPENROUTER_API_KEY environment variable."
    );
  }

  const client = createOpenAI({
    baseURL,
    apiKey,
    compatibility: "compatible", // OpenRouter is OpenAI-compatible
    headers: {
      // OpenRouter recommends these headers for app identification
      "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
      "X-Title": "Ensemble Link Manager",
    },
  });

  return client(model);
}

/**
 * ORG PROVIDER TEMPLATE (Phase 2 — uncomment and replace getAIModel when ready)
 *
 * export async function getAIModel(): Promise<LanguageModelV1> {
 *   // Step 1: Obtain auth token from the org token endpoint
 *   const tokenRes = await fetch(`${process.env.ORG_TOKEN_ENDPOINT}/token`, {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({
 *       clientId: process.env.ORG_CLIENT_ID,
 *       clientSecret: process.env.ORG_CLIENT_SECRET,
 *     }),
 *   });
 *   if (!tokenRes.ok) throw new Error("Failed to obtain org AI token");
 *   const { access_token } = await tokenRes.json();
 *
 *   // Step 2: Create model with Bearer token injected via custom fetch
 *   const client = createOpenAI({
 *     baseURL: process.env.ORG_GENAI_BASE_URL, // /api/genai/model
 *     apiKey: "unused",
 *     fetch: async (url, options) =>
 *       fetch(url, {
 *         ...options,
 *         headers: {
 *           ...options?.headers,
 *           Authorization: `Bearer ${access_token}`,
 *         },
 *       }),
 *   });
 *
 *   return client(process.env.ORG_GENAI_MODEL ?? "your-org-model");
 * }
 */
