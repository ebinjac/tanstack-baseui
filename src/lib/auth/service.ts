// lib/auth/service.ts
import { db } from "@/db"; // Your Drizzle DB instance
import { inArray, or, eq } from "drizzle-orm";
import { teams } from "@/db/schema";

type TeamPermission = {
    teamId: string;
    teamName: string;
    role: "ADMIN" | "MEMBER";
};

export async function resolveUserPermissions(userGroups: string[]): Promise<TeamPermission[]> {
    if (!userGroups.length) return [];

    // 1. Query DB: Find all teams where user's groups match either User or Admin columns
    const matchingTeams = await db
        .select({
            id: teams.id,
            teamName: teams.teamName,
            userGroup: teams.userGroup,
            adminGroup: teams.adminGroup,
        })
        .from(teams)
        .where(
            or(
                inArray(teams.userGroup, userGroups),
                inArray(teams.adminGroup, userGroups)
            )
        );

    // 2. Conflict Resolution (The "Admin Wins" Logic)
    // We use a Map to ensure unique teams and prioritize roles
    const permissionMap = new Map<string, TeamPermission>();

    for (const team of matchingTeams) {
        const isAdmin = userGroups.includes(team.adminGroup);
        const isMember = userGroups.includes(team.userGroup);

        // Current determined role for this specific row match
        let calculatedRole: "ADMIN" | "MEMBER" = "MEMBER";
        if (isAdmin) calculatedRole = "ADMIN";

        const existing = permissionMap.get(team.id);

        if (existing) {
            // If we already have this team, ONLY upgrade to Admin if currently Member
            if (existing.role === "MEMBER" && calculatedRole === "ADMIN") {
                permissionMap.set(team.id, { ...existing, role: "ADMIN" });
            }
        } else {
            // New entry
            permissionMap.set(team.id, {
                teamId: team.id,
                teamName: team.teamName,
                role: calculatedRole,
            });
        }
    }

    return Array.from(permissionMap.values());
}