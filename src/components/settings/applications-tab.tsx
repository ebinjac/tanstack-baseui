import { Boxes, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ApplicationActions } from "./application-actions";

interface ApplicationRecord {
  applicationName: string;
  assetId: number;
  id: string;
  lifeCycleStatus?: string | null;
  teamId: string;
  tier?: string | null;
  tla: string;
}

interface SyncMutationLike {
  isPending: boolean;
  mutate: (app: ApplicationRecord) => void;
  variables?: { id: string } | null;
}

interface TeamRecord {
  teamName: string;
}

interface ApplicationsTabProps {
  AddApplicationDialog: React.ComponentType<{
    teamId: string;
    onSuccess: () => void;
  }>;
  applications: ApplicationRecord[] | undefined;
  isAdmin: boolean;
  isLoadingApps: boolean;
  onAddSuccess: () => void;
  onDeleteApp: (app: ApplicationRecord) => void;
  onEditApp: (app: ApplicationRecord) => void;
  onViewApp: (app: ApplicationRecord) => void;
  syncMutation: SyncMutationLike;
  team: TeamRecord;
  teamId: string;
}

export function ApplicationsTab({
  team,
  applications,
  isLoadingApps,
  isAdmin,
  syncMutation,
  onViewApp,
  onEditApp,
  onDeleteApp,
  onAddSuccess,
  teamId,
  AddApplicationDialog,
}: ApplicationsTabProps) {
  const [appSearch, setAppSearch] = useState("");

  const filteredApps = applications?.filter(
    (app) =>
      app.applicationName.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.tla.toLowerCase().includes(appSearch.toLowerCase()) ||
      String(app.assetId).includes(appSearch)
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Boxes className="h-4 w-4 text-primary" /> Managed Applications
            </CardTitle>
            <CardDescription>
              Systems registered to {team.teamName}.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 w-56 pl-9 text-sm"
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search apps..."
                value={appSearch}
              />
            </div>
            {isAdmin && (
              <AddApplicationDialog onSuccess={onAddSuccess} teamId={teamId} />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px] px-6 py-3 font-bold text-xs uppercase tracking-wider">
                Application
              </TableHead>
              <TableHead className="py-3 font-bold text-xs uppercase tracking-wider">
                TNA
              </TableHead>
              <TableHead className="py-3 font-bold text-xs uppercase tracking-wider">
                Asset ID
              </TableHead>
              <TableHead className="py-3 text-center font-bold text-xs uppercase tracking-wider">
                Lifecycle
              </TableHead>
              <TableHead className="py-3 text-center font-bold text-xs uppercase tracking-wider">
                Tier
              </TableHead>
              <TableHead className="px-6 py-3 text-right font-bold text-xs uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingApps ? (
              <TableRow>
                <TableCell className="h-32 text-center" colSpan={6}>
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Loading applications...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {filteredApps?.length === 0 && (
                  <TableRow>
                    <TableCell className="h-32" colSpan={6}>
                      <EmptyState
                        description="No applications match your search."
                        icon={Boxes}
                        size="sm"
                        title="No applications found"
                      />
                    </TableCell>
                  </TableRow>
                )}
                {filteredApps &&
                  filteredApps.length > 0 &&
                  filteredApps.map((app) => (
                    <TableRow
                      className="group transition-colors hover:bg-muted/30"
                      key={app.id}
                    >
                      <TableCell className="px-6 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {app.applicationName}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                            {app.id.split("-")[0]}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-primary text-sm">
                        {app.tla}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {app.assetId}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={cn(
                            "h-5 border px-2 py-0 font-bold text-[9px] uppercase",
                            app.lifeCycleStatus?.toLowerCase() ===
                              "production" &&
                              "border-green-500/20 bg-green-500/10 text-green-600",
                            app.lifeCycleStatus?.toLowerCase() ===
                              "development" &&
                              "border-blue-500/20 bg-blue-500/10 text-blue-600"
                          )}
                          variant="secondary"
                        >
                          {app.lifeCycleStatus || "Undeclared"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={cn(
                            "font-bold text-[10px]",
                            ["0", "1", "2"].includes(String(app.tier))
                              ? "border-red-500/20 bg-red-500/10 text-red-600"
                              : ""
                          )}
                          variant={
                            ["0", "1", "2"].includes(String(app.tier))
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {app.tier || "Not Core"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-right">
                        <ApplicationActions
                          isAdmin={isAdmin}
                          isSyncing={
                            syncMutation.isPending &&
                            syncMutation.variables?.id === app.id
                          }
                          onDelete={() => onDeleteApp(app)}
                          onEdit={() => onEditApp(app)}
                          onSync={() => syncMutation.mutate(app)}
                          onView={() => onViewApp(app)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <div className="flex items-center justify-between border-t px-6 py-3 text-muted-foreground text-xs">
        <span>
          Showing {filteredApps?.length || 0} of {applications?.length || 0}{" "}
          applications
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500" /> Critical
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" /> Production
          </div>
        </div>
      </div>
    </Card>
  );
}
