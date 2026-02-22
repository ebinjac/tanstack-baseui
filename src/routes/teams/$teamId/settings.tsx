import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Boxes, LayoutDashboard, LifeBuoy, Users2, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  getTeamApplications,
  updateApplication,
} from "@/app/actions/applications";
import { getTeamById } from "@/app/actions/teams";
import type { NavItem } from "@/components/settings";
import {
  AddApplicationDialog,
  ApplicationsTab,
  DeleteConfirmationDialog,
  EditApplicationDialog,
  EditTeamDialog,
  MembersTab,
  OverviewTab,
  ResourcesTab,
  SettingsNav,
  SupportTab,
  ViewApplicationDialog,
} from "@/components/settings";
import { PageHeader } from "@/components/shared";

interface ApplicationRecord {
  applicationName: string;
  assetId: number;
  id: string;
  lifeCycleStatus?: string | null;
  teamId: string;
  tier?: string | null;
  tla: string;
}

export const Route = createFileRoute("/teams/$teamId/settings")({
  loader: async ({ params }) => {
    const team = await getTeamById({ data: { teamId: params.teamId } });
    if (!team) {
      throw new Error("Team not found");
    }
    return { team };
  },
  component: TeamSettingsPage,
});

function TeamSettingsPage() {
  const { team } = Route.useLoaderData();
  const { teamId } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Action States
  const [viewingApp, setViewingApp] = useState<ApplicationRecord | null>(null);
  const [editingApp, setEditingApp] = useState<ApplicationRecord | null>(null);
  const [deletingApp, setDeletingApp] = useState<ApplicationRecord | null>(
    null
  );
  const [isEditingTeam, setIsEditingTeam] = useState(false);

  // Fetch Applications
  const { data: applications, isLoading: isLoadingApps } = useQuery({
    queryKey: ["applications", teamId],
    queryFn: () => getTeamApplications({ data: { teamId } }),
  });

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: (app: ApplicationRecord) => {
      const syncData = {
        id: app.id,
        teamId: app.teamId,
      };
      return updateApplication({ data: syncData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications", teamId] });
      toast.success("Application synced with Central Registry");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to sync application");
    },
  });

  const stats = {
    total: applications?.length || 0,
    active:
      applications?.filter(
        (a) =>
          a.lifeCycleStatus?.toLowerCase() === "production" ||
          a.lifeCycleStatus?.toLowerCase() === "active"
      ).length || 0,
    tiers: {
      critical:
        applications?.filter((a) => ["0", "1", "2"].includes(String(a.tier)))
          .length || 0,
      other:
        applications?.filter((a) => !["0", "1", "2"].includes(String(a.tier)))
          .length || 0,
    },
  };

  const navItems: NavItem[] = [
    { value: "overview", label: "Overview", icon: LayoutDashboard },
    {
      value: "applications",
      label: "Applications",
      icon: Boxes,
      count: stats.total,
    },
    { value: "members", label: "Members", icon: Users2 },
    { value: "resources", label: "Resources", icon: Wrench },
    { value: "support", label: "Support", icon: LifeBuoy },
  ];

  // Mock Admin Check
  const isAdmin = true;

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      <PageHeader
        description={
          <>
            Manage your operational configurations, members, and preferences for{" "}
            <span className="font-bold text-white drop-shadow-sm">
              {team.teamName}
            </span>
            .
          </>
        }
        title="Settings"
      />

      <div className="flex flex-col gap-8 md:flex-row">
        <SettingsNav
          activeTab={activeTab}
          items={navItems}
          onTabChange={setActiveTab}
        />

        <div className="min-w-0 flex-1">
          {activeTab === "overview" && (
            <OverviewTab
              isAdmin={isAdmin}
              onEditTeam={() => setIsEditingTeam(true)}
              stats={stats}
              team={team}
            />
          )}

          {activeTab === "applications" && (
            <ApplicationsTab
              AddApplicationDialog={AddApplicationDialog}
              applications={applications}
              isAdmin={isAdmin}
              isLoadingApps={isLoadingApps}
              onAddSuccess={() =>
                queryClient.invalidateQueries({
                  queryKey: ["applications", teamId],
                })
              }
              onDeleteApp={(app) => setDeletingApp(app)}
              onEditApp={(app) => setEditingApp(app)}
              onViewApp={(app) => setViewingApp(app)}
              syncMutation={
                syncMutation as {
                  isPending: boolean;
                  mutate: (app: ApplicationRecord) => void;
                  variables?: { id: string } | null;
                }
              }
              team={team}
              teamId={teamId}
            />
          )}

          {activeTab === "members" && (
            <MembersTab
              adminGroup={team.adminGroup}
              userGroup={team.userGroup}
            />
          )}

          {activeTab === "resources" && <ResourcesTab stats={stats} />}

          {activeTab === "support" && <SupportTab team={team} />}
        </div>
      </div>

      {viewingApp && (
        <ViewApplicationDialog
          app={viewingApp}
          onOpenChange={(open) => !open && setViewingApp(null)}
          open={!!viewingApp}
        />
      )}

      {editingApp && (
        <EditApplicationDialog
          app={editingApp}
          onOpenChange={(open) => !open && setEditingApp(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["applications", teamId],
            });
            setEditingApp(null);
          }}
          open={!!editingApp}
        />
      )}

      {deletingApp && (
        <DeleteConfirmationDialog
          app={deletingApp}
          onOpenChange={(open) => !open && setDeletingApp(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["applications", teamId],
            });
            setDeletingApp(null);
          }}
          open={!!deletingApp}
        />
      )}

      {isEditingTeam && (
        <EditTeamDialog
          onOpenChange={setIsEditingTeam}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["team", teamId] });
            setIsEditingTeam(false);
            router.invalidate();
          }}
          open={isEditingTeam}
          team={team}
        />
      )}
    </div>
  );
}
