import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { scorecardAvailability, scorecardVolume } from "@/db/schema";
import { requireAuth } from "@/lib/middleware/auth.middleware";

// --- Types ---

export interface YearDataMonthRecord {
  availability: string;
  date: string; // e.g. "JAN2026"
  status: string;
  volume: string;
}

export interface YearDataResult {
  application: string;
  data: YearDataMonthRecord[];
}

// --- Helpers ---

const MONTH_ABBR: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

/**
 * Parses "MMMYYYY" (e.g. "JAN2026") into { year, month }.
 * Returns null when the format is unrecognised.
 */
export function parseDateLabel(
  label: string
): { year: number; month: number } | null {
  const abbr = label.slice(0, 3).toUpperCase();
  const yearStr = label.slice(3);
  const month = MONTH_ABBR[abbr];
  const year = Number.parseInt(yearStr, 10);

  if (!month || Number.isNaN(year)) {
    return null;
  }

  return { year, month };
}

/**
 * Returns true when the record was last touched by a real user (not auto-sync).
 * A null/undefined updatedBy means it was never manually edited.
 */
function isManuallyEdited(updatedBy: string | null | undefined): boolean {
  return !!updatedBy && updatedBy !== "system";
}

// --- Server Functions ---

/** Proxies the Year Data API and returns raw results. */
export const fetchYearData = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        scorecardIdentifier: z.string().min(1),
        timeframe: z.string().default("12"),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const baseUrl = process.env.YEAR_DATA_API_URL ?? "http://localhost:8008";

    const response = await fetch(`${baseUrl}/api/yeardata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timeframe: data.timeframe,
        application: [data.scorecardIdentifier],
        user: "system",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Year Data API returned ${response.status}: ${response.statusText}`
      );
    }

    const results = (await response.json()) as YearDataResult[];
    return { results };
  });

/**
 * Fetches the Year Data API and bulk-upserts availability + volume into the DB.
 *
 * Guards applied during sync:
 * 1. Zero values (availability = 0 or volume = 0) are skipped — these are
 *    almost certainly bad/missing data from the API, not real readings.
 * 2. Records that a real user has manually edited (updatedBy ≠ null/"system")
 *    are preserved as-is — manual corrections take priority over API data.
 *
 * Returns { synced, skippedZeros, skippedManual } for transparent feedback.
 */
export const syncScorecardEntry = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        entryId: z.uuid(),
        timeframe: z.string().default("12"),
      })
      .parse(data)
  )
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: sync logic branches over two resource types (availability + volume) each with two guards (zero-skip + manual-edit preservation)
  .handler(async ({ data }) => {
    // Resolve identifier from DB
    const entry = await db.query.scorecardEntries.findFirst({
      where: (entries, { eq: eqFn }) => eqFn(entries.id, data.entryId),
    });

    if (!entry) {
      throw new Error("Scorecard entry not found");
    }

    const { scorecardIdentifier } = entry;

    // Call the external API
    const baseUrl = process.env.YEAR_DATA_API_URL ?? "http://localhost:8008";

    const response = await fetch(`${baseUrl}/api/yeardata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timeframe: data.timeframe,
        application: [scorecardIdentifier],
        user: "system",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Year Data API returned ${response.status}: ${response.statusText}`
      );
    }

    const results = (await response.json()) as YearDataResult[];
    const appData = results[0]?.data ?? [];

    let synced = 0;
    let skippedZeros = 0;
    let skippedManual = 0;

    for (const record of appData) {
      const parsed = parseDateLabel(record.date);
      if (!parsed) {
        continue;
      }

      const { year, month } = parsed;
      const availValue = Number.parseFloat(record.availability);
      const volValue = Number.parseInt(record.volume, 10);

      // --- Availability ---
      if (!Number.isNaN(availValue)) {
        // Guard 1: skip zero — almost certainly missing/bad data from the API
        if (availValue === 0) {
          skippedZeros++;
        } else {
          const existingAvail = await db.query.scorecardAvailability.findFirst({
            where: (av, { and: andFn, eq: eqFn }) =>
              andFn(
                eqFn(av.scorecardEntryId, data.entryId),
                eqFn(av.year, year),
                eqFn(av.month, month)
              ),
          });

          if (existingAvail) {
            // Guard 2: skip if a human has manually edited this record
            if (isManuallyEdited(existingAvail.updatedBy)) {
              skippedManual++;
            } else {
              await db
                .update(scorecardAvailability)
                .set({
                  availability: String(availValue),
                  updatedBy: "system",
                })
                .where(eq(scorecardAvailability.id, existingAvail.id));
              synced++;
            }
          } else {
            await db.insert(scorecardAvailability).values({
              scorecardEntryId: data.entryId,
              year,
              month,
              availability: String(availValue),
              reason: null,
              createdBy: "system",
            });
            synced++;
          }
        }
      }

      // --- Volume ---
      if (!Number.isNaN(volValue)) {
        // Guard 1: skip zero volume
        if (volValue === 0) {
          skippedZeros++;
        } else {
          const existingVol = await db.query.scorecardVolume.findFirst({
            where: (vol, { and: andFn, eq: eqFn }) =>
              andFn(
                eqFn(vol.scorecardEntryId, data.entryId),
                eqFn(vol.year, year),
                eqFn(vol.month, month)
              ),
          });

          if (existingVol) {
            // Guard 2: skip if a human has manually edited this record
            if (isManuallyEdited(existingVol.updatedBy)) {
              skippedManual++;
            } else {
              await db
                .update(scorecardVolume)
                .set({ volume: volValue, updatedBy: "system" })
                .where(eq(scorecardVolume.id, existingVol.id));
              synced++;
            }
          } else {
            await db.insert(scorecardVolume).values({
              scorecardEntryId: data.entryId,
              year,
              month,
              volume: volValue,
              reason: null,
              createdBy: "system",
            });
            synced++;
          }
        }
      }
    }

    return { synced, skippedZeros, skippedManual };
  });
