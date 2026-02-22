import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  CheckCircle2,
  Clock,
  Edit,
  ExternalLink,
  Hash,
  HelpCircle,
  Hourglass,
  Info,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Star,
  Trash2,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteTurnoverEntry,
  resolveTurnoverEntry,
  toggleImportantEntry,
} from "@/app/actions/turnover";
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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Application } from "@/db/schema/teams";
import type { TurnoverEntryWithDetails } from "@/db/schema/turnover";
import { turnoverKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { TurnoverSection } from "@/lib/zod/turnover.schema";
import { SECTION_CONFIG } from "@/lib/zod/turnover.schema";

// SLA calculation
type SlaStatus = "OVERDUE" | "AT_RISK" | "UNATTENDED" | "STALE" | "HEALTHY";

function calculateSlaStatus(entry: TurnoverEntryWithDetails): SlaStatus {
  if (entry.status === "RESOLVED") {
    return "HEALTHY";
  }

  const now = new Date();
  const createdAt = new Date(entry.createdAt);
  const updatedAt = entry.updatedAt ? new Date(entry.updatedAt) : createdAt;

  const hoursOpen = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  const daysOpen = hoursOpen / 24;
  const hoursSinceUpdate =
    (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

  if (daysOpen > 7) {
    return "OVERDUE";
  }
  if (daysOpen >= 5) {
    return "AT_RISK";
  }
  if (hoursOpen > 24 && !entry.comments && !entry.updatedBy) {
    return "UNATTENDED";
  }
  if (hoursSinceUpdate > 48) {
    return "STALE";
  }
  return "HEALTHY";
}

const SLA_CONFIG: Record<
  SlaStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
    bgClass: string;
  }
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
const SECTION_ICONS: Record<
  TurnoverSection,
  React.ComponentType<{ className?: string }>
> = {
  RFC: CheckCircle2,
  INC: AlertCircle,
  ALERTS: Bell,
  MIM: Zap,
  COMMS: MessageSquare,
  FYI: HelpCircle,
};

function getRfcStatusColor(status: string): string {
  if (status === "Approved" || status === "Implemented") {
    return "bg-green-500";
  }
  if (status === "Rejected" || status === "Cancelled") {
    return "bg-red-500";
  }
  if (status === "In Progress" || status === "Pending Approval") {
    return "bg-blue-500";
  }
  return "bg-slate-400";
}

interface EntryCardProps {
  entry: TurnoverEntryWithDetails;
  groupApplications?: Application[];
  onEdit?: (entry: TurnoverEntryWithDetails) => void;
  readOnly?: boolean;
  // Group-related props - for showing which app an entry belongs to
  showApplicationBadge?: boolean;
  teamId: string;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex UI card with multiple conditional sections
export function EntryCard({
  entry,
  teamId,
  onEdit,
  readOnly = false,
  showApplicationBadge = false,
  groupApplications: _groupApplications = [],
}: EntryCardProps) {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  const sectionConfig = SECTION_CONFIG[entry.section];
  const SectionIcon = SECTION_ICONS[entry.section];
  const slaStatus = calculateSlaStatus(entry);
  const slaConfig = SLA_CONFIG[slaStatus];
  const SlaIcon = slaConfig.icon;

  // Mutations
  const toggleImportantMutation = useMutation({
    mutationFn: () =>
      toggleImportantEntry({
        data: { id: entry.id, isImportant: !entry.isImportant },
      }),
    onSuccess: () => {
      toast.success(
        entry.isImportant ? "Removed from critical items" : "Marked as critical"
      );
      queryClient.invalidateQueries({
        queryKey: turnoverKeys.entries.all(teamId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTurnoverEntry({ data: { id: entry.id, teamId } }),
    onSuccess: () => {
      toast.success("Entry deleted");
      queryClient.invalidateQueries({
        queryKey: turnoverKeys.entries.all(teamId),
      });
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
      queryClient.invalidateQueries({
        queryKey: turnoverKeys.entries.all(teamId),
      });
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
        return entry.title;
    }
  };

  // Format relative time
  const getRelativeTime = () => {
    const date = new Date(entry.createdAt);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return "Today";
    }
    if (diffDays === 1) {
      return "Yesterday";
    }
    return `${diffDays} days ago`;
  };

  return (
    <>
      <div
        className={cn(
          "group relative rounded-lg border bg-card p-4 transition-all duration-200 hover:bg-accent/5 hover:shadow-md",
          entry.isImportant && "border-l-4 border-l-orange-500/80",
          entry.status === "RESOLVED" &&
            "border-l-4 border-l-green-500/50 bg-muted/10 opacity-70"
        )}
      >
        {/* Header: Primary ID row */}
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {/* Star */}
            {!readOnly && (
              <button
                className="shrink-0"
                disabled={toggleImportantMutation.isPending}
                onClick={() => toggleImportantMutation.mutate()}
                type="button"
              >
                <Star
                  className={cn(
                    "h-4 w-4 transition-colors",
                    entry.isImportant
                      ? "fill-orange-500 text-orange-500"
                      : "text-muted-foreground hover:text-orange-400"
                  )}
                />
              </button>
            )}

            {/* Primary ID — wraps naturally, no truncation */}
            <span
              className="break-words font-bold font-mono text-sm"
              style={{ overflowWrap: "anywhere" }}
            >
              {getPrimaryId()}
            </span>
          </div>

          {/* Actions — always visible on the right */}
          {!readOnly && (
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                className="h-7 w-7"
                onClick={() => setShowInfoDialog(true)}
                size="icon"
                variant="ghost"
              >
                <Info className="h-3.5 w-3.5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-7 w-7"
                  )}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(entry)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  {entry.status === "OPEN" && (
                    <DropdownMenuItem
                      onClick={() => setShowResolveDialog(true)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Resolve
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Metadata row — compact, wraps gracefully */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {/* Application Badge (for grouped entries) */}
          {showApplicationBadge && entry.application && (
            <Badge
              className="h-[18px] border-primary/20 bg-primary/5 px-1.5 py-0 font-bold text-[10px]"
              variant="outline"
            >
              {entry.application.tla}
            </Badge>
          )}

          {/* SLA Badge */}
          {entry.status !== "RESOLVED" && slaStatus !== "HEALTHY" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    className={cn(
                      "h-[18px] gap-1 px-1.5 py-0 text-[10px]",
                      slaConfig.bgClass,
                      slaConfig.colorClass
                    )}
                    variant="secondary"
                  >
                    <SlaIcon className="h-2.5 w-2.5" />
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

          {/* Status Badge */}
          {entry.status === "RESOLVED" && (
            <Badge
              className="h-[18px] gap-1 bg-green-100 px-1.5 py-0 text-[10px] text-green-700 dark:bg-green-900/30 dark:text-green-400"
              variant="secondary"
            >
              <CheckCircle className="h-2.5 w-2.5" />
              Resolved
            </Badge>
          )}

          {/* RFC Status Badge */}
          {entry.section === "RFC" && entry.rfcDetails && (
            <Badge
              className="h-[18px] gap-1 px-1.5 py-0 text-[10px]"
              variant="outline"
            >
              <div
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  getRfcStatusColor(entry.rfcDetails.rfcStatus)
                )}
              />
              {entry.rfcDetails.rfcStatus}
            </Badge>
          )}

          {/* Validated By (RFC) */}
          {entry.section === "RFC" && entry.rfcDetails?.validatedBy && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <CheckCircle className="h-2.5 w-2.5" />
              {entry.rfcDetails.validatedBy}
            </span>
          )}

          {/* Separator dot */}
          <span className="text-[10px] text-muted-foreground/30">·</span>

          {/* Creator — compact text */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <span className="font-medium text-[10px] text-muted-foreground">
                  {entry.createdBy}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Created by {entry.createdBy}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <span className="text-[10px] text-muted-foreground/30">·</span>

          {/* Time — compact */}
          <span className="text-[10px] text-muted-foreground">
            {getRelativeTime()}
          </span>
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
              <div className="mb-2 flex flex-wrap gap-2">
                <a
                  className="inline-flex items-center gap-1.5 font-medium text-primary text-xs hover:underline"
                  href={entry.mimDetails.mimLink}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open MIM Bridge
                </a>
                {entry.mimDetails.mimSlackLink && (
                  <a
                    className="inline-flex items-center gap-1.5 font-medium text-purple-600 text-xs hover:underline"
                    href={entry.mimDetails.mimSlackLink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Slack Thread
                  </a>
                )}
              </div>
            )}

            {entry.section === "COMMS" && entry.commsDetails?.slackLink && (
              <a
                className="mb-2 inline-flex items-center gap-1.5 font-medium text-primary text-xs hover:underline"
                href={entry.commsDetails.slackLink}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Slack Link
              </a>
            )}

            {entry.description && (
              <p
                className="break-words text-muted-foreground text-sm"
                style={{ overflowWrap: "break-word", wordBreak: "normal" }}
              >
                {entry.description}
              </p>
            )}
          </div>

          {/* Comments */}
          {entry.comments && (
            <div className="md:col-span-2">
              <div
                className="prose prose-sm dark:prose-invert max-w-none break-words text-sm [&_*]:break-words"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: rich text editor content
                dangerouslySetInnerHTML={{ __html: entry.comments }}
                style={{ overflowWrap: "break-word", wordBreak: "normal" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
              type="button"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
      <AlertDialog onOpenChange={setShowResolveDialog} open={showResolveDialog}>
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
              disabled={resolveMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                resolveMutation.mutate();
              }}
              type="button"
            >
              {resolveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
      <Dialog onOpenChange={setShowInfoDialog} open={showInfoDialog}>
        <DialogContent className="min-w-[700px] max-w-2xl gap-0 overflow-hidden border bg-background p-0 shadow-xl sm:rounded-2xl">
          <div className="flex items-center justify-between border-b bg-muted/20 px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-background shadow-sm">
                <SectionIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="font-bold text-foreground text-xl tracking-tight">
                  Entry Details
                </DialogTitle>
                <p className="mt-0.5 font-medium text-muted-foreground text-sm">
                  Comprehensive view of the turnover log
                </p>
              </div>
            </div>
            {entry.status === "RESOLVED" && (
              <Badge
                className="bg-green-100 px-3 py-1 font-semibold text-green-700 text-xs uppercase tracking-wider dark:bg-green-900/40 dark:text-green-300"
                variant="secondary"
              >
                Resolved
              </Badge>
            )}
          </div>

          <div className="space-y-8 p-6">
            {/* Primary Meta Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1.5">
                <span className="flex items-center gap-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  <Hash className="h-3.5 w-3.5" /> Entry ID
                </span>
                <div className="w-fit select-all rounded-md border bg-muted/50 px-2.5 py-1.5 font-mono text-foreground text-sm">
                  {entry.id}
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Category
                </span>
                <div>
                  <Badge
                    className="border-border bg-muted/30 font-medium text-foreground hover:bg-muted/40"
                    variant="outline"
                  >
                    {sectionConfig.name}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Application
                </span>
                <div className="font-medium text-foreground text-sm">
                  {entry.application?.applicationName}
                  <span className="ml-1.5 font-normal text-muted-foreground">
                    ({entry.application?.tla})
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <span className="flex items-center gap-1.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  {entry.isImportant ? (
                    <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                  ) : (
                    <Star className="h-3.5 w-3.5" />
                  )}{" "}
                  Importance
                </span>
                <div
                  className={cn(
                    "font-medium text-sm",
                    entry.isImportant
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-muted-foreground"
                  )}
                >
                  {entry.isImportant
                    ? "Critical Priority"
                    : "Standard Priority"}
                </div>
              </div>
            </div>

            <div className="h-px bg-border/60" />

            {/* Audit Trail */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-semibold text-foreground text-sm">
                <Clock className="h-4 w-4 text-primary" /> Lifecycle Audit
              </h4>
              <div className="grid grid-cols-1 gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40">
                    <span className="font-bold text-[10px] text-blue-600 dark:text-blue-400">
                      CR
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      Created
                    </p>
                    <p className="font-medium text-foreground text-sm">
                      {entry.createdBy}
                    </p>
                    <p className="font-mono text-muted-foreground text-xs">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {entry.updatedBy && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-100 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
                      <span className="font-bold text-[10px] text-amber-600 dark:text-amber-400">
                        UP
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Last Updated
                      </p>
                      <p className="font-medium text-foreground text-sm">
                        {entry.updatedBy}
                      </p>
                      <p className="font-mono text-muted-foreground text-xs">
                        {new Date(entry.updatedAt ?? "").toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {entry.status === "RESOLVED" && (
                  <div className="col-span-1 mt-2 flex items-start gap-3 border-border/60 border-t border-dashed pt-2 sm:col-span-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-green-100 bg-green-50 dark:border-green-900 dark:bg-green-950/40">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Resolved
                      </p>
                      <p className="font-medium text-foreground text-sm">
                        {entry.resolvedBy}
                      </p>
                      <p className="font-mono text-muted-foreground text-xs">
                        {entry.resolvedAt
                          ? new Date(entry.resolvedAt).toLocaleString()
                          : "-"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t bg-muted/20 px-6 py-4">
            <Button onClick={() => setShowInfoDialog(false)} variant="outline">
              Close Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
