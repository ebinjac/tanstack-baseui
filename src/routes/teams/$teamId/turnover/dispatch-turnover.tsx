import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  canFinalizeTurnover,
  finalizeTurnover,
  getDispatchEntries,
} from "@/app/actions/turnover";
import { StatsSummaryItem } from "@/components/link-manager/shared";
import { PageHeader } from "@/components/shared";
import { EmptyState } from "@/components/shared/empty-state";
import { EntryCard } from "@/components/turnover/entry-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { TurnoverEntryWithDetails } from "@/db/schema/turnover";
import { turnoverKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { TurnoverSection } from "@/lib/zod/turnover.schema";
import { SECTION_CONFIG } from "@/lib/zod/turnover.schema";

export const Route = createFileRoute(
  "/teams/$teamId/turnover/dispatch-turnover"
)({
  component: DispatchTurnoverPage,
  loader: async ({ params: { teamId } }) => {
    const entries = await getDispatchEntries({ data: { teamId } });
    return { entries };
  },
  pendingComponent: DispatchTurnoverSkeleton,
});

function DispatchTurnoverSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card className="border-muted bg-muted/5" key={i}>
            <CardContent className="flex items-center gap-4 p-6">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card className="mb-4" key={i}>
            <CardHeader className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

const SECTION_ICONS: Record<TurnoverSection, React.ElementType> = {
  RFC: CheckCircle2,
  INC: AlertCircle,
  ALERTS: Bell,
  MIM: Zap,
  COMMS: MessageSquare,
  FYI: HelpCircle,
};

function getSectionBgClass(colorClass: string): string {
  if (colorClass.includes("blue")) {
    return "bg-blue-100";
  }
  if (colorClass.includes("red")) {
    return "bg-red-100";
  }
  if (colorClass.includes("amber")) {
    return "bg-amber-100";
  }
  if (colorClass.includes("purple")) {
    return "bg-purple-100";
  }
  if (colorClass.includes("green")) {
    return "bg-green-100";
  }
  return "bg-muted";
}

function DispatchTurnoverPage() {
  const { teamId } = Route.useParams();
  const { entries: initialEntries } = Route.useLoaderData();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [finalizeNotes, setFinalizeNotes] = useState("");

  // Keep entries fresh
  const { data: entries } = useQuery({
    queryKey: turnoverKeys.dispatch(teamId),
    queryFn: () => getDispatchEntries({ data: { teamId } }),
    initialData: initialEntries,
    staleTime: 30_000,
  });

  // Check finalize cooldown
  const { data: canFinalizeData, isLoading: checkingCooldown } = useQuery({
    queryKey: turnoverKeys.canFinalize(teamId),
    queryFn: () => canFinalizeTurnover({ data: { teamId } }),
  });

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: () =>
      finalizeTurnover({ data: { teamId, notes: finalizeNotes } }),
    onSuccess: () => {
      toast.success("Turnover finalized successfully");
      queryClient.invalidateQueries({
        queryKey: turnoverKeys.canFinalize(teamId),
      });
      queryClient.invalidateQueries({
        queryKey: turnoverKeys.dispatch(teamId),
      });
      setFinalizeDialogOpen(false);
      setFinalizeNotes("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to finalize turnover");
    },
  });

  // Group entries by application
  const groupedEntries = useMemo(() => {
    const filtered = searchQuery
      ? entries.filter(
          (e: TurnoverEntryWithDetails) =>
            e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : entries;

    const grouped: Record<string, TurnoverEntryWithDetails[]> = {};

    for (const entry of filtered) {
      const appId = (entry as TurnoverEntryWithDetails).applicationId;
      if (!grouped[appId]) {
        grouped[appId] = [];
      }
      grouped[appId].push(entry as TurnoverEntryWithDetails);
    }

    return grouped;
  }, [entries, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const apps = new Set(
      entries.map((e: TurnoverEntryWithDetails) => e.applicationId)
    );
    const critical = entries.filter(
      (e: TurnoverEntryWithDetails) => e.isImportant
    );

    return {
      activeApps: apps.size,
      totalEntries: entries.length,
      criticalItems: critical.length,
    };
  }, [entries]);

  // Toggle individual app
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

  // Toggle all
  const toggleAll = () => {
    if (allExpanded) {
      setExpandedApps(new Set());
    } else {
      setExpandedApps(new Set(Object.keys(groupedEntries)));
    }
    setAllExpanded(!allExpanded);
  };

  return (
    <div className="min-h-screen flex-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="space-y-8 p-8 pt-6">
        {/* Header */}
        <PageHeader
          className="w-full"
          description={`Shift Review • Handover summary for ${format(new Date(), "MMMM dd, yyyy")}`}
          title="Dispatch Turnover"
        >
          {/* Search */}
          <div className="group relative w-80">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/70" />
            <Input
              className="border border-white/20 bg-white/10 pl-9 text-white placeholder:text-white/60 focus-visible:ring-1 focus-visible:ring-white/40"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter entries..."
              value={searchQuery}
            />
          </div>

          {/* Finalize Button */}
          <Button
            className="gap-2"
            disabled={
              checkingCooldown ||
              !canFinalizeData?.canFinalize ||
              entries.length === 0
            }
            onClick={() => setFinalizeDialogOpen(true)}
            variant="secondary"
          >
            {checkingCooldown ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Finalize Turnover
          </Button>
        </PageHeader>

        {/* Cooldown Message */}
        <AnimatePresence>
          {!canFinalizeData?.canFinalize && canFinalizeData?.message && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 backdrop-blur-sm"
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 text-sm dark:text-amber-200">
                    Turnover Finalization Cooldown
                  </h4>
                  <p className="font-medium text-amber-700/80 text-xs dark:text-amber-400">
                    {canFinalizeData.message}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatsSummaryItem
            color="blue"
            icon={Layers}
            label="Active Applications"
            value={stats.activeApps}
          />
          <StatsSummaryItem
            color="primary"
            icon={Send}
            label="Total Entries"
            value={stats.totalEntries}
          />
          <StatsSummaryItem
            color={stats.criticalItems > 0 ? "amber" : "indigo"}
            icon={AlertTriangle}
            label="Critical Items"
            value={stats.criticalItems}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <p className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
              Grouped by Application
            </p>
          </div>
          <Button
            className="gap-2 rounded-xl font-bold text-xs hover:bg-primary/5 hover:text-primary"
            onClick={toggleAll}
            variant="ghost"
          >
            <ChevronsUpDown className="h-4 w-4" />
            {allExpanded ? "Collapse All View" : "Expand All View"}
          </Button>
        </div>

        {/* Application Accordions */}
        <div className="relative">
          {Object.keys(groupedEntries).length === 0 ? (
            <div className="py-12">
              <EmptyState
                description="There are no turnover entries to dispatch at this time."
                icon={Send}
                title="No Active Entries"
              />
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEntries).map(([appId, appEntries]) => {
                const app = appEntries[0]?.application;
                const criticalCount = appEntries.filter(
                  (e) => e.isImportant
                ).length;
                const isExpanded = expandedApps.has(appId);

                // Group by section
                const bySection: Record<string, TurnoverEntryWithDetails[]> =
                  {};
                for (const entry of appEntries) {
                  if (!bySection[entry.section]) {
                    bySection[entry.section] = [];
                  }
                  bySection[entry.section].push(entry);
                }

                return (
                  <div key={appId}>
                    <Collapsible
                      onOpenChange={() => toggleApp(appId)}
                      open={isExpanded}
                    >
                      <Card
                        className={cn(
                          "overflow-hidden border-l-[3px] transition-colors",
                          criticalCount > 0
                            ? "border-l-orange-400"
                            : "border-l-primary/40"
                        )}
                      >
                        <CollapsibleTrigger className="w-full text-left outline-none">
                          <div className="flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-muted/40">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex h-7 w-7 items-center justify-center rounded-md",
                                  criticalCount > 0
                                    ? "bg-orange-100 text-orange-600"
                                    : "bg-primary/10 text-primary"
                                )}
                              >
                                <Layers className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground text-sm">
                                  {app?.applicationName ||
                                    "Unknown Application"}
                                </h3>
                                {app?.tla && (
                                  <Badge
                                    className="px-1.5 py-0 font-medium text-[10px]"
                                    variant="secondary"
                                  >
                                    {app.tla}
                                  </Badge>
                                )}
                                <span className="text-muted-foreground text-xs">
                                  · {appEntries.length} items · Tier{" "}
                                  {app?.tier || "N/A"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {criticalCount > 0 && (
                                <Badge
                                  className="border-orange-200 bg-orange-50 font-medium text-[10px] text-orange-600"
                                  variant="outline"
                                >
                                  {criticalCount} Critical
                                </Badge>
                              )}
                              <div className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-muted/50">
                                <ChevronRight
                                  className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                    isExpanded && "rotate-90"
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent className="data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 overflow-hidden duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in">
                          <div className="space-y-4 border-t bg-muted/5 px-4 pt-3 pb-4">
                            {Object.entries(bySection).map(
                              // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: section rendering with multiple config lookups
                              ([section, sectionEntries]) => {
                                const sConfig =
                                  SECTION_CONFIG[section as TurnoverSection];
                                const SectionIcon =
                                  SECTION_ICONS[section as TurnoverSection];

                                return (
                                  <div className="space-y-2" key={section}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={cn(
                                          "flex h-5 w-5 items-center justify-center rounded",
                                          getSectionBgClass(sConfig.colorClass)
                                        )}
                                      >
                                        <SectionIcon
                                          className={cn(
                                            "h-3 w-3",
                                            sConfig.colorClass
                                          )}
                                        />
                                      </div>
                                      <span className="font-medium text-muted-foreground text-xs">
                                        {sConfig.name}
                                      </span>
                                      <span className="rounded-full bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground/60">
                                        {sectionEntries.length}
                                      </span>
                                    </div>
                                    <div className="space-y-2 pl-7">
                                      {sectionEntries.map((entry) => (
                                        <EntryCard
                                          entry={entry}
                                          key={entry.id}
                                          readOnly
                                          teamId={teamId}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Finalize Dialog */}
        <Dialog onOpenChange={setFinalizeDialogOpen} open={finalizeDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Finalize Turnover</DialogTitle>
              <DialogDescription>
                Create a permanent snapshot of the current turnover state for
                auditing and reporting.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label
                  className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="finalize-notes"
                >
                  Shift Intelligence Notes
                </label>
                <Textarea
                  id="finalize-notes"
                  onChange={(e) => setFinalizeNotes(e.target.value)}
                  placeholder="Add high-level summary or specific instructions for the incoming shift..."
                  rows={4}
                  value={finalizeNotes}
                />
              </div>

              <div className="space-y-3 rounded-md bg-muted p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Active Applications:
                  </span>
                  <span className="font-semibold">{stats.activeApps}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total Handover Items:
                  </span>
                  <span className="font-semibold">{stats.totalEntries}</span>
                </div>
                <div className="my-1 h-px bg-border" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Critical Intensity:
                  </span>
                  <span
                    className={cn(
                      "font-bold",
                      stats.criticalItems > 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  >
                    {stats.criticalItems} High Priority
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                disabled={finalizeMutation.isPending}
                onClick={() => setFinalizeDialogOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={finalizeMutation.isPending}
                onClick={() => finalizeMutation.mutate()}
              >
                {finalizeMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Authorize Finalization
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
