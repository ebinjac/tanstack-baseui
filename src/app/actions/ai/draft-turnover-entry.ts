import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { getAIModel } from "@/lib/ai/provider";
import { requireAuth } from "@/lib/middleware/auth.middleware";

const JSON_OBJECT_REGEX = /\{[\s\S]*\}/;

/**
 * AI-5: Turnover Entry Rewriter
 *
 * Takes the user's own description/comments and rewrites them into
 * clear, professional ops-team language. Does NOT invent content —
 * it only polishes what the user has already written.
 */
export const draftTurnoverEntry = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        section: z.enum(["RFC", "INC", "ALERTS", "MIM", "COMMS", "FYI"]),
        // User-entered content to rewrite
        description: z.string().optional(),
        comments: z.string().optional(), // may be HTML from RichTextEditor
        // Lightweight context (optional)
        title: z.string().optional(),
        rfcNumber: z.string().optional(),
        incidentNumber: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { section, description, comments, title, rfcNumber, incidentNumber } =
      data;

    const hasContent =
      (description && description.trim().length > 0) ||
      (comments && comments.replace(/<[^>]+>/g, "").trim().length > 0);

    if (!hasContent) {
      return { description: description ?? "", comments: comments ?? "" };
    }

    // Strip HTML tags from comments for the prompt input
    const plainComments = comments
      ? comments
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : "";

    const contextLine = [
      section,
      title && `Title: ${title}`,
      rfcNumber && `RFC: ${rfcNumber}`,
      incidentNumber && `INC: ${incidentNumber}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const systemPrompt = `You are an expert enterprise operations engineer who writes concise, professional shift turnover notes.
Your task is to REWRITE the user's draft — preserving all the facts and intent — into clear, professional ops-team language.
Do NOT add new information. Do NOT remove facts already present. Only improve wording, grammar, and clarity.
Return ONLY a JSON object with exactly two string fields:
  "description" — the rewritten plain-text description (1-3 sentences)
  "comments"    — the rewritten content as clean HTML using only <p>, <ul>, <li>, <strong> tags`;

    const userPrompt = `Context: ${contextLine}

USER'S DRAFT DESCRIPTION:
${description || "(empty)"}

USER'S DRAFT COMMENTS (plain text extracted):
${plainComments || "(empty)"}

Rewrite both into professional ops-team language. Return JSON only.`;

    const model = getAIModel();

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 600,
    });

    let rewrittenDescription = description ?? "";
    let rewrittenComments = comments ?? "";

    try {
      const jsonMatch = text.match(JSON_OBJECT_REGEX);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          description?: string;
          comments?: string;
        };
        if (parsed.description) {
          rewrittenDescription = parsed.description;
        }
        if (parsed.comments) {
          rewrittenComments = parsed.comments;
        }
      }
    } catch {
      // If parsing fails, return original user text unchanged
    }

    return { description: rewrittenDescription, comments: rewrittenComments };
  });
