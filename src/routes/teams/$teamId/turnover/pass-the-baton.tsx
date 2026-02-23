import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, FolderOpen, Layers, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getApplicationGroups } from "@/app/actions/application-groups";
import { getTeamApplications } from "@/app/actions/applications";
import { getTurnoverEntries } from "@/app/actions/turnover";
import { PageHeader } from "@/components/shared";
import { GroupManagementDialog } from "@/components/turnover/group-management-sheet";
import type { TabItem } from "@/components/turnover/grouped-application-tabs";
import {
  FlatApplicationTabs,
  GroupedApplicationTabs,
} from "@/components/turnover/grouped-application-tabs";
import { SectionTable } from "@/components/turnover/section-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ApplicationGroup } from "@/db/schema/application-groups";
import type { Application } from "@/db/schema/teams";
import { turnoverKeys } from "@/lib/query-keys";
import type { TurnoverSection } from "@/lib/zod/turnover.schema";

export const Route = createFileRoute("/teams/$teamId/turnover/pass-the-baton")({
  component: PassTheBatonPage,
  loader: async ({ params: { teamId } }) => {
    const [applications, groupsData] = await Promise.all([
      getTeamApplications({ data: { teamId } }),
      getApplicationGroups({ data: { teamId } }),
    ]);
    return { applications, groupsData };
  },
});

const SECTIONS: TurnoverSection[] = [
  "RFC",
  "INC",
  "ALERTS",
  "MIM",
  "COMMS",
  "FYI",
];

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: multi-tab turnover page with grouped/flat views
function PassTheBatonPage() {
  const { teamId } = Route.useParams();
  const { applications, groupsData: initialGroupsData } = Route.useLoaderData();

  // Fetch groups data with react-query for live updates
  const { data: groupsData } = useQuery({
    queryKey: ["application-groups", teamId],
    queryFn: () => getApplicationGroups({ data: { teamId } }),
    initialData: initialGroupsData,
  });

  // Track active tab and its applications
  const [activeTab, setActiveTab] = useState<TabItem | null>(null);

  // Build initial tab on mount or when groupsData changes
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: complex tab initialization logic with groups
  useEffect(() => {
    if (!activeTab && applications?.length > 0) {
      const groupingEnabled = groupsData?.groupingEnabled ?? false;
      const groups = groupsData?.groups || [];
      const ungroupedApps = groupsData?.ungroupedApplications || [];

      if (groupingEnabled && groups.length > 0) {
        // Find first valid group (2+ apps) or first ungrouped app
        const firstGroup = groups.find(
          (g: ApplicationGroup & { applications: Application[] }) =>
            g.applications.length >= 2
        );
        if (firstGroup) {
          setActiveTab({
            id: `group-${firstGroup.id}`,
            label: firstGroup.name,
            type: "group",
            color: firstGroup.color || undefined,
            applications: firstGroup.applications,
          });
        } else if (ungroupedApps.length > 0) {
          setActiveTab({
            id: ungroupedApps[0].id,
            label: ungroupedApps[0].tla,
            type: "application",
            applications: [ungroupedApps[0]],
          });
        }
      } else if (applications.length > 0) {
        setActiveTab({
          id: applications[0].id,
          label: applications[0].tla,
          type: "application",
          applications: [applications[0]],
        });
      }
    }
  }, [groupsData, applications, activeTab]);

  // Get all application IDs for the active tab (for fetching entries)
  const activeAppIds = activeTab?.applications.map((a) => a.id) || [];
  const primaryAppId = activeAppIds[0] || null;

  // Fetch entries for all applications in the active tab
  const { data: allEntriesData } = useQuery({
    queryKey: turnoverKeys.entries.filtered(teamId, {
      applicationIds: activeAppIds,
      includeResolved: true,
    }),
    queryFn: async () => {
      if (activeAppIds.length === 0) {
        return { entries: [], total: 0 };
      }

      // Fetch entries for all applications in the tab
      const entriesPromises = activeAppIds.map((appId) =>
        getTurnoverEntries({
          data: { teamId, applicationId: appId, includeRecentlyResolved: true },
        })
      );
      const results = await Promise.all(entriesPromises);

      // Combine all entries
      const allEntries = results.flatMap((r) => r.entries);
      return { entries: allEntries, total: allEntries.length };
    },
    enabled: activeAppIds.length > 0,
  });

  const importantEntries =
    allEntriesData?.entries?.filter(
      (e: { isImportant: boolean }) => e.isImportant
    ) || [];

  const groupingEnabled = groupsData?.groupingEnabled ?? false;
  const hasGroups = (groupsData?.groups?.length ?? 0) > 0;

  // Handler for tab selection
  const handleSelectTab = (_tabId: string, tabItem: TabItem) => {
    setActiveTab(tabItem);
  };

  // Handler for flat view tab selection
  const handleSelectApplication = (appId: string) => {
    const app = applications?.find((a: Application) => a.id === appId);
    if (app) {
      setActiveTab({
        id: app.id,
        label: app.tla,
        type: "application",
        applications: [app],
      });
    }
  };

  return (
    <div className="mx-auto space-y-8 p-8">
      <PageHeader
        className="w-full"
        description="Create and manage turnover entries for your applications and groups."
        title="Pass the Baton"
      />
      {/* Application Selection Header */}
      {applications && applications.length > 0 ? (
        <div className="space-y-4">
          {/* Header with View Toggle & Management */}
          {hasGroups && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <Label
                    className="font-medium text-muted-foreground text-sm"
                    htmlFor="grouped-view"
                  >
                    Grouped View
                  </Label>
                </div>
                <Switch
                  checked={groupingEnabled}
                  className="data-[state=checked]:bg-primary"
                  disabled
                  id="grouped-view"
                  onCheckedChange={() => {
                    // This is handled via the GroupManagementDialog
                  }}
                />
                {groupingEnabled && (
                  <Badge className="font-bold text-[10px]" variant="secondary">
                    {groupsData?.groups?.length ?? 0} groups
                  </Badge>
                )}
              </div>

              <GroupManagementDialog
                teamId={teamId}
                trigger={
                  <Button className="gap-2 text-xs" size="sm" variant="outline">
                    <Settings2 className="h-3.5 w-3.5" />
                    Manage Groups
                  </Button>
                }
              />
            </div>
          )}

          {/* Application Tabs */}
          {groupingEnabled && hasGroups ? (
            <GroupedApplicationTabs
              activeTabId={activeTab?.id || null}
              groups={groupsData?.groups || []}
              onSelectTab={handleSelectTab}
              ungroupedApplications={groupsData?.ungroupedApplications || []}
            />
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <FlatApplicationTabs
                  activeApplicationId={activeTab?.id || null}
                  applications={applications}
                  onSelectApplication={handleSelectApplication}
                />
              </div>
              {!hasGroups && (
                <GroupManagementDialog
                  teamId={teamId}
                  trigger={
                    <Button
                      className="shrink-0 gap-2 text-muted-foreground text-xs"
                      size="sm"
                      variant="ghost"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      Create Groups
                    </Button>
                  }
                />
              )}
            </div>
          )}
        </div>
      ) : (
        // Empty State - No Applications
        <div className="rounded-2xl border border-dashed bg-muted/20 py-20 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/50">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mb-2 font-bold text-2xl">No Applications Found</h2>
          <p className="mx-auto mb-6 max-w-md text-muted-foreground">
            No applications are configured for this team. Please add
            applications to team to manage turnover entries.
          </p>
          <Link params={{ teamId }} to="/teams/$teamId/settings">
            <Button className="gap-2" size="lg">
              <Settings2 className="h-5 w-5" />
              Go to Settings to Add Applications
            </Button>
          </Link>
        </div>
      )}
      {/* Critical Items Alert */}
      {importantEntries.length > 0 && (
        <div>
          <div className="rounded-lg border border-l-4 border-l-orange-500 bg-card p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="shrink-0 rounded-full bg-orange-50 p-2 dark:bg-orange-950/30">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="flex items-center gap-2 font-semibold text-foreground">
                  Critical Turnover Items
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 font-bold text-orange-700 text-xs dark:bg-orange-900/30 dark:text-orange-400">
                    {importantEntries.length} items
                  </span>
                </h4>
                <p className="text-muted-foreground text-sm">
                  Action required: These items have been flagged for immediate
                  attention.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Section Tables */}
      {activeTab && primaryAppId && (
        <div className="space-y-6" key={activeTab.id}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-3 font-bold text-xl">
                {activeTab.type === "group" && (
                  <Layers
                    className="h-5 w-5"
                    style={{ color: activeTab.color }}
                  />
                )}
                {activeTab.label}
              </h2>
              <p className="text-muted-foreground text-sm">
                {activeTab.type === "group"
                  ? `Manage turnover entries for ${activeTab.applications.length} grouped applications`
                  : "Manage turnover entries for this application"}
              </p>
            </div>
            {activeTab.type === "group" && (
              <div className="flex items-center gap-2">
                {activeTab.applications.map((app) => (
                  <Badge className="text-xs" key={app.id} variant="outline">
                    {app.tla}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
            {SECTIONS.map((section) => (
              <div key={section}>
                <SectionTable
                  applicationId={primaryAppId}
                  groupApplications={activeTab.applications}
                  isGrouped={activeTab.type === "group"}
                  // Pass group info for application selector in entry dialog
                  section={section}
                  teamId={teamId}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
