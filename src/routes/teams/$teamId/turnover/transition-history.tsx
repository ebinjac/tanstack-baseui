import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
    History,
    Search,
    Grid3X3,
    List,
    FileText,
    Star,
    Layers,
    ChevronLeft,
    ChevronRight,
    X,
    CheckCircle2,
    AlertCircle,
    Bell,
    Zap,
    MessageSquare,
    HelpCircle,
    CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { getFinalizedTurnovers } from "@/app/actions/turnover";
import { SECTION_CONFIG, type TurnoverSection } from "@/lib/zod/turnover.schema";
import type { FinalizedTurnover } from "@/db/schema/turnover";
import { EntryCard } from "@/components/turnover/entry-card";

export const Route = createFileRoute(
    "/teams/$teamId/turnover/transition-history"
)({
    component: TransitionHistoryPage,
});

const SECTION_ICONS: Record<TurnoverSection, any> = {
    RFC: CheckCircle2,
    INC: AlertCircle,
    ALERTS: Bell,
    MIM: Zap,
    COMMS: MessageSquare,
    FYI: HelpCircle,
};

function TransitionHistoryPage() {
    const { teamId } = Route.useParams();

    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [page, setPage] = useState(0);
    const [selectedSnapshot, setSelectedSnapshot] = useState<FinalizedTurnover | null>(null);
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

    // Reset page when search changes
    useEffect(() => {
        setPage(0);
    }, [debouncedSearch, dateRange]);

    // Fetch turnovers
    const { data } = useQuery({
        queryKey: ["finalized-turnovers", teamId, dateRange?.from, dateRange?.to, page, debouncedSearch],
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
    const queryResult = data as { turnovers: FinalizedTurnover[]; total: number } | undefined;
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
    const openSnapshot = async (turnover: FinalizedTurnover) => {
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
        <div className="flex-1 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            <div className="max-w-7xl mx-auto space-y-8 p-8 pt-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            Transition History
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 border-primary/20 text-primary px-2 h-5">
                                Archives
                            </Badge>
                            <span className="text-muted-foreground/30">•</span>
                            <p className="text-sm font-medium text-muted-foreground">
                                Browse all finalized shift handovers and transitions
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex items-center gap-1 p-1 bg-background/50 rounded-xl border-none">
                            <Button
                                variant={viewMode === "grid" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("grid")}
                                className="gap-2 h-9 rounded-lg"
                            >
                                <Grid3X3 className="w-4 h-4" />
                                Grid
                            </Button>
                            <Button
                                variant={viewMode === "list" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("list")}
                                className="gap-2 h-9 rounded-lg"
                            >
                                <List className="w-4 h-4" />
                                List
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="relative group w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search by notes, user..."
                                className="h-11 pl-12 rounded-xl bg-background/50 border-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-bold text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Range Picker */}
                    <Popover>
                        <PopoverTrigger>
                            <Button
                                id="date"
                                variant="outline"
                                className={cn(
                                    "justify-start text-left font-normal gap-2 h-11 px-4 text-sm rounded-xl",
                                    !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="w-4 h-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Clear */}
                    {hasFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2 text-muted-foreground h-11 rounded-xl">
                            <X className="w-4 h-4" />
                            Clear filters
                        </Button>
                    )}
                </div>

                {/* Results */}
                {filteredTurnovers.length === 0 ? (
                    <div className="text-center py-16 bg-muted/10 rounded-xl border border-dashed">
                        <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                            <History className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">No History Found</h3>
                        <p className="text-sm text-muted-foreground">
                            {hasFilters
                                ? "No turnovers match your filters."
                                : "No finalized turnovers yet."}
                        </p>
                    </div>
                ) : (
                    <>
                        {viewMode === "grid" ? (
                            <div
                                key="grid"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {filteredTurnovers.map((turnover: FinalizedTurnover) => (
                                    <Card
                                        key={turnover.id}
                                        className={cn(
                                            "cursor-pointer hover:shadow-md transition-all duration-200 border-l-[3px]",
                                            Number(turnover.importantCount) > 0
                                                ? "border-l-orange-400 hover:border-l-orange-500"
                                                : "border-l-primary/40 hover:border-l-primary"
                                        )}
                                        onClick={() => openSnapshot(turnover)}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                                                        <History className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-semibold">
                                                            {format(new Date(turnover.finalizedAt), "MMM dd, yyyy")}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(turnover.finalizedAt), "h:mm a")}
                                                        </p>
                                                    </div>
                                                </div>
                                                {Number(turnover.importantCount) > 0 && (
                                                    <Badge variant="outline" className="gap-1 text-orange-600 border-orange-200 bg-orange-50 text-xs">
                                                        <Star className="w-3 h-3 fill-current" />
                                                        {turnover.importantCount}
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <FileText className="w-3.5 h-3.5" />
                                                    {turnover.totalApplications} Apps
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Layers className="w-3.5 h-3.5" />
                                                    {turnover.totalEntries} Entries
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                        {getInitials(turnover.finalizedBy)}
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">{turnover.finalizedBy}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div
                                key="list"
                                className="space-y-2"
                            >
                                {filteredTurnovers.map((turnover: FinalizedTurnover) => (
                                    <Card
                                        key={turnover.id}
                                        className={cn(
                                            "cursor-pointer hover:bg-muted/20 transition-colors border-l-[3px]",
                                            Number(turnover.importantCount) > 0
                                                ? "border-l-orange-400"
                                                : "border-l-primary/40"
                                        )}
                                        onClick={() => openSnapshot(turnover)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                                                        <History className="w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="min-w-[100px]">
                                                        <p className="font-semibold text-sm">
                                                            {format(new Date(turnover.finalizedAt), "MMM dd, yyyy")}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(turnover.finalizedAt), "h:mm a")}
                                                        </p>
                                                    </div>
                                                    <Separator orientation="vertical" className="h-8" />
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1.5">
                                                            <FileText className="w-3.5 h-3.5" />
                                                            {turnover.totalApplications} Apps
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Layers className="w-3.5 h-3.5" />
                                                            {turnover.totalEntries} Entries
                                                        </span>
                                                    </div>
                                                    {turnover.notes && (
                                                        <>
                                                            <Separator orientation="vertical" className="h-8" />
                                                            <p className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                                                                {turnover.notes}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {Number(turnover.importantCount) > 0 && (
                                                        <Badge variant="outline" className="gap-1 text-orange-600 border-orange-200 bg-orange-50 text-xs">
                                                            <Star className="w-3 h-3 fill-current" />
                                                            {turnover.importantCount}
                                                        </Badge>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                            {getInitials(turnover.finalizedBy)}
                                                        </div>
                                                        <span className="text-sm text-muted-foreground">{turnover.finalizedBy}</span>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </Button>
                        <div className="px-3 py-1.5 bg-muted/50 rounded-md text-sm text-muted-foreground">
                            {page + 1} / {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="gap-1"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* Snapshot Detail Dialog - Full Screen */}
                <Dialog open={snapshotDialogOpen} onOpenChange={setSnapshotDialogOpen}>
                    <DialogContent className="min-w-[100vw] h-[100vh] max-w-[100vw] max-h-[100vh] rounded-none p-0 gap-0 flex flex-col overflow-y-scroll">
                        {/* Fixed Header */}
                        <DialogHeader className="px-6 py-4 border-b shrink-0">
                            <DialogTitle className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <History className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold">Turnover Snapshot</p>
                                    {selectedSnapshot && (
                                        <p className="text-sm font-normal text-muted-foreground">
                                            {format(new Date(selectedSnapshot.finalizedAt), "MMMM dd, yyyy 'at' h:mm a")}
                                            <span className="mx-2">•</span>
                                            Finalized by <span className="font-medium text-foreground">{selectedSnapshot.finalizedBy}</span>
                                        </p>
                                    )}
                                </div>
                            </DialogTitle>
                        </DialogHeader>

                        {/* Scrollable Content */}
                        {selectedSnapshot && (
                            <ScrollArea className="flex-1">
                                <div className="p-6 space-y-6">
                                    {/* Filter & Notes Row */}
                                    <div className="flex flex-col lg:flex-row gap-4">
                                        <div className="relative w-full lg:max-w-md">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Filter entries..."
                                                className="pl-10"
                                                value={snapshotFilter}
                                                onChange={(e) => setSnapshotFilter(e.target.value)}
                                            />
                                        </div>
                                        {selectedSnapshot.notes && (
                                            <div className="flex-1 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                <div className="flex gap-2">
                                                    <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Shift Notes</p>
                                                        <p className="text-sm text-foreground/80">{selectedSnapshot.notes}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Applications */}
                                    <div className="space-y-6">
                                        {(() => {
                                            const snapshotData = selectedSnapshot.snapshotData as any[];

                                            // Group by application
                                            const groupedByApp: Record<string, any[]> = {};
                                            snapshotData.forEach((entry) => {
                                                const appId = entry.applicationId;
                                                if (!groupedByApp[appId]) groupedByApp[appId] = [];

                                                if (snapshotFilter) {
                                                    const searchLower = snapshotFilter.toLowerCase();
                                                    const matchesFilter =
                                                        entry.title?.toLowerCase().includes(searchLower) ||
                                                        entry.description?.toLowerCase().includes(searchLower) ||
                                                        entry.comments?.toLowerCase().includes(searchLower) ||
                                                        entry.createdBy?.toLowerCase().includes(searchLower) ||
                                                        entry.application?.applicationName?.toLowerCase().includes(searchLower) ||
                                                        entry.application?.tla?.toLowerCase().includes(searchLower) ||
                                                        entry.rfcDetails?.rfcNumber?.toLowerCase().includes(searchLower) ||
                                                        entry.incDetails?.incidentNumber?.toLowerCase().includes(searchLower) ||
                                                        entry.mimDetails?.mimLink?.toLowerCase().includes(searchLower) ||
                                                        entry.commsDetails?.emailSubject?.toLowerCase().includes(searchLower);

                                                    if (!matchesFilter) return;
                                                }

                                                groupedByApp[appId].push(entry);
                                            });

                                            const appGroups = Object.entries(groupedByApp).filter(([, entries]) => entries.length > 0);

                                            if (appGroups.length === 0) {
                                                return (
                                                    <div className="text-center py-12 text-muted-foreground">
                                                        <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                                        <p>No entries match your filter.</p>
                                                    </div>
                                                );
                                            }

                                            return appGroups.map(([appId, appEntries]) => {
                                                const app = appEntries[0]?.application;
                                                const criticalCount = appEntries.filter((e) => e.isImportant).length;
                                                const isExpanded = expandedApps[appId];

                                                // Group by section
                                                const groupedBySection: Record<string, any[]> = {};
                                                appEntries.forEach((entry) => {
                                                    if (!groupedBySection[entry.section]) groupedBySection[entry.section] = [];
                                                    groupedBySection[entry.section].push(entry);
                                                });

                                                const sectionOrder: TurnoverSection[] = ["MIM", "INC", "RFC", "ALERTS", "COMMS", "FYI"];
                                                const sortedSections = sectionOrder
                                                    .filter((s) => groupedBySection[s])
                                                    .map((s) => [s, groupedBySection[s]] as [string, any[]]);

                                                return (
                                                    <div key={appId}>
                                                        <Collapsible open={isExpanded} onOpenChange={() => toggleApp(appId)}>
                                                            <Card className={cn(
                                                                "overflow-hidden border-l-[3px] transition-colors mb-4",
                                                                criticalCount > 0 ? "border-l-orange-400" : "border-l-primary/40"
                                                            )}>
                                                                <CollapsibleTrigger className="w-full text-left outline-none">
                                                                    <div className="px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-muted/40 transition-colors">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={cn(
                                                                                "h-7 w-7 rounded-md flex items-center justify-center",
                                                                                criticalCount > 0 ? "bg-orange-100 text-orange-600" : "bg-primary/10 text-primary"
                                                                            )}>
                                                                                <Layers className="h-3.5 w-3.5" />
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <h3 className="text-sm font-semibold text-foreground">
                                                                                    {app?.applicationName || "Unknown Application"}
                                                                                </h3>
                                                                                {app?.tla && (
                                                                                    <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0">
                                                                                        {app.tla}
                                                                                    </Badge>
                                                                                )}
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    · {appEntries.length} items · Tier {app?.tier || "N/A"}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            {criticalCount > 0 && (
                                                                                <Badge variant="outline" className="text-[10px] font-medium text-orange-600 border-orange-200 bg-orange-50">
                                                                                    {criticalCount} Critical
                                                                                </Badge>
                                                                            )}
                                                                            <div className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted/50 transition-colors">
                                                                                <ChevronRight className={cn(
                                                                                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                                                                    isExpanded && "rotate-90"
                                                                                )} />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </CollapsibleTrigger>

                                                                <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 duration-200 overflow-hidden">
                                                                    <div className="px-4 pb-4 pt-3 space-y-4 border-t bg-muted/5">
                                                                        {sortedSections.map(([section, entries]) => {
                                                                            const sConfig = SECTION_CONFIG[section as TurnoverSection];
                                                                            const SectionIcon = SECTION_ICONS[section as TurnoverSection];

                                                                            return (
                                                                                <div key={section} className="space-y-2">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className={cn(
                                                                                            "h-5 w-5 rounded flex items-center justify-center",
                                                                                            sConfig.colorClass.includes('blue') ? "bg-blue-100" :
                                                                                                sConfig.colorClass.includes('red') ? "bg-red-100" :
                                                                                                    sConfig.colorClass.includes('amber') ? "bg-amber-100" :
                                                                                                        sConfig.colorClass.includes('purple') ? "bg-purple-100" :
                                                                                                            sConfig.colorClass.includes('green') ? "bg-green-100" :
                                                                                                                "bg-muted"
                                                                                        )}>
                                                                                            <SectionIcon className={cn("h-3 w-3", sConfig.colorClass)} />
                                                                                        </div>
                                                                                        <span className="text-xs font-medium text-muted-foreground">
                                                                                            {sConfig.name}
                                                                                        </span>
                                                                                        <span className="text-[10px] text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded-full">
                                                                                            {entries.length}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="space-y-2 pl-7">
                                                                                        {entries.map((entry) => (
                                                                                            <EntryCard
                                                                                                key={entry.id}
                                                                                                entry={entry}
                                                                                                teamId={teamId}
                                                                                                readOnly
                                                                                            />
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
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
