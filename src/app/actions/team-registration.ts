import { createServerFn } from "@tanstack/react-start";
import { TeamRegistrationSchema } from "@/lib/zod/team-registration.schema";
import { db } from "@/db";
import { teamRegistrationRequests, teams } from "@/db/schema/teams";
import { getSession } from "@/app/ssr/auth";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const registerTeam = createServerFn({ method: "POST" })
    .inputValidator((data: unknown) => {
        if (data instanceof FormData) {
            // If we ever support formData directly, parse it here
            // For now, we expect JSON
            throw new Error("FormData not supported yet");
        }
        return TeamRegistrationSchema.parse(data);
    })
    .handler(async ({ data }) => {
        const session = await getSession();

        // In a real app, you might ensure session exists. 
        // For now, we'll assume if no session, we use a fallback or error.
        // Given the prompt implies authenticated context ("requestedBy"), we should try to get email.

        const requestedBy = session?.user?.email || "anonymous";

        try {
            const [newRequest] = await db.insert(teamRegistrationRequests).values({
                teamName: data.teamName,
                userGroup: data.userGroup,
                adminGroup: data.adminGroup,
                contactName: data.contactName,
                contactEmail: data.contactEmail,
                comments: data.comments,
                requestedBy: requestedBy,
                requestedAt: new Date(),
                status: "pending",
            }).returning();

            return { success: true, requestId: newRequest.id };
        } catch (error) {
            console.error("Failed to register team:", error);
            // Check for generic database errors (like unique constraint violations)
            if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
                throw new Error("A request for this team name already exists or team name is taken.");
            }
            throw new Error("Failed to submit team registration request");
        }
    });

export const checkTeamNameAvailability = createServerFn({ method: "GET" })
    .inputValidator((data: { name: string }) => data)
    .handler(async ({ data }) => {
        const { name } = data;

        // Check existing teams
        const existingTeams = await db
            .select()
            .from(teams)
            .where(sql`lower(${teams.teamName}) = lower(${name})`)
            .limit(1);

        if (existingTeams.length > 0) {
            return { available: false, reason: "Team name already exists." };
        }

        // Check pending requests
        const existingRequests = await db
            .select()
            .from(teamRegistrationRequests)
            .where(
                sql`lower(${teamRegistrationRequests.teamName}) = lower(${name}) AND ${teamRegistrationRequests.status} = 'pending'`
            )
            .limit(1);

        if (existingRequests.length > 0) {
            return { available: false, reason: "A request for this team name is already pending." };
        }

        return { available: true };
    });

export const getRegistrationRequests = createServerFn({ method: "GET" })
    .handler(async () => {
        try {
            const requests = await db
                .select()
                .from(teamRegistrationRequests)
                .orderBy(sql`${teamRegistrationRequests.requestedAt} DESC`);

            return requests;
        } catch (error) {
            console.error("Failed to fetch registration requests:", error);
            throw new Error("Failed to fetch registration requests");
        }
    });

export const updateRequestStatus = createServerFn({ method: "POST" })
    .inputValidator((data: { requestId: string, status: "approved" | "rejected" | "pending", comments?: string }) => data)
    .handler(async ({ data }) => {
        const session = await getSession();
        const reviewedBy = session?.user?.email || "admin";

        try {
            const [request] = await db
                .select()
                .from(teamRegistrationRequests)
                .where(sql`${teamRegistrationRequests.id} = ${data.requestId}`)
                .limit(1);

            if (!request) {
                throw new Error("Request not found");
            }

            if (data.status === "approved") {
                // If approved, create the team as well
                await db.transaction(async (tx) => {
                    await tx.update(teamRegistrationRequests)
                        .set({
                            status: "approved",
                            reviewedBy: reviewedBy,
                            reviewedAt: new Date(),
                            comments: data.comments || request.comments,
                        })
                        .where(sql`${teamRegistrationRequests.id} = ${data.requestId}`);

                    await tx.insert(teams).values({
                        teamName: request.teamName,
                        userGroup: request.userGroup,
                        adminGroup: request.adminGroup,
                        contactName: request.contactName,
                        contactEmail: request.contactEmail,
                        createdBy: request.requestedBy,
                    });
                });
            } else {
                await db.update(teamRegistrationRequests)
                    .set({
                        status: data.status,
                        reviewedBy: reviewedBy,
                        reviewedAt: new Date(),
                        comments: data.comments || request.comments,
                    })
                    .where(sql`${teamRegistrationRequests.id} = ${data.requestId}`);
            }

            return { success: true };
        } catch (error) {
            console.error("Failed to update request status:", error);
            throw new Error("Failed to update request status");
        }
    });
