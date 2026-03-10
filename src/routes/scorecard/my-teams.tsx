import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Grid2X2, LayoutGrid, List, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getGlobalScorecardData } from "@/app/actions/scorecard";
import type {
  Application,
  AvailabilityRecord,
  LeadershipDisplay,
  ScorecardEntry,
  VolumeRecord,
} from "@/components/enterprise-scorecard";
import {
  CURRENT_YEAR,
  TeamHeatmap,
  TeamSection,
  TeamTable,
} from "@/components/enterprise-scorecard";
import { EnterpriseScorecardSkeleton } from "@/components/skeletons/enterprise-scorecard-skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/scorecard/my-teams")({
  component: MyTeamsView,
});

function MyTeamsView() {
  const [viewMode, setViewMode] = useState<"list" | "heatmap" | "table">(
    "list"
  );
  const selectedYear = CURRENT_YEAR;

  const { data: scorecardData, isLoading } = useQuery({
    queryKey: ["scorecard", "global", selectedYear],
    queryFn: () => getGlobalScorecardData({ data: { year: selectedYear } }),
  });

  const applications = scorecardData?.applications || [];
  const entries = scorecardData?.entries || [];

  // TODO: In a real app, this relates to the authenticated user's session.
  // We're mimicking an auto-filter to a subset of teams to demonstrate the "My Teams" view.
  const myTeams = useMemo(() => {
    const teams = scorecardData?.teams || [];
    // Just returning the first 3 teams as a mock "My Teams" for demonstration.
    return teams.slice(0, 3);
  }, [scorecardData?.teams]);

  const filteredApps = useMemo(() => {
    const userTeamIds = new Set(myTeams.map((t) => t.id));
    return applications.filter((app) => userTeamIds.has(app.teamId));
  }, [applications, myTeams]);

  const appsByTeam = useMemo(() => {
    return applications.reduce(
      (acc, app) => {
        if (!acc[app.teamId]) {
          acc[app.teamId] = [];
        }
        acc[app.teamId].push(app);
        return acc;
      },
      {} as Record<string, Application[]>
    );
  }, [applications]);

  const entriesByApp = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        if (!acc[entry.applicationId]) {
          acc[entry.applicationId] = [];
        }
        acc[entry.applicationId].push(entry);
        return acc;
      },
      {} as Record<string, ScorecardEntry[]>
    );
  }, [entries]);

  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());

  // Auto-expand all on load
  useEffect(() => {
    if (filteredApps.length > 0 && expandedApps.size === 0) {
      setExpandedApps(new Set(filteredApps.map((a) => a.id)));
    }
  }, [filteredApps, expandedApps.size]);

  const handleToggleApp = (appId: string) => {
    setExpandedApps((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) {
        next.delete(appId);
      } else {
        next.add(appId);
      }
      return next;
    });
  };

  const getLeadershipDisplay = (app: Application): LeadershipDisplay[] => {
    const list = [
      { name: app.applicationManagerName, role: "Application Manager" },
      { name: app.applicationOwnerName, role: "Application Owner" },
      { name: app.directorName, role: "Director" },
      { name: app.vpName, role: "VP" },
      { name: app.ownerSvpName, role: "SVP" },
      { name: app.unitCioName, role: "Unit CIO" },
    ];
    return list.filter((ldr): ldr is LeadershipDisplay => Boolean(ldr.name));
  };

  const availabilityByEntry = useMemo(() => {
    if (!scorecardData?.availability) {
      return {};
    }
    return scorecardData.availability.reduce(
      (acc, curr) => {
        if (!acc[curr.scorecardEntryId]) {
          acc[curr.scorecardEntryId] = {};
        }
        acc[curr.scorecardEntryId][`${curr.year}-${curr.month}`] = curr;
        return acc;
      },
      {} as Record<string, Record<string, AvailabilityRecord>>
    );
  }, [scorecardData?.availability]);

  const volumeByEntry = useMemo(() => {
    if (!scorecardData?.volume) {
      return {};
    }
    return scorecardData.volume.reduce(
      (acc, curr) => {
        if (!acc[curr.scorecardEntryId]) {
          acc[curr.scorecardEntryId] = {};
        }
        acc[curr.scorecardEntryId][`${curr.year}-${curr.month}`] = curr;
        return acc;
      },
      {} as Record<string, Record<string, VolumeRecord>>
    );
  }, [scorecardData?.volume]);

  if (isLoading) {
    return (
      <div className="p-8">
        <EnterpriseScorecardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 p-6">
      {/* Header and Title */}
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl tracking-tight">My Teams</h1>
        <p className="mt-2 text-muted-foreground">
          Immediate insights into the applications owned by your specific teams.
          No filtering required.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          className="h-9 font-medium"
          onClick={() => setViewMode("table")}
          variant={viewMode === "table" ? "default" : "outline"}
        >
          <LayoutGrid className="mr-2 h-4 w-4" />
          Table View
        </Button>
        <Button
          className="h-9 font-medium"
          onClick={() => setViewMode("list")}
          variant={viewMode === "list" ? "default" : "outline"}
        >
          <List className="mr-2 h-4 w-4" />
          List View
        </Button>
        <Button
          className="h-9 font-medium"
          onClick={() => setViewMode("heatmap")}
          variant={viewMode === "heatmap" ? "default" : "outline"}
        >
          <Grid2X2 className="mr-2 h-4 w-4" />
          Heatmap View
        </Button>
      </div>

      <div className="pb-20">
        {myTeams.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
            <ShieldAlert className="mb-4 h-8 w-8 text-muted-foreground" />
            <h3 className="font-semibold text-lg">No Teams Assigned</h3>
            <p className="mt-1 max-w-sm text-muted-foreground text-sm">
              You are not currently assigned to any teams in the directory.
            </p>
          </div>
        )}

        {myTeams.length > 0 && viewMode === "heatmap" && (
          <TeamHeatmap
            appsByTeam={appsByTeam}
            availabilityByEntry={availabilityByEntry}
            entriesByApp={entriesByApp}
            selectedYear={selectedYear}
            teams={myTeams}
            volumeByEntry={volumeByEntry}
          />
        )}

        {myTeams.length > 0 && viewMode === "table" && (
          <TeamTable
            applications={filteredApps}
            availabilityByEntry={availabilityByEntry}
            entriesByApp={entriesByApp}
            selectedYear={selectedYear}
            teams={myTeams}
            volumeByEntry={volumeByEntry}
          />
        )}

        {myTeams.length > 0 && viewMode === "list" && (
          <div className="space-y-4">
            {myTeams.map((team) => (
              <TeamSection
                applications={filteredApps.filter((a) => a.teamId === team.id)}
                availabilityByEntry={availabilityByEntry}
                entriesByApp={entriesByApp}
                expandedApps={expandedApps}
                getLeadershipDisplay={getLeadershipDisplay}
                key={team.id}
                onToggleApp={handleToggleApp}
                onViewFull={() => undefined}
                selectedYear={selectedYear}
                team={team}
                volumeByEntry={volumeByEntry}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
