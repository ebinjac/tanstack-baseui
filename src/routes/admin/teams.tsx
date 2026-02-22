import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Filter,
  MoreHorizontal,
  Search,
  Shield,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";
import { getTeams } from "@/app/actions/teams";
import { PageHeader } from "@/components/shared";
import { EmptyState } from "@/components/shared/empty-state";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Team } from "@/db/schema/teams";

export const Route = createFileRoute("/admin/teams")({
  component: AdminTeams,
});

function AdminTeams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => getTeams(),
  });

  const filteredTeams = teams?.filter((team) => {
    const matchesSearch =
      team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && team.isActive) ||
      (statusFilter === "inactive" && !team.isActive);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: teams?.length || 0,
    active: teams?.filter((t) => t.isActive).length || 0,
    inactive: teams?.filter((t) => !t.isActive).length || 0,
    withAdminGroup: teams?.filter((t) => t.adminGroup).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Premium Admin Header Banner */}
      <PageHeader
        description="Manage and overview all registered engineering teams in the system."
        title="Active Teams"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MiniStatCard
          color="blue"
          icon={Building2}
          title="Total Teams"
          value={stats.total}
        />
        <MiniStatCard
          color="emerald"
          icon={CheckCircle2}
          title="Active"
          value={stats.active}
        />
        <MiniStatCard
          color="red"
          icon={XCircle}
          title="Inactive"
          value={stats.inactive}
        />
        <MiniStatCard
          color="amber"
          icon={UserCheck}
          title="With Admins"
          value={stats.withAdminGroup}
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
                        onClick={() => setStatusFilter("active")}
                      >
                        Active{" "}
                        {statusFilter === "active" && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center justify-between"
                        onClick={() => setStatusFilter("inactive")}
                      >
                        Inactive{" "}
                        {statusFilter === "inactive" && (
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
                  <TableHead className="font-semibold">Created</TableHead>
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
                          Fetching teams...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && (filteredTeams?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell className="h-64 text-center" colSpan={5}>
                      <EmptyState
                        actionText="Clear filters"
                        description="No teams match your current filters."
                        icon={Search}
                        onAction={() => {
                          setSearchTerm("");
                          setStatusFilter("all");
                        }}
                        size="md"
                        title="No teams found"
                        variant="search"
                      />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading &&
                  (filteredTeams?.length ?? 0) > 0 &&
                  filteredTeams?.map((team) => (
                    <TableRow
                      className="group transition-colors hover:bg-muted/30"
                      key={team.id}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Shield className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-base">
                              {team.teamName}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                className="h-4 bg-accent/50 font-normal text-[10px]"
                                variant="outline"
                              >
                                U: {team.userGroup}
                              </Badge>
                              <Badge
                                className="h-4 bg-accent/50 font-normal text-[10px]"
                                variant="outline"
                              >
                                A: {team.adminGroup}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shadow-sm ring-1 ring-border">
                            <AvatarFallback className="bg-primary/5 font-bold text-primary text-xs">
                              {team.contactName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium leading-none">
                              {team.contactName}
                            </span>
                            <span className="mt-1 text-muted-foreground text-xs">
                              {team.contactEmail}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {new Date(team.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(team.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge active={team.isActive} />
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    className="h-9 w-9 text-primary hover:bg-primary/5 hover:text-primary"
                                    onClick={() => {
                                      setSelectedTeam(team);
                                      setIsDetailsOpen(true);
                                    }}
                                    size="icon"
                                    variant="ghost"
                                  >
                                    <ExternalLink className="h-5 w-5" />
                                  </Button>
                                }
                              />
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                                  setSelectedTeam(team);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                <ExternalLink className="h-4 w-4" /> View
                                Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2">
                                <Users className="h-4 w-4" /> View Members
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
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Team Profile</DialogTitle>
                <DialogDescription>
                  Overview and configuration for this team.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedTeam && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Team Name
                  </span>
                  <p className="font-bold text-sm">{selectedTeam.teamName}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Status
                  </span>
                  <StatusBadge active={selectedTeam.isActive} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Ads User Group
                  </span>
                  <p className="w-fit rounded border border-border bg-muted/50 px-2 py-0.5 font-mono text-sm">
                    {selectedTeam.userGroup}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Ads Admin Group
                  </span>
                  <p className="w-fit rounded border border-border bg-muted/50 px-2 py-0.5 font-mono text-sm">
                    {selectedTeam.adminGroup}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Primary Contact
                </span>
                <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/20 p-3">
                  <span className="font-bold text-sm">
                    {selectedTeam.contactName}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {selectedTeam.contactEmail}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                    Created
                  </span>
                  <p className="font-medium text-sm">
                    {new Date(selectedTeam.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground italic">
                    {formatDistanceToNow(new Date(selectedTeam.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {selectedTeam.updatedAt && (
                  <div className="space-y-1">
                    <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                      Last Updated
                    </span>
                    <p className="font-medium text-sm">
                      {new Date(selectedTeam.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground italic">
                      {formatDistanceToNow(new Date(selectedTeam.updatedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  Internal Identifiers
                </span>
                <p className="break-all rounded bg-muted/30 p-2 font-mono text-[10px] text-muted-foreground">
                  ID: {selectedTeam.id}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailsOpen(false)} variant="secondary">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <Badge className="flex w-fit items-center gap-1.5 border-emerald-200/50 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-900/30 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Active
      </Badge>
    );
  }
  return (
    <Badge className="flex w-fit items-center gap-1.5 border-red-200/50 bg-red-100 text-red-700 hover:bg-red-100 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-400">
      <XCircle className="h-3 w-3" /> Inactive
    </Badge>
  );
}
