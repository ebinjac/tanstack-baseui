import type { SessionData } from "./config";

/** A single permission entry from the session */
export type Permission = SessionData["permissions"][number];

/** Available user roles */
export type UserRole = Permission["role"];

/** Check if the session user is an admin for a specific team */
export function isTeamAdmin(
  session: SessionData | null,
  teamId: string
): boolean {
  return (
    session?.permissions.some(
      (p) => p.teamId === teamId && p.role === "ADMIN"
    ) ?? false
  );
}

/** Check if the session user is a member of a specific team (any role) */
export function isTeamMember(
  session: SessionData | null,
  teamId: string
): boolean {
  return session?.permissions.some((p) => p.teamId === teamId) ?? false;
}
