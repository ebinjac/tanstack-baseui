import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db";
import { applications } from "@/db/schema/teams";
import { sql } from "drizzle-orm";
import { CreateApplicationSchema, UpdateApplicationSchema } from "@/lib/zod/application.schema";
import { requireAuth, assertTeamAdmin } from "@/lib/middleware/auth.middleware";

export const createApplication = createServerFn({ method: "POST" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => CreateApplicationSchema.parse(data))
    .handler(async ({ data, context }) => {
        assertTeamAdmin(context.session, data.teamId);

        const userEmail = context.userEmail;

        // cleaning logic: trim strings, convert empty/whitespace to null. Preserve numbers/booleans.
        const cleanedData = Object.fromEntries(
            Object.entries(data).map(([key, value]) => {
                if (typeof value === 'string') {
                    const trimmed = value.trim();
                    return [key, trimmed === '' ? null : trimmed];
                }
                return [key, value];
            })
        ) as typeof data;

        // Explicitly check for Asset ID
        if (!cleanedData.assetId) {
            throw new Error("Invalid Asset ID");
        }

        try {
            const [newApp] = await db.insert(applications).values({
                ...cleanedData,
                createdBy: userEmail,
                updatedBy: userEmail,
            }).returning();

            return { success: true, applicationId: newApp.id };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to create application";
            throw new Error(message);
        }
    });

export const getTeamApplications = createServerFn({ method: "GET" })
    .inputValidator((data: unknown) => z.object({ teamId: z.string().uuid() }).parse(data))
    .handler(async ({ data }) => {
        try {
            const apps = await db.query.applications.findMany({
                where: (applications, { eq }) => eq(applications.teamId, data.teamId)
            });
            return apps;
        } catch (error: unknown) {
            console.error("Failed to fetch applications:", error);
            throw new Error("Failed to fetch applications");
        }
    });

export const updateApplication = createServerFn({ method: "POST" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => UpdateApplicationSchema.parse(data))
    .handler(async ({ data, context }) => {
        // Get application to find teamId
        const app = await db.query.applications.findFirst({
            where: (applications, { eq }) => eq(applications.id, data.id)
        });

        if (!app) throw new Error("Application not found");

        assertTeamAdmin(context.session, app.teamId);

        const userEmail = context.userEmail;

        try {
            await db.update(applications)
                .set({
                    ...data,
                    updatedBy: userEmail,
                    updatedAt: new Date(),
                })
                .where(sql`${applications.id} = ${data.id}`);

            return { success: true };
        } catch (error: unknown) {
            console.error("Failed to update application:", error);
            throw new Error("Failed to update application");
        }
    });

export const deleteApplication = createServerFn({ method: "POST" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => z.object({ applicationId: z.string().uuid() }).parse(data))
    .handler(async ({ data, context }) => {
        // Get application to find teamId
        const app = await db.query.applications.findFirst({
            where: (applications, { eq }) => eq(applications.id, data.applicationId)
        });

        if (!app) throw new Error("Application not found");

        assertTeamAdmin(context.session, app.teamId);

        try {
            await db.delete(applications)
                .where(sql`${applications.id} = ${data.applicationId}`);

            return { success: true };
        } catch (error: unknown) {
            console.error("Failed to delete application:", error);
            throw new Error("Failed to delete application");
        }
    });

export const checkTeamTLA = createServerFn({ method: "GET" })
    .inputValidator((data: unknown) => z.object({ teamId: z.string().uuid(), tla: z.string() }).parse(data))
    .handler(async ({ data }) => {
        try {
            const existing = await db.query.applications.findFirst({
                where: (applications, { and, eq, ilike }) => and(
                    eq(applications.teamId, data.teamId),
                    ilike(applications.tla, data.tla)
                )
            });
            return { exists: !!existing };
        } catch (error: unknown) {
            console.error("Failed to check TLA:", error);
            throw new Error("Failed to check TLA");
        }
    });
