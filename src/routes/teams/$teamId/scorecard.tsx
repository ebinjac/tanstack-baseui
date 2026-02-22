import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronsUpDown,
  EyeOff,
  Hash,
  Loader2,
  Percent,
  Send,
  TrendingUp,
} from "lucide-react";
import { getTeamById } from "@/app/actions/teams";
import type { TimePeriod, ViewMode } from "@/components/scorecard";
// Import from scorecard components
import {
  AddEntryDialog,
  // Components
  ApplicationSection,
  AVAILABLE_YEARS,
  DeleteEntryDialog,
  EditEntryDialog,
  MetricsChartSheet,
  MONTH_NAMES,
  // Types

  // Constants
  TIME_PERIOD_OPTIONS,
  // Hook
  useScorecard,
} from "@/components/scorecard";
import { PageHeader } from "@/components/shared";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: scorecard page with multiple interactive states
function ScorecardPage() {
  const { team } = Route.useLoaderData();
  const { teamId } = Route.useParams();
  const { session } = useRouteContext({ from: "__root__" });

  const isAdmin =
    session?.permissions?.some(
      (p: { teamId: string; role: string }) =>
        p.teamId === teamId && p.role === "ADMIN"
    ) ?? false;

  // Use the scorecard hook for all state management
  const scorecard = useScorecard({ teamId, isAdmin });

  // Toggle all apps handler
  const toggleAllApps = () => {
    const allAppIds = scorecard.scorecardData.applications.map((app) => app.id);
    if (
      scorecard.expandedApps.hasExpanded &&
      scorecard.expandedApps.expandedCount === allAppIds.length
    ) {
      scorecard.expandedApps.collapseAll();
    } else {
      scorecard.expandedApps.expandAll(allAppIds);
    }
  };

  return (
    <div className="min-h-screen flex-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="mx-auto max-w-7xl space-y-8 p-8 pt-6">
        {/* Premium Admin Header Banner */}
        <PageHeader
          description={
            <>
              Tracking for{" "}
              <span className="font-bold text-white">{team.teamName}</span>
            </>
          }
          title="Performance Scorecard"
        >
          <Link to="/scorecard">
            <Button
              className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              size="sm"
              variant="outline"
            >
              <Activity className="h-4 w-4" />
              Enterprise View
            </Button>
          </Link>
          {isAdmin && (
            <Link params={{ teamId }} to="/teams/$teamId/settings">
              <Button
                className="text-white hover:bg-white/10 hover:text-white"
                size="sm"
                variant="ghost"
              >
                Manage Apps
              </Button>
            </Link>
          )}
        </PageHeader>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-8 py-4 md:grid-cols-5">
          <div className="relative z-10 flex flex-col justify-center py-2">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Activity className="h-4 w-4 text-blue-500" />
              </div>
              <p className="truncate font-bold text-[11px] text-muted-foreground uppercase tracking-widest">
                Applications
              </p>
            </div>
            <p className="font-black text-4xl text-foreground tabular-nums leading-none tracking-tighter md:text-5xl">
              {scorecard.stats.apps}
            </p>
          </div>

          <div className="relative z-10 flex flex-col justify-center py-2">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                <Hash className="h-4 w-4" />
              </div>
              <p className="truncate font-bold text-[11px] text-muted-foreground uppercase tracking-widest">
                Tracked Tech
              </p>
            </div>
            <p className="font-black text-4xl text-foreground tabular-nums leading-none tracking-tighter md:text-5xl">
              {scorecard.stats.entries}
            </p>
          </div>

          <div className="relative z-10 flex flex-col justify-center py-2 md:mt-0">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
                <Percent className="h-4 w-4" />
              </div>
              <p className="truncate font-bold text-[11px] text-muted-foreground uppercase tracking-widest">
                Availability
              </p>
            </div>
            <div className="flex items-baseline gap-3">
              <p className="font-black text-4xl text-foreground tabular-nums leading-none tracking-tighter md:text-5xl">
                {scorecard.stats.availRecords}
              </p>
              <div className="flex items-center gap-1.5 opacity-80">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
                  {scorecard.filterLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col justify-center py-2 md:mt-0">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <p className="truncate font-bold text-[11px] text-muted-foreground uppercase tracking-widest">
                Volume Log
              </p>
            </div>
            <div className="flex items-baseline gap-3">
              <p className="font-black text-4xl text-foreground tabular-nums leading-none tracking-tighter md:text-5xl">
                {scorecard.stats.volRecords}
              </p>
              <div className="flex items-center gap-1.5 opacity-80">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
                  {scorecard.filterLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col justify-center py-2 md:mt-0">
            <div className="mb-3 flex items-center gap-2.5">
              <div
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                  scorecard.stats.availBreaches > 0
                    ? "bg-red-500/10 text-red-600 dark:text-red-500"
                    : "bg-primary/10 text-primary"
                )}
              >
                <AlertTriangle className="h-4 w-4" />
              </div>
              <p
                className={cn(
                  "truncate font-bold text-[11px] uppercase tracking-widest",
                  scorecard.stats.availBreaches > 0
                    ? "text-red-500/80 dark:text-red-400"
                    : "text-muted-foreground"
                )}
              >
                SLA Breaches
              </p>
            </div>
            <div className="flex items-baseline gap-3">
              <p
                className={cn(
                  "font-black text-4xl tabular-nums leading-none tracking-tighter md:text-5xl",
                  scorecard.stats.availBreaches > 0
                    ? "text-red-600 dark:text-red-500"
                    : "text-foreground"
                )}
              >
                {scorecard.stats.availBreaches}
              </p>
              <div className="flex items-center gap-1.5 opacity-80">
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    scorecard.stats.availBreaches > 0
                      ? "bg-red-500/50"
                      : "bg-primary/40"
                  )}
                />
                <p
                  className={cn(
                    "font-medium text-[10px] uppercase tracking-wider",
                    scorecard.stats.availBreaches > 0
                      ? "text-red-600/70 dark:text-red-500/80"
                      : "text-muted-foreground"
                  )}
                >
                  {scorecard.filterLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Status Bar */}
        {isAdmin && (
          <div
            className={cn(
              "flex flex-col justify-between gap-4 rounded-2xl border px-5 py-3 transition-all duration-300 md:flex-row md:items-center",
              scorecard.unpublishedMonths.length > 0 ||
                scorecard.pendingChangesMonths.length > 0
                ? "border-orange-500/30 bg-orange-500/[0.04] ring-1 ring-orange-500/10"
                : "border-green-500/20 bg-green-500/[0.02]"
            )}
          >
            <div className="flex items-center gap-3">
              {scorecard.unpublishedMonths.length > 0 ||
              scorecard.pendingChangesMonths.length > 0 ? (
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 animate-pulse text-orange-600" />
                  <div className="flex flex-col">
                    <span className="font-bold text-orange-700 text-xs uppercase tracking-wider">
                      Sync Required
                    </span>
                    <span className="font-bold text-[10px] text-orange-600/70">
                      Select a month below to publish changes
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-bold text-green-700/70 text-xs uppercase tracking-wider">
                    Fully Synchronized
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {scorecard.displayMonths
                .filter((m) => !m.isFuture)
                .map(({ year, month, label }) => {
                  const key = `${year}-${month}`;
                  const hasPending = scorecard.pendingChangesMonths.some(
                    (p) => p.year === year && p.month === month
                  );
                  const isUnpublished = scorecard.unpublishedMonths.some(
                    (u) => u.year === year && u.month === month
                  );

                  let colorClass = "";
                  if (hasPending) {
                    colorClass =
                      "bg-orange-500/10 text-orange-700 border-orange-500/20";
                  } else if (isUnpublished) {
                    colorClass =
                      "bg-amber-500/10 text-amber-700 border-amber-500/20";
                  } else {
                    colorClass =
                      "bg-green-500/5 text-green-700/50 border-green-500/10 hover:bg-green-500/10";
                  }

                  return (
                    <button
                      className={cn(
                        "rounded border px-2 py-0.5 font-bold text-[9px] uppercase tracking-tight transition-all",
                        colorClass
                      )}
                      key={key}
                      onClick={() =>
                        hasPending || isUnpublished
                          ? scorecard.handlePublishClick(year, month)
                          : scorecard.handleUnpublishClick(year, month)
                      }
                      type="button"
                    >
                      {label}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Main Content */}
        <Card className="overflow-hidden rounded-3xl border-border/50 bg-card/30 shadow-sm backdrop-blur-sm">
          <CardHeader className="border-border/40 border-b px-6 py-4">
            <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
              <div>
                <CardTitle className="flex items-center gap-3 font-bold text-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Application Health
                </CardTitle>
                <CardDescription className="mt-1 font-medium text-sm">
                  Performance tracking and reliability metrics across your
                  application portfolio.
                </CardDescription>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3">
                <Tabs
                  onValueChange={(val) =>
                    scorecard.setViewMode(val as ViewMode)
                  }
                  value={scorecard.viewMode}
                >
                  <TabsList>
                    <TabsTrigger value="period">Period</TabsTrigger>
                    <TabsTrigger value="year">Year</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Period/Year Selector */}
                {scorecard.viewMode === "period" ? (
                  <Select
                    onValueChange={(val) =>
                      scorecard.setSelectedPeriod(val as TimePeriod)
                    }
                    value={scorecard.selectedPeriod}
                  >
                    <SelectTrigger className="h-9 w-[160px] text-xs">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_PERIOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="text-xs">{option.label}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select
                    onValueChange={(val) =>
                      scorecard.setSelectedYear(Number(val))
                    }
                    value={String(scorecard.selectedYear)}
                  >
                    <SelectTrigger className="h-9 w-[120px] text-xs">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_YEARS.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          Year {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <div className="flex items-center gap-1.5">
                  <Button
                    className="gap-2"
                    onClick={() => scorecard.setShowChart(true)}
                    size="sm"
                    variant="outline"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Visualize
                  </Button>

                  <Button
                    className="gap-2"
                    onClick={toggleAllApps}
                    size="sm"
                    variant="ghost"
                  >
                    <ChevronsUpDown className="h-4 w-4" />
                    {scorecard.expandedApps.hasExpanded &&
                    scorecard.expandedApps.expandedCount ===
                      (scorecard.scorecardData.applications.length || 0)
                      ? "Collapse All"
                      : "Expand All"}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {scorecard.isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {!scorecard.isLoading &&
              scorecard.scorecardData.applications.length > 0 && (
                <div className="divide-y">
                  {scorecard.scorecardData.applications.map((app) => (
                    <ApplicationSection
                      app={app}
                      availabilityByEntry={scorecard.availabilityByEntry}
                      displayMonths={scorecard.displayMonths}
                      entries={scorecard.entriesByApp[app.id] || []}
                      isAdmin={isAdmin}
                      isExpanded={scorecard.expandedApps.isExpanded(app.id)}
                      key={app.id}
                      onAddEntry={() => scorecard.setAddEntryAppId(app.id)}
                      onDeleteEntry={(entry) =>
                        scorecard.setDeletingEntry(entry)
                      }
                      onEditEntry={(entry) => scorecard.setEditingEntry(entry)}
                      onToggle={() => scorecard.expandedApps.toggle(app.id)}
                      teamId={teamId}
                      volumeByEntry={scorecard.volumeByEntry}
                    />
                  ))}
                </div>
              )}
            {!scorecard.isLoading &&
              scorecard.scorecardData.applications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Activity className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="font-semibold text-lg">
                    No Applications Found
                  </h3>
                  <p className="mt-2 max-w-md text-muted-foreground text-sm">
                    Add applications in Team Settings to start tracking metrics.
                  </p>
                  <Link params={{ teamId }} to="/teams/$teamId/settings">
                    <Button className="mt-4">Go to Settings</Button>
                  </Link>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Add Entry Dialog */}
        {scorecard.addEntryAppId && (
          <AddEntryDialog
            applicationId={scorecard.addEntryAppId}
            onOpenChange={(open) => !open && scorecard.setAddEntryAppId(null)}
            onSuccess={() => {
              scorecard.invalidateData();
              scorecard.setAddEntryAppId(null);
            }}
            open={!!scorecard.addEntryAppId}
          />
        )}

        {/* Edit Entry Dialog */}
        {scorecard.editingEntry && (
          <EditEntryDialog
            entry={scorecard.editingEntry}
            onOpenChange={(open) => !open && scorecard.setEditingEntry(null)}
            onSuccess={() => {
              scorecard.invalidateData();
              scorecard.setEditingEntry(null);
            }}
            open={!!scorecard.editingEntry}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {scorecard.deletingEntry && (
          <DeleteEntryDialog
            entry={scorecard.deletingEntry}
            onOpenChange={(open) => !open && scorecard.setDeletingEntry(null)}
            onSuccess={() => {
              scorecard.invalidateData();
              scorecard.setDeletingEntry(null);
            }}
            open={!!scorecard.deletingEntry}
          />
        )}

        {/* Metrics Chart Sheet */}
        <MetricsChartSheet
          applications={scorecard.scorecardData.applications}
          availabilityByEntry={scorecard.availabilityByEntry}
          displayMonths={scorecard.displayMonths}
          entriesByApp={scorecard.entriesByApp}
          filterLabel={scorecard.filterLabel}
          onOpenChange={scorecard.setShowChart}
          open={scorecard.showChart}
          volumeByEntry={scorecard.volumeByEntry}
        />

        {/* Publish/Unpublish Confirmation Dialog */}
        <AlertDialog
          onOpenChange={scorecard.setShowPublishDialog}
          open={scorecard.showPublishDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {scorecard.publishAction === "publish" ? (
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
                {scorecard.publishAction === "publish" ? (
                  <>
                    <p>
                      You are about to publish the scorecard for{" "}
                      <strong>
                        {scorecard.publishMonth
                          ? MONTH_NAMES[scorecard.publishMonth.month - 1]
                          : ""}{" "}
                        {scorecard.publishMonth?.year}
                      </strong>
                      .
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Once published, this data will be visible in the
                      Enterprise Scorecard for all users.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      You are about to unpublish the scorecard for{" "}
                      <strong>
                        {scorecard.publishMonth
                          ? MONTH_NAMES[scorecard.publishMonth.month - 1]
                          : ""}{" "}
                        {scorecard.publishMonth?.year}
                      </strong>
                      .
                    </p>
                    <p className="text-muted-foreground text-sm">
                      This will hide the data from the Enterprise Scorecard. You
                      can republish it later.
                    </p>
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={cn(
                  scorecard.publishAction === "publish"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-amber-600 hover:bg-amber-700"
                )}
                disabled={scorecard.isPublishing}
                onClick={scorecard.confirmPublishAction}
              >
                {scorecard.isPublishing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {scorecard.publishAction === "publish"
                  ? "Publish"
                  : "Unpublish"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
