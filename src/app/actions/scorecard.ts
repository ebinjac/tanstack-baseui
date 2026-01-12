import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import {
    scorecardEntries,
    scorecardAvailability,
    scorecardVolume,
} from "@/db/schema";
import { getSession } from "@/app/ssr/auth";
import { eq } from "drizzle-orm";
import {
    CreateScorecardEntrySchema,
    UpdateScorecardEntrySchema,
    UpsertAvailabilitySchema,
    UpsertVolumeSchema,
    GetScorecardDataSchema,
    CheckScorecardIdentifierSchema,
} from "@/lib/zod/scorecard.schema";
import type { CreateScorecardEntry, UpdateScorecardEntry, UpsertAvailability, UpsertVolume, GetScorecardData } from "@/lib/zod/scorecard.schema";

// Get all scorecard data for a team and year
export const getScorecardData = createServerFn({ method: "GET" })
    .inputValidator((data: GetScorecardData) => GetScorecardDataSchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

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
    .inputValidator((data: CreateScorecardEntry) => CreateScorecardEntrySchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

        // Get the application to verify team access
        const app = await db.query.applications.findFirst({
            where: (apps, { eq }) => eq(apps.id, data.applicationId),
        });

        if (!app) throw new Error("Application not found");

        const isAdmin = session.permissions.some(
            (p) => p.teamId === app.teamId && p.role === "ADMIN"
        );
        if (!isAdmin)
            throw new Error("Forbidden: You must be a team admin to create entries");

        const userEmail = session.user.email;
        if (!userEmail) throw new Error("User email is required for auditing");

        // Check uniqueness of scorecardIdentifier
        const existing = await db.query.scorecardEntries.findFirst({
            where: (entries, { eq }) =>
                eq(entries.scorecardIdentifier, data.scorecardIdentifier),
        });

        if (existing) {
            throw new Error(
                `Scorecard identifier "${data.scorecardIdentifier}" is already in use`
            );
        }

        try {
            const [newEntry] = await db
                .insert(scorecardEntries)
                .values({
                    applicationId: data.applicationId,
                    scorecardIdentifier: data.scorecardIdentifier,
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
    .inputValidator((data: UpdateScorecardEntry) => UpdateScorecardEntrySchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

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

        const isAdmin = session.permissions.some(
            (p) => p.teamId === app.teamId && p.role === "ADMIN"
        );
        if (!isAdmin)
            throw new Error("Forbidden: You must be a team admin to update entries");

        const userEmail = session.user.email;

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
    .inputValidator((data: { entryId: string }) => data)
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

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

        const isAdmin = session.permissions.some(
            (p) => p.teamId === app.teamId && p.role === "ADMIN"
        );
        if (!isAdmin)
            throw new Error("Forbidden: You must be a team admin to delete entries");

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
    .inputValidator((data: UpsertAvailability) => UpsertAvailabilitySchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

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

        const isTeamMember = session.permissions.some(
            (p) => p.teamId === app.teamId
        );
        if (!isTeamMember) throw new Error("Forbidden: Not a team member");

        const userEmail = session.user.email;
        if (!userEmail) throw new Error("User email is required for auditing");

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
    .inputValidator((data: UpsertVolume) => UpsertVolumeSchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

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

        const isTeamMember = session.permissions.some(
            (p) => p.teamId === app.teamId
        );
        if (!isTeamMember) throw new Error("Forbidden: Not a team member");

        const userEmail = session.user.email;
        if (!userEmail) throw new Error("User email is required for auditing");

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
    .inputValidator((data: { identifier: string; excludeId?: string }) =>
        CheckScorecardIdentifierSchema.parse(data)
    )
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
export const getGlobalScorecardData = createServerFn({ method: "GET" })
    .inputValidator((data: { year: number; leadershipFilter?: string; leadershipType?: string }) => data)
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

        // Get all active teams
        const allTeams = await db.query.teams.findMany({
            where: (teams, { eq }) => eq(teams.isActive, true),
            orderBy: (teams, { asc }) => asc(teams.teamName),
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
            return { teams: allTeams, applications: [], entries: [], availability: [], volume: [] };
        }

        const appIds = allApps.map((a) => a.id);

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
                where: (av, { and, eq, inArray, or }) =>
                    and(
                        inArray(av.scorecardEntryId, entryIds),
                        or(eq(av.year, data.year), eq(av.year, data.year - 1))
                    ),
            });

            volumeData = await db.query.scorecardVolume.findMany({
                where: (vol, { and, eq, inArray, or }) =>
                    and(
                        inArray(vol.scorecardEntryId, entryIds),
                        or(eq(vol.year, data.year), eq(vol.year, data.year - 1))
                    ),
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
        };
    });
