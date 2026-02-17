import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/db";
import { teams } from "@/db/schema/teams";
import { desc, eq } from "drizzle-orm";
import { UpdateTeamSchema } from "@/lib/zod/team.schema";
import { requireAuth, assertTeamAdmin } from "@/lib/middleware/auth.middleware";

export const getTeams = createServerFn({ method: "GET" })
    .middleware([requireAuth])
    .handler(async () => {
        try {
            const allTeams = await db.select().from(teams).orderBy(desc(teams.createdAt));
            return allTeams;
        } catch (error: unknown) {
            console.error("Failed to fetch teams:", error);
            throw new Error("Failed to fetch teams");
        }
    });

export const getTeamById = createServerFn({ method: "GET" })
    .inputValidator((data: unknown) => z.object({ teamId: z.string().uuid() }).parse(data))
    .handler(async ({ data }) => {
        try {
            const team = await db.query.teams.findFirst({
                where: (teams, { eq }) => eq(teams.id, data.teamId),
                with: {
                    applications: true
                }
            });
            return team;
        } catch (error: unknown) {
            console.error("Failed to fetch team:", error);
            throw new Error("Failed to fetch team");
        }
    });

export const updateTeam = createServerFn({ method: "POST" })
    .middleware([requireAuth])
    .inputValidator((data: unknown) => UpdateTeamSchema.parse(data))
    .handler(async ({ data, context }) => {
        assertTeamAdmin(context.session, data.id);

        try {
            const updatedTeam = await db.update(teams)
                .set({
                    teamName: data.teamName,
                    userGroup: data.userGroup,
                    adminGroup: data.adminGroup,
                    contactName: data.contactName,
                    contactEmail: data.contactEmail,
                    isActive: data.isActive,
                    updatedBy: context.session.user.adsId,
                    updatedAt: new Date()
                })
                .where(eq(teams.id, data.id))
                .returning();

            return updatedTeam[0];
        } catch (error: unknown) {
            console.error("Failed to update team:", error);
            throw new Error("Failed to update team");
        }
    });
