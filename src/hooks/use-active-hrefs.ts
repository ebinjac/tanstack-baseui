import { useEffect, useState } from "react";
import type { SessionData } from "@/lib/auth/config";

interface ActiveHrefs {
  linkManagerHref: string;
  scorecardHref: string;
  turnoverHref: string;
}

/**
 * Derives the correct team-scoped hrefs for the three main tools.
 * Reads the last-used team from localStorage and falls back to the
 * first team in the user's permissions if it isn't in the list.
 */
export function useActiveHrefs(session: SessionData | null): ActiveHrefs {
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    const savedTeamId = localStorage.getItem("ensemble-last-team-id");
    if (
      savedTeamId &&
      session.permissions.find((t) => t.teamId === savedTeamId)
    ) {
      setActiveTeamId(savedTeamId);
    } else if (session.permissions.length > 0) {
      setActiveTeamId(session.permissions[0].teamId);
    }
  }, [session]);

  return {
    scorecardHref: activeTeamId
      ? `/teams/${activeTeamId}/scorecard`
      : "/scorecard",
    turnoverHref: activeTeamId
      ? `/teams/${activeTeamId}/turnover`
      : "/turnover",
    linkManagerHref: activeTeamId
      ? `/teams/${activeTeamId}/link-manager`
      : "/link-manager",
  };
}
