import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db";
import {
    scorecardEntries,
    scorecardAvailability,
    scorecardVolume,
    scorecardPublishStatus,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import {
    CreateScorecardEntrySchema,
    UpdateScorecardEntrySchema,
    UpsertAvailabilitySchema,
    UpsertVolumeSchema,
    GetScorecardDataSchema,
    CheckScorecardIdentifierSchema,
    PublishScorecardSchema,
    UnpublishScorecardSchema,
    GetPublishStatusSchema,
} from "@/lib/zod/scorecard.schema";
import { requireAuth, assertTeamAdmin, assertTeamMember } from "@/lib/middleware/auth.middleware";

// Get all scorecard data for a team and year
export const getScorecardData = createServerFn({ method: "GET" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => GetScorecardDataSchema.parse(data))
    .handler(async ({ data }) => {
        // Get all applications for the team
        const teamApps = await db.query.applications.findMany({
            where: (apps, { eq }) => eq(apps.teamId, data.teamId),
            orderBy: (apps, { asc }) => asc(apps.applicationName),
        });

        if (teamApps.length === 0) {
            return { applications: [], entries: [], availability: [], volume: [] };
        }

        const appIds = teamApps.map((a) => a.id);

        // Get all scorecard entries for these applications
        const entries = await db.query.scorecardEntries.findMany({
            where: (entries, { inArray }) => inArray(entries.applicationId, appIds),
            orderBy: (entries, { asc }) => asc(entries.name),
        });

        const entryIds = entries.map((e) => e.id);

        // Get availability and volume for the year
        let availabilityData: typeof scorecardAvailability.$inferSelect[] = [];
        let volumeData: typeof scorecardVolume.$inferSelect[] = [];

        if (entryIds.length > 0) {
            availabilityData = await db.query.scorecardAvailability.findMany({
                where: (av, { and, eq, inArray }) =>
                    and(inArray(av.scorecardEntryId, entryIds), eq(av.year, data.year)),
            });

            volumeData = await db.query.scorecardVolume.findMany({
                where: (vol, { and, eq, inArray }) =>
                    and(inArray(vol.scorecardEntryId, entryIds), eq(vol.year, data.year)),
            });
        }

        return {
            applications: teamApps,
            entries,
            availability: availabilityData,
            volume: volumeData,
        };
    });

// Create a new scorecard entry (sub-application)
export const createScorecardEntry = createServerFn({ method: "POST" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => CreateScorecardEntrySchema.parse(data))
    .handler(async ({ data, context }) => {
        // Get the application to verify team access
        const app = await db.query.applications.findFirst({
            where: (apps, { eq }) => eq(apps.id, data.applicationId),
        });

        if (!app) throw new Error("Application not found");

        assertTeamAdmin(context.session, app.teamId);

        const userEmail = context.userEmail;

        // Generate or use provided scorecardIdentifier
        let identifier = data.scorecardIdentifier?.trim();

        if (!identifier) {
            // Auto-generate identifier from name + random suffix
            const baseId = data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 50);
            const suffix = Math.random().toString(36).substring(2, 8);
            identifier = `${baseId}-${suffix}`;
        }

        // Check uniqueness of scorecardIdentifier
        const existing = await db.query.scorecardEntries.findFirst({
            where: (entries, { eq }) =>
                eq(entries.scorecardIdentifier, identifier!),
        });

        if (existing) {
            throw new Error(
                `Scorecard identifier "${identifier}" is already in use`
            );
        }

        try {
            const [newEntry] = await db
                .insert(scorecardEntries)
                .values({
                    applicationId: data.applicationId,
                    scorecardIdentifier: identifier,
                    name: data.name,
                    availabilityThreshold: String(data.availabilityThreshold),
                    volumeChangeThreshold: String(data.volumeChangeThreshold),
                    createdBy: userEmail,
                })
                .returning();

            return { success: true, entry: newEntry };
        } catch (error: unknown) {
            console.error("Failed to create scorecard entry:", error);
            const message = error instanceof Error ? error.message : "Failed to create scorecard entry";
            throw new Error(message);
        }
    });

// Update a scorecard entry
export const updateScorecardEntry = createServerFn({ method: "POST" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => UpdateScorecardEntrySchema.parse(data))
    .handler(async ({ data, context }) => {
        // Get the entry
        const entry = await db.query.scorecardEntries.findFirst({
            where: (entries, { eq }) => eq(entries.id, data.id),
        });

        if (!entry) throw new Error("Entry not found");

        // Get the application to verify team access
        const app = await db.query.applications.findFirst({
            where: (apps, { eq }) => eq(apps.id, entry.applicationId),
        });

        if (!app) throw new Error("Application not found");

        assertTeamAdmin(context.session, app.teamId);

        const userEmail = context.userEmail;

        // Check uniqueness if updating identifier
        const newIdentifier = data.scorecardIdentifier;
        if (newIdentifier && newIdentifier !== entry.scorecardIdentifier) {
            const existing = await db.query.scorecardEntries.findFirst({
                where: (entries, { eq }) => eq(entries.scorecardIdentifier, newIdentifier),
            });
            if (existing) {
                throw new Error(
                    `Scorecard identifier "${data.scorecardIdentifier}" is already in use`
                );
            }
        }

        try {
            const updateData: Record<string, unknown> = { updatedBy: userEmail };
            if (data.name) updateData.name = data.name;
            if (data.scorecardIdentifier)
                updateData.scorecardIdentifier = data.scorecardIdentifier;
            if (data.availabilityThreshold !== undefined)
                updateData.availabilityThreshold = String(data.availabilityThreshold);
            if (data.volumeChangeThreshold !== undefined)
                updateData.volumeChangeThreshold = String(data.volumeChangeThreshold);

            await db
                .update(scorecardEntries)
                .set(updateData)
                .where(eq(scorecardEntries.id, data.id));

            return { success: true };
        } catch (error: unknown) {
            console.error("Failed to update scorecard entry:", error);
            const message = error instanceof Error ? error.message : "Failed to update scorecard entry";
            throw new Error(message);
        }
    });

// Delete a scorecard entry
export const deleteScorecardEntry = createServerFn({ method: "POST" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => z.object({ entryId: z.string().uuid() }).parse(data))
    .handler(async ({ data, context }) => {
        // Get the entry
        const entry = await db.query.scorecardEntries.findFirst({
            where: (entries, { eq }) => eq(entries.id, data.entryId),
        });

        if (!entry) throw new Error("Entry not found");

        // Get the application to verify team access
        const app = await db.query.applications.findFirst({
            where: (apps, { eq }) => eq(apps.id, entry.applicationId),
        });

        if (!app) throw new Error("Application not found");

        assertTeamAdmin(context.session, app.teamId);

        try {
            await db
                .delete(scorecardEntries)
                .where(eq(scorecardEntries.id, data.entryId));

            return { success: true };
        } catch (error: unknown) {
            console.error("Failed to delete scorecard entry:", error);
            const message = error instanceof Error ? error.message : "Failed to delete scorecard entry";
            throw new Error(message);
        }
    });

// Upsert (create or update) availability for a month
export const upsertAvailability = createServerFn({ method: "POST" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => UpsertAvailabilitySchema.parse(data))
    .handler(async ({ data, context }) => {
        // Get the entry
        const entry = await db.query.scorecardEntries.findFirst({
            where: (entries, { eq }) => eq(entries.id, data.scorecardEntryId),
        });

        if (!entry) throw new Error("Entry not found");

        // Get the application to verify team access
        const app = await db.query.applications.findFirst({
            where: (apps, { eq }) => eq(apps.id, entry.applicationId),
        });

        if (!app) throw new Error("Application not found");

        assertTeamMember(context.session, app.teamId);

        const userEmail = context.userEmail;

        try {
            // Check if record exists
            const existing = await db.query.scorecardAvailability.findFirst({
                where: (av, { and, eq }) =>
                    and(
                        eq(av.scorecardEntryId, data.scorecardEntryId),
                        eq(av.year, data.year),
                        eq(av.month, data.month)
                    ),
            });

            if (existing) {
                // Update
                await db
                    .update(scorecardAvailability)
                    .set({
                        availability: String(data.availability),
                        reason: data.reason ?? null,
                        updatedBy: userEmail,
                    })
                    .where(eq(scorecardAvailability.id, existing.id));
            } else {
                // Create
                await db.insert(scorecardAvailability).values({
                    scorecardEntryId: data.scorecardEntryId,
                    year: data.year,
                    month: data.month,
                    availability: String(data.availability),
                    reason: data.reason ?? null,
                    createdBy: userEmail,
                });
            }

            return { success: true };
        } catch (error: unknown) {
            console.error("Failed to upsert availability:", error);
            const message = error instanceof Error ? error.message : "Failed to save availability";
            throw new Error(message);
        }
    });

// Upsert (create or update) volume for a month
export const upsertVolume = createServerFn({ method: "POST" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => UpsertVolumeSchema.parse(data))
    .handler(async ({ data, context }) => {
        // Get the entry
        const entry = await db.query.scorecardEntries.findFirst({
            where: (entries, { eq }) => eq(entries.id, data.scorecardEntryId),
        });

        if (!entry) throw new Error("Entry not found");

        // Get the application to verify team access
        const app = await db.query.applications.findFirst({
            where: (apps, { eq }) => eq(apps.id, entry.applicationId),
        });

        if (!app) throw new Error("Application not found");

        assertTeamMember(context.session, app.teamId);

        const userEmail = context.userEmail;

        try {
            // Check if record exists
            const existing = await db.query.scorecardVolume.findFirst({
                where: (vol, { and, eq }) =>
                    and(
                        eq(vol.scorecardEntryId, data.scorecardEntryId),
                        eq(vol.year, data.year),
                        eq(vol.month, data.month)
                    ),
            });

            if (existing) {
                // Update
                await db
                    .update(scorecardVolume)
                    .set({
                        volume: data.volume,
                        reason: data.reason ?? null,
                        updatedBy: userEmail,
                    })
                    .where(eq(scorecardVolume.id, existing.id));
            } else {
                // Create
                await db.insert(scorecardVolume).values({
                    scorecardEntryId: data.scorecardEntryId,
                    year: data.year,
                    month: data.month,
                    volume: data.volume,
                    reason: data.reason ?? null,
                    createdBy: userEmail,
                });
            }

            return { success: true };
        } catch (error: unknown) {
            console.error("Failed to upsert volume:", error);
            const message = error instanceof Error ? error.message : "Failed to save volume";
            throw new Error(message);
        }
    });

// Check if scorecard identifier is unique
export const checkScorecardIdentifier = createServerFn({ method: "GET" })
    .inputValidator((data: unknown) => CheckScorecardIdentifierSchema.parse(data))
    .handler(async ({ data }) => {
        const existing = await db.query.scorecardEntries.findFirst({
            where: (entries, { eq, and, ne }) => {
                if (data.excludeId) {
                    return and(
                        eq(entries.scorecardIdentifier, data.identifier),
                        ne(entries.id, data.excludeId)
                    );
                }
                return eq(entries.scorecardIdentifier, data.identifier);
            },
        });

        return { exists: !!existing };
    });

// Get global scorecard data for all teams with leadership filters
// Now filters data based on publish status - only shows data that was published and not modified since
export const getGlobalScorecardData = createServerFn({ method: "GET" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => z.object({
        year: z.number().int().min(2000).max(2100),
        leadershipFilter: z.string().optional(),
        leadershipType: z.string().optional(),
    }).parse(data))
    .handler(async ({ data }) => {
        // Get all active teams
        const allTeams = await db.query.teams.findMany({
            where: (teams, { eq }) => eq(teams.isActive, true),
            orderBy: (teams, { asc }) => asc(teams.teamName),
        });

        // Get publish status for all teams for this year (and previous year for rolling views)
        const allPublishStatus = await db.query.scorecardPublishStatus.findMany({
            where: (ps, { eq, and: andOp, or: orOp }) =>
                andOp(
                    eq(ps.isPublished, true),
                    orOp(eq(ps.year, data.year), eq(ps.year, data.year - 1))
                ),
        });

        // Build a map of teamId -> year-month -> publishedAt timestamp
        const publishTimestamps: Record<string, Record<string, Date | null>> = {};
        allPublishStatus.forEach((ps) => {
            if (!publishTimestamps[ps.teamId]) {
                publishTimestamps[ps.teamId] = {};
            }
            publishTimestamps[ps.teamId][`${ps.year}-${ps.month}`] = ps.publishedAt;
        });

        // Get all applications with optional leadership filter
        let allApps = await db.query.applications.findMany({
            where: (apps, { eq }) => eq(apps.status, "active"),
            orderBy: (apps, { asc }) => asc(apps.applicationName),
        });

        // Apply leadership filter if provided
        if (data.leadershipFilter && data.leadershipType) {
            const filterValue = data.leadershipFilter.toLowerCase();
            allApps = allApps.filter((app) => {
                switch (data.leadershipType) {
                    case "svp":
                        return app.ownerSvpName?.toLowerCase().includes(filterValue) ||
                            app.ownerSvpEmail?.toLowerCase().includes(filterValue);
                    case "vp":
                        return app.vpName?.toLowerCase().includes(filterValue) ||
                            app.vpEmail?.toLowerCase().includes(filterValue);
                    case "director":
                        return app.directorName?.toLowerCase().includes(filterValue) ||
                            app.directorEmail?.toLowerCase().includes(filterValue);
                    case "app_owner":
                        return app.applicationOwnerName?.toLowerCase().includes(filterValue) ||
                            app.applicationOwnerEmail?.toLowerCase().includes(filterValue);
                    case "app_manager":
                        return app.applicationManagerName?.toLowerCase().includes(filterValue) ||
                            app.applicationManagerEmail?.toLowerCase().includes(filterValue);
                    case "unit_cio":
                        return app.unitCioName?.toLowerCase().includes(filterValue) ||
                            app.unitCioEmail?.toLowerCase().includes(filterValue);
                    default:
                        // Search across all leadership fields
                        return [
                            app.ownerSvpName, app.ownerSvpEmail,
                            app.vpName, app.vpEmail,
                            app.directorName, app.directorEmail,
                            app.applicationOwnerName, app.applicationOwnerEmail,
                            app.applicationManagerName, app.applicationManagerEmail,
                            app.unitCioName, app.unitCioEmail,
                        ].some(field => field?.toLowerCase().includes(filterValue));
                }
            });
        }

        if (allApps.length === 0) {
            return { teams: allTeams, applications: [], entries: [], availability: [], volume: [], publishTimestamps };
        }

        const appIds = allApps.map((a) => a.id);

        // Build app to team mapping for publish status lookup
        const appToTeam: Record<string, string> = {};
        allApps.forEach((app) => {
            appToTeam[app.id] = app.teamId;
        });

        // Get all scorecard entries for these applications
        const entries = await db.query.scorecardEntries.findMany({
            where: (entries, { inArray }) => inArray(entries.applicationId, appIds),
            orderBy: (entries, { asc }) => asc(entries.name),
        });

        // Build entry to app mapping
        const entryToApp: Record<string, string> = {};
        entries.forEach((entry) => {
            entryToApp[entry.id] = entry.applicationId;
        });

        const entryIds = entries.map((e) => e.id);

        // Get availability and volume for the year
        let availabilityData: typeof scorecardAvailability.$inferSelect[] = [];
        let volumeData: typeof scorecardVolume.$inferSelect[] = [];

        if (entryIds.length > 0) {
            const rawAvailability = await db.query.scorecardAvailability.findMany({
                where: (av, { and, eq, inArray, or }) =>
                    and(
                        inArray(av.scorecardEntryId, entryIds),
                        or(eq(av.year, data.year), eq(av.year, data.year - 1))
                    ),
            });

            const rawVolume = await db.query.scorecardVolume.findMany({
                where: (vol, { and, eq, inArray, or }) =>
                    and(
                        inArray(vol.scorecardEntryId, entryIds),
                        or(eq(vol.year, data.year), eq(vol.year, data.year - 1))
                    ),
            });

            // Filter availability to only include published data
            availabilityData = rawAvailability.filter((av) => {
                const appId = entryToApp[av.scorecardEntryId];
                const teamId = appToTeam[appId];
                const key = `${av.year}-${av.month}`;
                const publishedAt = publishTimestamps[teamId]?.[key];

                if (!publishedAt) return false;

                const dataUpdatedAt = av.updatedAt || av.createdAt;
                if (!dataUpdatedAt) return true;

                return new Date(dataUpdatedAt) <= new Date(publishedAt);
            });

            // Filter volume to only include published data
            volumeData = rawVolume.filter((vol) => {
                const appId = entryToApp[vol.scorecardEntryId];
                const teamId = appToTeam[appId];
                const key = `${vol.year}-${vol.month}`;
                const publishedAt = publishTimestamps[teamId]?.[key];

                if (!publishedAt) return false;

                const dataUpdatedAt = vol.updatedAt || vol.createdAt;
                if (!dataUpdatedAt) return true;

                return new Date(dataUpdatedAt) <= new Date(publishedAt);
            });
        }

        // Get unique leadership values for filters
        const leadershipOptions = {
            svp: [...new Set(allApps.map(a => a.ownerSvpName).filter(Boolean))].sort(),
            vp: [...new Set(allApps.map(a => a.vpName).filter(Boolean))].sort(),
            director: [...new Set(allApps.map(a => a.directorName).filter(Boolean))].sort(),
            appOwner: [...new Set(allApps.map(a => a.applicationOwnerName).filter(Boolean))].sort(),
            unitCio: [...new Set(allApps.map(a => a.unitCioName).filter(Boolean))].sort(),
        };

        return {
            teams: allTeams,
            applications: allApps,
            entries,
            availability: availabilityData,
            volume: volumeData,
            leadershipOptions,
            publishTimestamps,
        };
    });

// Get publish status for a team/year
export const getPublishStatus = createServerFn({ method: "GET" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => GetPublishStatusSchema.parse(data))
    .handler(async ({ data }) => {
        // Get all publish status records for this team and year
        const publishStatus = await db.query.scorecardPublishStatus.findMany({
            where: (ps, { eq, and: andOp }) =>
                andOp(eq(ps.teamId, data.teamId), eq(ps.year, data.year)),
        });

        // Convert to a map by month for easy lookup
        const statusByMonth: Record<number, {
            isPublished: boolean;
            publishedBy: string | null;
            publishedAt: Date | null;
        }> = {};

        publishStatus.forEach((ps) => {
            statusByMonth[ps.month] = {
                isPublished: ps.isPublished,
                publishedBy: ps.publishedBy,
                publishedAt: ps.publishedAt,
            };
        });

        return { statusByMonth };
    });

// Publish scorecard for a specific month
export const publishScorecard = createServerFn({ method: "POST" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => PublishScorecardSchema.parse(data))
    .handler(async ({ data, context }) => {
        assertTeamAdmin(context.session, data.teamId);

        const userEmail = context.userEmail;

        try {
            // Check if record exists
            const existing = await db.query.scorecardPublishStatus.findFirst({
                where: (ps, { eq, and: andOp }) =>
                    andOp(
                        eq(ps.teamId, data.teamId),
                        eq(ps.year, data.year),
                        eq(ps.month, data.month)
                    ),
            });

            if (existing) {
                // Update to published
                await db
                    .update(scorecardPublishStatus)
                    .set({
                        isPublished: true,
                        publishedBy: userEmail,
                        publishedAt: new Date(),
                    })
                    .where(eq(scorecardPublishStatus.id, existing.id));
            } else {
                // Create new published record
                await db.insert(scorecardPublishStatus).values({
                    teamId: data.teamId,
                    year: data.year,
                    month: data.month,
                    isPublished: true,
                    publishedBy: userEmail,
                    publishedAt: new Date(),
                });
            }

            return { success: true };
        } catch (error: unknown) {
            console.error("Failed to publish scorecard:", error);
            const message = error instanceof Error ? error.message : "Failed to publish scorecard";
            throw new Error(message);
        }
    });

// Unpublish scorecard for a specific month
export const unpublishScorecard = createServerFn({ method: "POST" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => UnpublishScorecardSchema.parse(data))
    .handler(async ({ data, context }) => {
        assertTeamAdmin(context.session, data.teamId);

        const userEmail = context.userEmail;

        try {
            // Check if record exists
            const existing = await db.query.scorecardPublishStatus.findFirst({
                where: (ps, { eq, and: andOp }) =>
                    andOp(
                        eq(ps.teamId, data.teamId),
                        eq(ps.year, data.year),
                        eq(ps.month, data.month)
                    ),
            });

            if (existing) {
                // Update to unpublished
                await db
                    .update(scorecardPublishStatus)
                    .set({
                        isPublished: false,
                        unpublishedBy: userEmail,
                        unpublishedAt: new Date(),
                    })
                    .where(eq(scorecardPublishStatus.id, existing.id));
            }

            return { success: true };
        } catch (error: unknown) {
            console.error("Failed to unpublish scorecard:", error);
            const message = error instanceof Error ? error.message : "Failed to unpublish scorecard";
            throw new Error(message);
        }
    });

// Get all published months for global scorecard (for filtering)
export const getGlobalPublishStatus = createServerFn({ method: "GET" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => z.object({ year: z.number().int().min(2000).max(2100) }).parse(data))
    .handler(async ({ data }) => {
        // Get all published records for the year
        const publishedRecords = await db.query.scorecardPublishStatus.findMany({
            where: (ps, { eq, and: andOp }) =>
                andOp(eq(ps.year, data.year), eq(ps.isPublished, true)),
        });

        // Group by team ID and return list of published months per team
        const publishedByTeam: Record<string, number[]> = {};
        publishedRecords.forEach((record) => {
            if (!publishedByTeam[record.teamId]) {
                publishedByTeam[record.teamId] = [];
            }
            publishedByTeam[record.teamId].push(record.month);
        });

        return { publishedByTeam };
    });
