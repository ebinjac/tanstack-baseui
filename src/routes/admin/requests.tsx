import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  Filter,
  MoreHorizontal,
  Search,
  XCircle,
} from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  getRegistrationRequests,
  updateRequestStatus,
} from "@/app/actions/team-registration";
import { PageHeader } from "@/components/shared";
import { EmptyState } from "@/components/shared/empty-state";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TeamRegistrationRequest } from "@/db/schema/teams";

export const Route = createFileRoute("/admin/requests")({
  component: AdminRequests,
});

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: admin requests page with multiple filters and states
function AdminRequests() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] =
    useState<TeamRegistrationRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(
    null
  );
  const [comments, setComments] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["registration-requests"],
    queryFn: () => getRegistrationRequests(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateRequestStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-requests"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success(
        `Request ${actionType === "approved" ? "approved" : "rejected"} successfully`
      );
      resetState();
    },
    onError: (error: Error) => {
      toast.error("Failed to update request", {
        description: error.message,
      });
    },
  });

  const resetState = () => {
    setSelectedRequest(null);
    setActionType(null);
    setComments("");
    setIsDetailsOpen(false);
  };

  const handleAction = () => {
    if (!(selectedRequest && actionType)) {
      return;
    }
    updateStatusMutation.mutate({
      data: {
        requestId: selectedRequest.id,
        status: actionType,
        comments: comments.trim() || undefined,
      },
    });
  };

  const filteredRequests = requests?.filter((req) => {
    const matchesSearch =
      req.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r) => r.status === "pending").length || 0,
    approved: requests?.filter((r) => r.status === "approved").length || 0,
    rejected: requests?.filter((r) => r.status === "rejected").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Premium Admin Header Banner */}
      <PageHeader
        description="Manage and review incoming team registration applications."
        title="Team Requests"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MiniStatCard
          color="blue"
          icon={ClipboardList}
          title="Total"
          value={stats.total}
        />
        <MiniStatCard
          color="amber"
          icon={Clock}
          title="Pending"
          value={stats.pending}
        />
        <MiniStatCard
          color="emerald"
          icon={CheckCircle2}
          title="Approved"
          value={stats.approved}
        />
        <MiniStatCard
          color="red"
          icon={XCircle}
          title="Rejected"
          value={stats.rejected}
        />
      </div>

      <Card className="border-none shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
        <CardHeader className="pb-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-80">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 border-none bg-muted/50 pl-10 ring-1 ring-border"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by team, contact or email..."
                  value={searchTerm}
                />
              </div>
              <TooltipProvider>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <DropdownMenuTrigger
                          render={
                            <Button
                              className="h-10 w-10"
                              size="icon"
                              variant="outline"
                            >
                              <Filter className="h-4 w-4" />
                            </Button>
                          }
                        />
                      }
                    />
                    <TooltipContent>Filter by status</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Status Filter</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="flex items-center justify-between"
                        onClick={() => setStatusFilter("all")}
                      >
                        All{" "}
                        {statusFilter === "all" && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center justify-between"
                        onClick={() => setStatusFilter("pending")}
                      >
                        Pending{" "}
                        {statusFilter === "pending" && (
                          <CheckCircle2 className="h-4 w-4 text-amber-500" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center justify-between"
                        onClick={() => setStatusFilter("approved")}
                      >
                        Approved{" "}
                        {statusFilter === "approved" && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center justify-between"
                        onClick={() => setStatusFilter("rejected")}
                      >
                        Rejected{" "}
                        {statusFilter === "rejected" && (
                          <CheckCircle2 className="h-4 w-4 text-red-500" />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px] font-semibold">
                    Team Details
                  </TableHead>
                  <TableHead className="font-semibold">
                    Contact Person
                  </TableHead>
                  <TableHead className="font-semibold">Requested</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="pr-6 text-right font-semibold">
                    Management
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell className="h-64 text-center" colSpan={5}>
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-muted-foreground text-sm">
                          Fetching requests...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && (filteredRequests?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell className="h-64 text-center" colSpan={5}>
                      <EmptyState
                        actionText="Clear filters"
                        description="No requests match your current filters."
                        icon={Search}
                        onAction={() => {
                          setSearchTerm("");
                          setStatusFilter("all");
                        }}
                        size="md"
                        title="No requests found"
                        variant="search"
                      />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  (filteredRequests?.length ?? 0) > 0 &&
                  filteredRequests?.map((req) => (
                    <TableRow
                      className="group transition-colors hover:bg-muted/30"
                      key={req.id}
                    >
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-base">
                            {req.teamName}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge
                              className="h-4 bg-accent/50 font-normal text-[10px]"
                              variant="outline"
                            >
                              U: {req.userGroup}
                            </Badge>
                            <Badge
                              className="h-4 bg-accent/50 font-normal text-[10px]"
                              variant="outline"
                            >
                              A: {req.adminGroup}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shadow-sm ring-1 ring-border">
                            <AvatarFallback className="bg-primary/5 font-bold text-primary text-xs">
                              {req.contactName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium leading-none">
                              {req.contactName}
                            </span>
                            <span className="mt-1 text-muted-foreground text-xs">
                              {req.contactEmail}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {new Date(req.requestedAt).toLocaleDateString()}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(req.requestedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={req.status} />
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {req.status === "pending" ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      className="h-9 w-9 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20"
                                      disabled={updateStatusMutation.isPending}
                                      onClick={() => {
                                        setSelectedRequest(req);
                                        setActionType("approved");
                                      }}
                                      size="icon"
                                      variant="ghost"
                                    >
                                      <CheckCircle2 className="h-5 w-5" />
                                    </Button>
                                  }
                                />
                                <TooltipContent>Approve Request</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      className="h-9 w-9 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                                      disabled={updateStatusMutation.isPending}
                                      onClick={() => {
                                        setSelectedRequest(req);
                                        setActionType("rejected");
                                      }}
                                      size="icon"
                                      variant="ghost"
                                    >
                                      <XCircle className="h-5 w-5" />
                                    </Button>
                                  }
                                />
                                <TooltipContent>Reject Request</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <div className="flex h-9 items-center gap-1.5 px-3 text-muted-foreground text-xs italic">
                              Reviewed by{" "}
                              {req.reviewedBy?.split("@")[0] || "admin"}
                            </div>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  className="h-9 w-9"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                <ExternalLink className="h-4 w-4" /> View
                                Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog onOpenChange={setIsDetailsOpen} open={isDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Request Details</DialogTitle>
                <DialogDescription>
                  Full application information and history.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Team Name
                  </span>
                  <p className="font-bold text-sm">
                    {selectedRequest.teamName}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Status
                  </span>
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    User Group (ADS)
                  </span>
                  <p className="w-fit rounded border border-border bg-muted/50 px-2 py-0.5 font-mono text-sm">
                    {selectedRequest.userGroup}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Admin Group (ADS)
                  </span>
                  <p className="w-fit rounded border border-border bg-muted/50 px-2 py-0.5 font-mono text-sm">
                    {selectedRequest.adminGroup}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Contact Information
                </span>
                <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/20 p-3">
                  <span className="font-bold text-sm">
                    {selectedRequest.contactName}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {selectedRequest.contactEmail}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Requested By
                  </span>
                  <p className="font-medium text-sm">
                    {selectedRequest.requestedBy}
                  </p>
                  <p className="text-[10px] text-muted-foreground italic">
                    {new Date(selectedRequest.requestedAt).toLocaleString()}
                  </p>
                </div>
                {selectedRequest.status !== "pending" && (
                  <div className="space-y-1">
                    <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      Reviewed By
                    </span>
                    <p className="font-medium text-sm">
                      {selectedRequest.reviewedBy}
                    </p>
                    <p className="text-[10px] text-muted-foreground italic">
                      {selectedRequest.reviewedAt
                        ? new Date(selectedRequest.reviewedAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                )}
              </div>
              {selectedRequest.comments && (
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Reviewer Comments
                  </span>
                  <p className="rounded-lg border border-orange-200/50 bg-orange-50/50 p-3 text-sm italic dark:border-orange-800/50 dark:bg-orange-900/10">
                    "{selectedRequest.comments}"
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            <div className="flex items-center gap-2">
              {selectedRequest?.status === "pending" && (
                <>
                  <Button
                    className="border-emerald-200 text-emerald-600"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      setActionType("approved");
                    }}
                    variant="outline"
                  >
                    Approve
                  </Button>
                  <Button
                    className="border-red-200 text-red-600"
                    onClick={() => {
                      setIsDetailsOpen(false);
                      setActionType("rejected");
                    }}
                    variant="outline"
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
            <Button onClick={() => setIsDetailsOpen(false)} variant="secondary">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <AlertDialog
        onOpenChange={(open) => !open && resetState()}
        open={!!actionType}
      >
        <AlertDialogContent className="sm:max-w-[450px]">
          <AlertDialogHeader>
            <div
              className={`mb-2 w-fit rounded-full p-2 ${actionType === "approved" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40" : "bg-red-100 text-red-600 dark:bg-red-900/40"}`}
            >
              {actionType === "approved" ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <XCircle className="h-6 w-6" />
              )}
            </div>
            <AlertDialogTitle className="text-xl">
              Confirm {actionType === "approved" ? "Approval" : "Rejection"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionType} the team registration for{" "}
              <strong>{selectedRequest?.teamName}</strong>?
              {actionType === "approved" &&
                " This will automatically create the team in the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label
                className="font-medium text-sm"
                htmlFor="rejection-comments"
              >
                Internal Comments (Optional)
              </label>
              <Textarea
                className="min-h-[100px] resize-none focus-visible:ring-primary"
                id="rejection-comments"
                onChange={(e) => setComments(e.target.value)}
                placeholder="Reason for this action..."
                value={comments}
              />
              <p className="text-[11px] text-muted-foreground">
                These comments will be visible in the request history details.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatusMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className={
                actionType === "approved"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-red-600 text-white hover:bg-red-700"
              }
              disabled={updateStatusMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                handleAction();
              }}
            >
              {updateStatusMutation.isPending
                ? "Processing..."
                : `Confirm ${actionType ? actionType.charAt(0).toUpperCase() + actionType.slice(1) : ""}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MiniStatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  color: "blue" | "amber" | "emerald" | "red";
}) {
  const colors = {
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
    amber: "text-amber-600 bg-amber-100 dark:bg-amber-900/20",
    emerald: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20",
    red: "text-red-600 bg-red-100 dark:bg-red-900/20",
  };

  return (
    <Card className="group overflow-hidden border-none bg-background shadow-sm ring-1 ring-border">
      <CardContent className="flex items-center justify-between p-4">
        <div className="space-y-0.5">
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            {title}
          </p>
          <p className="font-bold text-2xl tracking-tight">{value}</p>
        </div>
        <div
          className={`rounded-lg p-2 transition-transform duration-300 group-hover:scale-110 ${colors[color]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge className="flex w-fit items-center gap-1.5 border-amber-200/50 bg-amber-100 text-amber-700 hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge className="flex w-fit items-center gap-1.5 border-emerald-200/50 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Approved
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="flex w-fit items-center gap-1.5 border-red-200/50 bg-red-100 text-red-700 hover:bg-red-100 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-400">
          <XCircle className="h-3 w-3" /> Rejected
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
