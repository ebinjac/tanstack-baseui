import { createFileRoute, Link } from "@tanstack/react-router";
import { Route as RootRoute } from "../../__root";
import { getScorecardData } from "@/app/actions/scorecard";
import { getTeamById } from "@/app/actions/teams";
import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ChevronsUpDown,
  AlertTriangle,
  BarChart3,
  Activity,
  TrendingUp,
  Loader2,
  Hash,
  Percent,
  Calendar,
  Filter,
  LayoutDashboard,
} from "lucide-react";

// Import from scorecard components
import {
  // Types
  type ViewMode,
  type TimePeriod,
  type ScorecardEntry,
  type Application,
  type AvailabilityRecord,
  type VolumeRecord,
  type MonthInfo,
  // Constants
  TIME_PERIOD_OPTIONS,
  AVAILABLE_YEARS,
  currentYear,
  currentMonth,
  getMonthsForPeriod,
  getMonthsForYear,
  // Components
  StatsCard,
  ApplicationSection,
  AddEntryDialog,
  EditEntryDialog,
  DeleteEntryDialog,
  MetricsChartSheet,
} from "@/components/scorecard";

export const Route = createFileRoute("/teams/$teamId/scorecard")({
  loader: async ({ params }) => {
    const team = await getTeamById({ data: { teamId: params.teamId } });
    if (!team) {
      throw new Error("Team not found");
    }
    return { team };
  },
  component: ScorecardPage,
});

function ScorecardPage() {
  const { team } = Route.useLoaderData();
  const { teamId } = Route.useParams();
  const { session } = (RootRoute as any).useLoaderData();
  const queryClient = useQueryClient();

  const isAdmin = session?.permissions?.some(
    (p: { teamId: string; role: string }) => p.teamId === teamId && p.role === "ADMIN"
  );

  const [viewMode, setViewMode] = useState<ViewMode>("period");
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("ytd");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const [addEntryAppId, setAddEntryAppId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<ScorecardEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<ScorecardEntry | null>(null);

  // Chart sheet state
  const [showChart, setShowChart] = useState(false);

  const toggleAllApps = () => {
    const allAppIds = scorecardData?.applications?.map((app: Application) => app.id) || [];
    if (expandedApps.size > 0 && expandedApps.size === allAppIds.length) {
      setExpandedApps(new Set());
    } else {
      setExpandedApps(new Set(allAppIds));
    }
  };

  // Get the months to display based on view mode
  const displayMonths = useMemo(() => {
    if (viewMode === "year") {
      return getMonthsForYear(selectedYear);
    }
    return getMonthsForPeriod(selectedPeriod);
  }, [viewMode, selectedPeriod, selectedYear]);

  // Determine which years we need to fetch data for
  const yearsToFetch = useMemo(() => {
    const years = new Set<number>();
    displayMonths.forEach(m => years.add(m.year));
    return Array.from(years);
  }, [displayMonths]);

  // Fetch scorecard data for current year
  const { data: currentYearData, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ["scorecard", teamId, currentYear],
    queryFn: () => getScorecardData({ data: { teamId, year: currentYear } }),
  });

  // Fetch scorecard data for previous year (if needed)
  const { data: prevYearData, isLoading: isLoadingPrev } = useQuery({
    queryKey: ["scorecard", teamId, currentYear - 1],
    queryFn: () => getScorecardData({ data: { teamId, year: currentYear - 1 } }),
    enabled: yearsToFetch.includes(currentYear - 1),
  });

  const isLoading = isLoadingCurrent || (yearsToFetch.includes(currentYear - 1) && isLoadingPrev);

  // Merge data from both years
  const scorecardData = useMemo(() => {
    const apps = currentYearData?.applications || [];
    const entries = currentYearData?.entries || [];

    // Combine availability from both years
    const availability = [
      ...(currentYearData?.availability || []),
      ...(prevYearData?.availability || []),
    ];

    // Combine volume from both years
    const volume = [
      ...(currentYearData?.volume || []),
      ...(prevYearData?.volume || []),
    ];

    return { applications: apps, entries, availability, volume };
  }, [currentYearData, prevYearData]);

  // Build lookup maps with year-month composite key
  const { entriesByApp, availabilityByEntry, volumeByEntry } = useMemo(() => {
    const entriesByApp: Record<string, ScorecardEntry[]> = {};
    const availabilityByEntry: Record<string, Record<string, AvailabilityRecord>> = {};
    const volumeByEntry: Record<string, Record<string, VolumeRecord>> = {};

    scorecardData?.entries?.forEach((entry: ScorecardEntry) => {
      if (!entriesByApp[entry.applicationId]) {
        entriesByApp[entry.applicationId] = [];
      }
      entriesByApp[entry.applicationId].push(entry);
    });

    scorecardData?.availability?.forEach((av: AvailabilityRecord) => {
      if (!availabilityByEntry[av.scorecardEntryId]) {
        availabilityByEntry[av.scorecardEntryId] = {};
      }
      const key = `${av.year}-${av.month}`;
      availabilityByEntry[av.scorecardEntryId][key] = av;
    });

    scorecardData?.volume?.forEach((vol: VolumeRecord) => {
      if (!volumeByEntry[vol.scorecardEntryId]) {
        volumeByEntry[vol.scorecardEntryId] = {};
      }
      const key = `${vol.year}-${vol.month}`;
      volumeByEntry[vol.scorecardEntryId][key] = vol;
    });

    return { entriesByApp, availabilityByEntry, volumeByEntry };
  }, [scorecardData]);

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

  // Stats - calculated based on visible months only
  const stats = useMemo(() => {
    const apps = scorecardData?.applications?.length || 0;
    const entries = scorecardData?.entries?.length || 0;

    // Count records and breaches only for visible months
    let availRecords = 0;
    let volRecords = 0;
    let availBreaches = 0;

    scorecardData?.entries?.forEach((entry: ScorecardEntry) => {
      const threshold = parseFloat(entry.availabilityThreshold);
      const entryAvailability = availabilityByEntry[entry.id] || {};
      const entryVolume = volumeByEntry[entry.id] || {};

      displayMonths.forEach(({ year, month, isFuture }) => {
        if (isFuture) return;
        const key = `${year}-${month}`;
        if (entryAvailability[key]) {
          availRecords++;
          if (parseFloat(entryAvailability[key].availability) < threshold) {
            availBreaches++;
          }
        }
        if (entryVolume[key]) {
          volRecords++;
        }
      });
    });

    return { apps, entries, availRecords, volRecords, availBreaches };
  }, [scorecardData, availabilityByEntry, volumeByEntry, displayMonths]);

  // Get the period/year description
  const filterLabel = viewMode === "year"
    ? `Year ${selectedYear}`
    : TIME_PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.label || "";

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Scorecard
          </h1>
          <p className="text-muted-foreground mt-1">
            Track availability and volume metrics for {team.teamName}
          </p>
        </div>

        <Link to="/scorecard">
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <LayoutDashboard className="h-4 w-4" />
            Enterprise Scorecard
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatsCard
          icon={<Activity className="h-4 w-4 text-blue-500" />}
          label="Applications"
          value={stats.apps}
        />
        <StatsCard
          icon={<Hash className="h-4 w-4 text-indigo-500" />}
          label="Tracked Entries"
          value={stats.entries}
        />
        <StatsCard
          icon={<Percent className="h-4 w-4 text-green-500" />}
          label="Availability Records"
          value={stats.availRecords}
          sublabel={filterLabel}
        />
        <StatsCard
          icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
          label="Volume Records"
          value={stats.volRecords}
          sublabel={filterLabel}
        />
        <StatsCard
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          label="Breaches"
          value={stats.availBreaches}
          highlight={stats.availBreaches > 0}
          sublabel={filterLabel}
        />
      </div>

      {/* Main Content */}
      <Card className="shadow-sm border-muted/60">
        <CardHeader className="py-3 px-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Application Metrics
              </CardTitle>
              <CardDescription>
                View and edit availability and volume data. Future months are locked.
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
              </div>

              {/* View Mode Toggle */}
              <div className="flex rounded-md border border-border overflow-hidden">
                <button
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    viewMode === "period"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                  onClick={() => setViewMode("period")}
                >
                  Period
                </button>
                <button
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors border-l",
                    viewMode === "year"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                  onClick={() => setViewMode("year")}
                >
                  Year
                </button>
              </div>

              <div className="h-6 w-px bg-muted mx-1" />

              {/* Visualize Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs gap-1.5 hover:bg-background border border-transparent hover:border-border transition-all text-primary hover:text-primary"
                onClick={() => setShowChart(true)}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Visualize
              </Button>

              <div className="h-6 w-px bg-muted mx-1" />

              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs gap-1.5 hover:bg-background border border-transparent hover:border-border transition-all"
                onClick={toggleAllApps}
              >
                <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                {expandedApps.size > 0 && expandedApps.size === (scorecardData?.applications?.length || 0)
                  ? "Collapse All"
                  : "Expand All"}
              </Button>

              <div className="h-6 w-px bg-muted mx-1" />

              {/* Period Selector (when in period mode) */}
              {viewMode === "period" && (
                <Select
                  value={selectedPeriod}
                  onValueChange={(val) => setSelectedPeriod(val as TimePeriod)}
                >
                  <SelectTrigger className="w-[160px] bg-background border-none shadow-none h-8 font-medium">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_PERIOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Year Selector (when in year mode) */}
              {viewMode === "year" && (
                <Select
                  value={String(selectedYear)}
                  onValueChange={(val) => setSelectedYear(Number(val))}
                >
                  <SelectTrigger className="w-[120px] bg-background border-none shadow-none h-8 font-medium">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_YEARS.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !scorecardData?.applications?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No Applications Found</h3>
              <p className="text-muted-foreground text-sm max-w-md mt-2">
                Add applications in Team Settings to start tracking metrics.
              </p>
              <Link to="/teams/$teamId/settings" params={{ teamId }}>
                <Button className="mt-4">Go to Settings</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {scorecardData.applications.map((app: Application) => (
                <ApplicationSection
                  key={app.id}
                  app={app}
                  isAdmin={isAdmin}
                  isExpanded={expandedApps.has(app.id)}
                  onToggle={() => toggleApp(app.id)}
                  entries={entriesByApp[app.id] || []}
                  availabilityByEntry={availabilityByEntry}
                  volumeByEntry={volumeByEntry}
                  displayMonths={displayMonths}
                  onAddEntry={() => setAddEntryAppId(app.id)}
                  onEditEntry={(entry) => setEditingEntry(entry)}
                  onDeleteEntry={(entry) => setDeletingEntry(entry)}
                  teamId={teamId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Entry Dialog */}
      {addEntryAppId && (
        <AddEntryDialog
          applicationId={addEntryAppId}
          open={!!addEntryAppId}
          onOpenChange={(open) => !open && setAddEntryAppId(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["scorecard", teamId],
            });
            setAddEntryAppId(null);
          }}
        />
      )}

      {/* Edit Entry Dialog */}
      {editingEntry && (
        <EditEntryDialog
          entry={editingEntry}
          open={!!editingEntry}
          onOpenChange={(open) => !open && setEditingEntry(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["scorecard", teamId],
            });
            setEditingEntry(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingEntry && (
        <DeleteEntryDialog
          entry={deletingEntry}
          open={!!deletingEntry}
          onOpenChange={(open) => !open && setDeletingEntry(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["scorecard", teamId],
            });
            setDeletingEntry(null);
          }}
        />
      )}

      {/* Metrics Chart Sheet */}
      <MetricsChartSheet
        open={showChart}
        onOpenChange={setShowChart}
        applications={scorecardData?.applications || []}
        entriesByApp={entriesByApp}
        availabilityByEntry={availabilityByEntry}
        volumeByEntry={volumeByEntry}
        displayMonths={displayMonths}
        filterLabel={filterLabel}
      />
    </div>
  );
}
