import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  AlertTriangle,
  FolderOpen,
  Settings2,
  Star,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { getTeamApplications } from "@/app/actions/applications";
import { getTurnoverEntries } from "@/app/actions/turnover";
import { SectionTable } from "@/components/turnover/section-table";
import { type TurnoverSection } from "@/lib/zod/turnover.schema";
import type { Application } from "@/db/schema/teams";

export const Route = createFileRoute(
  "/teams/$teamId/turnover/pass-the-baton"
)({
  component: PassTheBatonPage,
  loader: async ({ params: { teamId } }) => {
    const applications = await getTeamApplications({ data: { teamId } });
    return { applications };
  },
});

const SECTIONS: TurnoverSection[] = ["RFC", "INC", "ALERTS", "MIM", "COMMS", "FYI"];

function PassTheBatonPage() {
  const { teamId } = Route.useParams();
  const { applications } = Route.useLoaderData();
  const [activeAppId, setActiveAppId] = useState<string | null>(
    applications?.[0]?.id || null
  );

  // Fetch all entries for the active application (including recently resolved)
  const { data: allEntriesData } = useQuery({
    queryKey: ["turnover-entries", teamId, activeAppId, "all"],
    queryFn: () =>
      activeAppId
        ? getTurnoverEntries({
          data: { teamId, applicationId: activeAppId, includeRecentlyResolved: true },
        })
        : Promise.resolve({ entries: [], total: 0 }),
    enabled: !!activeAppId,
  });

  const importantEntries =
    allEntriesData?.entries?.filter((e: any) => e.isImportant) || [];

  const activeApp = applications?.find((app: Application) => app.id === activeAppId);

  return (
    <div className="p-8 mx-auto space-y-8">
      {/* Header */}
      {/* <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
            <ArrowRightLeft className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Pass the Baton
            </h1>
            <p className="text-muted-foreground">
              Seamlessly transfer context and critical information between
              shifts.
            </p>
          </div>
        </div>
      </div> */}

      {/* Application Tabs */}
      {applications && applications.length > 0 ? (
        <div>
          <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-2xl border">
            {applications.map((app: Application, index: number) => {
              const isActive = app.id === activeAppId;

              return (
                <button
                  key={app.id}
                  onClick={() => setActiveAppId(app.id)}
                  className={cn(
                    "relative px-5 py-3 rounded-xl font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="text-sm font-bold">{app.applicationName}</div>
                  <div
                    className={cn(
                      "text-xs",
                      isActive
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {app.tla}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        // Empty State - No Applications
        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
          <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Applications Found</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            No applications are configured for this team. Please add
            applications to team to manage turnover entries.
          </p>
          <Link to="/teams/$teamId/settings" params={{ teamId }}>
            <Button size="lg" className="gap-2">
              <Settings2 className="w-5 h-5" />
              Go to Settings to Add Applications
            </Button>
          </Link>
        </div>
      )}

      {/* Critical Items Alert */}
      {/* Critical Items Alert */}
      {importantEntries.length > 0 && (
        <div>
          <div className="rounded-lg border bg-card p-4 shadow-sm border-l-4 border-l-orange-500">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-full shrink-0">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  Critical Turnover Items
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold">
                    {importantEntries.length} items
                  </span>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Action required: These items have been flagged for immediate attention.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Tables */}
      {/* Section Tables */}
      {activeAppId && (
        <div key={activeAppId} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{activeApp?.applicationName}</h2>
              <p className="text-sm text-muted-foreground">
                Manage turnover entries for this application
              </p>
            </div>
            {activeApp?.tier && (
              <Badge variant="outline" className="text-xs">
                Tier {activeApp.tier}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {SECTIONS.map((section, index) => (
              <div key={section}>
                <SectionTable
                  teamId={teamId}
                  applicationId={activeAppId}
                  section={section}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
