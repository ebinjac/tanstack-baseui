import { createServerFn } from "@tanstack/react-start";
import { getSession } from "@/app/ssr/auth";
import { db } from "@/db";
import { teams } from "@/db/schema/teams";
import { desc } from "drizzle-orm";

import { eq } from "drizzle-orm";
import { UpdateTeamSchema } from "@/lib/zod/team.schema";

export const getTeams = createServerFn({ method: "GET" })
    .handler(async () => {
        // Ideally check for admin privileges here

        try {
            const allTeams = await db.select().from(teams).orderBy(desc(teams.createdAt));
            return allTeams;
        } catch (error) {
            console.error("Failed to fetch teams:", error);
            throw new Error("Failed to fetch teams");
        }
    });

export const getTeamById = createServerFn({ method: "GET" })
    .inputValidator((data: { teamId: string }) => data)
    .handler(async ({ data }) => {
        try {
            const team = await db.query.teams.findFirst({
                where: (teams, { eq }) => eq(teams.id, data.teamId),
                with: {
                    applications: true
                }
            });
            return team;
        } catch (error) {
            console.error("Failed to fetch team:", error);
            throw new Error("Failed to fetch team");
        }
    });

export const updateTeam = createServerFn({ method: "POST" })
    .inputValidator((data: any) => UpdateTeamSchema.parse(data))
    .handler(async ({ data }) => {
        const session = await getSession();
        if (!session) throw new Error("Unauthorized");

        const isAdmin = session.permissions.some(p => p.teamId === data.id && p.role === "ADMIN");
        if (!isAdmin) throw new Error("Forbidden: You must be a team admin to update team details");

        try {
            const updatedTeam = await db.update(teams)
                .set({
                    teamName: data.teamName,
                    userGroup: data.userGroup,
                    adminGroup: data.adminGroup,
                    contactName: data.contactName,
                    contactEmail: data.contactEmail,
                    isActive: data.isActive,
                    updatedBy: session.user.adsId,
                    updatedAt: new Date()
                })
                .where(eq(teams.id, data.id))
                .returning();

            return updatedTeam[0];
        } catch (error) {
            console.error("Failed to update team:", error);
            throw new Error("Failed to update team");
        }
    });
