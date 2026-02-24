import { createServerFn } from "@tanstack/react-start";
import { subDays } from "date-fns";
import { and, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  applications,
  turnoverAppAssignmentGroups,
  turnoverAppCmdbCis,
  turnoverEntries,
  turnoverIncDetails,
  turnoverItsmRecords,
  turnoverRfcDetails,
  turnoverSettings,
} from "@/db/schema";
import { requireAuth } from "@/lib/middleware/auth.middleware";
import {
  BulkImportItsmSchema,
  ProcessReviewQueueItemSchema,
  SyncItsmSchema,
  UntrackItsmSchema,
  UpdateTurnoverSettingsSchema,
} from "@/lib/zod/itsm.schema";
import {
  ITSMClient,
  type ItsmChange,
  type ItsmIncident,
} from "../services/itsm-client";

// ========================
// Settings Actions
// ========================

export const getTurnoverSettings = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((teamId: string) => z.string().uuid().parse(teamId))
  .handler(async ({ data: teamId }) => {
    const [settings] = await db
      .select()
      .from(turnoverSettings)
      .where(eq(turnoverSettings.teamId, teamId));

    const workgroups = await db
      .select()
      .from(turnoverAppAssignmentGroups)
      .innerJoin(
        applications,
        eq(turnoverAppAssignmentGroups.applicationId, applications.id)
      )
      .where(eq(applications.teamId, teamId));

    return {
      teamId,
      maxSearchDays: settings?.maxSearchDays ?? 30,
      rfcImportMode: settings?.rfcImportMode ?? "REVIEW",
      incImportMode: settings?.incImportMode ?? "REVIEW",
      appWorkgroups: workgroups.map(
        ({ turnover_app_assignment_groups: wg }) => ({
          id: wg.id,
          applicationId: wg.applicationId,
          type: wg.type,
          groupName: wg.groupName,
        })
      ),
      appCmdbCis: await db
        .select()
        .from(turnoverAppCmdbCis)
        .innerJoin(
          applications,
          eq(turnoverAppCmdbCis.applicationId, applications.id)
        )
        .where(eq(applications.teamId, teamId))
        .then((res) =>
          res.map(({ turnover_app_cmdb_cis: ci }) => ({
            id: ci.id,
            applicationId: ci.applicationId,
            cmdbCiName: ci.cmdbCiName,
          }))
        ),
    };
  });

export const updateTurnoverSettings = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => UpdateTurnoverSettingsSchema.parse(data))
  .handler(async ({ data }) => {
    const { teamId, settings } = data;
    const { appWorkgroups, ...coreSettings } = settings;

    await db.transaction(async (tx) => {
      // 1. Update core settings
      await tx
        .insert(turnoverSettings)
        .values({ teamId, ...coreSettings })
        .onConflictDoUpdate({
          target: turnoverSettings.teamId,
          set: { ...coreSettings, updatedAt: new Date() },
        });

      // 2. Update workgroups
      // Delete existing workgroups for all team applications
      const teamApps = await tx
        .select({ id: applications.id })
        .from(applications)
        .where(eq(applications.teamId, teamId));

      const teamAppIds = teamApps.map((a) => a.id);

      if (teamAppIds.length > 0) {
        await tx.delete(turnoverAppAssignmentGroups).where(
          and(
            eq(turnoverAppAssignmentGroups.applicationId, teamAppIds[0]) // Placeholder
            // Drizzle doesn't have an easy "inArray" for DELETE in some versions, using raw if needed or loop
          )
        );

        // Manual loop delete to be safe with Drizzle versions
        for (const appId of teamAppIds) {
          await tx
            .delete(turnoverAppAssignmentGroups)
            .where(eq(turnoverAppAssignmentGroups.applicationId, appId));
        }
      }

      if (appWorkgroups.length > 0) {
        await tx.insert(turnoverAppAssignmentGroups).values(
          appWorkgroups.map((wg) => ({
            applicationId: wg.applicationId,
            type: wg.type,
            groupName: wg.groupName,
          }))
        );
      }

      // 3. Update CMDB CIs
      // Delete existing CMDB CIs for all team applications
      if (teamAppIds.length > 0) {
        for (const appId of teamAppIds) {
          await tx
            .delete(turnoverAppCmdbCis)
            .where(eq(turnoverAppCmdbCis.applicationId, appId));
        }
      }

      const appCmdbCis = settings.appCmdbCis || [];
      if (appCmdbCis.length > 0) {
        await tx.insert(turnoverAppCmdbCis).values(
          appCmdbCis.map((ci) => ({
            applicationId: ci.applicationId,
            cmdbCiName: ci.cmdbCiName,
          }))
        );
      }
    });

    return { success: true };
  });

// Helper for bulk import to reduce complexity
async function processBulkImportRecord({
  tx,
  record,
  cmdbCiMappings,
  fallbackApplicationId,
  userName,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: Transaction type is complex to type-safe here
  tx: any;
  record: typeof turnoverItsmRecords.$inferSelect;
  cmdbCiMappings: (typeof turnoverAppCmdbCis.$inferSelect)[];
  fallbackApplicationId?: string;
  userName: string;
}) {
  const rawData = record.rawData as Record<string, unknown>;
  const recordCmdbCi = rawData.cmdb_ci as string | undefined;

  let effectiveApplicationId = record.applicationId;

  // Try to resolve via CMDB CI if not already assigned
  if (!effectiveApplicationId && recordCmdbCi) {
    const match = cmdbCiMappings.find(
      (m) => m.cmdbCiName.toLowerCase() === recordCmdbCi.trim().toLowerCase()
    );
    if (match) {
      effectiveApplicationId = match.applicationId;
    }
  }

  // Fallback to provided default if still no app assigned
  if (!effectiveApplicationId && fallbackApplicationId) {
    effectiveApplicationId = fallbackApplicationId;
  }

  if (!effectiveApplicationId) {
    return false;
  }

  // 1. Create turnover entry
  const [entry] = await tx
    .insert(turnoverEntries)
    .values({
      teamId: record.teamId,
      applicationId: effectiveApplicationId,
      section: record.type,
      title: record.externalId,
      description:
        (rawData.short_description as string) ||
        (rawData.description as string) ||
        "",
      createdBy: `AUTO-${userName}`,
    })
    .returning();

  // 2. Create detail record
  if (record.type === "RFC") {
    await tx.insert(turnoverRfcDetails).values({
      entryId: entry.id,
      rfcNumber: record.externalId,
      rfcStatus: (rawData.state as string) || "Approved",
      cmdbCi: (rawData.cmdb_ci as string) || null,
      validatedBy: (rawData.assignment_group as string) || "Unknown",
    });
  } else {
    await tx.insert(turnoverIncDetails).values({
      entryId: entry.id,
      incidentNumber: record.externalId,
    });
  }

  // 3. Mark as imported
  await tx
    .update(turnoverItsmRecords)
    .set({ status: "IMPORTED", updatedAt: new Date() })
    .where(eq(turnoverItsmRecords.id, record.id));

  return true;
}

/**
 * HELPER: PROCESS ITSM ITEMS
 */
async function processItsmItems(params: {
  teamId: string;
  items: (ItsmChange | ItsmIncident)[];
  type: "RFC" | "INC";
  importMode: "AUTO" | "REVIEW";
  importedIds: Set<string>;
  groupToAppIds: Map<string, string[]>;
  ciToAppIds: Map<string, string[]>;
  fallbackApplicationId?: string;
}) {
  const {
    teamId,
    items,
    type,
    importMode,
    importedIds,
    groupToAppIds,
    ciToAppIds,
    fallbackApplicationId,
  } = params;

  console.log(
    `[SYNC] [${type}] Processing ${items.length} total items. Mode: ${importMode}`
  );

  for (const item of items) {
    if (importedIds.has(item.number)) {
      continue;
    }

    // Resolve target applications
    const targetAppIds = resolveTargetAppIds({
      item,
      groupToAppIds,
      ciToAppIds,
    });

    if (targetAppIds.size === 0 && fallbackApplicationId) {
      console.log(
        `[SYNC] [${type}] Using Fallback App for ${item.number}. Group: "${item.assignment_group}"`
      );
      targetAppIds.add(fallbackApplicationId);
    }

    if (targetAppIds.size === 0) {
      console.log(
        `[SYNC] [${type}] Skipping ${item.number} - No mapped app. Group: "${item.assignment_group}"`
      );
      continue;
    }

    const primaryAppId = Array.from(targetAppIds)[0];
    console.log(
      `[SYNC] [${type}] Resolved ${item.number} to ${targetAppIds.size} apps. Using Primary: ${primaryAppId}`
    );

    if (importMode === "AUTO") {
      await autoImportSyncRecord({
        teamId,
        type,
        item,
        applicationId: primaryAppId,
      });
    } else {
      await upsertReviewQueueItem({
        teamId,
        type,
        item,
        applicationId: primaryAppId,
      });
    }

    // Mark as processed per this run
    importedIds.add(item.number);
  }
}

function resolveTargetAppIds(params: {
  item: ItsmChange | ItsmIncident;
  groupToAppIds: Map<string, string[]>;
  ciToAppIds: Map<string, string[]>;
}): Set<string> {
  const { item, groupToAppIds, ciToAppIds } = params;
  const targetAppIds = new Set<string>();

  // 1. By assignment group
  const normalizedGroup = item.assignment_group?.trim().toLowerCase();
  for (const [groupName, appIds] of groupToAppIds.entries()) {
    if (groupName.trim().toLowerCase() === normalizedGroup) {
      for (const id of appIds) {
        targetAppIds.add(id);
      }
    }
  }

  // 2. By CMDB CI (if RFC)
  const recordCmdbCi =
    "cmdb_ci" in item
      ? (item as ItsmChange).cmdb_ci?.trim().toLowerCase()
      : undefined;
  if (recordCmdbCi) {
    for (const [ciName, appIds] of ciToAppIds.entries()) {
      if (ciName.trim().toLowerCase() === recordCmdbCi) {
        for (const id of appIds) {
          targetAppIds.add(id);
        }
      }
    }
  }

  return targetAppIds;
}

async function autoImportSyncRecord(params: {
  teamId: string;
  type: "RFC" | "INC";
  item: ItsmChange | ItsmIncident;
  applicationId: string;
}) {
  const { teamId, type, item, applicationId } = params;
  console.log(
    `[SYNC] [${type}] [AUTO] Importing ${item.number} into App: ${applicationId}`
  );

  await db.transaction(async (tx) => {
    const [entry] = await tx
      .insert(turnoverEntries)
      .values({
        teamId,
        applicationId,
        section: type,
        title: item.number,
        description: item.short_description,
        createdBy: "SYSTEM-AUTO",
      })
      .returning();

    if (type === "RFC") {
      const change = item as ItsmChange;
      await tx.insert(turnoverRfcDetails).values({
        entryId: entry.id,
        rfcNumber: change.number,
        rfcStatus: change.state,
        validatedBy: change.assignment_group,
        cmdbCi: change.cmdb_ci,
      });
    } else {
      await tx.insert(turnoverIncDetails).values({
        entryId: entry.id,
        incidentNumber: item.number,
      });
    }

    // 3. Mark as imported in the queue if it exists
    await tx
      .update(turnoverItsmRecords)
      .set({ status: "IMPORTED", updatedAt: new Date() })
      .where(
        and(
          eq(turnoverItsmRecords.teamId, teamId),
          eq(turnoverItsmRecords.externalId, item.number)
        )
      );
  });
}

async function upsertReviewQueueItem(params: {
  teamId: string;
  type: "RFC" | "INC";
  item: ItsmChange | ItsmIncident;
  applicationId: string;
}) {
  const { teamId, type, item, applicationId } = params;
  try {
    await db
      .insert(turnoverItsmRecords)
      .values({
        teamId,
        applicationId,
        externalId: item.number,
        type,
        rawData: item as unknown as Record<string, unknown>,
        status: "PENDING",
      })
      .onConflictDoUpdate({
        target: [turnoverItsmRecords.teamId, turnoverItsmRecords.externalId],
        set: {
          rawData: sql`excluded.raw_data`,
          updatedAt: sql`now()`,
          applicationId: sql`excluded.application_id`,
        },
        where: eq(turnoverItsmRecords.status, "PENDING"),
      });
  } catch (err) {
    console.error(
      `[SYNC] [${type}] Error upserting ${item.number} for App ${applicationId}:`,
      err
    );
  }
}

// ========================
// Sync Actions
// ========================

export const syncItsmItems = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => SyncItsmSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const { teamId, fallbackApplicationId } = data;
      console.log(
        `[SYNC] Starting sync for team: ${teamId}. Fallback: ${fallbackApplicationId}`
      );

      // 1. Get settings and workgroups
      const [settings] = await db
        .select()
        .from(turnoverSettings)
        .where(eq(turnoverSettings.teamId, teamId));

      const workgroups = await db
        .select()
        .from(turnoverAppAssignmentGroups)
        .innerJoin(
          applications,
          eq(turnoverAppAssignmentGroups.applicationId, applications.id)
        )
        .where(eq(applications.teamId, teamId));

      const cmdbCis = await db
        .select()
        .from(turnoverAppCmdbCis)
        .innerJoin(
          applications,
          eq(turnoverAppCmdbCis.applicationId, applications.id)
        )
        .where(eq(applications.teamId, teamId));

      if (workgroups.length === 0) {
        return {
          success: false,
          message: "No ITSM assignment groups configured for this team.",
        };
      }

      const now = new Date();
      const maxSearchDays = settings?.maxSearchDays ?? 30;
      const minDate = subDays(now, maxSearchDays);

      console.log(
        `[SYNC] Fetching since ${minDate.toISOString()} (Max days: ${maxSearchDays})`
      );

      // 2. Fetch all existing entries for deduplication
      const existingRfcEntries = await db
        .select({ num: turnoverRfcDetails.rfcNumber })
        .from(turnoverRfcDetails)
        .innerJoin(
          turnoverEntries,
          eq(turnoverRfcDetails.entryId, turnoverEntries.id)
        )
        .where(eq(turnoverEntries.teamId, teamId));

      const existingIncEntries = await db
        .select({ num: turnoverIncDetails.incidentNumber })
        .from(turnoverIncDetails)
        .innerJoin(
          turnoverEntries,
          eq(turnoverIncDetails.entryId, turnoverEntries.id)
        )
        .where(eq(turnoverEntries.teamId, teamId));

      const existingItsmRecords = await db
        .select({ extId: turnoverItsmRecords.externalId })
        .from(turnoverItsmRecords)
        .where(
          and(
            eq(turnoverItsmRecords.teamId, teamId),
            or(
              eq(turnoverItsmRecords.status, "IMPORTED"),
              eq(turnoverItsmRecords.status, "REJECTED")
            )
          )
        );

      const importedIds = new Set([
        ...existingRfcEntries.map((e) => e.num),
        ...existingIncEntries.map((e) => e.num),
        ...existingItsmRecords.map((e) => e.extId),
      ]);
      console.log(`[SYNC] Initial Exclusion set size: ${importedIds.size}`);

      // 3. Build mappings for batched processing
      const groupToAppIds = new Map<string, string[]>();
      const ciToAppIds = new Map<string, string[]>();

      const rfcGroupNames = new Set<string>();
      const incGroupNames = new Set<string>();
      const allCmdbCis = new Set<string>();

      for (const { turnover_app_assignment_groups: wg } of workgroups) {
        const groupApps = groupToAppIds.get(wg.groupName) || [];
        groupApps.push(wg.applicationId);
        groupToAppIds.set(wg.groupName, groupApps);

        if (wg.type === "RFC") {
          rfcGroupNames.add(wg.groupName);
        } else {
          incGroupNames.add(wg.groupName);
        }
      }

      for (const { turnover_app_cmdb_cis: ci } of cmdbCis) {
        const ciApps = ciToAppIds.get(ci.cmdbCiName) || [];
        ciApps.push(ci.applicationId);
        ciToAppIds.set(ci.cmdbCiName, ciApps);
        allCmdbCis.add(ci.cmdbCiName);
      }

      // 4. Batch sync for RFCs
      if (rfcGroupNames.size > 0) {
        console.log(`[SYNC] Batching RFCs for ${rfcGroupNames.size} groups`);
        try {
          const changes = await ITSMClient.getChanges({
            assignment_group: Array.from(rfcGroupNames).join(","),
            opened_at_min: minDate,
            opened_at_max: now,
            cmdb_ci:
              allCmdbCis.size > 0
                ? Array.from(allCmdbCis).join(",")
                : undefined,
          });
          await processItsmItems({
            teamId,
            items: changes,
            type: "RFC",
            importMode: settings?.rfcImportMode ?? "REVIEW",
            importedIds: new Set(importedIds), // Clone to avoid mutation interfering with INC run if any
            groupToAppIds,
            ciToAppIds,
            fallbackApplicationId,
          });
        } catch (error) {
          console.error("[SYNC] RFC Batch API Error:", error);
        }
      }

      // 5. Batch sync for Incidents
      if (incGroupNames.size > 0) {
        console.log(
          `[SYNC] Batching Incidents for ${incGroupNames.size} groups`
        );
        try {
          const incidents = await ITSMClient.getIncidents({
            assignment_group: Array.from(incGroupNames).join(","),
            opened_at_min: minDate,
            opened_at_max: now,
          });
          await processItsmItems({
            teamId,
            items: incidents,
            type: "INC",
            importMode: settings?.incImportMode ?? "REVIEW",
            importedIds: new Set(importedIds),
            groupToAppIds,
            ciToAppIds,
            fallbackApplicationId,
          });
        } catch (error) {
          console.error("[SYNC] INC Batch API Error:", error);
        }
      }

      console.log("[SYNC] Completed successfully");
      return { success: true };
    } catch (err) {
      console.error("[SYNC] CRITICAL ERROR:", err);
      return { success: false, message: "Internal sync error" };
    }
  });

// ========================
// Review Queue Actions
// ========================

export const getReviewQueue = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((teamId: string) => z.string().uuid().parse(teamId))
  .handler(async ({ data: teamId }) => {
    console.log(`[QUEUE] Fetching review queue for team: ${teamId}`);
    const records = await db
      .select({
        id: turnoverItsmRecords.id,
        teamId: turnoverItsmRecords.teamId,
        applicationId: turnoverItsmRecords.applicationId,
        externalId: turnoverItsmRecords.externalId,
        type: turnoverItsmRecords.type,
        status: turnoverItsmRecords.status,
        rawData: turnoverItsmRecords.rawData,
        createdAt: turnoverItsmRecords.createdAt,
        updatedAt: turnoverItsmRecords.updatedAt,
      })
      .from(turnoverItsmRecords)
      .where(
        and(
          eq(turnoverItsmRecords.teamId, teamId),
          eq(turnoverItsmRecords.status, "PENDING")
        )
      );

    // biome-ignore lint/suspicious/noExplicitAny: Complex type cast for TanStack Start compatibility
    return records as any;
  });

export const processReviewQueueItem = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => ProcessReviewQueueItemSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.action === "REJECT") {
      await db
        .update(turnoverItsmRecords)
        .set({ status: "REJECTED" })
        .where(eq(turnoverItsmRecords.id, data.id));
    } else {
      // IMPORT action is handled by the frontend calling createTurnoverEntry
      // and then we mark this as IMPORTED.
      await db
        .update(turnoverItsmRecords)
        .set({ status: "IMPORTED" })
        .where(eq(turnoverItsmRecords.id, data.id));
    }

    return { success: true };
  });

export const bulkImportItsmRecords = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => BulkImportItsmSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { ids, fallbackApplicationId } = data;
    const userName = context.userName || "SYSTEM";

    let importedCount = 0;
    let skippedCount = 0;

    await db.transaction(async (tx) => {
      // Fetch all CMDB CI mappings for potentially relevant applications
      const cmdbCiMappings = await tx.select().from(turnoverAppCmdbCis);

      for (const id of ids) {
        const [record] = await tx
          .select()
          .from(turnoverItsmRecords)
          .where(eq(turnoverItsmRecords.id, id));

        if (!record || record.status !== "PENDING") {
          skippedCount++;
          continue;
        }

        const success = await processBulkImportRecord({
          tx,
          record,
          cmdbCiMappings,
          fallbackApplicationId,
          userName,
        });

        if (success) {
          importedCount++;
        } else {
          skippedCount++;
        }
      }
    });

    return {
      success: true,
      importedCount,
      skippedCount,
      message: `Successfully imported ${importedCount} records.${skippedCount > 0 ? ` Skipped ${skippedCount} unassigned records.` : ""}`,
    };
  });

export const untrackItsmRecord = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => UntrackItsmSchema.parse(data))
  .handler(async ({ data }) => {
    const { entryId, teamId } = data;

    // 1. Identify the record details to get external IDs
    const rfc = await db.query.turnoverRfcDetails.findFirst({
      where: eq(turnoverRfcDetails.entryId, entryId),
    });
    const inc = await db.query.turnoverIncDetails.findFirst({
      where: eq(turnoverIncDetails.entryId, entryId),
    });

    const externalId = rfc?.rfcNumber || inc?.incidentNumber;

    if (externalId) {
      // 2. Set status to REJECTED in review queue
      await db
        .update(turnoverItsmRecords)
        .set({ status: "REJECTED" })
        .where(
          and(
            eq(turnoverItsmRecords.teamId, teamId),
            eq(turnoverItsmRecords.externalId, externalId)
          )
        );
    }

    // 3. Delete the turnover entry (cascades)
    await db.delete(turnoverEntries).where(eq(turnoverEntries.id, entryId));

    return { success: true };
  });
