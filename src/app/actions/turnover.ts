import { createServerFn } from "@tanstack/react-start";
import { getSession } from "../ssr/auth";
import { db } from "@/db";
import {
    turnoverEntries,
    turnoverRfcDetails,
    turnoverIncDetails,
    turnoverMimDetails,
    turnoverCommsDetails,
    finalizedTurnovers,
} from "@/db/schema/turnover";
import {
    CreateTurnoverEntrySchema,
    UpdateTurnoverEntrySchema,
    ToggleImportantSchema,
    ResolveEntrySchema,
    DeleteEntrySchema,
    GetEntriesSchema,
    FinalizeTurnoverSchema,
    GetFinalizedTurnoversSchema,
    GetTurnoverMetricsSchema,
} from "@/lib/zod/turnover.schema";
import { z } from "zod";
import { and, desc, eq, gte, lte, or, sql, count } from "drizzle-orm";

// ========================
// Entry Management
// ========================

/**
 * CREATE TURNOVER ENTRY
 */
export const createTurnoverEntry = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => CreateTurnoverEntrySchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session?.user?.email) throw new Error("Unauthorized");

        const userEmail = session.user.email;
        const userName = `${session.user.firstName} ${session.user.lastName}`;

        // Generate title based on section if not provided
        let title = data.title;
        if (!title || title.trim() === "") {
            switch (data.section) {
                case "RFC":
                    title = data.rfcNumber || "RFC Entry";
                    break;
                case "INC":
                    title = data.incidentNumber || "Incident Entry";
                    break;
                case "ALERTS":
                    title = "Alert Entry";
                    break;
                case "MIM":
                    title = "MIM Entry";
                    break;
                case "COMMS":
                    title = data.emailSubject || "Communication";
                    break;
                case "FYI":
                    title = data.description?.substring(0, 50) || "FYI Entry";
                    break;
            }
        }

        // Insert main entry
        const [entry] = await db
            .insert(turnoverEntries)
            .values({
                teamId: data.teamId,
                applicationId: data.applicationId,
                section: data.section,
                title,
                description: data.description,
                comments: data.comments,
                isImportant: data.isImportant,
                createdBy: userName,
            })
            .returning();

        // Insert section-specific details
        switch (data.section) {
            case "RFC":
                if (data.rfcNumber && data.rfcStatus && data.validatedBy) {
                    await db.insert(turnoverRfcDetails).values({
                        entryId: entry.id,
                        rfcNumber: data.rfcNumber,
                        rfcStatus: data.rfcStatus,
                        validatedBy: data.validatedBy,
                    });
                }
                break;
            case "INC":
                if (data.incidentNumber) {
                    await db.insert(turnoverIncDetails).values({
                        entryId: entry.id,
                        incidentNumber: data.incidentNumber,
                    });
                }
                break;
            case "MIM":
                if (data.mimLink) {
                    await db.insert(turnoverMimDetails).values({
                        entryId: entry.id,
                        mimLink: data.mimLink,
                        mimSlackLink: data.mimSlackLink || null,
                    });
                }
                break;
            case "COMMS":
                await db.insert(turnoverCommsDetails).values({
                    entryId: entry.id,
                    emailSubject: data.emailSubject || null,
                    slackLink: data.slackLink || null,
                });
                break;
        }

        return { success: true, entryId: entry.id };
    });

/**
 * UPDATE TURNOVER ENTRY
 */
export const updateTurnoverEntry = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => UpdateTurnoverEntrySchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session?.user?.email) throw new Error("Unauthorized");

        const userName = `${session.user.firstName} ${session.user.lastName}`;

        // Verify entry exists
        const existingEntry = await db.query.turnoverEntries.findFirst({
            where: eq(turnoverEntries.id, data.id),
        });

        if (!existingEntry) throw new Error("Entry not found");

        // Update main entry
        await db
            .update(turnoverEntries)
            .set({
                title: data.title,
                description: data.description,
                comments: data.comments,
                isImportant: data.isImportant,
                updatedBy: userName,
                updatedAt: new Date(),
            })
            .where(eq(turnoverEntries.id, data.id));

        // Update section-specific details
        switch (existingEntry.section) {
            case "RFC":
                if (data.rfcNumber && data.rfcStatus && data.validatedBy) {
                    const existingRfc = await db.query.turnoverRfcDetails.findFirst({
                        where: eq(turnoverRfcDetails.entryId, data.id),
                    });

                    if (existingRfc) {
                        await db
                            .update(turnoverRfcDetails)
                            .set({
                                rfcNumber: data.rfcNumber,
                                rfcStatus: data.rfcStatus,
                                validatedBy: data.validatedBy,
                            })
                            .where(eq(turnoverRfcDetails.entryId, data.id));
                    } else {
                        await db.insert(turnoverRfcDetails).values({
                            entryId: data.id,
                            rfcNumber: data.rfcNumber,
                            rfcStatus: data.rfcStatus,
                            validatedBy: data.validatedBy,
                        });
                    }
                }
                break;
            case "INC":
                if (data.incidentNumber) {
                    const existingInc = await db.query.turnoverIncDetails.findFirst({
                        where: eq(turnoverIncDetails.entryId, data.id),
                    });

                    if (existingInc) {
                        await db
                            .update(turnoverIncDetails)
                            .set({ incidentNumber: data.incidentNumber })
                            .where(eq(turnoverIncDetails.entryId, data.id));
                    } else {
                        await db.insert(turnoverIncDetails).values({
                            entryId: data.id,
                            incidentNumber: data.incidentNumber,
                        });
                    }
                }
                break;
            case "MIM":
                if (data.mimLink) {
                    const existingMim = await db.query.turnoverMimDetails.findFirst({
                        where: eq(turnoverMimDetails.entryId, data.id),
                    });

                    if (existingMim) {
                        await db
                            .update(turnoverMimDetails)
                            .set({
                                mimLink: data.mimLink,
                                mimSlackLink: data.mimSlackLink || null,
                            })
                            .where(eq(turnoverMimDetails.entryId, data.id));
                    } else {
                        await db.insert(turnoverMimDetails).values({
                            entryId: data.id,
                            mimLink: data.mimLink,
                            mimSlackLink: data.mimSlackLink || null,
                        });
                    }
                }
                break;
            case "COMMS":
                const existingComms = await db.query.turnoverCommsDetails.findFirst({
                    where: eq(turnoverCommsDetails.entryId, data.id),
                });

                if (existingComms) {
                    await db
                        .update(turnoverCommsDetails)
                        .set({
                            emailSubject: data.emailSubject || null,
                            slackLink: data.slackLink || null,
                        })
                        .where(eq(turnoverCommsDetails.entryId, data.id));
                } else {
                    await db.insert(turnoverCommsDetails).values({
                        entryId: data.id,
                        emailSubject: data.emailSubject || null,
                        slackLink: data.slackLink || null,
                    });
                }
                break;
        }

        return { success: true };
    });

/**
 * DELETE TURNOVER ENTRY
 */
export const deleteTurnoverEntry = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => DeleteEntrySchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session?.user?.email) throw new Error("Unauthorized");

        // Delete entry (cascades to extension tables)
        await db.delete(turnoverEntries).where(eq(turnoverEntries.id, data.id));

        return { success: true };
    });

/**
 * TOGGLE IMPORTANT FLAG
 */
export const toggleImportantEntry = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => ToggleImportantSchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session?.user?.email) throw new Error("Unauthorized");

        const userName = `${session.user.firstName} ${session.user.lastName}`;

        await db
            .update(turnoverEntries)
            .set({
                isImportant: data.isImportant,
                updatedBy: userName,
                updatedAt: new Date(),
            })
            .where(eq(turnoverEntries.id, data.id));

        return { success: true };
    });

/**
 * RESOLVE ENTRY
 */
export const resolveTurnoverEntry = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => ResolveEntrySchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session?.user?.email) throw new Error("Unauthorized");

        const userName = `${session.user.firstName} ${session.user.lastName}`;

        await db
            .update(turnoverEntries)
            .set({
                status: "RESOLVED",
                resolvedBy: userName,
                resolvedAt: new Date(),
                updatedBy: userName,
                updatedAt: new Date(),
            })
            .where(eq(turnoverEntries.id, data.id));

        return { success: true };
    });

/**
 * GET TURNOVER ENTRIES
 */
export const getTurnoverEntries = createServerFn({ method: "GET" })
    .inputValidator((data: unknown) => GetEntriesSchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session?.user?.email) throw new Error("Unauthorized");

        const { teamId, applicationId, section, status, includeRecentlyResolved, limit = 50, offset = 0 } = data;

        const filters = [eq(turnoverEntries.teamId, teamId)];

        if (applicationId) {
            filters.push(eq(turnoverEntries.applicationId, applicationId));
        }

        if (section) {
            filters.push(eq(turnoverEntries.section, section));
        }

        // Handle status filter with includeRecentlyResolved option
        if (includeRecentlyResolved) {
            // Include OPEN entries AND entries resolved within last 24 hours
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            filters.push(
                or(
                    eq(turnoverEntries.status, "OPEN"),
                    and(
                        eq(turnoverEntries.status, "RESOLVED"),
                        gte(turnoverEntries.resolvedAt, twentyFourHoursAgo)
                    )
                )!
            );
        } else if (status) {
            filters.push(eq(turnoverEntries.status, status));
        }

        const entries = await db.query.turnoverEntries.findMany({
            where: and(...filters),
            orderBy: [desc(turnoverEntries.isImportant), desc(turnoverEntries.createdAt)],
            limit,
            offset,
            with: {
                application: {
                    columns: {
                        applicationName: true,
                        tla: true,
                        tier: true,
                    },
                },
                rfcDetails: true,
                incDetails: true,
                mimDetails: true,
                commsDetails: true,
            },
        });

        // Get total count
        const countResult = await db
            .select({ count: count() })
            .from(turnoverEntries)
            .where(and(...filters));

        return {
            entries,
            total: countResult[0]?.count || 0,
        };
    });

/**
 * GET ENTRIES FOR DISPATCH (includes RESOLVED from today)
 */
export const getDispatchEntries = createServerFn({ method: "GET" })
    .inputValidator((data: unknown) =>
        z.object({ teamId: z.string().uuid() }).parse(data)
    )
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session?.user?.email) throw new Error("Unauthorized");

        const { teamId } = data;

        // Get today's start
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all OPEN entries OR entries resolved today
        const entries = await db.query.turnoverEntries.findMany({
            where: and(
                eq(turnoverEntries.teamId, teamId),
                or(
                    eq(turnoverEntries.status, "OPEN"),
                    and(
                        eq(turnoverEntries.status, "RESOLVED"),
                        gte(turnoverEntries.updatedAt, today)
                    )
                )
            ),
            orderBy: [desc(turnoverEntries.isImportant), desc(turnoverEntries.createdAt)],
            with: {
                application: {
                    columns: {
                        id: true,
                        applicationName: true,
                        tla: true,
                        tier: true,
                    },
                },
                rfcDetails: true,
                incDetails: true,
                mimDetails: true,
                commsDetails: true,
            },
        });

        return entries;
    });

// ========================
// Finalization
// ========================

/**
 * CHECK IF CAN FINALIZE (Cooldown check)
 */
export const canFinalizeTurnover = createServerFn({ method: "GET" })
    .inputValidator((data: unknown) =>
        z.object({ teamId: z.string().uuid() }).parse(data)
    )
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session?.user?.email) throw new Error("Unauthorized");

        // Check last finalization time (5 hours cooldown)
        const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);

        const lastFinalization = await db.query.finalizedTurnovers.findFirst({
            where: and(
                eq(finalizedTurnovers.teamId, data.teamId),
                gte(finalizedTurnovers.finalizedAt, fiveHoursAgo)
            ),
            orderBy: [desc(finalizedTurnovers.finalizedAt)],
        });

        if (lastFinalization) {
            const remainingTime = Math.ceil(
                (lastFinalization.finalizedAt.getTime() + 5 * 60 * 60 * 1000 - Date.now()) / 60000
            );
            return {
                canFinalize: false,
                message: `Cooldown active. Try again in ${remainingTime} minutes.`,
                lastFinalization: lastFinalization.finalizedAt,
            };
        }

        return { canFinalize: true, message: "Ready to finalize" };
    });

/**
 * FINALIZE TURNOVER
 */
export const finalizeTurnover = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => FinalizeTurnoverSchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session?.user?.email) throw new Error("Unauthorized");

        const userName = `${session.user.firstName} ${session.user.lastName}`;

        // Check cooldown
        const canFinalizeResult = await canFinalizeTurnover({ data: { teamId: data.teamId } });
        if (!canFinalizeResult.canFinalize) {
            throw new Error(canFinalizeResult.message);
        }

        // Get all current entries for snapshot
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const entries = await db.query.turnoverEntries.findMany({
            where: and(
                eq(turnoverEntries.teamId, data.teamId),
                or(
                    eq(turnoverEntries.status, "OPEN"),
                    and(
                        eq(turnoverEntries.status, "RESOLVED"),
                        gte(turnoverEntries.updatedAt, today)
                    )
                )
            ),
            with: {
                application: {
                    columns: {
                        id: true,
                        applicationName: true,
                        tla: true,
                        tier: true,
                    },
                },
                rfcDetails: true,
                incDetails: true,
                mimDetails: true,
                commsDetails: true,
            },
        });

        // Calculate stats
        const applicationIds = new Set(entries.map((e) => e.applicationId));
        const importantCount = entries.filter((e) => e.isImportant).length;

        // Create snapshot
        await db.insert(finalizedTurnovers).values({
            teamId: data.teamId,
            snapshotData: entries,
            totalApplications: applicationIds.size.toString(),
            totalEntries: entries.length.toString(),
            importantCount: importantCount.toString(),
            notes: data.notes,
            finalizedBy: userName,
        });

        return { success: true };
    });

/**
 * GET FINALIZED TURNOVERS
 */
export const getFinalizedTurnovers = createServerFn({ method: "GET" })
    .inputValidator((data: unknown) => GetFinalizedTurnoversSchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session?.user?.email) throw new Error("Unauthorized");

        const { teamId, fromDate, toDate, limit = 20, offset = 0 } = data;

        const filters = [eq(finalizedTurnovers.teamId, teamId)];

        if (fromDate) {
            filters.push(gte(finalizedTurnovers.finalizedAt, new Date(fromDate)));
        }

        if (toDate) {
            const toDateObj = new Date(toDate);
            toDateObj.setHours(23, 59, 59, 999);
            filters.push(lte(finalizedTurnovers.finalizedAt, toDateObj));
        }

        const turnovers = await db.query.finalizedTurnovers.findMany({
            where: and(...filters),
            orderBy: [desc(finalizedTurnovers.finalizedAt)],
            limit,
            offset,
        });

        // Get total count
        const countResult = await db
            .select({ count: count() })
            .from(finalizedTurnovers)
            .where(and(...filters));

        return {
            turnovers: turnovers.map((t) => ({ ...t, snapshotData: t.snapshotData as any })),
            total: countResult[0]?.count || 0,
        };
    });

/**
 * GET FINALIZED TURNOVER BY ID
 */
export const getFinalizedTurnoverById = createServerFn({ method: "GET" })
    .inputValidator((data: unknown) =>
        z.object({ id: z.string().uuid() }).parse(data)
    )
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session?.user?.email) throw new Error("Unauthorized");

        const turnover = await db.query.finalizedTurnovers.findFirst({
            where: eq(finalizedTurnovers.id, data.id),
        });

        if (!turnover) throw new Error("Snapshot not found");

        return {
            ...turnover,
            snapshotData: turnover.snapshotData as any,
        };
    });

// ========================
// Metrics
// ========================

/**
 * GET TURNOVER METRICS
 */
export const getTurnoverMetrics = createServerFn({ method: "GET" })
    .inputValidator((data: unknown) => GetTurnoverMetricsSchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session?.user?.email) throw new Error("Unauthorized");

        const { teamId, startDate, endDate } = data;

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);

        // Get all entries in date range
        const entries = await db.query.turnoverEntries.findMany({
            where: and(
                eq(turnoverEntries.teamId, teamId),
                gte(turnoverEntries.createdAt, startDateObj),
                lte(turnoverEntries.createdAt, endDateObj)
            ),
        });

        // Calculate KPIs
        const totalEntries = entries.length;
        const resolvedEntries = entries.filter((e) => e.status === "RESOLVED").length;
        const openEntries = entries.filter((e) => e.status === "OPEN").length;
        const criticalItems = entries.filter((e) => e.isImportant).length;
        const resolutionRate =
            totalEntries > 0 ? Math.round((resolvedEntries / totalEntries) * 100) : 0;

        // Section distribution
        const sectionCounts: Record<string, number> = {};
        entries.forEach((e) => {
            sectionCounts[e.section] = (sectionCounts[e.section] || 0) + 1;
        });

        // Daily activity trend
        const dailyStats: Record<string, { created: number; resolved: number }> = {};

        entries.forEach((e) => {
            const dateKey = e.createdAt.toISOString().split("T")[0];
            if (!dailyStats[dateKey]) {
                dailyStats[dateKey] = { created: 0, resolved: 0 };
            }
            dailyStats[dateKey].created++;

            if (e.status === "RESOLVED" && e.resolvedAt) {
                const resolvedDateKey = e.resolvedAt.toISOString().split("T")[0];
                if (!dailyStats[resolvedDateKey]) {
                    dailyStats[resolvedDateKey] = { created: 0, resolved: 0 };
                }
                dailyStats[resolvedDateKey].resolved++;
            }
        });

        // Convert to array and sort by date
        const activityTrend = Object.entries(dailyStats)
            .map(([date, stats]) => ({
                date,
                created: stats.created,
                resolved: stats.resolved,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            kpis: {
                totalEntries,
                resolvedEntries,
                openEntries,
                criticalItems,
                resolutionRate,
            },
            sectionDistribution: Object.entries(sectionCounts).map(([section, count]) => ({
                section,
                count,
            })),
            activityTrend,
        };
    });
