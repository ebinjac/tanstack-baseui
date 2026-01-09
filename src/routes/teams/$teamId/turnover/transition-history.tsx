import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { format } from "date-fns";
import {
    History,
    Search,
    Grid3X3,
    List,
    Calendar,
    FileText,
    Star,
    Layers,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    X,
    CheckCircle2,
    AlertCircle,
    Bell,
    Zap,
    MessageSquare,
    HelpCircle,
    Filter,
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
    const [fromDate, setFromDate] = useState<Date | undefined>();
    const [toDate, setToDate] = useState<Date | undefined>();
    const [page, setPage] = useState(0);
    const [selectedSnapshot, setSelectedSnapshot] = useState<FinalizedTurnover | null>(null);
    const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
    const [snapshotFilter, setSnapshotFilter] = useState("");
    const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());

    const limit = 20;

    // Fetch turnovers
    const { data } = useQuery({
        queryKey: ["finalized-turnovers", teamId, fromDate, toDate, page],
        queryFn: () =>
            getFinalizedTurnovers({
                data: {
                    teamId,
                    fromDate: fromDate?.toISOString(),
                    toDate: toDate?.toISOString(),
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

    // Filter by search
    const filteredTurnovers = useMemo(() => {
        if (!searchQuery) return turnovers;
        return turnovers.filter((t: FinalizedTurnover) =>
            t.finalizedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.notes?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [turnovers, searchQuery]);

    // Open snapshot detail
    const openSnapshot = async (turnover: FinalizedTurnover) => {
        setSelectedSnapshot(turnover);
        setSnapshotDialogOpen(true);
        setExpandedApps(new Set());
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
        setFromDate(undefined);
        setToDate(undefined);
        setPage(0);
    };

    const hasFilters = searchQuery || fromDate || toDate;

    return (
        <div className="p-8 mx-auto space-y-8">
            {/* Header */}
            <div
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            >
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">
                            Transition History
                        </h1>
                        <p className="text-muted-foreground">
                            Archive of all finalized shift handovers and transitions.
                        </p>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-lg">
                    <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className="gap-2"
                    >
                        <Grid3X3 className="w-4 h-4" />
                        Grid
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className="gap-2"
                    >
                        <List className="w-4 h-4" />
                        List
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div
                className="flex flex-wrap items-center gap-4"
            >
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by notes, user..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* From Date */}
                <Popover>
                    <PopoverTrigger>
                        <Button variant="outline" className="gap-2">
                            <Calendar className="w-4 h-4" />
                            {fromDate ? format(fromDate, "MMM dd, yyyy") : "From Date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                            mode="single"
                            selected={fromDate}
                            onSelect={setFromDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {/* To Date */}
                <Popover>
                    <PopoverTrigger>
                        <Button variant="outline" className="gap-2">
                            <Calendar className="w-4 h-4" />
                            {toDate ? format(toDate, "MMM dd, yyyy") : "To Date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                            mode="single"
                            selected={toDate}
                            onSelect={setToDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {/* Clear */}
                {hasFilters && (
                    <Button variant="ghost" onClick={clearFilters} className="gap-2 text-muted-foreground">
                        <X className="w-4 h-4" />
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Results */}
            {filteredTurnovers.length === 0 ? (
                <div
                    className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed"
                >
                    <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No History Found</h3>
                    <p className="text-muted-foreground">
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
                            {filteredTurnovers.map((turnover: FinalizedTurnover, index: number) => (
                                <div
                                    key={turnover.id}
                                >
                                    <Card
                                        className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                                        onClick={() => openSnapshot(turnover)}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-lg font-bold">
                                                        {format(new Date(turnover.finalizedAt), "MMM dd, yyyy")}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(turnover.finalizedAt), "h:mm a")}
                                                    </p>
                                                </div>
                                                {Number(turnover.importantCount) > 0 && (
                                                    <Badge className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                                        <Star className="w-3 h-3 fill-current" />
                                                        {turnover.importantCount}
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <Separator />
                                        <CardContent className="pt-4">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                                    <span>{turnover.totalApplications} Apps</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Layers className="w-4 h-4 text-muted-foreground" />
                                                    <span>{turnover.totalEntries} Entries</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                        {getInitials(turnover.finalizedBy)}
                                                    </div>
                                                    <span className="text-sm">{turnover.finalizedBy}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div
                            key="list"
                            className="space-y-2"
                        >
                            {filteredTurnovers.map((turnover: FinalizedTurnover, index: number) => (
                                <div
                                    key={turnover.id}
                                >
                                    <Card
                                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                                        onClick={() => openSnapshot(turnover)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div>
                                                        <p className="font-bold">
                                                            {format(new Date(turnover.finalizedAt), "MMM dd, yyyy")}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {format(new Date(turnover.finalizedAt), "h:mm a")}
                                                        </p>
                                                    </div>
                                                    <Separator orientation="vertical" className="h-10" />
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="flex items-center gap-1">
                                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                                            {turnover.totalApplications} Apps
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Layers className="w-4 h-4 text-muted-foreground" />
                                                            {turnover.totalEntries} Entries
                                                        </span>
                                                    </div>
                                                    <Separator orientation="vertical" className="h-10" />
                                                    <p className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                                                        {turnover.notes || "No notes"}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {Number(turnover.importantCount) > 0 && (
                                                        <Badge className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                                            <Star className="w-3 h-3 fill-current" />
                                                            {turnover.importantCount}
                                                        </Badge>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                            {getInitials(turnover.finalizedBy)}
                                                        </div>
                                                        <span className="text-sm">{turnover.finalizedBy}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page + 1} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                    >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )}

            {/* Snapshot Detail Dialog */}
            <Dialog open={snapshotDialogOpen} onOpenChange={setSnapshotDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] min-w-[80vw]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <FileText className="w-5 h-5" />
                            <div>
                                <p>Turnover Snapshot</p>
                                {selectedSnapshot && (
                                    <p className="text-sm font-normal text-muted-foreground">
                                        {format(new Date(selectedSnapshot.finalizedAt), "MMMM dd, yyyy 'at' h:mm a")}
                                        {" • "}Finalized by {selectedSnapshot.finalizedBy}
                                    </p>
                                )}
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedSnapshot && (
                        <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-6 pr-4">
                                {/* Filter */}
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Filter entries..."
                                            className="pl-9"
                                            value={snapshotFilter}
                                            onChange={(e) => setSnapshotFilter(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                {selectedSnapshot.notes && (
                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                                        <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                                            Handover Notes
                                        </h4>
                                        <p className="text-sm text-amber-700 dark:text-amber-300">
                                            {selectedSnapshot.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Applications */}
                                {(() => {
                                    const snapshotData = selectedSnapshot.snapshotData as any[];

                                    // Group by application
                                    const grouped: Record<string, any[]> = {};
                                    snapshotData.forEach((entry) => {
                                        const appId = entry.applicationId;
                                        if (!grouped[appId]) grouped[appId] = [];

                                        // Apply filter
                                        if (snapshotFilter) {
                                            const matchesFilter =
                                                entry.title?.toLowerCase().includes(snapshotFilter.toLowerCase()) ||
                                                entry.description?.toLowerCase().includes(snapshotFilter.toLowerCase());
                                            if (!matchesFilter) return;
                                        }

                                        grouped[appId].push(entry);
                                    });

                                    return Object.entries(grouped).map(([appId, entries]) => {
                                        const app = entries[0]?.application;
                                        const isExpanded = expandedApps.has(appId);

                                        if (entries.length === 0) return null;

                                        return (
                                            <Collapsible
                                                key={appId}
                                                open={isExpanded}
                                                onOpenChange={() => {
                                                    setExpandedApps((prev) => {
                                                        const next = new Set(prev);
                                                        if (next.has(appId)) {
                                                            next.delete(appId);
                                                        } else {
                                                            next.add(appId);
                                                        }
                                                        return next;
                                                    });
                                                }}
                                            >
                                                <Card>
                                                    <CollapsibleTrigger className="w-full text-left">
                                                        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                                                            <div className="flex items-center gap-3">
                                                                <ChevronDown
                                                                    className={cn(
                                                                        "w-4 h-4 transition-transform",
                                                                        !isExpanded && "-rotate-90"
                                                                    )}
                                                                />
                                                                <span className="font-semibold">
                                                                    {app?.applicationName || "Unknown"}
                                                                </span>
                                                                {app?.tla && (
                                                                    <Badge variant="secondary">{app.tla}</Badge>
                                                                )}
                                                                <Badge variant="outline">{entries.length} entries</Badge>
                                                            </div>
                                                        </CardHeader>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <CardContent className="pt-0 space-y-3">
                                                            {entries.map((entry: any) => {
                                                                const sConfig = SECTION_CONFIG[entry.section as TurnoverSection];
                                                                const SectionIcon = SECTION_ICONS[entry.section as TurnoverSection];

                                                                return (
                                                                    <div
                                                                        key={entry.id}
                                                                        className={cn(
                                                                            "p-3 rounded-lg border",
                                                                            entry.isImportant && "border-l-4 border-l-orange-500"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Badge
                                                                                className={cn("gap-1", sConfig.bgClass, sConfig.colorClass)}
                                                                            >
                                                                                <SectionIcon className="w-3 h-3" />
                                                                                {sConfig.shortName}
                                                                            </Badge>
                                                                            <span className="font-medium">{entry.title}</span>
                                                                        </div>
                                                                        {entry.description && (
                                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                                {entry.description}
                                                                            </p>
                                                                        )}
                                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                            <span>Created by {entry.createdBy}</span>
                                                                            {entry.status === "RESOLVED" && (
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                                >
                                                                                    Resolved
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        {entry.comments && (
                                                                            <div
                                                                                className="mt-2 text-sm prose prose-sm dark:prose-invert max-w-none"
                                                                                dangerouslySetInnerHTML={{ __html: entry.comments }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </CardContent>
                                                    </CollapsibleContent>
                                                </Card>
                                            </Collapsible>
                                        );
                                    });
                                })()}
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
