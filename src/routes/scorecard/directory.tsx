import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Grid2X2, LayoutGrid, List, RotateCcw } from "lucide-react";
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
  CURRENT_MONTH,
  CURRENT_YEAR,
  EnterpriseFilters,
  StatsSummary,
  TeamHeatmap,
  TeamSection,
  TeamTable,
} from "@/components/enterprise-scorecard";
import { EnterpriseScorecardSkeleton } from "@/components/skeletons/enterprise-scorecard-skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/scorecard/directory")({
  component: EnterpriseDirectoryView,
});

function checkLeadershipMatch(
  app: Application,
  type: string,
  searchStr: string
): boolean {
  if (type === "all" || !searchStr) {
    return true;
  }
  const searchLower = searchStr.toLowerCase();

  switch (type) {
    case "appManager":
      return !!app.applicationManagerName?.toLowerCase().includes(searchLower);
    case "appOwner":
      return !!app.applicationOwnerName?.toLowerCase().includes(searchLower);
    case "director":
      return !!app.directorName?.toLowerCase().includes(searchLower);
    case "svp":
      return !!app.ownerSvpName?.toLowerCase().includes(searchLower);
    case "unitCio":
      return !!app.unitCioName?.toLowerCase().includes(searchLower);
    case "vp":
      return !!app.vpName?.toLowerCase().includes(searchLower);
    default:
      return false;
  }
}

function EnterpriseDirectoryView() {
  const [viewMode, setViewMode] = useState<"list" | "heatmap" | "table">(
    "list"
  );
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  // Filter States
  const [teamSearch, setTeamSearch] = useState("");
  const [appSearch, setAppSearch] = useState("");
  const [leadershipSearch, setLeadershipSearch] = useState("");
  const [leadershipType, setLeadershipType] = useState("all");

  const { data: scorecardData, isLoading } = useQuery({
    queryKey: [
      "scorecard",
      "global",
      selectedYear,
      leadershipType,
      leadershipSearch,
    ],
    queryFn: () =>
      getGlobalScorecardData({
        data: {
          year: selectedYear,
          leadershipFilter: leadershipSearch || undefined,
          leadershipType: leadershipType || undefined,
        },
      }),
  });

  const applications = scorecardData?.applications || [];
  const entries = scorecardData?.entries || [];
  const teams = scorecardData?.teams || [];

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

  // Filter Logic
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (
        appSearch &&
        !app.applicationName.toLowerCase().includes(appSearch.toLowerCase()) &&
        !app.tla.toLowerCase().includes(appSearch.toLowerCase())
      ) {
        return false;
      }

      if (teamSearch) {
        const team = teams.find((t) => t.id === app.teamId);
        if (!team?.teamName.toLowerCase().includes(teamSearch.toLowerCase())) {
          return false;
        }
      }

      if (
        leadershipType !== "all" &&
        leadershipSearch &&
        !checkLeadershipMatch(app, leadershipType, leadershipSearch)
      ) {
        return false;
      }

      return true;
    });
  }, [
    applications,
    teams,
    appSearch,
    teamSearch,
    leadershipType,
    leadershipSearch,
  ]);

  const filteredTeams = useMemo(() => {
    const activeTeamIds = new Set(filteredApps.map((a) => a.teamId));
    return teams.filter((t) => activeTeamIds.has(t.id));
  }, [teams, filteredApps]);

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

  // Handle clear-all from Filters
  const handleClearAll = () => {
    setTeamSearch("");
    setAppSearch("");
    setLeadershipSearch("");
    setLeadershipType("all");
    setSelectedYear(CURRENT_YEAR);
  };

  const stats = {
    teams: filteredTeams.length,
    apps: filteredApps.length,
    entries: filteredApps.reduce(
      (acc, app) =>
        acc + entries.filter((e) => e.applicationId === app.id).length,
      0
    ),
    availBreaches: entries.reduce((acc, entry) => {
      if (!filteredApps.find((a) => a.id === entry.applicationId)) {
        return acc;
      }

      const isCurrentYear = selectedYear === CURRENT_YEAR;
      const monthOffset = isCurrentYear ? CURRENT_MONTH - 1 : 12;

      let breaches = 0;
      for (let i = monthOffset; i > 0; i--) {
        const data = availabilityByEntry[entry.id]?.[`${selectedYear}-${i}`];
        if (
          data &&
          Number.parseFloat(data.availability) <
            Number.parseFloat(entry.availabilityThreshold)
        ) {
          breaches++;
        }
      }
      return acc + breaches;
    }, 0),
  };

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Enterprise Directory
          </h1>
          <p className="mt-2 text-muted-foreground">
            Explore and filter teams and application scorecards across the
            organization.
          </p>
        </div>
        <StatsSummary stats={stats} />
      </div>

      <div className="flex flex-col gap-4">
        <EnterpriseFilters
          applications={applications}
          appSearch={appSearch}
          leadershipOptions={scorecardData?.leadershipOptions || {}}
          leadershipSearch={leadershipSearch}
          leadershipType={leadershipType}
          onAppSearchChange={setAppSearch}
          onClearAll={handleClearAll}
          onLeadershipSearchChange={setLeadershipSearch}
          onLeadershipTypeChange={setLeadershipType}
          onTeamSearchChange={setTeamSearch}
          onYearChange={setSelectedYear}
          selectedYear={selectedYear}
          teamSearch={teamSearch}
          teams={teams}
        />
      </div>

      {/* Toggles & View Area */}
      <div className="mt-4 flex items-center justify-between">
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
      </div>

      <div className="mt-4 pb-20">
        {filteredTeams.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
            <h3 className="font-semibold text-lg">No matches found</h3>
            <p className="mt-1 max-w-sm text-muted-foreground text-sm">
              Adjust your filters to see more results.
            </p>
            <Button className="mt-4" onClick={handleClearAll} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        )}

        {filteredTeams.length > 0 && viewMode === "heatmap" && (
          <TeamHeatmap
            appsByTeam={appsByTeam}
            availabilityByEntry={availabilityByEntry}
            entriesByApp={entriesByApp}
            selectedYear={selectedYear}
            teams={filteredTeams}
            volumeByEntry={volumeByEntry}
          />
        )}

        {filteredTeams.length > 0 && viewMode === "table" && (
          <TeamTable
            applications={filteredApps}
            availabilityByEntry={availabilityByEntry}
            entriesByApp={entriesByApp}
            selectedYear={selectedYear}
            teams={filteredTeams}
            volumeByEntry={volumeByEntry}
          />
        )}

        {filteredTeams.length > 0 && viewMode === "list" && (
          <div className="space-y-4">
            {filteredTeams.map((team) => (
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
