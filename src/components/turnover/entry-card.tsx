import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { formatDistanceToNow } from "date-fns";
import {
    Star,
    Info,
    MoreHorizontal,
    Edit,
    CheckCircle,
    Trash2,
    ExternalLink,
    MessageSquare,
    CheckCircle2,
    AlertCircle,
    Bell,
    Zap,
    HelpCircle,
    AlertTriangle,
    Clock,
    Hourglass,
    Hash,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
    toggleImportantEntry,
    deleteTurnoverEntry,
    resolveTurnoverEntry,
} from "@/app/actions/turnover";
import { toast } from "sonner";
import { SECTION_CONFIG, type TurnoverSection } from "@/lib/zod/turnover.schema";
import type { TurnoverEntryWithDetails } from "@/db/schema/turnover";

// SLA calculation
type SlaStatus = "OVERDUE" | "AT_RISK" | "UNATTENDED" | "STALE" | "HEALTHY";

function calculateSlaStatus(entry: TurnoverEntryWithDetails): SlaStatus {
    if (entry.status === "RESOLVED") return "HEALTHY";

    const now = new Date();
    const createdAt = new Date(entry.createdAt);
    const updatedAt = entry.updatedAt ? new Date(entry.updatedAt) : createdAt;

    const hoursOpen = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const daysOpen = hoursOpen / 24;
    const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

    if (daysOpen > 7) return "OVERDUE";
    if (daysOpen >= 5) return "AT_RISK";
    if (hoursOpen > 24 && !entry.comments && !entry.updatedBy) return "UNATTENDED";
    if (hoursSinceUpdate > 48) return "STALE";
    return "HEALTHY";
}

const SLA_CONFIG: Record<
    SlaStatus,
    { label: string; icon: any; colorClass: string; bgClass: string }
> = {
    OVERDUE: {
        label: "Overdue (>7d)",
        icon: AlertTriangle,
        colorClass: "text-red-600",
        bgClass: "bg-red-100 dark:bg-red-900/30",
    },
    AT_RISK: {
        label: "Due Soon",
        icon: AlertCircle,
        colorClass: "text-orange-600",
        bgClass: "bg-orange-100 dark:bg-orange-900/30",
    },
    UNATTENDED: {
        label: "Needs Triage",
        icon: HelpCircle,
        colorClass: "text-purple-600",
        bgClass: "bg-purple-100 dark:bg-purple-900/30",
    },
    STALE: {
        label: "Stale Update",
        icon: Hourglass,
        colorClass: "text-amber-600",
        bgClass: "bg-amber-100 dark:bg-amber-900/30",
    },
    HEALTHY: {
        label: "Healthy",
        icon: CheckCircle2,
        colorClass: "text-slate-500",
        bgClass: "bg-slate-100 dark:bg-slate-800/30",
    },
};

// Section icon mapping
const SECTION_ICONS: Record<TurnoverSection, any> = {
    RFC: CheckCircle2,
    INC: AlertCircle,
    ALERTS: Bell,
    MIM: Zap,
    COMMS: MessageSquare,
    FYI: HelpCircle,
};

interface EntryCardProps {
    entry: TurnoverEntryWithDetails;
    teamId: string;
    onEdit?: (entry: TurnoverEntryWithDetails) => void;
    readOnly?: boolean;
}

export function EntryCard({
    entry,
    teamId,
    onEdit,
    readOnly = false,
}: EntryCardProps) {
    const queryClient = useQueryClient();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showResolveDialog, setShowResolveDialog] = useState(false);
    const [showInfoDialog, setShowInfoDialog] = useState(false);

    const sectionConfig = SECTION_CONFIG[entry.section as TurnoverSection];
    const SectionIcon = SECTION_ICONS[entry.section as TurnoverSection];
    const slaStatus = calculateSlaStatus(entry);
    const slaConfig = SLA_CONFIG[slaStatus];
    const SlaIcon = slaConfig.icon;

    // Mutations
    const toggleImportantMutation = useMutation({
        mutationFn: () =>
            toggleImportantEntry({ data: { id: entry.id, isImportant: !entry.isImportant } }),
        onSuccess: () => {
            toast.success(
                entry.isImportant ? "Removed from critical items" : "Marked as critical"
            );
            queryClient.invalidateQueries({ queryKey: ["turnover-entries", teamId] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to update");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteTurnoverEntry({ data: { id: entry.id, teamId } }),
        onSuccess: () => {
            toast.success("Entry deleted");
            queryClient.invalidateQueries({ queryKey: ["turnover-entries", teamId] });
            setShowDeleteDialog(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to delete");
        },
    });

    const resolveMutation = useMutation({
        mutationFn: () => resolveTurnoverEntry({ data: { id: entry.id } }),
        onSuccess: () => {
            toast.success("Entry resolved");
            queryClient.invalidateQueries({ queryKey: ["turnover-entries", teamId] });
            setShowResolveDialog(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to resolve");
        },
    });

    // Get primary identifier based on section
    const getPrimaryId = () => {
        switch (entry.section) {
            case "RFC":
                return entry.rfcDetails?.rfcNumber;
            case "INC":
                return entry.incDetails?.incidentNumber;
            case "COMMS":
                return entry.commsDetails?.emailSubject || entry.title;
            default:
                return entry.title.substring(0, 50);
        }
    };

    // Format relative time
    const getRelativeTime = () => {
        const date = new Date(entry.createdAt);
        const now = new Date();
        const diffDays = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        return `${diffDays} days ago`;
    };

    // Get creator initials
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <>
            <div
                className={cn(
                    "group relative border rounded-lg p-4 transition-all duration-200 bg-card hover:bg-accent/5 hover:shadow-md",
                    entry.isImportant && "border-l-4 border-l-orange-500/80",
                    entry.status === "RESOLVED" && "bg-muted/10 opacity-70 border-l-4 border-l-green-500/50"
                )}
            >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Star */}
                        {!readOnly && (
                            <button
                                onClick={() => toggleImportantMutation.mutate()}
                                disabled={toggleImportantMutation.isPending}
                                className="shrink-0"
                            >
                                <Star
                                    className={cn(
                                        "w-5 h-5 transition-colors",
                                        entry.isImportant
                                            ? "fill-orange-500 text-orange-500"
                                            : "text-muted-foreground hover:text-orange-400"
                                    )}
                                />
                            </button>
                        )}

                        {/* Primary ID */}
                        <span className="font-mono font-bold text-sm truncate">
                            {getPrimaryId()}
                        </span>

                        {/* Status Badge */}
                        {entry.status === "RESOLVED" && (
                            <Badge
                                variant="secondary"
                                className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0"
                            >
                                <CheckCircle className="w-3 h-3" />
                                Resolved
                            </Badge>
                        )}

                        {/* SLA Badge */}
                        {entry.status !== "RESOLVED" && slaStatus !== "HEALTHY" && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "gap-1 shrink-0",
                                                slaConfig.bgClass,
                                                slaConfig.colorClass
                                            )}
                                        >
                                            <SlaIcon className="w-3 h-3" />
                                            {slaConfig.label}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>
                                            Created {formatDistanceToNow(new Date(entry.createdAt))} ago
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {/* RFC Status Badge */}
                        {entry.section === "RFC" && entry.rfcDetails && (
                            <Badge variant="outline" className="shrink-0 text-[10px] gap-1.5 px-2 py-0 h-5">
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    entry.rfcDetails.rfcStatus === "Approved" || entry.rfcDetails.rfcStatus === "Implemented" ? "bg-green-500" :
                                        entry.rfcDetails.rfcStatus === "Rejected" || entry.rfcDetails.rfcStatus === "Cancelled" ? "bg-red-500" :
                                            entry.rfcDetails.rfcStatus === "In Progress" || entry.rfcDetails.rfcStatus === "Pending Approval" ? "bg-blue-500" :
                                                "bg-slate-400"
                                )} />
                                {entry.rfcDetails.rfcStatus}
                            </Badge>
                        )}

                        {/* Validated By (RFC) */}
                        {entry.section === "RFC" && entry.rfcDetails?.validatedBy && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                                <CheckCircle className="w-3 h-3" />
                                {entry.rfcDetails.validatedBy}
                            </span>
                        )}
                    </div>

                    {/* Right Side: Meta & Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Creator */}
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {getInitials(entry.createdBy)}
                            </div>
                            <span className="text-sm text-muted-foreground hidden sm:block">
                                {entry.createdBy.split(" ")[0]}
                            </span>
                        </div>

                        {/* Time */}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getRelativeTime()}
                        </span>

                        {/* Actions */}
                        {!readOnly && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setShowInfoDialog(true)}
                                >
                                    <Info className="w-4 h-4" />
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit?.(entry)}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        {entry.status === "OPEN" && (
                                            <DropdownMenuItem
                                                onClick={() => setShowResolveDialog(true)}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Resolve
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => setShowDeleteDialog(true)}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div
                    className={cn(
                        "grid gap-4",
                        entry.comments ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1"
                    )}
                >
                    {/* Description */}
                    <div className={cn(entry.comments ? "md:col-span-1" : "")}>
                        {entry.section === "MIM" && entry.mimDetails && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                <a
                                    href={entry.mimDetails.mimLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Open MIM Bridge
                                </a>
                                {entry.mimDetails.mimSlackLink && (
                                    <a
                                        href={entry.mimDetails.mimSlackLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:underline"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Slack Thread
                                    </a>
                                )}
                            </div>
                        )}

                        {entry.section === "COMMS" && entry.commsDetails?.slackLink && (
                            <a
                                href={entry.commsDetails.slackLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mb-2"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Open Slack Link
                            </a>
                        )}

                        {entry.description && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {entry.description}
                            </p>
                        )}
                    </div>

                    {/* Comments */}
                    {entry.comments && (
                        <div className="md:col-span-2">
                            <div
                                className="text-sm prose prose-sm dark:prose-invert max-w-none line-clamp-4"
                                dangerouslySetInnerHTML={{ __html: entry.comments }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            turnover entry.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                deleteMutation.mutate();
                            }}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Resolve Confirmation Dialog */}
            <AlertDialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will mark the entry as resolved and remove it from the active
                            list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={resolveMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                resolveMutation.mutate();
                            }}
                            disabled={resolveMutation.isPending}
                        >
                            {resolveMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Resolving...
                                </>
                            ) : (
                                "Resolve"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Info Dialog */}
            <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
                <DialogContent className="max-w-2xl min-w-[700px] p-0 gap-0 overflow-hidden sm:rounded-2xl border bg-background shadow-xl">
                    <div className="px-6 py-6 border-b bg-muted/20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-background border shadow-sm">
                                <SectionIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                                    Entry Details
                                </DialogTitle>
                                <p className="text-sm text-muted-foreground font-medium mt-0.5">
                                    Comprehensive view of the turnover log
                                </p>
                            </div>
                        </div>
                        {entry.status === "RESOLVED" && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                                Resolved
                            </Badge>
                        )}
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Primary Meta Grid */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wide flex items-center gap-1.5">
                                    <Hash className="w-3.5 h-3.5" /> Entry ID
                                </span>
                                <div className="font-mono text-sm bg-muted/50 px-2.5 py-1.5 rounded-md border text-foreground w-fit select-all">
                                    {entry.id}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                                    Category
                                </span>
                                <div>
                                    <Badge variant="outline" className="font-medium bg-muted/30 text-foreground border-border hover:bg-muted/40">
                                        {sectionConfig.name}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                                    Application
                                </span>
                                <div className="text-sm font-medium text-foreground">
                                    {entry.application?.applicationName}
                                    <span className="text-muted-foreground ml-1.5 font-normal">
                                        ({entry.application?.tla})
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wide flex items-center gap-1.5">
                                    {entry.isImportant ? <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" /> : <Star className="w-3.5 h-3.5" />} Importance
                                </span>
                                <div className={cn("text-sm font-medium", entry.isImportant ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground")}>
                                    {entry.isImportant ? "Critical Priority" : "Standard Priority"}
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-border/60" />

                        {/* Audit Trail */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" /> Lifecycle Audit
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">CR</span>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Created</p>
                                        <p className="text-sm font-medium text-foreground">{entry.createdBy}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{new Date(entry.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                {entry.updatedBy && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900">
                                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">UP</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Last Updated</p>
                                            <p className="text-sm font-medium text-foreground">{entry.updatedBy}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{new Date(entry.updatedAt!).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}

                                {entry.status === "RESOLVED" && (
                                    <div className="flex items-start gap-3 col-span-1 sm:col-span-2 pt-2 border-t mt-2 border-dashed border-border/60">
                                        <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-950/40 flex items-center justify-center shrink-0 border border-green-100 dark:border-green-900">
                                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Resolved</p>
                                            <p className="text-sm font-medium text-foreground">{entry.resolvedBy}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{entry.resolvedAt ? new Date(entry.resolvedAt).toLocaleString() : "-"}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted/20 px-6 py-4 border-t flex justify-end">
                        <Button variant="outline" onClick={() => setShowInfoDialog(false)}>
                            Close Details
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
