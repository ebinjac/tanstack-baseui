import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { getAIModel } from "@/lib/ai/provider";
import { requireAuth } from "@/lib/middleware/auth.middleware";

// ─── Output Schema ────────────────────────────────────────────────────────────

const MetricsInsightsSchema = z.object({
  headline: z
    .string()
    .describe("One-sentence headline summarising the period (max 15 words)"),
  narrative: z
    .string()
    .describe(
      "2-3 sentence plain-English overview of team activity and health"
    ),
  resolutionRating: z
    .enum(["excellent", "good", "needs-attention", "critical"])
    .describe("Overall resolution performance rating"),
  anomalies: z
    .array(
      z.object({
        title: z.string().describe("Short label, e.g. 'High INC volume'"),
        detail: z.string().describe("1 sentence explanation"),
        severity: z.enum(["info", "warning", "critical"]),
      })
    )
    .max(4)
    .describe("Up to 4 notable patterns or anomalies in the data"),
  recommendation: z
    .string()
    .describe(
      "One concrete, actionable recommendation based on the data trends"
    ),
  teamLoadRating: z
    .enum(["low", "moderate", "high", "overloaded"])
    .describe("Assessment of team workload intensity over the period"),
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionItem {
  count: number;
  section: string;
}

interface TrendDay {
  created: number;
  date: string;
  resolved: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTrendSummary(trend: TrendDay[]): string {
  if (trend.length === 0) {
    return "No daily trend data.";
  }
  const totalCreated = trend.reduce((s, d) => s + d.created, 0);
  const totalResolved = trend.reduce((s, d) => s + d.resolved, 0);
  const peak = trend.reduce(
    (m, d) => (d.created > m.created ? d : m),
    trend[0]
  );
  return `Daily trend over ${trend.length} days: ${totalCreated} created, ${totalResolved} resolved. Peak day: ${peak.date} (${peak.created} created).`;
}

function buildSectionSummary(distribution: SectionItem[]): string {
  if (distribution.length === 0) {
    return "No section data.";
  }
  const sorted = [...distribution].sort((a, b) => b.count - a.count);
  return sorted.map((s) => `${s.section}: ${s.count}`).join(", ");
}

// ─── Server Action ────────────────────────────────────────────────────────────

/**
 * AI: Turnover Metrics Intelligence
 *
 * Analyses KPIs, activity trend, and section distribution
 * and returns narrative insights, anomalies, and recommendations.
 */
export const analyzeTurnoverMetrics = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        dateRange: z.string(), // e.g. "Feb 01 – Mar 01"
        kpis: z.object({
          totalEntries: z.number(),
          resolvedEntries: z.number(),
          openEntries: z.number(),
          criticalItems: z.number(),
          resolutionRate: z.number(),
        }),
        sectionDistribution: z.array(
          z.object({ section: z.string(), count: z.number() })
        ),
        activityTrend: z.array(
          z.object({
            date: z.string(),
            created: z.number(),
            resolved: z.number(),
          })
        ),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { dateRange, kpis, sectionDistribution, activityTrend } = data;

    if (kpis.totalEntries === 0) {
      return {
        headline: "No activity recorded in this period.",
        narrative: "The selected date range has no turnover entries.",
        resolutionRating: "good" as const,
        anomalies: [],
        recommendation:
          "Extend the date range or check that entries have been logged.",
        teamLoadRating: "low" as const,
      };
    }

    const trendSummary = buildTrendSummary(activityTrend);
    const sectionSummary = buildSectionSummary(sectionDistribution);

    const prompt = `You are an expert operations manager reviewing team turnover metrics.
Analyse the following data for the period: ${dateRange}

KPIs:
- Total entries: ${kpis.totalEntries}
- Resolved: ${kpis.resolvedEntries} (${kpis.resolutionRate}%)
- Open: ${kpis.openEntries}
- Critical/Important: ${kpis.criticalItems}

Section breakdown (sorted by volume): ${sectionSummary}

${trendSummary}

Provide a structured intelligence brief for the operations team.`;

    const model = getAIModel();

    const { object } = await generateObject({
      model,
      schema: MetricsInsightsSchema,
      system:
        "You are an expert operations intelligence system. Provide concise, professional analysis suitable for an operations team lead. Be specific, not generic.",
      prompt,
    });

    return object;
  });
