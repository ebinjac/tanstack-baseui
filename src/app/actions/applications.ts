import { createServerFn } from "@tanstack/react-start";
import { CreateApplicationSchema, UpdateApplicationSchema } from "@/lib/zod/application.schema";
import { db } from "@/db";
import { applications } from "@/db/schema/teams";
import { getSession } from "@/app/ssr/auth";

import { sql } from "drizzle-orm";

export const createApplication = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => CreateApplicationSchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

        const isAdmin = session.permissions.some(p => p.teamId === data.teamId && p.role === "ADMIN");
        if (!isAdmin) throw new Error("Forbidden: You must be a team admin to create applications");

        const userEmail = session.user.email;
        if (!userEmail) throw new Error("User email is required for auditing");

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
            console.error("Asset ID missing/invalid:", cleanedData.assetId);
            throw new Error("Invalid Asset ID");
        }

        console.log("Creating application with data:", JSON.stringify(cleanedData, null, 2));

        try {
            const [newApp] = await db.insert(applications).values({
                ...cleanedData,
                createdBy: userEmail,
                updatedBy: userEmail,
            }).returning();

            return { success: true, applicationId: newApp.id };
        } catch (error: any) {
            console.error("Failed to create application:", error);
            // Rethrow the specific error message so the client can show it
            throw new Error(error.message || "Failed to create application");
        }
    });

export const getTeamApplications = createServerFn({ method: "GET" })
    .inputValidator((data: { teamId: string }) => data)
    .handler(async ({ data }) => {
        try {
            const apps = await db.query.applications.findMany({
                where: (applications, { eq }) => eq(applications.teamId, data.teamId)
            });
            return apps;
        } catch (error) {
            console.error("Failed to fetch applications:", error);
            throw new Error("Failed to fetch applications");
        }
    });

export const updateApplication = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => UpdateApplicationSchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

        // Get application to find teamId
        const app = await db.query.applications.findFirst({
            where: (applications, { eq }) => eq(applications.id, data.id)
        });

        if (!app) throw new Error("Application not found");

        const isAdmin = session.permissions.some(p => p.teamId === app.teamId && p.role === "ADMIN");
        if (!isAdmin) throw new Error("Forbidden: You must be a team admin to update applications");

        const userEmail = session.user.email;

        try {
            await db.update(applications)
                .set({
                    ...data,
                    updatedBy: userEmail,
                    updatedAt: new Date(),
                })
                .where(sql`${applications.id} = ${data.id}`);

            return { success: true };
        } catch (error) {
            console.error("Failed to update application:", error);
            throw new Error("Failed to update application");
        }
    });

export const deleteApplication = createServerFn({ method: "POST" })
    .inputValidator((data: { applicationId: string }) => data)
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

        // Get application to find teamId
        const app = await db.query.applications.findFirst({
            where: (applications, { eq }) => eq(applications.id, data.applicationId)
        });

        if (!app) throw new Error("Application not found");

        const isAdmin = session.permissions.some(p => p.teamId === app.teamId && p.role === "ADMIN");
        if (!isAdmin) throw new Error("Forbidden: You must be a team admin to delete applications");

        try {
            await db.delete(applications)
                .where(sql`${applications.id} = ${data.applicationId}`);

            return { success: true };
        } catch (error) {
            console.error("Failed to delete application:", error);
            throw new Error("Failed to delete application");
        }
    });

export const checkTeamTLA = createServerFn({ method: "GET" })
    .inputValidator((data: { teamId: string, tla: string }) => data)
    .handler(async ({ data }) => {
        try {
            const existing = await db.query.applications.findFirst({
                where: (applications, { and, eq, ilike }) => and(
                    eq(applications.teamId, data.teamId),
                    ilike(applications.tla, data.tla)
                )
            });
            return { exists: !!existing };
        } catch (error) {
            console.error("Failed to check TLA:", error);
            throw new Error("Failed to check TLA");
        }
    });
