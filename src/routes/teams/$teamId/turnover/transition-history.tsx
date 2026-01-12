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
    X,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
                            {filteredTurnovers.map((turnover: FinalizedTurnover) => (
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
                            {filteredTurnovers.map((turnover: FinalizedTurnover) => (
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
                                                const matchesFilter =
                                                    entry.title?.toLowerCase().includes(snapshotFilter.toLowerCase()) ||
                                                    entry.description?.toLowerCase().includes(snapshotFilter.toLowerCase());
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
                                                <div key={appId} className="space-y-4 mb-10">
                                                    {/* App Header Row */}
                                                    <div className="flex items-center justify-between px-2">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border shadow-sm">
                                                                <Layers className="w-6 h-6 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <h3 className="text-xl font-bold tracking-tight">
                                                                        {app?.applicationName || "Unknown Application"}
                                                                    </h3>
                                                                    {app?.tla && (
                                                                        <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                                                                            {app.tla}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mt-0.5">
                                                                    {appEntries.length} total entries
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {criticalCount > 0 && (
                                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/20">
                                                                <AlertTriangle className="w-4 h-4 text-destructive" />
                                                                <span className="text-sm font-semibold text-destructive">{criticalCount} Critical Items</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Sections as Individual Cards */}
                                                    <div className="grid grid-cols-1 gap-6">
                                                        {sortedSections.map(([section, entries]) => {
                                                            const sConfig = SECTION_CONFIG[section as TurnoverSection];
                                                            const SectionIcon = SECTION_ICONS[section as TurnoverSection];

                                                            return (
                                                                <div key={section} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                                                                    {/* Section Header */}
                                                                    <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
                                                                        <div className={cn("p-2 rounded-md", sConfig.colorClass.replace("text-", "bg-").replace("500", "500/10").replace("600", "600/10"))}>
                                                                            <SectionIcon className={cn("w-4 h-4", sConfig.colorClass)} />
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <h4 className="font-semibold text-base">{sConfig.name}</h4>
                                                                            <Badge variant="secondary" className="text-xs font-normal">
                                                                                {entries.length}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>

                                                                    {/* Table Content */}
                                                                    <div className="overflow-x-auto">
                                                                        <Table>
                                                                            <TableHeader>
                                                                                <TableRow className="hover:bg-transparent border-b-border/50">
                                                                                    <TableHead className="w-[60px] text-center bg-muted/5">Pri</TableHead>
                                                                                    <TableHead className="bg-muted/5">Description</TableHead>
                                                                                    <TableHead className="w-[120px] bg-muted/5">Status</TableHead>
                                                                                    <TableHead className="w-[30%] bg-muted/5">Team Notes</TableHead>
                                                                                    <TableHead className="w-[150px] text-right bg-muted/5">Author</TableHead>
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {entries.map((entry) => (
                                                                                    <TableRow key={entry.id} className="group hover:bg-muted/30">
                                                                                        <TableCell className="text-center py-4 align-top">
                                                                                            {entry.isImportant ? (
                                                                                                <div className="relative inline-flex">
                                                                                                    <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-sm" />
                                                                                                    <Star className="relative w-4 h-4 text-orange-500 fill-orange-500" />
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 mx-auto mt-2" />
                                                                                            )}
                                                                                        </TableCell>
                                                                                        <TableCell className="py-4 align-top">
                                                                                            <span className="font-medium text-sm block mb-1">
                                                                                                {entry.title}
                                                                                            </span>
                                                                                            {entry.description && (
                                                                                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                                                                    {entry.description}
                                                                                                </p>
                                                                                            )}
                                                                                        </TableCell>
                                                                                        <TableCell className="py-4 align-top">
                                                                                            <Badge
                                                                                                variant="outline"
                                                                                                className={cn(
                                                                                                    "font-medium text-[11px] px-2 py-0.5",
                                                                                                    entry.status === "RESOLVED"
                                                                                                        ? "border-green-500/30 text-green-700 bg-green-500/5 dark:text-green-400"
                                                                                                        : "border-muted-foreground/30 text-muted-foreground"
                                                                                                )}
                                                                                            >
                                                                                                {entry.status === "RESOLVED" ? "Resolved" : "Active"}
                                                                                            </Badge>
                                                                                        </TableCell>
                                                                                        <TableCell className="py-4 align-top">
                                                                                            {entry.comments ? (
                                                                                                <div className="flex gap-2">
                                                                                                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/40 mt-1 shrink-0" />
                                                                                                    <div
                                                                                                        className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none prose-p:my-0 leading-relaxed"
                                                                                                        dangerouslySetInnerHTML={{ __html: entry.comments }}
                                                                                                    />
                                                                                                </div>
                                                                                            ) : (
                                                                                                <span className="text-muted-foreground/20 text-xs italic">—</span>
                                                                                            )}
                                                                                        </TableCell>
                                                                                        <TableCell className="py-4 align-top text-right">
                                                                                            <div className="flex items-center justify-end gap-2.5">
                                                                                                <div className="text-right">
                                                                                                    <p className="text-xs font-medium text-foreground">{entry.createdBy}</p>
                                                                                                    <p className="text-[10px] text-muted-foreground">Owner</p>
                                                                                                </div>
                                                                                                <div className="h-8 w-8 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-xs font-bold text-primary shadow-sm">
                                                                                                    {getInitials(entry.createdBy)}
                                                                                                </div>
                                                                                            </div>
                                                                                        </TableCell>
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
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
    );
}
