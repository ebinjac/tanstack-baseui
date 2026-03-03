import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { getAIModel } from "@/lib/ai/provider";
import { requireAuth } from "@/lib/middleware/auth.middleware";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TurnoverEntryContext {
  appName: string;
  description?: string | null;
  incidentNumber?: string | null;
  isImportant: boolean;
  mimLink?: string | null;
  rfcNumber?: string | null;
  rfcStatus?: string | null;
  section: string;
  status: string;
  title: string;
}

/**
 * AI-6: Shift Handover Summary Generator
 *
 * Takes all turnover entries for the current shift and generates a
 * structured, plain-English handover brief that the incoming shift
 * can read quickly. Returns a formatted text summary to be stored
 * in finalized_turnovers.notes.
 */
export const generateHandoverSummary = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        teamId: z.uuid(),
        entries: z.array(
          z.object({
            section: z.string(),
            title: z.string(),
            status: z.string(),
            isImportant: z.boolean(),
            appName: z.string(),
            description: z.string().nullable().optional(),
            rfcNumber: z.string().nullable().optional(),
            rfcStatus: z.string().nullable().optional(),
            incidentNumber: z.string().nullable().optional(),
            mimLink: z.string().nullable().optional(),
          })
        ),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { entries } = data;

    if (entries.length === 0) {
      return {
        summary:
          "No entries recorded for this shift. The handover is clean with no open items.",
      };
    }

    // Format entries for context
    const entryContext = entries
      .map((e: TurnoverEntryContext) => {
        const parts = [
          `[${e.section}] ${e.title}`,
          `App: ${e.appName}`,
          `Status: ${e.status}`,
          e.isImportant ? "⚠️ IMPORTANT" : "",
          e.description ? `Details: ${e.description}` : "",
          e.rfcNumber
            ? `RFC: ${e.rfcNumber} (${e.rfcStatus ?? "pending"})`
            : "",
          e.incidentNumber ? `INC: ${e.incidentNumber}` : "",
        ]
          .filter(Boolean)
          .join(" | ");
        return parts;
      })
      .join("\n");

    const model = getAIModel();

    const { text } = await generateText({
      model,
      system: `You are an expert shift lead writing a concise handover brief for the incoming operations team.
Structure your response EXACTLY as follows:
🔴 CRITICAL (<count> items): Brief descriptions of open/important items
🟡 IN PROGRESS (<count> items): Items that are ongoing
🟢 RESOLVED (<count> items): Items that are resolved/closed
📢 COMMS: Any communications sent this shift (or "None")
📋 WATCH LIST: 2-3 specific things the next shift must monitor or follow up on

Keep each section to 1-2 lines. Be specific and actionable. Use shift turnover language.`,
      prompt: `Generate a shift handover brief from these turnover entries:\n\n${entryContext}`,
      maxOutputTokens: 400,
    });

    return { summary: text.trim() };
  });
