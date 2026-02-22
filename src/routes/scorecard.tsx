import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Building2,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getGlobalScorecardData } from "@/app/actions/scorecard";
import type {
  Application,
  AvailabilityRecord,
  ScorecardEntry,
  ScorecardStats,
  Team,
  VolumeRecord,
} from "@/components/enterprise-scorecard";
// Import enterprise scorecard components
import {
  CURRENT_MONTH,
  CURRENT_YEAR,
  EnterpriseFilters,
  EntryRows,
  MONTHS,
  StatsSummary,
  TeamSection,
} from "@/components/enterprise-scorecard";
import { PageHeader } from "@/components/shared";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { scorecardKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scorecard")({
  component: GlobalScorecardPage,
});

function GlobalScorecardPage() {
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [leadershipType, setLeadershipType] = useState<string>("all");
  const [leadershipSearch, setLeadershipSearch] = useState<string>("");
  const [teamSearch, setTeamSearch] = useState<string>("");
  const [appSearch, setAppSearch] = useState<string>("");
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const [viewTeam, setViewTeam] = useState<Team | null>(null);
  const [drawerRange, setDrawerRange] = useState<string>("full");

  // Calculate visible months for the drawer/detail view
  const visibleMonths = useMemo(() => {
    if (drawerRange === "full") {
      return MONTHS.map((_, i) => ({ month: i + 1, year: selectedYear }));
    }

    const isCurrentYear = selectedYear === CURRENT_YEAR;
    const endMonth = isCurrentYear ? CURRENT_MONTH : 12;

    if (drawerRange === "ytd") {
      return Array.from({ length: endMonth }, (_, i) => ({
        month: i + 1,
        year: selectedYear,
      }));
    }

    let count = 3;
    if (drawerRange === "last6") {
      count = 6;
    }
    if (drawerRange === "last12") {
      count = 12;
    }

    const result: Array<{ month: number; year: number }> = [];
    let currM = endMonth;
    let currY = selectedYear;

    for (let i = 0; i < count; i++) {
      result.unshift({ month: currM, year: currY });
      currM--;
      if (currM < 1) {
        currM = 12;
        currY--;
      }
    }
    return result;
  }, [drawerRange, selectedYear]);

  // Fetch global scorecard data
  const { data: scorecardData, isLoading } = useQuery({
    queryKey: scorecardKeys.global.filtered({
      year: selectedYear,
      leadershipType: leadershipType !== "all" ? leadershipType : undefined,
      leadershipSearch: leadershipSearch || undefined,
    }),
    queryFn: () =>
      getGlobalScorecardData({
        data: {
          year: selectedYear,
          leadershipFilter: leadershipSearch || undefined,
          leadershipType: leadershipType !== "all" ? leadershipType : undefined,
        },
      }),
  });

  // Build lookup maps and apply client-side team/app filtering
  const { appsByTeam, entriesByApp, availabilityByEntry, volumeByEntry } =
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: builds multiple lookup maps from scorecard data
    useMemo(() => {
      const appsByTeam: Record<string, Application[]> = {};
      const entriesByApp: Record<string, ScorecardEntry[]> = {};
      const availabilityByEntry: Record<
        string,
        Record<string, AvailabilityRecord>
      > = {};
      const volumeByEntry: Record<string, Record<string, VolumeRecord>> = {};

      // Filter apps by name if search is active
      const filteredApps = (scorecardData?.applications || []).filter(
        (app: Application) => {
          const matchesApp =
            !appSearch ||
            app.applicationName.toLowerCase().includes(appSearch.toLowerCase());
          const team = (scorecardData?.teams || []).find(
            (t: Team) => t.id === app.teamId
          );
          const matchesTeam =
            !teamSearch ||
            team?.teamName.toLowerCase().includes(teamSearch.toLowerCase());
          return matchesApp && matchesTeam;
        }
      );

      for (const app of filteredApps) {
        if (!appsByTeam[app.teamId]) {
          appsByTeam[app.teamId] = [];
        }
        appsByTeam[app.teamId].push(app);
      }

      for (const entry of scorecardData?.entries || []) {
        if (!entriesByApp[entry.applicationId]) {
          entriesByApp[entry.applicationId] = [];
        }
        entriesByApp[entry.applicationId].push(entry);
      }

      for (const av of scorecardData?.availability || []) {
        if (!availabilityByEntry[av.scorecardEntryId]) {
          availabilityByEntry[av.scorecardEntryId] = {};
        }
        availabilityByEntry[av.scorecardEntryId][`${av.year}-${av.month}`] = av;
      }

      for (const vol of scorecardData?.volume || []) {
        if (!volumeByEntry[vol.scorecardEntryId]) {
          volumeByEntry[vol.scorecardEntryId] = {};
        }
        volumeByEntry[vol.scorecardEntryId][`${vol.year}-${vol.month}`] = vol;
      }

      return { appsByTeam, entriesByApp, availabilityByEntry, volumeByEntry };
    }, [scorecardData, teamSearch, appSearch]);

  // Teams with data after filtering
  const teamsWithApps = useMemo(() => {
    return (scorecardData?.teams || [])
      .filter((team: Team) => appsByTeam[team.id]?.length > 0)
      .sort((a: Team, b: Team) => a.teamName.localeCompare(b.teamName));
  }, [scorecardData, appsByTeam]);

  // Auto-expand all teams when data loads
  useEffect(() => {
    if (teamsWithApps.length > 0) {
      setExpandedTeams(new Set(teamsWithApps.map((t: Team) => t.id)));
    }
  }, [teamsWithApps]);

  // Stats
  const stats: ScorecardStats = useMemo(() => {
    const teams = teamsWithApps.length;
    const apps = scorecardData?.applications?.length || 0;
    const entries = scorecardData?.entries?.length || 0;

    let availBreaches = 0;
    for (const entry of scorecardData?.entries || []) {
      const threshold = Number.parseFloat(entry.availabilityThreshold);
      const entryAvail = availabilityByEntry[entry.id] || {};
      for (const av of Object.values(entryAvail)) {
        if (Number.parseFloat(av.availability) < threshold) {
          availBreaches++;
        }
      }
    }

    return { teams, apps, entries, availBreaches };
  }, [teamsWithApps, scorecardData, availabilityByEntry]);

  const toggleTeam = (teamId: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const toggleApp = (appId: string) => {
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

  // Get leadership display for an application
  const getLeadershipDisplay = (app: Application) => {
    const leaders: Array<{ role: string; name: string }> = [];
    if (app.ownerSvpName) {
      leaders.push({ role: "SVP", name: app.ownerSvpName });
    }
    if (app.vpName) {
      leaders.push({ role: "VP", name: app.vpName });
    }
    if (app.directorName) {
      leaders.push({ role: "Dir", name: app.directorName });
    }
    if (app.applicationOwnerName) {
      leaders.push({ role: "Owner", name: app.applicationOwnerName });
    }
    return leaders.slice(0, 3);
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: CSV export requires nested iteration
  const handleExportCSV = (team: Team) => {
    const apps = appsByTeam[team.id] || [];
    let csv = "Ensemble Scorecard Report\n";
    csv += `Team: ${team.teamName}\n`;
    csv += `Year: ${selectedYear}\n`;
    csv += `Range: ${drawerRange.toUpperCase()}\n\n`;

    csv +=
      "Application,Asset ID,Metric,Identifier,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,Average/Total\n";

    for (const app of apps) {
      const entries = entriesByApp[app.id] || [];
      for (const entry of entries) {
        // Availability row
        let availRow = `"${app.applicationName}",${app.assetId},"${entry.name} (Availability)","${entry.scorecardIdentifier}"`;
        let sumAvail = 0;
        let countAvail = 0;
        for (let m = 1; m <= 12; m++) {
          const key = `${selectedYear}-${m}`;
          const val = availabilityByEntry[entry.id]?.[key]?.availability;
          availRow += `,${val ? Number.parseFloat(val).toFixed(2) : ""}`;
          if (val) {
            sumAvail += Number.parseFloat(val);
            countAvail++;
          }
        }
        csv +=
          availRow +
          `,${countAvail > 0 ? (sumAvail / countAvail).toFixed(2) : ""}\n`;

        // Volume row
        let volRow = `"",,,"${entry.name} (Volume)",""`;
        let totalVol = 0;
        for (let m = 1; m <= 12; m++) {
          const key = `${selectedYear}-${m}`;
          const val = volumeByEntry[entry.id]?.[key]?.volume;
          volRow += `,${val || ""}`;
          if (val) {
            totalVol += val;
          }
        }
        csv += `${volRow},${totalVol}\n`;
      }
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${team.teamName.replace(/\s+/g, "_")}_Scorecard_${selectedYear}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAllFilters = () => {
    setLeadershipType("all");
    setLeadershipSearch("");
    setTeamSearch("");
    setAppSearch("");
  };

  return (
    <div className="fade-in container mx-auto max-w-7xl animate-in space-y-8 px-6 py-8 duration-500">
      {/* Premium Admin Header Banner */}
      <PageHeader
        description={
          <>
            Global performance metrics and compliance across{" "}
            <span className="font-bold text-white">{teamsWithApps.length}</span>{" "}
            active teams.
          </>
        }
        title="Enterprise Scorecard"
      >
        <Button
          className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          disabled={
            !isLoading &&
            teamsWithApps.length === scorecardData?.teams?.length &&
            leadershipType === "all" &&
            !leadershipSearch &&
            !teamSearch &&
            !appSearch
          }
          onClick={handleClearAllFilters}
          size="sm"
          variant="outline"
        >
          <RotateCcw className="h-4 w-4" />
          Reset All
        </Button>
      </PageHeader>

      {/* Stats Overview */}
      <StatsSummary stats={stats} />

      {/* Structured Search & Filters */}
      <div>
        <EnterpriseFilters
          applications={scorecardData?.applications || []}
          appSearch={appSearch}
          leadershipOptions={scorecardData?.leadershipOptions}
          leadershipSearch={leadershipSearch}
          leadershipType={leadershipType}
          onAppSearchChange={setAppSearch}
          onClearAll={handleClearAllFilters}
          onLeadershipSearchChange={setLeadershipSearch}
          onLeadershipTypeChange={setLeadershipType}
          onTeamSearchChange={setTeamSearch}
          onYearChange={setSelectedYear}
          selectedYear={selectedYear}
          teamSearch={teamSearch}
          teams={scorecardData?.teams || []}
        />
      </div>

      {/* Team Scorecards List */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-foreground text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Teams ({teamsWithApps.length})
          </h2>
        </div>

        <div className="divide-y rounded-lg border">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoading && teamsWithApps.length === 0 && (
            <EmptyState
              description="Try adjusting your search criteria or clear filters."
              icon={Activity}
              size="md"
              title="No teams match your filters"
              variant="search"
            />
          )}
          {!isLoading &&
            teamsWithApps.length > 0 &&
            teamsWithApps.map((team: Team) => (
              <TeamSection
                applications={appsByTeam[team.id] || []}
                availabilityByEntry={availabilityByEntry}
                entriesByApp={entriesByApp}
                expandedApps={expandedApps}
                getLeadershipDisplay={getLeadershipDisplay}
                isExpanded={expandedTeams.has(team.id)}
                key={team.id}
                onToggle={() => toggleTeam(team.id)}
                onToggleApp={toggleApp}
                onViewFull={() => setViewTeam(team)}
                selectedYear={selectedYear}
                team={team}
                volumeByEntry={volumeByEntry}
              />
            ))}
        </div>
      </div>

      {/* Team Scorecard Drawer */}
      <Drawer
        direction="right"
        onOpenChange={(open) => !open && setViewTeam(null)}
        open={!!viewTeam}
      >
        <DrawerContent className="!max-w-full flex h-full w-screen flex-col rounded-none border-none p-0 shadow-none focus:outline-none">
          {viewTeam && (
            <div className="flex h-full flex-col overflow-hidden rounded-l-3xl bg-background">
              <DrawerHeader className="shrink-0 border-b bg-muted/20 p-6">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                  <div className="flex items-center gap-6">
                    <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary shadow-sm">
                      <Building2 className="h-7 w-7" />
                    </div>
                    <div>
                      <DrawerTitle className="flex items-center gap-3 font-bold text-2xl tracking-tight">
                        {viewTeam.teamName}
                      </DrawerTitle>
                      <DrawerDescription className="mt-1 font-medium text-muted-foreground text-sm">
                        Enterprise Performance Report •{" "}
                        <span className="font-bold text-foreground">
                          {selectedYear}
                        </span>
                      </DrawerDescription>
                    </div>

                    <div className="mx-2 hidden h-10 w-px bg-border md:block" />

                    {/* Range Selector */}
                    <Tabs onValueChange={setDrawerRange} value={drawerRange}>
                      <TabsList>
                        <TabsTrigger value="full">Full Year</TabsTrigger>
                        <TabsTrigger value="ytd">YTD</TabsTrigger>
                        <TabsTrigger value="last3">Last 3M</TabsTrigger>
                        <TabsTrigger value="last6">Last 6M</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      className="gap-2"
                      onClick={() => handleExportCSV(viewTeam)}
                      size="sm"
                      variant="outline"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      CSV Export
                    </Button>

                    <Button
                      onClick={() => setViewTeam(null)}
                      size="icon"
                      variant="ghost"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </DrawerHeader>

              <div className="mx-auto w-full max-w-7xl flex-1 space-y-10 overflow-y-auto p-8 pb-20">
                {(appsByTeam[viewTeam.id] || []).map((app) => (
                  <div className="space-y-6" key={app.id}>
                    <div className="flex flex-col justify-between gap-6 border-border/50 border-b pb-4 md:flex-row md:items-center">
                      <div className="flex items-center gap-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-sm">
                          <Activity className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-xl tracking-tight">
                              {app.applicationName}
                            </h3>
                            <Badge
                              className="h-5 px-2 font-bold text-[10px] uppercase tracking-widest"
                              variant="outline"
                            >
                              {app.tla}
                            </Badge>
                            {app.tier &&
                              ["0", "1", "2"].includes(String(app.tier)) && (
                                <Badge className="h-5 border-red-500/20 bg-red-500/10 px-2 font-bold text-[10px] text-red-600">
                                  Tier {app.tier}
                                </Badge>
                              )}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                            {getLeadershipDisplay(app).map((l) => (
                              <div
                                className="flex items-center gap-1.5 opacity-70 grayscale"
                                key={`${l.role}-${l.name}`}
                              >
                                <span className="font-bold text-[10px] uppercase tracking-wider opacity-60">
                                  {l.role}:
                                </span>
                                <span className="font-bold text-[11px] text-foreground">
                                  {l.name}
                                </span>
                              </div>
                            ))}
                            <span className="hidden text-muted-foreground/30 md:block">
                              •
                            </span>
                            <div className="flex items-center gap-1.5 opacity-60">
                              <span className="font-bold text-[10px] uppercase tracking-wider opacity-60">
                                Asset ID:
                              </span>
                              <span className="font-bold font-mono text-[11px] text-foreground">
                                {app.assetId}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/30 shadow-xl backdrop-blur-md">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow className="border-b-border/30 hover:bg-transparent">
                            <TableHead className="w-[240px] py-3 pl-6 font-bold text-[10px] uppercase tracking-wider">
                              Metric Configuration
                            </TableHead>
                            <TableHead className="w-[60px] py-3 font-bold text-[10px] uppercase tracking-wider">
                              Core
                            </TableHead>
                            {visibleMonths.map((vm) => {
                              const isFutureMonth =
                                vm.year === CURRENT_YEAR &&
                                vm.month > CURRENT_MONTH;
                              return (
                                <TableHead
                                  className={cn(
                                    "py-3 text-center font-bold text-[10px] uppercase tracking-wider",
                                    isFutureMonth && "text-muted-foreground/40"
                                  )}
                                  key={`${vm.year}-${vm.month}`}
                                >
                                  <div className="flex flex-col leading-none">
                                    <span>{MONTHS[vm.month - 1]}</span>
                                    {vm.year !== selectedYear && (
                                      <span className="mt-1 text-[8px] opacity-60">
                                        {vm.year}
                                      </span>
                                    )}
                                  </div>
                                </TableHead>
                              );
                            })}
                            <TableHead className="bg-primary/5 py-3 pr-6 text-center font-bold text-[10px] text-primary uppercase tracking-wider">
                              Performance
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(entriesByApp[app.id] || []).map((entry) => (
                            <EntryRows
                              availability={availabilityByEntry[entry.id] || {}}
                              entry={entry}
                              key={entry.id}
                              selectedYear={selectedYear}
                              visibleMonths={visibleMonths}
                              volume={volumeByEntry[entry.id] || {}}
                            />
                          ))}
                          {(!entriesByApp[app.id] ||
                            entriesByApp[app.id].length === 0) && (
                            <TableRow>
                              <TableCell
                                className="h-32 text-center font-medium text-muted-foreground italic"
                                colSpan={visibleMonths.length + 3}
                              >
                                No active metrics registered for this
                                application
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
