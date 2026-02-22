import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  AlertCircle,
  Bell,
  CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Grid3X3,
  HelpCircle,
  History,
  Layers,
  List,
  MessageSquare,
  Search,
  Star,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { getFinalizedTurnovers } from "@/app/actions/turnover";
import { PageHeader } from "@/components/shared";
import { EntryCard } from "@/components/turnover/entry-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type {
  FinalizedTurnover,
  TurnoverEntryWithDetails,
} from "@/db/schema/turnover";
import { cn } from "@/lib/utils";
import type { TurnoverSection } from "@/lib/zod/turnover.schema";
import { SECTION_CONFIG } from "@/lib/zod/turnover.schema";

interface SnapshotEntry {
  application?: { applicationName?: string; tla?: string; tier?: string };
  applicationId: string;
  comments?: string;
  commsDetails?: { emailSubject?: string };
  createdBy?: string;
  description?: string;
  id: string;
  incDetails?: { incidentNumber?: string };
  isImportant?: boolean;
  mimDetails?: { mimLink?: string };
  rfcDetails?: { rfcNumber?: string };
  section: string;
  title?: string;
}

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

export const Route = createFileRoute(
  "/teams/$teamId/turnover/transition-history"
)({
  component: TransitionHistoryPage,
});

const SECTION_ICONS: Record<TurnoverSection, React.ElementType> = {
  RFC: CheckCircle2,
  INC: AlertCircle,
  ALERTS: Bell,
  MIM: Zap,
  COMMS: MessageSquare,
  FYI: HelpCircle,
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex history page with filters, pagination, grid/list views, and snapshot dialog
function TransitionHistoryPage() {
  const { teamId } = Route.useParams();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [page, setPage] = useState(0);
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<FinalizedTurnover | null>(null);
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const limit = 20;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when search changes using inline state
  const [prevDebouncedSearch, setPrevDebouncedSearch] =
    useState(debouncedSearch);
  const [prevDateRange, setPrevDateRange] = useState(dateRange);

  if (debouncedSearch !== prevDebouncedSearch || dateRange !== prevDateRange) {
    setPrevDebouncedSearch(debouncedSearch);
    setPrevDateRange(dateRange);
    setPage(0);
  }

  // Fetch turnovers
  const { data } = useQuery({
    queryKey: [
      "finalized-turnovers",
      teamId,
      dateRange?.from,
      dateRange?.to,
      page,
      debouncedSearch,
    ],
    queryFn: () =>
      getFinalizedTurnovers({
        data: {
          teamId,
          search: debouncedSearch,
          fromDate: dateRange?.from?.toISOString(),
          toDate: dateRange?.to?.toISOString(),
          limit,
          offset: page * limit,
        },
      }),
  });

  // Type-safe access to data
  const queryResult = data as
    | { turnovers: FinalizedTurnover[]; total: number }
    | undefined;
  const turnovers = queryResult?.turnovers || [];
  const total = queryResult?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // Use turnovers directly (they are already filtered by server)
  const filteredTurnovers = turnovers;

  // Add missing snapshotFilter state
  const [snapshotFilter, setSnapshotFilter] = useState("");
  const [expandedApps, setExpandedApps] = useState<Record<string, boolean>>({});

  // Toggle app expansion
  const toggleApp = (appId: string) => {
    setExpandedApps((prev) => ({
      ...prev,
      [appId]: !prev[appId],
    }));
  };

  // Open snapshot detail
  const openSnapshot = (turnover: FinalizedTurnover) => {
    setSelectedSnapshot(turnover);
    setSnapshotDialogOpen(true);
    setExpandedApps({});
  };

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setDateRange(undefined);
    setPage(0);
  };

  const hasFilters = searchQuery || dateRange?.from || dateRange?.to;

  return (
    <div className="min-h-screen flex-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="space-y-8 p-8 pt-6">
        {/* Header */}
        <PageHeader
          className="w-full"
          description="Browse all finalized shift handovers and transitions."
          title="Transition History"
        >
          {/* View Toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 p-1">
            <Button
              className={cn(
                "h-9 gap-2 rounded-lg text-white hover:text-white",
                viewMode === "grid"
                  ? "bg-white/20 hover:bg-white/30"
                  : "hover:bg-white/10"
              )}
              onClick={() => setViewMode("grid")}
              size="sm"
              variant={viewMode === "grid" ? "default" : "ghost"}
            >
              <Grid3X3 className="h-4 w-4" />
              Grid
            </Button>
            <Button
              className={cn(
                "h-9 gap-2 rounded-lg text-white hover:text-white",
                viewMode === "list"
                  ? "bg-white/20 hover:bg-white/30"
                  : "hover:bg-white/10"
              )}
              onClick={() => setViewMode("list")}
              size="sm"
              variant={viewMode === "list" ? "default" : "ghost"}
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>

          {/* Search */}
          <div className="group relative w-80">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-primary/70 transition-colors group-focus-within:text-white" />
            <Input
              className="h-11 rounded-xl border-white/20 bg-white/10 pl-12 font-medium text-sm text-white transition-all placeholder:text-white/60 hover:bg-white/15 focus:bg-white/20 focus:ring-2 focus:ring-white/40"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by notes, user..."
              value={searchQuery}
            />
          </div>
        </PageHeader>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger>
              <Button
                className={cn(
                  "h-11 justify-start gap-2 rounded-xl px-4 text-left font-normal text-sm",
                  !dateRange && "text-muted-foreground"
                )}
                id="date"
                variant="outline"
              >
                <CalendarIcon className="h-4 w-4" />
                {!dateRange?.from && <span>Pick a date range</span>}
                {dateRange?.from &&
                  !dateRange.to &&
                  format(dateRange.from, "LLL dd, y")}
                {dateRange?.from && dateRange.to && (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <CalendarComponent
                defaultMonth={dateRange?.from}
                initialFocus
                mode="range"
                numberOfMonths={2}
                onSelect={setDateRange}
                selected={dateRange}
              />
            </PopoverContent>
          </Popover>

          {/* Clear */}
          {hasFilters && (
            <Button
              className="h-11 gap-2 rounded-xl text-muted-foreground"
              onClick={clearFilters}
              size="sm"
              variant="ghost"
            >
              <X className="h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Results */}
        {filteredTurnovers.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/10 py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
              <History className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-1 font-semibold text-lg">No History Found</h3>
            <p className="text-muted-foreground text-sm">
              {hasFilters
                ? "No turnovers match your filters."
                : "No finalized turnovers yet."}
            </p>
          </div>
        ) : (
          <>
            {viewMode === "grid" && (
              <div
                className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                key="grid"
              >
                {filteredTurnovers.map((turnover: FinalizedTurnover) => (
                  <Card
                    className={cn(
                      "cursor-pointer border-l-[3px] transition-all duration-200 hover:shadow-md",
                      Number(turnover.importantCount) > 0
                        ? "border-l-orange-400 hover:border-l-orange-500"
                        : "border-l-primary/40 hover:border-l-primary"
                    )}
                    key={turnover.id}
                    onClick={() => openSnapshot(turnover)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                            <History className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-base">
                              {format(
                                new Date(turnover.finalizedAt),
                                "MMM dd, yyyy"
                              )}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {format(new Date(turnover.finalizedAt), "h:mm a")}
                            </p>
                          </div>
                        </div>
                        {Number(turnover.importantCount) > 0 && (
                          <Badge
                            className="gap-1 border-orange-200 bg-orange-50 text-orange-600 text-xs"
                            variant="outline"
                          >
                            <Star className="h-3 w-3 fill-current" />
                            {turnover.importantCount}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="mb-3 flex items-center gap-4 text-muted-foreground text-sm">
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          {turnover.totalApplications} Apps
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" />
                          {turnover.totalEntries} Entries
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t pt-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 font-bold text-[10px] text-primary">
                            {getInitials(turnover.finalizedBy)}
                          </div>
                          <span className="text-muted-foreground text-sm">
                            {turnover.finalizedBy}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {viewMode === "list" && (
              <div className="space-y-2" key="list">
                {filteredTurnovers.map((turnover: FinalizedTurnover) => (
                  <Card
                    className={cn(
                      "cursor-pointer border-l-[3px] transition-colors hover:bg-muted/20",
                      Number(turnover.importantCount) > 0
                        ? "border-l-orange-400"
                        : "border-l-primary/40"
                    )}
                    key={turnover.id}
                    onClick={() => openSnapshot(turnover)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                            <History className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-[100px]">
                            <p className="font-semibold text-sm">
                              {format(
                                new Date(turnover.finalizedAt),
                                "MMM dd, yyyy"
                              )}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {format(new Date(turnover.finalizedAt), "h:mm a")}
                            </p>
                          </div>
                          <Separator className="h-8" orientation="vertical" />
                          <div className="flex items-center gap-4 text-muted-foreground text-sm">
                            <span className="flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5" />
                              {turnover.totalApplications} Apps
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Layers className="h-3.5 w-3.5" />
                              {turnover.totalEntries} Entries
                            </span>
                          </div>
                          {turnover.notes && (
                            <>
                              <Separator
                                className="h-8"
                                orientation="vertical"
                              />
                              <p className="line-clamp-1 max-w-xs text-muted-foreground text-sm">
                                {turnover.notes}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {Number(turnover.importantCount) > 0 && (
                            <Badge
                              className="gap-1 border-orange-200 bg-orange-50 text-orange-600 text-xs"
                              variant="outline"
                            >
                              <Star className="h-3 w-3 fill-current" />
                              {turnover.importantCount}
                            </Badge>
                          )}
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 font-bold text-[10px] text-primary">
                              {getInitials(turnover.finalizedBy)}
                            </div>
                            <span className="text-muted-foreground text-sm">
                              {turnover.finalizedBy}
                            </span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              className="gap-1"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              size="sm"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="rounded-md bg-muted/50 px-3 py-1.5 text-muted-foreground text-sm">
              {page + 1} / {totalPages}
            </div>
            <Button
              className="gap-1"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              size="sm"
              variant="outline"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Snapshot Detail Dialog - Full Screen */}
        <Dialog onOpenChange={setSnapshotDialogOpen} open={snapshotDialogOpen}>
          <DialogContent className="flex h-[100vh] max-h-[100vh] min-w-[100vw] max-w-[100vw] flex-col gap-0 overflow-y-scroll rounded-none p-0">
            {/* Fixed Header */}
            <DialogHeader className="shrink-0 border-b px-6 py-4">
              <DialogTitle className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-lg">Turnover Snapshot</p>
                  {selectedSnapshot && (
                    <p className="font-normal text-muted-foreground text-sm">
                      {format(
                        new Date(selectedSnapshot.finalizedAt),
                        "MMMM dd, yyyy 'at' h:mm a"
                      )}
                      <span className="mx-2">•</span>
                      Finalized by{" "}
                      <span className="font-medium text-foreground">
                        {selectedSnapshot.finalizedBy}
                      </span>
                    </p>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Scrollable Content */}
            {selectedSnapshot && (
              <ScrollArea className="flex-1">
                <div className="space-y-6 p-6">
                  {/* Filter & Notes Row */}
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="relative w-full lg:max-w-md">
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        onChange={(e) => setSnapshotFilter(e.target.value)}
                        placeholder="Filter entries..."
                        value={snapshotFilter}
                      />
                    </div>
                    {selectedSnapshot.notes && (
                      <div className="flex-1 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                        <div className="flex gap-2">
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          <div>
                            <p className="font-semibold text-amber-600 text-xs dark:text-amber-400">
                              Shift Notes
                            </p>
                            <p className="text-foreground/80 text-sm">
                              {selectedSnapshot.notes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Applications */}
                  <div className="space-y-6">
                    {(() => {
                      const snapshotData =
                        selectedSnapshot.snapshotData as SnapshotEntry[];

                      // Group by application
                      const groupedByApp: Record<string, SnapshotEntry[]> = {};
                      for (const entry of snapshotData) {
                        const appId = entry.applicationId;
                        if (!groupedByApp[appId]) {
                          groupedByApp[appId] = [];
                        }

                        if (snapshotFilter) {
                          const searchLower = snapshotFilter.toLowerCase();
                          const matchesFilter =
                            entry.title?.toLowerCase().includes(searchLower) ||
                            entry.description
                              ?.toLowerCase()
                              .includes(searchLower) ||
                            entry.comments
                              ?.toLowerCase()
                              .includes(searchLower) ||
                            entry.createdBy
                              ?.toLowerCase()
                              .includes(searchLower) ||
                            entry.application?.applicationName
                              ?.toLowerCase()
                              .includes(searchLower) ||
                            entry.application?.tla
                              ?.toLowerCase()
                              .includes(searchLower) ||
                            entry.rfcDetails?.rfcNumber
                              ?.toLowerCase()
                              .includes(searchLower) ||
                            entry.incDetails?.incidentNumber
                              ?.toLowerCase()
                              .includes(searchLower) ||
                            entry.mimDetails?.mimLink
                              ?.toLowerCase()
                              .includes(searchLower) ||
                            entry.commsDetails?.emailSubject
                              ?.toLowerCase()
                              .includes(searchLower);

                          if (!matchesFilter) {
                            return;
                          }
                        }

                        groupedByApp[appId].push(entry);
                      }

                      const appGroups = Object.entries(groupedByApp).filter(
                        ([, entries]) => entries.length > 0
                      );

                      if (appGroups.length === 0) {
                        return (
                          <div className="py-12 text-center text-muted-foreground">
                            <History className="mx-auto mb-3 h-10 w-10 opacity-30" />
                            <p>No entries match your filter.</p>
                          </div>
                        );
                      }

                      return appGroups.map(([appId, appEntries]) => {
                        const app = appEntries[0]?.application;
                        const criticalCount = appEntries.filter(
                          (e) => e.isImportant
                        ).length;
                        const isExpanded = expandedApps[appId];

                        // Group by section
                        const groupedBySection: Record<
                          string,
                          SnapshotEntry[]
                        > = {};
                        for (const entry of appEntries) {
                          if (!groupedBySection[entry.section]) {
                            groupedBySection[entry.section] = [];
                          }
                          groupedBySection[entry.section].push(entry);
                        }

                        const sectionOrder: TurnoverSection[] = [
                          "MIM",
                          "INC",
                          "RFC",
                          "ALERTS",
                          "COMMS",
                          "FYI",
                        ];
                        const sortedSections = sectionOrder
                          .filter((s) => groupedBySection[s])
                          .map(
                            (s) =>
                              [s, groupedBySection[s]] as [
                                string,
                                SnapshotEntry[],
                              ]
                          );

                        return (
                          <div key={appId}>
                            <Collapsible
                              onOpenChange={() => toggleApp(appId)}
                              open={isExpanded}
                            >
                              <Card
                                className={cn(
                                  "mb-4 overflow-hidden border-l-[3px] transition-colors",
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
                                    {sortedSections.map(
                                      ([section, entries]) => {
                                        const sConfig =
                                          SECTION_CONFIG[
                                            section as TurnoverSection
                                          ];
                                        const SectionIcon =
                                          SECTION_ICONS[
                                            section as TurnoverSection
                                          ];

                                        return (
                                          <div
                                            className="space-y-2"
                                            key={section}
                                          >
                                            <div className="flex items-center gap-2">
                                              <div
                                                className={cn(
                                                  "flex h-5 w-5 items-center justify-center rounded",
                                                  getSectionBgClass(
                                                    sConfig.colorClass
                                                  )
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
                                                {entries.length}
                                              </span>
                                            </div>
                                            <div className="space-y-2 pl-7">
                                              {entries.map((entry) => (
                                                <EntryCard
                                                  entry={
                                                    entry as unknown as TurnoverEntryWithDetails
                                                  }
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
                      });
                    })()}
                  </div>

                  {/* Bottom Spacer for scroll */}
                  <div className="h-8" />
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
