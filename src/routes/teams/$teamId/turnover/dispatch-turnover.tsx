import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { format } from "date-fns";
import {
    Send,
    Search,
    Layers,
    AlertTriangle,
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
    Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { StatsSummaryItem } from "@/components/link-manager/shared";
import { motion, AnimatePresence } from "framer-motion";
import { turnoverKeys } from "@/lib/query-keys";

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
        queryKey: turnoverKeys.dispatch(teamId),
        queryFn: () => getDispatchEntries({ data: { teamId } }),
        initialData: initialEntries,
        staleTime: 30000,
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
            queryClient.invalidateQueries({ queryKey: turnoverKeys.canFinalize(teamId) });
            queryClient.invalidateQueries({ queryKey: turnoverKeys.dispatch(teamId) });
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
        <div className="flex-1 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
            <div className="max-w-7xl mx-auto space-y-8 p-8 pt-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            Dispatch Turnover
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 border-primary/20 text-primary px-2 h-5">
                                Shift Review
                            </Badge>
                            <span className="text-muted-foreground/30">•</span>
                            <p className="text-sm font-medium text-muted-foreground">
                                Handover summary for {format(new Date(), "MMMM dd, yyyy")}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative group w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Filter entries..."
                                className="h-11 pl-12 rounded-xl bg-background/50 border-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-bold text-sm"
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
                            className="h-11 px-6 gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 font-bold text-xs rounded-xl shadow-lg shadow-green-500/10"
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
                <AnimatePresence>
                    {!canFinalizeData?.canFinalize && canFinalizeData?.message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm p-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                                    <Clock className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                                        Turnover Finalization Cooldown
                                    </h4>
                                    <p className="text-xs text-amber-700/80 dark:text-amber-400 font-medium">
                                        {canFinalizeData.message}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatsSummaryItem
                        label="Active Applications"
                        value={stats.activeApps}
                        icon={Layers}
                        color="blue"
                    />
                    <StatsSummaryItem
                        label="Total Entries"
                        value={stats.totalEntries}
                        icon={Send}
                        color="primary"
                    />
                    <StatsSummaryItem
                        label="Critical Items"
                        value={stats.criticalItems}
                        icon={AlertTriangle}
                        color={stats.criticalItems > 0 ? "amber" : "indigo"}
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Grouped by Application
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={toggleAll}
                        className="gap-2 font-bold text-xs hover:bg-primary/5 hover:text-primary rounded-xl"
                    >
                        <ChevronsUpDown className="w-4 h-4" />
                        {allExpanded ? "Collapse All View" : "Expand All View"}
                    </Button>
                </div>

                {/* Application Accordions */}
                <div className="relative">
                    {Object.keys(groupedEntries).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 bg-card/10 backdrop-blur-sm border border-dashed border-border/50 rounded-[2.5rem] text-center space-y-6">
                            <div className="h-24 w-24 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground animate-pulse">
                                <Send className="h-10 w-10 opacity-30" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black tracking-tight italic">No Active Entries</h3>
                                <p className="text-muted-foreground max-w-sm font-medium">There are no turnover entries to dispatch at this time.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedEntries).map(([appId, appEntries]) => {
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
                                            <Card className={cn(
                                                "overflow-hidden border-l-[3px] transition-colors",
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
                                                        {Object.entries(bySection).map(([section, sectionEntries]) => {
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
                                                                            {sectionEntries.length}
                                                                        </span>
                                                                    </div>
                                                                    <div className="space-y-2 pl-7">
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
                <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
                    <DialogContent className="rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl min-w-[500px]">
                        <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 opacity-20 bg-white rounded-full blur-3xl pointer-events-none" />
                            <div className="relative z-10">
                                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-lg mb-6">
                                    <FileText className="h-7 w-7" />
                                </div>
                                <DialogHeader className="space-y-2">
                                    <DialogTitle className="text-3xl font-black tracking-tight">
                                        Finalize Turnover
                                    </DialogTitle>
                                    <DialogDescription className="text-primary-foreground/70 font-medium">
                                        Create a permanent snapshot of the current turnover state for auditing and reporting.
                                    </DialogDescription>
                                </DialogHeader>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Shift Intelligence Notes</label>
                                <Textarea
                                    placeholder="Add high-level summary or specific instructions for the incoming shift..."
                                    value={finalizeNotes}
                                    onChange={(e) => setFinalizeNotes(e.target.value)}
                                    rows={4}
                                    className="rounded-2xl bg-muted/50 border-transparent focus:bg-background transition-all font-medium text-sm p-4"
                                />
                            </div>

                            <div className="bg-muted/30 rounded-2xl p-6 space-y-3 border border-border/50">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Active Applications:</span>
                                    <span className="text-sm font-black text-foreground">{stats.activeApps}</span>
                                </div>
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Total Handover Items:</span>
                                    <span className="text-sm font-black text-foreground">{stats.totalEntries}</span>
                                </div>
                                <div className="h-px bg-border/40 my-1" />
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Critical Intensity:</span>
                                    <span
                                        className={cn(
                                            "text-sm font-black",
                                            stats.criticalItems > 0 ? "text-orange-600" : "text-muted-foreground"
                                        )}
                                    >
                                        {stats.criticalItems} High Priority
                                    </span>
                                </div>
                            </div>

                            <DialogFooter className="gap-3 sm:justify-start">
                                <Button
                                    onClick={() => finalizeMutation.mutate()}
                                    disabled={finalizeMutation.isPending}
                                    className="flex-1 h-12 rounded-xl font-bold text-sm bg-primary shadow-lg shadow-primary/20"
                                >
                                    {finalizeMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                    )}
                                    Authorize Finalization
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setFinalizeDialogOpen(false)}
                                    disabled={finalizeMutation.isPending}
                                    className="h-12 px-6 rounded-xl font-bold text-sm border-primary/20 hover:bg-primary/5"
                                >
                                    Cancel
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
