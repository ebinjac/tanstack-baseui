import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { getAIModel } from "@/lib/ai/provider";
import { requireAuth } from "@/lib/middleware/auth.middleware";

// ─── Types ──────────────────────────────────────────────────────────────────

interface HealthRecord {
  availability?: string | null;
  availabilityBreach: boolean;
  month: string;
  reason?: string | null;
  volume?: number | null;
  volumeBreach: boolean;
  volumeChange?: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatVolumeChange(r: HealthRecord): string {
  if (!r.volumeBreach) {
    return "";
  }
  if (r.volumeChange == null) {
    return " (breach)";
  }
  const sign = r.volumeChange > 0 ? "+" : "";
  return ` (${sign}${r.volumeChange}%)`;
}

function formatRecord(r: HealthRecord): string {
  const parts = [`Month: ${r.month}`];
  if (r.availability) {
    parts.push(
      `Avail: ${r.availability}%${r.availabilityBreach ? " [BREACH]" : ""}`
    );
  }
  if (r.volume != null) {
    parts.push(`Vol: ${r.volume.toLocaleString()}${formatVolumeChange(r)}`);
  }
  if (r.reason) {
    parts.push(`Reason: ${r.reason}`);
  }
  return parts.join(", ");
}

const InsightsSchema = z.object({
  narrative: z
    .string()
    .describe(
      "2-3 sentence plain-English health summary for an operations audience"
    ),
  healthScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Overall health score 0-100 based on breaches and trends. 100 = perfect availability, 0 = multiple critical breaches"
    ),
  trend: z
    .enum(["improving", "stable", "degrading"])
    .describe("Availability trend based on recent months vs earlier months"),
  keyRisks: z
    .array(z.string())
    .max(3)
    .describe(
      "Up to 3 specific risk observations (e.g. month with worst breach)"
    ),
  recommendation: z
    .string()
    .describe(
      "One concrete, actionable recommendation for the operations team"
    ),
});

// ─── Action ──────────────────────────────────────────────────────────────────

/**
 * AI-3: Scorecard Health Insights
 *
 * Analyzes 12 months of availability + volume data for an application
 * and returns a structured insights object with trends, anomalies,
 * and a plain-English narrative.
 */
export const generateScorecardInsights = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        appName: z.string(),
        availabilityThreshold: z.number(),
        volumeChangeThreshold: z.number(),
        records: z.array(
          z.object({
            month: z.string(),
            availability: z.string().nullable().optional(),
            availabilityBreach: z.boolean(),
            volume: z.number().nullable().optional(),
            volumeChange: z.number().nullable().optional(),
            volumeBreach: z.boolean(),
            reason: z.string().nullable().optional(),
          })
        ),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { appName, availabilityThreshold, records } = data;

    if (records.length === 0) {
      return {
        narrative: "No data available to analyze.",
        healthScore: null,
        keyRisks: [],
        recommendation: "",
        trend: "stable" as const,
      };
    }

    const context = records.map(formatRecord).join("\n");
    const model = getAIModel();

    const { object } = await generateObject({
      model,
      schema: InsightsSchema,
      system:
        "You are an expert SRE/operations analyst reviewing application health metrics. Provide concise, professional insights.",
      prompt: `Analyze the following ${records.length}-month health data for ${appName} (availability threshold: ${availabilityThreshold}%):\n\n${context}\n\nProvide a health summary, score, trend, key risks, and recommendation.`,
    });

    return object;
  });
