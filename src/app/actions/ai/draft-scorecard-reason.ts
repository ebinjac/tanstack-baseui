import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { getAIModel } from "@/lib/ai/provider";
import { requireAuth } from "@/lib/middleware/auth.middleware";

/**
 * AI-2: Scorecard Reason Rewriter
 *
 * Takes the user's own draft reason for a threshold breach and rewrites
 * it into clear, professional operations language.
 * Only rewrites — does NOT invent content from thin air.
 */
export const draftScorecardReason = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        type: z.enum(["availability", "volume"]),
        appName: z.string().min(1),
        month: z.string(),
        value: z.string(),
        threshold: z.string(),
        change: z.string().optional(),
        // The user's current draft — required for rewrite mode
        draftReason: z.string(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { type, appName, month, value, threshold, change, draftReason } =
      data;

    const hasDraft = draftReason.trim().length > 0;

    if (!hasDraft) {
      // Nothing to rewrite — return the draft unchanged so the UI
      // knows no rewrite happened
      return { reason: draftReason };
    }

    const context =
      type === "availability"
        ? `${appName} recorded ${value} availability in ${month}, below the ${threshold} threshold.`
        : `${appName} had a ${change ?? "significant"} volume change in ${month} (value: ${value}, threshold: ${threshold}).`;

    const model = getAIModel();

    const { text } = await generateText({
      model,
      system: `You are an enterprise operations engineer rewriting breach reason notes for a scorecard.
RULES:
- Preserve all facts from the user's draft.
- Do NOT add information not present in the draft.
- Rewrite into clear, professional 1-3 sentence operations language.
- Return ONLY the rewritten reason as plain text — no quotes, no preamble.`,
      prompt: `Context: ${context}

User's draft reason:
"${draftReason}"

Rewrite this into polished, professional operations language.`,
      maxOutputTokens: 150,
    });

    return { reason: text.trim() };
  });
