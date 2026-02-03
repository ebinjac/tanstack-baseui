import { createFileRoute, Link } from "@tanstack/react-router";
import { Route as RootRoute } from "../../__root";
import { getScorecardData, getPublishStatus, publishScorecard, unpublishScorecard } from "@/app/actions/scorecard";
import { getTeamById } from "@/app/actions/teams";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  CheckCircle2,
  Send,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

// Import from scorecard components
import {
  // Types
  type ViewMode,
  type TimePeriod,
  type ScorecardEntry,
  type Application,
  type AvailabilityRecord,
  type VolumeRecord,

  // Constants
  TIME_PERIOD_OPTIONS,
  AVAILABLE_YEARS,
  currentYear,

  getMonthsForPeriod,
  getMonthsForYear,
  MONTH_NAMES,
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

  // Publish dialog state
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishMonth, setPublishMonth] = useState<{ year: number; month: number } | null>(null);
  const [publishAction, setPublishAction] = useState<"publish" | "unpublish">("publish");

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

  // Fetch publish status for current year
  const { data: publishStatusCurrentYear } = useQuery({
    queryKey: ["publishStatus", teamId, currentYear],
    queryFn: () => getPublishStatus({ data: { teamId, year: currentYear } }),
  });

  // Fetch publish status for previous year (if needed)
  const { data: publishStatusPrevYear } = useQuery({
    queryKey: ["publishStatus", teamId, currentYear - 1],
    queryFn: () => getPublishStatus({ data: { teamId, year: currentYear - 1 } }),
    enabled: yearsToFetch.includes(currentYear - 1),
  });

  // Combine publish status from both years
  const publishStatusByMonth = useMemo(() => {
    const status: Record<string, { isPublished: boolean; publishedBy: string | null; publishedAt: Date | null }> = {};

    // Add current year status
    if (publishStatusCurrentYear?.statusByMonth) {
      Object.entries(publishStatusCurrentYear.statusByMonth).forEach(([month, data]) => {
        status[`${currentYear}-${month}`] = data;
      });
    }

    // Add previous year status
    if (publishStatusPrevYear?.statusByMonth) {
      Object.entries(publishStatusPrevYear.statusByMonth).forEach(([month, data]) => {
        status[`${currentYear - 1}-${month}`] = data;
      });
    }

    return status;
  }, [publishStatusCurrentYear, publishStatusPrevYear]);

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: (params: { year: number; month: number }) =>
      publishScorecard({ data: { teamId, year: params.year, month: params.month } }),
    onSuccess: () => {
      toast.success("Scorecard published successfully", {
        description: "Data is now visible in the Enterprise Scorecard.",
      });
      queryClient.invalidateQueries({ queryKey: ["publishStatus", teamId] });
      setShowPublishDialog(false);
      setPublishMonth(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to publish scorecard", {
        description: error.message,
      });
    },
  });

  // Unpublish mutation
  const unpublishMutation = useMutation({
    mutationFn: (params: { year: number; month: number }) =>
      unpublishScorecard({ data: { teamId, year: params.year, month: params.month } }),
    onSuccess: () => {
      toast.success("Scorecard unpublished", {
        description: "Data is no longer visible in the Enterprise Scorecard.",
      });
      queryClient.invalidateQueries({ queryKey: ["publishStatus", teamId] });
      setShowPublishDialog(false);
      setPublishMonth(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to unpublish scorecard", {
        description: error.message,
      });
    },
  });

  const handlePublishClick = (year: number, month: number) => {
    setPublishMonth({ year, month });
    setPublishAction("publish");
    setShowPublishDialog(true);
  };

  const handleUnpublishClick = (year: number, month: number) => {
    setPublishMonth({ year, month });
    setPublishAction("unpublish");
    setShowPublishDialog(true);
  };

  const confirmPublishAction = () => {
    if (!publishMonth) return;
    if (publishAction === "publish") {
      publishMutation.mutate(publishMonth);
    } else {
      unpublishMutation.mutate(publishMonth);
    }
  };

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

  // Calculate months requiring publishing:
  // 1. Months that were never published
  // 2. Months where data has been modified after the last publish (pending changes)
  const { unpublishedMonths, pendingChangesMonths } = useMemo(() => {
    const unpublished: typeof displayMonths = [];
    const pendingChanges: typeof displayMonths = [];

    displayMonths.forEach(({ year, month, isFuture, label }) => {
      if (isFuture) return;

      const key = `${year}-${month}`;
      const status = publishStatusByMonth[key];

      // Check if never published
      if (!status?.isPublished) {
        unpublished.push({ year, month, isFuture, label });
        return;
      }

      // Check if data was modified after the last publish
      const publishedAt = status.publishedAt ? new Date(status.publishedAt) : null;
      if (!publishedAt) {
        unpublished.push({ year, month, isFuture, label });
        return;
      }

      // Check availability records for this month
      let hasPendingChanges = false;

      Object.values(availabilityByEntry).forEach(entryAvail => {
        const av = entryAvail[key];
        if (av) {
          const dataUpdatedAt = av.updatedAt ? new Date(av.updatedAt) : (av.createdAt ? new Date(av.createdAt) : null);
          if (dataUpdatedAt && dataUpdatedAt > publishedAt) {
            hasPendingChanges = true;
          }
        }
      });

      // Check volume records for this month
      if (!hasPendingChanges) {
        Object.values(volumeByEntry).forEach(entryVol => {
          const vol = entryVol[key];
          if (vol) {
            const dataUpdatedAt = vol.updatedAt ? new Date(vol.updatedAt) : (vol.createdAt ? new Date(vol.createdAt) : null);
            if (dataUpdatedAt && dataUpdatedAt > publishedAt) {
              hasPendingChanges = true;
            }
          }
        });
      }

      if (hasPendingChanges) {
        pendingChanges.push({ year, month, isFuture, label });
      }
    });

    return { unpublishedMonths: unpublished, pendingChangesMonths: pendingChanges };
  }, [displayMonths, publishStatusByMonth, availabilityByEntry, volumeByEntry]);

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
    <div className="container mx-auto py-8 px-6 max-w-7xl space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Scorecard
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium flex items-center gap-2">
            Metrics tracking for
            <span className="text-foreground font-black px-2 py-0.5 rounded bg-muted/50 border border-border/50">
              {team.teamName}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/scorecard">
            <Button variant="outline" size="sm" className="gap-2 h-10 px-4 font-black uppercase tracking-widest text-[10px] border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all active:scale-95 shadow-sm">
              <Activity className="h-4 w-4 text-primary" />
              Enterprise View
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/teams/$teamId/settings" params={{ teamId }}>
              <Button variant="ghost" size="sm" className="h-10 px-3 hover:bg-muted/50 transition-all font-bold text-xs">
                Manage Apps
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          icon={<Activity className="text-blue-500" />}
          label="Applications"
          value={stats.apps}
        />
        <StatsCard
          icon={<Hash className="text-indigo-500" />}
          label="Tracked Tech"
          value={stats.entries}
        />
        <StatsCard
          icon={<Percent className="text-green-500" />}
          label="Availability"
          value={stats.availRecords}
          sublabel={filterLabel}
        />
        <StatsCard
          icon={<TrendingUp className="text-purple-500" />}
          label="Volume Log"
          value={stats.volRecords}
          sublabel={filterLabel}
        />
        <StatsCard
          icon={<AlertTriangle className="text-red-500" />}
          label="SLA Breaches"
          value={stats.availBreaches}
          highlight={stats.availBreaches > 0}
          sublabel={filterLabel}
        />
      </div>

      {/* Sync Status Bar */}
      {isAdmin && (
        <div className={cn(
          "flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-3 rounded-2xl border transition-all duration-300",
          (unpublishedMonths.length > 0 || pendingChangesMonths.length > 0)
            ? "border-orange-500/30 bg-orange-500/[0.04] ring-1 ring-orange-500/10"
            : "border-green-500/20 bg-green-500/[0.02]"
        )}>
          <div className="flex items-center gap-3">
            {(unpublishedMonths.length > 0 || pendingChangesMonths.length > 0) ? (
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest text-orange-700">
                    Sync Required
                  </span>
                  <span className="text-[10px] font-bold text-orange-600/70">
                    Select a month below to publish changes
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs font-black uppercase tracking-widest text-green-700/70">
                  Fully Synchronized
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {displayMonths.filter(m => !m.isFuture).map(({ year, month, label }) => {
              const key = `${year}-${month}`;
              const hasPending = pendingChangesMonths.some(p => p.year === year && p.month === month);
              const isUnpublished = unpublishedMonths.some(u => u.year === year && u.month === month);

              let colorClass = "";
              if (hasPending) colorClass = "bg-orange-500/10 text-orange-700 border-orange-500/20";
              else if (isUnpublished) colorClass = "bg-amber-500/10 text-amber-700 border-amber-500/20";
              else colorClass = "bg-green-500/5 text-green-700/50 border-green-500/10 hover:bg-green-500/10";

              return (
                <button
                  key={key}
                  className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight transition-all border active:scale-95",
                    colorClass
                  )}
                  onClick={() => (hasPending || isUnpublished) ? handlePublishClick(year, month) : handleUnpublishClick(year, month)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <Card className="shadow-sm border-border/50 overflow-hidden rounded-3xl bg-card/30 backdrop-blur-sm">
        <CardHeader className="py-5 px-6 border-b border-border/40 bg-muted/20">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-primary" />
                Service Metrics
              </CardTitle>
              <CardDescription className="text-sm font-medium mt-1">
                Performance tracking and reliability metrics for application services.
              </CardDescription>
            </div>

            {/* Structured Toolbar */}
            <div className="flex flex-wrap items-center gap-3 bg-background/60 p-1.5 rounded-2xl border border-border/50 shadow-sm backdrop-blur-md">
              <div className="flex rounded-xl border border-border p-1 bg-muted/30">
                <button
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg",
                    viewMode === "period"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                  onClick={() => setViewMode("period")}
                >
                  Period
                </button>
                <button
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg",
                    viewMode === "year"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                  onClick={() => setViewMode("year")}
                >
                  Year
                </button>
              </div>

              <div className="h-6 w-px bg-border/50 mx-1" />

              {/* Period/Year Selector */}
              {viewMode === "period" ? (
                <Select
                  value={selectedPeriod}
                  onValueChange={(val) => setSelectedPeriod(val as TimePeriod)}
                >
                  <SelectTrigger className="w-[160px] bg-background border border-border/50 h-9 font-bold text-xs rounded-xl focus:ring-primary/20 transition-all">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 shadow-xl">
                    {TIME_PERIOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="py-2 focus:bg-primary/10">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs">{option.label}</span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={String(selectedYear)}
                  onValueChange={(val) => setSelectedYear(Number(val))}
                >
                  <SelectTrigger className="w-[120px] bg-background border border-border/50 h-9 font-bold text-xs rounded-xl focus:ring-primary/20 transition-all">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 shadow-xl">
                    {AVAILABLE_YEARS.map((year) => (
                      <SelectItem key={year} value={String(year)} className="focus:bg-primary/10 font-bold text-xs py-2">
                        Year {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="h-6 w-px bg-border/50 mx-1" />

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-[10px] font-black uppercase tracking-widest gap-2 bg-background hover:bg-primary/5 hover:text-primary hover:border-primary/40 border-border/50 transition-all rounded-xl active:scale-95"
                  onClick={() => setShowChart(true)}
                >
                  <TrendingUp className="h-4 w-4" />
                  Visualize
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-[10px] font-black uppercase tracking-widest gap-2 hover:bg-muted/50 transition-all rounded-xl border border-transparent hover:border-border/50"
                  onClick={toggleAllApps}
                >
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                  {expandedApps.size > 0 && expandedApps.size === (scorecardData?.applications?.length || 0)
                    ? "Collapse All"
                    : "Expand All"}
                </Button>
              </div>
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

      {/* Publish/Unpublish Confirmation Dialog */}
      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {publishAction === "publish" ? (
                <>
                  <Send className="h-5 w-5 text-green-500" />
                  Publish Scorecard
                </>
              ) : (
                <>
                  <EyeOff className="h-5 w-5 text-amber-500" />
                  Unpublish Scorecard
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {publishAction === "publish" ? (
                <>
                  <p>
                    You are about to publish the scorecard for{" "}
                    <strong>
                      {publishMonth ? MONTH_NAMES[publishMonth.month - 1] : ""} {publishMonth?.year}
                    </strong>.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Once published, this data will be visible in the Enterprise Scorecard for all users.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    You are about to unpublish the scorecard for{" "}
                    <strong>
                      {publishMonth ? MONTH_NAMES[publishMonth.month - 1] : ""} {publishMonth?.year}
                    </strong>.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This will hide the data from the Enterprise Scorecard. You can republish it later.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPublishAction}
              disabled={publishMutation.isPending || unpublishMutation.isPending}
              className={cn(
                publishAction === "publish"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-amber-600 hover:bg-amber-700"
              )}
            >
              {(publishMutation.isPending || unpublishMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {publishAction === "publish" ? "Publish" : "Unpublish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  );
}
