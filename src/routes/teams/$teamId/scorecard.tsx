import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { getTeamById } from "@/app/actions/teams";
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
  EyeOff,
} from "lucide-react";

// Import from scorecard components
import {
  // Types
  type ViewMode,
  type TimePeriod,

  // Constants
  TIME_PERIOD_OPTIONS,
  AVAILABLE_YEARS,
  currentYear,
  MONTH_NAMES,

  // Components
  StatsCard,
  ApplicationSection,
  AddEntryDialog,
  EditEntryDialog,
  DeleteEntryDialog,
  MetricsChartSheet,

  // Hook
  useScorecard,
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
  const { session } = useRouteContext({ from: '__root__' });

  const isAdmin = session?.permissions?.some(
    (p: { teamId: string; role: string }) => p.teamId === teamId && p.role === "ADMIN"
  ) ?? false;

  // Use the scorecard hook for all state management
  const scorecard = useScorecard({ teamId, isAdmin });

  // Toggle all apps handler
  const toggleAllApps = () => {
    const allAppIds = scorecard.scorecardData.applications.map((app) => app.id);
    if (scorecard.expandedApps.hasExpanded && 
        scorecard.expandedApps.expandedCount === allAppIds.length) {
      scorecard.expandedApps.collapseAll();
    } else {
      scorecard.expandedApps.expandAll(allAppIds);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="max-w-7xl mx-auto space-y-8 p-8 pt-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Performance Scorecard
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-md uppercase tracking-wider">
                <BarChart3 className="h-3 w-3" />
                Metrics
              </span>
              <span className="text-muted-foreground/30">·</span>
              <p className="text-sm font-medium text-muted-foreground">
                Tracking for{" "}
                <span className="text-foreground font-bold">{team.teamName}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/scorecard">
              <Button
                variant="outline"
                size="sm"
                className="h-11 px-5 gap-2 rounded-xl bg-background/50 border-none hover:bg-accent/50 transition-all font-bold text-xs"
              >
                <Activity className="h-4 w-4 text-primary" />
                Enterprise View
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/teams/$teamId/settings" params={{ teamId }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 px-4 rounded-xl hover:bg-muted/50 transition-all font-bold text-xs"
                >
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
            value={scorecard.stats.apps}
          />
          <StatsCard
            icon={<Hash className="text-indigo-500" />}
            label="Tracked Tech"
            value={scorecard.stats.entries}
          />
          <StatsCard
            icon={<Percent className="text-green-500" />}
            label="Availability"
            value={scorecard.stats.availRecords}
            sublabel={scorecard.filterLabel}
          />
          <StatsCard
            icon={<TrendingUp className="text-purple-500" />}
            label="Volume Log"
            value={scorecard.stats.volRecords}
            sublabel={scorecard.filterLabel}
          />
          <StatsCard
            icon={<AlertTriangle className="text-red-500" />}
            label="SLA Breaches"
            value={scorecard.stats.availBreaches}
            highlight={scorecard.stats.availBreaches > 0}
            sublabel={scorecard.filterLabel}
          />
        </div>

        {/* Sync Status Bar */}
        {isAdmin && (
          <div className={cn(
            "flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-3 rounded-2xl border transition-all duration-300",
            (scorecard.unpublishedMonths.length > 0 || scorecard.pendingChangesMonths.length > 0)
              ? "border-orange-500/30 bg-orange-500/[0.04] ring-1 ring-orange-500/10"
              : "border-green-500/20 bg-green-500/[0.02]"
          )}>
            <div className="flex items-center gap-3">
              {(scorecard.unpublishedMonths.length > 0 || scorecard.pendingChangesMonths.length > 0) ? (
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
              {scorecard.displayMonths.filter(m => !m.isFuture).map(({ year, month, label }) => {
                const key = `${year}-${month}`;
                const hasPending = scorecard.pendingChangesMonths.some(p => p.year === year && p.month === month);
                const isUnpublished = scorecard.unpublishedMonths.some(u => u.year === year && u.month === month);

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
                    onClick={() => (hasPending || isUnpublished) 
                      ? scorecard.handlePublishClick(year, month) 
                      : scorecard.handleUnpublishClick(year, month)}
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
                      scorecard.viewMode === "period"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                    onClick={() => scorecard.setViewMode("period")}
                  >
                    Period
                  </button>
                  <button
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg",
                      scorecard.viewMode === "year"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                    onClick={() => scorecard.setViewMode("year")}
                  >
                    Year
                  </button>
                </div>

                <div className="h-6 w-px bg-border/50 mx-1" />

                {/* Period/Year Selector */}
                {scorecard.viewMode === "period" ? (
                  <Select
                    value={scorecard.selectedPeriod}
                    onValueChange={(val) => scorecard.setSelectedPeriod(val as TimePeriod)}
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
                    value={String(scorecard.selectedYear)}
                    onValueChange={(val) => scorecard.setSelectedYear(Number(val))}
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
                    onClick={() => scorecard.setShowChart(true)}
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
                    {scorecard.expandedApps.hasExpanded && 
                     scorecard.expandedApps.expandedCount === (scorecard.scorecardData.applications.length || 0)
                      ? "Collapse All"
                      : "Expand All"}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {scorecard.isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !scorecard.scorecardData.applications.length ? (
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
                {scorecard.scorecardData.applications.map((app) => (
                  <ApplicationSection
                    key={app.id}
                    app={app}
                    isAdmin={isAdmin}
                    isExpanded={scorecard.expandedApps.isExpanded(app.id)}
                    onToggle={() => scorecard.expandedApps.toggle(app.id)}
                    entries={scorecard.entriesByApp[app.id] || []}
                    availabilityByEntry={scorecard.availabilityByEntry}
                    volumeByEntry={scorecard.volumeByEntry}
                    displayMonths={scorecard.displayMonths}
                    onAddEntry={() => scorecard.setAddEntryAppId(app.id)}
                    onEditEntry={(entry) => scorecard.setEditingEntry(entry)}
                    onDeleteEntry={(entry) => scorecard.setDeletingEntry(entry)}
                    teamId={teamId}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Entry Dialog */}
        {scorecard.addEntryAppId && (
          <AddEntryDialog
            applicationId={scorecard.addEntryAppId}
            open={!!scorecard.addEntryAppId}
            onOpenChange={(open) => !open && scorecard.setAddEntryAppId(null)}
            onSuccess={() => {
              scorecard.invalidateData();
              scorecard.setAddEntryAppId(null);
            }}
          />
        )}

        {/* Edit Entry Dialog */}
        {scorecard.editingEntry && (
          <EditEntryDialog
            entry={scorecard.editingEntry}
            open={!!scorecard.editingEntry}
            onOpenChange={(open) => !open && scorecard.setEditingEntry(null)}
            onSuccess={() => {
              scorecard.invalidateData();
              scorecard.setEditingEntry(null);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {scorecard.deletingEntry && (
          <DeleteEntryDialog
            entry={scorecard.deletingEntry}
            open={!!scorecard.deletingEntry}
            onOpenChange={(open) => !open && scorecard.setDeletingEntry(null)}
            onSuccess={() => {
              scorecard.invalidateData();
              scorecard.setDeletingEntry(null);
            }}
          />
        )}

        {/* Metrics Chart Sheet */}
        <MetricsChartSheet
          open={scorecard.showChart}
          onOpenChange={scorecard.setShowChart}
          applications={scorecard.scorecardData.applications}
          entriesByApp={scorecard.entriesByApp}
          availabilityByEntry={scorecard.availabilityByEntry}
          volumeByEntry={scorecard.volumeByEntry}
          displayMonths={scorecard.displayMonths}
          filterLabel={scorecard.filterLabel}
        />

        {/* Publish/Unpublish Confirmation Dialog */}
        <AlertDialog open={scorecard.showPublishDialog} onOpenChange={scorecard.setShowPublishDialog}>
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
                        {scorecard.publishMonth ? MONTH_NAMES[scorecard.publishMonth.month - 1] : ""} {scorecard.publishMonth?.year}
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
                        {scorecard.publishMonth ? MONTH_NAMES[scorecard.publishMonth.month - 1] : ""} {scorecard.publishMonth?.year}
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
                onClick={scorecard.confirmPublishAction}
                disabled={scorecard.isPublishing}
                className={cn(
                  scorecard.publishAction === "publish"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-amber-600 hover:bg-amber-700"
                )}
              >
                {scorecard.isPublishing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {scorecard.publishAction === "publish" ? "Publish" : "Unpublish"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
