import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { format } from "date-fns";
import {
    Send,
    Search,
    Layers,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    ChevronsUpDown,
    Loader2,
    FileText,
    CheckCircle2,
    AlertCircle,
    Bell,
    Zap,
    MessageSquare,
    HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    getDispatchEntries,
    canFinalizeTurnover,
    finalizeTurnover,
} from "@/app/actions/turnover";
import { SECTION_CONFIG, type TurnoverSection } from "@/lib/zod/turnover.schema";
import { EntryCard } from "@/components/turnover/entry-card";
import type { TurnoverEntryWithDetails } from "@/db/schema/turnover";

// ... other imports
import { Skeleton } from "@/components/ui/skeleton";

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
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-2xl" />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-muted/5 border-muted">
                        <CardContent className="p-6 flex items-center gap-4">
                            <Skeleton className="w-14 h-14 rounded-2xl" />
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
                    <Card key={i} className="mb-4">
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

const SECTION_ICONS: Record<TurnoverSection, any> = {
    RFC: CheckCircle2,
    INC: AlertCircle,
    ALERTS: Bell,
    MIM: Zap,
    COMMS: MessageSquare,
    FYI: HelpCircle,
};

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
        queryKey: ["dispatch-entries", teamId],
        queryFn: () => getDispatchEntries({ data: { teamId } }),
        initialData: initialEntries,
        staleTime: 30000,
    });

    // Check finalize cooldown
    const { data: canFinalizeData, isLoading: checkingCooldown } = useQuery({
        queryKey: ["can-finalize", teamId],
        queryFn: () => canFinalizeTurnover({ data: { teamId } }),
    });

    // Finalize mutation
    const finalizeMutation = useMutation({
        mutationFn: () =>
            finalizeTurnover({ data: { teamId, notes: finalizeNotes } }),
        onSuccess: () => {
            toast.success("Turnover finalized successfully");
            queryClient.invalidateQueries({ queryKey: ["can-finalize", teamId] });
            queryClient.invalidateQueries({ queryKey: ["dispatch-entries", teamId] });
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

        filtered.forEach((entry: TurnoverEntryWithDetails) => {
            const appId = entry.applicationId;
            if (!grouped[appId]) {
                grouped[appId] = [];
            }
            grouped[appId].push(entry);
        });

        return grouped;
    }, [entries, searchQuery]);

    // Stats
    const stats = useMemo(() => {
        const apps = new Set(entries.map((e: TurnoverEntryWithDetails) => e.applicationId));
        const critical = entries.filter((e: TurnoverEntryWithDetails) => e.isImportant);

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
        <div className="p-8 mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">
                            Dispatch Turnover
                        </h1>
                        <p className="text-muted-foreground">
                            Shift briefing and handover summary for{" "}
                            {format(new Date(), "MMMM dd, yyyy")}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search entries..."
                            className="pl-9 bg-muted/30"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Finalize Button */}
                    <Button
                        onClick={() => setFinalizeDialogOpen(true)}
                        disabled={
                            checkingCooldown ||
                            !canFinalizeData?.canFinalize ||
                            entries.length === 0
                        }
                        className="gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                        {checkingCooldown ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <FileText className="w-4 h-4" />
                        )}
                        Finalize Turnover
                    </Button>
                </div>
            </div>

            {/* Cooldown Message */}
            {!canFinalizeData?.canFinalize && canFinalizeData?.message && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-amber-800 dark:text-amber-200 text-sm">
                    {canFinalizeData.message}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
                        <Layers className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeApps}</div>
                        <p className="text-xs text-muted-foreground">
                            With pending turnover
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                        <Send className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalEntries}</div>
                        <p className="text-xs text-muted-foreground">
                            Ready for dispatch
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
                        <AlertTriangle
                            className={cn(
                                "h-4 w-4",
                                stats.criticalItems > 0 ? "text-orange-600" : "text-muted-foreground"
                            )}
                        />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.criticalItems}</div>
                        <p className="text-xs text-muted-foreground">
                            Marked as Important
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={toggleAll} className="gap-2">
                    <ChevronsUpDown className="w-4 h-4" />
                    {allExpanded ? "Collapse All" : "Expand All"}
                </Button>
            </div>

            {/* Application Accordions */}
            {Object.keys(groupedEntries).length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
                    <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Active Entries</h3>
                    <p className="text-muted-foreground">
                        There are no turnover entries to dispatch at this time.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groupedEntries).map(([appId, appEntries], index) => {
                        const app = appEntries[0]?.application;
                        const criticalCount = appEntries.filter((e) => e.isImportant).length;
                        const isExpanded = expandedApps.has(appId);

                        // Group by section
                        const bySection: Record<string, TurnoverEntryWithDetails[]> = {};
                        appEntries.forEach((entry) => {
                            if (!bySection[entry.section]) {
                                bySection[entry.section] = [];
                            }
                            bySection[entry.section].push(entry);
                        });

                        return (
                            <div key={appId}>
                                <Collapsible open={isExpanded} onOpenChange={() => toggleApp(appId)}>
                                    <Card>
                                        <CollapsibleTrigger className="w-full text-left">
                                            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        {isExpanded ? (
                                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                                        )}
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                            <Layers className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <div className="text-lg font-semibold">
                                                                {app?.applicationName || "Unknown Application"}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {appEntries.length} entries
                                                                {criticalCount > 0 &&
                                                                    ` • ${criticalCount} critical`}
                                                            </p>
                                                        </div>
                                                        {app?.tla && (
                                                            <Badge variant="secondary">{app.tla}</Badge>
                                                        )}
                                                        {app?.tier && (
                                                            <Badge variant="outline">Tier {app.tier}</Badge>
                                                        )}
                                                    </div>

                                                    {criticalCount > 0 && (
                                                        <Badge className="gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            {criticalCount} Critical
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardHeader>
                                        </CollapsibleTrigger>

                                        <CollapsibleContent>
                                            <CardContent className="pt-0 space-y-6">
                                                {Object.entries(bySection).map(([section, sectionEntries]) => {
                                                    const sConfig = SECTION_CONFIG[section as TurnoverSection];
                                                    const SectionIcon = SECTION_ICONS[section as TurnoverSection];

                                                    return (
                                                        <div key={section}>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <SectionIcon
                                                                    className={cn("w-4 h-4", sConfig.colorClass)}
                                                                />
                                                                <span className="font-semibold text-sm">
                                                                    {sConfig.name}
                                                                </span>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {sectionEntries.length}
                                                                </Badge>
                                                            </div>
                                                            <div className="space-y-3 pl-6">
                                                                {sectionEntries.map((entry) => (
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
                                            </CardContent>
                                        </CollapsibleContent>
                                    </Card>
                                </Collapsible>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Finalize Dialog */}
            <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Finalize Turnover
                        </DialogTitle>
                        <DialogDescription>
                            Create a permanent snapshot of the current turnover state. This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Shift Notes (Optional)</label>
                            <Textarea
                                placeholder="Add any general notes for the incoming shift..."
                                value={finalizeNotes}
                                onChange={(e) => setFinalizeNotes(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Applications:</span>
                                <span className="font-medium">{stats.activeApps}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Entries:</span>
                                <span className="font-medium">{stats.totalEntries}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Critical Items:</span>
                                <span
                                    className={cn(
                                        "font-medium",
                                        stats.criticalItems > 0 && "text-orange-600"
                                    )}
                                >
                                    {stats.criticalItems}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setFinalizeDialogOpen(false)}
                            disabled={finalizeMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => finalizeMutation.mutate()}
                            disabled={finalizeMutation.isPending}
                            className="gap-2"
                        >
                            {finalizeMutation.isPending && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            Finalize
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
