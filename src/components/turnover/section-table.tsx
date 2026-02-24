import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  FolderOpen,
  HelpCircle,
  Inbox,
  Loader2,
  MessageSquare,
  Plus,
  Star,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { getTurnoverSettings } from "@/app/actions/itsm";
import { getTurnoverEntries } from "@/app/actions/turnover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Application } from "@/db/schema/teams";
import type { TurnoverEntryWithDetails } from "@/db/schema/turnover";
import { turnoverKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { TurnoverSection } from "@/lib/zod/turnover.schema";
import { SECTION_CONFIG } from "@/lib/zod/turnover.schema";
import { EntryCard } from "./entry-card";
import { EntryDialog, type ItsmRecord } from "./entry-dialog";
import { ItsmSelectorDialog } from "./itsm-selector-dialog";

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

interface SectionTableProps {
  applicationId: string;
  groupApplications?: Application[];
  // Group-related props - for showing application selector in entry dialog
  isGrouped?: boolean;
  section: TurnoverSection;
  teamId: string;
}

export function SectionTable({
  teamId,
  applicationId,
  section,
  isGrouped = false,
  groupApplications = [],
}: SectionTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itsmSelectorOpen, setItsmSelectorOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<TurnoverEntryWithDetails | null>(
    null
  );
  const [selectedItsmRecord, setSelectedItsmRecord] =
    useState<ItsmRecord | null>(null);

  const sectionConfig = SECTION_CONFIG[section];
  const SectionIcon = SECTION_ICONS[section];

  // Fetch entries for all applications in the group or just the single app
  const applicationIds =
    isGrouped && groupApplications.length > 0
      ? groupApplications.map((a) => a.id)
      : [applicationId];

  const { data, isLoading, isFetching } = useQuery({
    queryKey: turnoverKeys.entries.section(
      teamId,
      applicationIds,
      section,
      "with-resolved"
    ),
    queryFn: async () => {
      // Fetch entries for all applications
      const entriesPromises = applicationIds.map((appId) =>
        getTurnoverEntries({
          data: {
            teamId,
            applicationId: appId,
            section,
            includeRecentlyResolved: true,
          },
        })
      );
      const results = await Promise.all(entriesPromises);

      // Combine all entries and sort by createdAt
      const allEntries = results.flatMap((r) => r.entries);
      allEntries.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return { entries: allEntries, total: allEntries.length };
    },
    staleTime: 30_000,
  });

  const { data: settings } = useQuery({
    queryKey: ["turnover-settings", teamId],
    queryFn: () => getTurnoverSettings({ data: teamId }),
  });

  const entries = data?.entries || [];
  const importantCount = entries.filter(
    (e: TurnoverEntryWithDetails) => e.isImportant
  ).length;

  const handleEdit = (entry: TurnoverEntryWithDetails) => {
    setEditEntry(entry);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditEntry(null);
    setDialogOpen(true);
  };

  return (
    <>
      <div>
        <Card className="gap-0 overflow-hidden p-0">
          {/* Header */}
          <CardHeader
            className={cn(
              "flex flex-row items-center justify-between py-4",
              sectionConfig.bgClass,
              sectionConfig.borderClass,
              "border-b"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl bg-background shadow-sm"
                )}
              >
                <SectionIcon
                  className={cn("h-5 w-5", sectionConfig.colorClass)}
                />
              </div>
              <div>
                <h3 className="font-bold text-base">{sectionConfig.name}</h3>
                <p className="text-muted-foreground text-xs">
                  {sectionConfig.shortName}
                </p>
              </div>

              {/* Loading spinner */}
              {isFetching && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}

              {/* Entry count badge */}
              {!isLoading && (
                <Badge className="ml-2" variant="secondary">
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </Badge>
              )}

              {/* Important count badge */}
              {importantCount > 0 && (
                <Badge
                  className="gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  variant="secondary"
                >
                  <Star className="h-3 w-3 fill-current" />
                  {importantCount}
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              {(section === "RFC" || section === "INC") &&
                (section === "RFC"
                  ? settings?.rfcImportMode === "REVIEW"
                  : settings?.incImportMode === "REVIEW") && (
                  <Button
                    className="h-9 gap-2 rounded-xl border border-primary/20 bg-background px-4 font-semibold text-primary shadow-sm transition-all duration-300 hover:bg-primary/5 active:scale-95"
                    onClick={() => setItsmSelectorOpen(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Inbox className="h-4 w-4" />
                    ITSM
                  </Button>
                )}
              <Button
                className="h-9 gap-2 rounded-xl border-white/10 border-t bg-gradient-to-br from-primary via-primary to-primary/90 px-4 font-semibold text-primary-foreground shadow-[0_8px_16px_-6px_rgba(59,130,246,0.3)] transition-all duration-300 hover:to-primary hover:shadow-[0_12px_20px_-8px_rgba(59,130,246,0.4)] active:scale-95"
                onClick={handleAdd}
                size="sm"
              >
                <div className="rounded-md bg-white/20 p-0.5 transition-colors group-hover:bg-white/30">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                Add Entry
              </Button>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="p-4">
            {/* Loading State */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div className="space-y-2" key={i}>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && entries.length === 0 && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="mb-1 font-semibold text-lg">No entries yet</h4>
                <p className="mb-4 text-muted-foreground text-sm">
                  Get started by adding a new entry to this section.
                </p>
                <Button
                  className="group h-11 rounded-xl border-2 border-dashed px-8 font-semibold transition-all duration-300 hover:border-solid hover:bg-muted/50"
                  onClick={handleAdd}
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  Add First Entry
                </Button>
              </div>
            )}

            {/* Entries List */}
            {!isLoading && entries.length > 0 && (
              <div className="space-y-3">
                {entries.map((entry: TurnoverEntryWithDetails) => (
                  <div key={entry.id}>
                    <EntryCard
                      entry={entry}
                      groupApplications={groupApplications}
                      onEdit={handleEdit}
                      // Show app badge when grouped to identify which app the entry belongs to
                      showApplicationBadge={isGrouped}
                      teamId={teamId}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Entry Dialog */}
      <EntryDialog
        applicationId={selectedItsmRecord?.applicationId || applicationId}
        editEntry={editEntry}
        groupApplications={groupApplications}
        initialData={selectedItsmRecord || undefined}
        isGrouped={isGrouped}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditEntry(null);
            setSelectedItsmRecord(null);
          }
        }}
        open={dialogOpen}
        // Pass group info for application selector
        section={section}
        teamId={teamId}
      />

      {/* ITSM Selector Dialog */}
      {(section === "RFC" || section === "INC") && (
        <ItsmSelectorDialog
          applications={groupApplications.length > 0 ? groupApplications : []}
          defaultApplicationId={applicationId}
          onOpenChange={setItsmSelectorOpen}
          onSelect={(record) => {
            setSelectedItsmRecord(record);
            setItsmSelectorOpen(false);
            setDialogOpen(true);
          }}
          open={itsmSelectorOpen}
          section={section as "RFC" | "INC"}
          teamId={teamId}
        />
      )}
    </>
  );
}
