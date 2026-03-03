import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import type { LinkWithRelations } from "@/db/schema/links";
import { links } from "@/db/schema/links";
import { getAIModel } from "@/lib/ai/provider";
import { requireAuth } from "@/lib/middleware/auth.middleware";

// ─── Schemas ───────────────────────────────────────────────────────────────

const AILinkMatchSchema = z.object({
  matches: z
    .array(
      z.object({
        linkId: z.string().describe("The UUID of the matched link"),
        relevanceScore: z
          .number()
          .min(0)
          .max(1)
          .describe(
            "How relevant this link is (0 = not relevant, 1 = perfect match)"
          ),
        reason: z
          .string()
          .describe(
            "One-sentence explanation of why this link matches the query"
          ),
      })
    )
    .describe("List of matching links ordered by relevance (highest first)"),
  summary: z
    .string()
    .describe(
      "A short, friendly response to the user's query (1-2 sentences). Mention the count of results found and any key information."
    ),
  noResultsMessage: z
    .string()
    .optional()
    .describe(
      "If no links match, provide a helpful message explaining why and suggest alternative search terms."
    ),
});

type AILinkMatch = z.infer<typeof AILinkMatchSchema>;

export interface AILinkSearchResult {
  matches: Array<{
    link: LinkWithRelations;
    relevanceScore: number;
    reason: string;
  }>;
  noResultsMessage?: string;
  summary: string;
}

// ─── Helper: build compact context string ─────────────────────────────────

function buildLinksContext(allLinks: LinkWithRelations[]): string {
  return allLinks
    .map((link) => {
      const parts = [
        `ID: ${link.id}`,
        `Title: ${link.title}`,
        `URL: ${link.url}`,
      ];
      if (link.description) {
        parts.push(`Description: ${link.description}`);
      }
      if (link.application?.applicationName) {
        parts.push(
          `Application: ${link.application.applicationName} (${link.application.tla})`
        );
      }
      if (link.category?.name) {
        parts.push(`Category: ${link.category.name}`);
      }
      if (link.tags && link.tags.length > 0) {
        parts.push(`Tags: ${link.tags.join(", ")}`);
      }
      parts.push(`Visibility: ${link.visibility}`);
      return parts.join(" | ");
    })
    .join("\n");
}

// ─── Server Function ───────────────────────────────────────────────────────

/**
 * AI-powered natural language link search.
 *
 * The user can ask questions like:
 *  - "give me the Dynatrace link for KMS"
 *  - "show me all monitoring links"
 *  - "find the CI/CD pipeline for TKS"
 *
 * The LLM receives all accessible team links as context and returns
 * structured JSON indicating which links best match the query.
 */
export const searchLinksWithAI = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        teamId: z.uuid(),
        query: z.string().min(1).max(500),
      })
      .parse(data)
  )
  .handler(async ({ data, context }): Promise<AILinkSearchResult> => {
    const { teamId, query } = data;
    const userEmail = context.userEmail;

    // 1. Fetch all accessible links for this team
    //    (public links + user's own private links)
    const accessibleLinks = await db.query.links.findMany({
      where: and(
        eq(links.teamId, teamId),
        or(
          eq(links.visibility, "public"),
          and(eq(links.visibility, "private"), eq(links.userEmail, userEmail))
        )
      ),
      with: {
        category: true,
        application: true,
      },
      orderBy: (l, { desc }) => [desc(l.usageCount)],
      // Safety cap — LLM context window guard
      limit: 200,
    });

    if (accessibleLinks.length === 0) {
      return {
        matches: [],
        summary: "No links found in this team's repository yet.",
        noResultsMessage:
          "Your team hasn't added any links to the Link Manager yet. Add some links first and then try asking me!",
      };
    }

    // 2. Build compact context string for the LLM
    const linksContext = buildLinksContext(accessibleLinks);

    // 3. Call the LLM with structured output
    const model = getAIModel();

    const { object } = await generateObject<AILinkMatch>({
      model,
      schema: AILinkMatchSchema,
      system: `You are a helpful assistant for an enterprise Link Manager tool called Ensemble.
Your job is to find the most relevant links from the team's link repository based on the user's natural language query.

IMPORTANT RULES:
- Only return links that are genuinely relevant to the query
- Order matches by relevance (most relevant first)
- Limit results to a maximum of 10 matches
- If no links match well, return an empty matches array and use noResultsMessage
- Be concise and professional in your summary and reasons
- The links below contain: ID, Title, URL, Description, Application, Category, Tags, Visibility`,
      prompt: `USER QUERY: "${query}"

AVAILABLE LINKS IN THE TEAM REPOSITORY:
${linksContext}

Find the links that best answer the user's query. Return their IDs, relevance scores, and a brief reason for each match.`,
    });

    // 4. Map AI-returned link IDs back to full link objects
    const linkMap = new Map(accessibleLinks.map((l) => [l.id, l]));

    const matches = object.matches
      .filter((m) => m.relevanceScore > 0.2 && linkMap.has(m.linkId))
      .slice(0, 10)
      .map((m) => ({
        link: linkMap.get(m.linkId) as LinkWithRelations,
        relevanceScore: m.relevanceScore,
        reason: m.reason,
      }));

    return {
      matches,
      summary: object.summary,
      noResultsMessage:
        matches.length === 0 ? object.noResultsMessage : undefined,
    };
  });
