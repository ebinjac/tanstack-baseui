import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  Import,
  Inbox,
  Info,
  Layers,
  RefreshCcw,
  Search,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  bulkImportItsmRecords,
  getReviewQueue,
  getTurnoverSettings,
  processReviewQueueItem,
  syncItsmItems,
} from "@/app/actions/itsm";
import type { ItsmRecord } from "@/components/turnover/entry-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Application } from "@/db/schema/teams";
import { turnoverKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

function formatDate(dateStr: string | undefined) {
  if (!dateStr) {
    return "N/A";
  }
  try {
    const date = new Date(dateStr.replace(" ", "T")); // Handle both ISO and ServiceNow space-separated formats
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (_e) {
    return dateStr;
  }
}

interface ItsmSelectorDialogProps {
  applications: Application[];
  defaultApplicationId?: string;
  onOpenChange: (open: boolean) => void;
  onSelect: (record: ItsmRecord) => void;
  open: boolean;
  section: "RFC" | "INC";
  teamId: string;
}

interface ItsmQueueItemProps {
  applicationName: string;
  isBulkSelected: boolean;
  isSelected: boolean;
  item: ItsmRecord;
  onSelect: (item: ItsmRecord) => void;
  onToggleBulk: (id: string) => void;
}

function ItsmQueueItem({
  item,
  isSelected,
  isBulkSelected,
  onSelect,
  onToggleBulk,
  applicationName,
}: ItsmQueueItemProps) {
  return (
    <div
      className={cn(
        "group relative flex w-full border-b border-l-4 border-l-transparent transition-all hover:bg-muted/50",
        isSelected && "border-l-primary bg-primary/5 shadow-inner",
        isBulkSelected && "bg-primary/5"
      )}
    >
      <button
        aria-label={`Select ${item.externalId}`}
        className="flex items-start px-4 pt-4 pb-4 outline-none focus-visible:bg-muted"
        onClick={() => {
          onToggleBulk(item.id);
        }}
        type="button"
      >
        <div className="pointer-events-none mt-0.5">
          <Checkbox checked={isBulkSelected} tabIndex={-1} />
        </div>
      </button>

      <button
        className="flex min-w-0 flex-1 flex-col gap-0.5 p-4 pl-0 text-left outline-none focus-visible:bg-muted"
        onClick={() => onSelect(item)}
        type="button"
      >
        <div className="flex w-full items-center justify-between gap-2">
          <span className="font-bold font-mono text-primary text-sm group-hover:underline">
            {item.externalId}
          </span>
          <span className="whitespace-nowrap rounded bg-muted px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground uppercase">
            {(item.rawData.incident_state as string) ||
              (item.rawData.state as string) ||
              "Pending"}
          </span>
        </div>
        <p className="line-clamp-2 font-medium text-sm leading-snug">
          {item.rawData.short_description as string}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge
            className="h-4 rounded-sm bg-primary/5 px-1.5 py-0 text-[10px]"
            variant="outline"
          >
            {applicationName}
          </Badge>
          {item.rawData.cmdb_ci && (
            <Badge
              className="h-4 max-w-[140px] truncate rounded-sm border-emerald-500/20 bg-emerald-500/5 px-1.5 py-0 text-[10px] text-emerald-600"
              title={item.rawData.cmdb_ci as string}
              variant="outline"
            >
              {item.rawData.cmdb_ci as string}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground group-hover:text-muted-foreground/80">
            {formatDate(item.rawData.opened_at as string)}
          </span>
        </div>
      </button>
      <ChevronRight className="h-4 w-4 self-center pr-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

interface RecordDetailContentProps {
  applications: Application[];
  fallbackAppId?: string;
  isImporting: boolean;
  onAppOverride: (recordId: string, appId: string) => void;
  onAutoImport: (id: string) => void;
  onReject: (id: string) => void;
  onSelect: (record: ItsmRecord) => void;
  section: "RFC" | "INC";
  selectedRecord: ItsmRecord;
  settings?: { appCmdbCis: { applicationId: string; cmdbCiName: string }[] };
}

function RecordDetailContent({
  selectedRecord,
  applications,
  fallbackAppId,
  section,
  onSelect,
  onReject,
  onAutoImport,
  isImporting,
  settings,
  onAppOverride,
}: RecordDetailContentProps) {
  const rawData = selectedRecord.rawData as Record<string, unknown>;
  const recordCmdbCi = rawData.cmdb_ci as string | undefined;

  const matchedAppId = useMemo(() => {
    if (selectedRecord.applicationId) {
      return selectedRecord.applicationId;
    }
    if (recordCmdbCi && settings?.appCmdbCis) {
      const match = settings.appCmdbCis.find(
        (m) => m.cmdbCiName.toLowerCase() === recordCmdbCi.trim().toLowerCase()
      );
      if (match) {
        return match.applicationId;
      }
    }
    return fallbackAppId;
  }, [selectedRecord, recordCmdbCi, settings, fallbackAppId]);

  const isMatchedViaCmdb =
    !selectedRecord.applicationId &&
    recordCmdbCi &&
    settings?.appCmdbCis?.some(
      (m) => m.cmdbCiName.toLowerCase() === recordCmdbCi.trim().toLowerCase()
    );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge className="font-mono text-xs uppercase" variant="outline">
              {section} Record
            </Badge>
            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
              PENDING REVIEW
            </Badge>
          </div>
          <h2 className="font-bold text-3xl tracking-tight">
            {selectedRecord.externalId}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            className="border-primary/20 bg-background text-primary hover:bg-primary/5"
            onClick={() => onSelect(selectedRecord)}
            size="sm"
            variant="outline"
          >
            <ExternalLink className="mr-2 h-4 w-4" /> Refine & Import
          </Button>
          <Button
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => onReject(selectedRecord.id)}
            size="sm"
            variant="outline"
          >
            <XCircle className="mr-2 h-4 w-4" /> Reject
          </Button>
          <Button
            className="bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50"
            disabled={isImporting || !matchedAppId}
            onClick={() => onAutoImport(selectedRecord.id)}
            size="sm"
          >
            {isImporting ? (
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Import className="mr-2 h-4 w-4" />
            )}
            Auto Import
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <div className="mb-1 block font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Application
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Layers className="h-4 w-4" />
              </div>
              {applications.length > 1 ? (
                <Select
                  onValueChange={(val) => onAppOverride(selectedRecord.id, val)}
                  value={matchedAppId}
                >
                  <SelectTrigger className="h-9 w-[200px] border-none bg-primary/5 px-2 font-semibold text-lg focus:ring-0">
                    <SelectValue>
                      {applications.find((a) => a.id === matchedAppId)
                        ?.applicationName || "Not Assigned"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.applicationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span
                  className={cn(
                    "font-semibold text-lg",
                    !matchedAppId && "text-rose-500",
                    isMatchedViaCmdb && "text-emerald-600"
                  )}
                >
                  {applications.find((a) => a.id === matchedAppId)
                    ?.applicationName || "Not Assigned"}
                </span>
              )}
            </div>
            {!matchedAppId && (
              <p className="mt-1 text-rose-500 text-xs italic">
                Manual refinement required to assign an application.
              </p>
            )}
            {isMatchedViaCmdb && (
              <p className="mt-1 flex items-center gap-1 font-medium text-emerald-600 text-xs uppercase italic tracking-tight">
                <CheckCircle2 className="h-3 w-3" />
                Auto-resolved via CMDB CI mapping
              </p>
            )}
            {!(selectedRecord.applicationId || isMatchedViaCmdb) &&
              fallbackAppId && (
                <p className="mt-1 text-muted-foreground text-xs italic">
                  Will be assigned to the current tab application.
                </p>
              )}
          </div>

          <div>
            <div className="mb-1 block font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Status
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                <Info className="h-4 w-4" />
              </div>
              <span className="font-medium">
                {(rawData.incident_state as string) ||
                  (rawData.state as string) ||
                  "Unknown"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-1 block font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Created Date
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-orange-500/10 p-2 text-orange-600">
                <Clock className="h-4 w-4" />
              </div>
              <span className="font-medium">
                {formatDate(rawData.opened_at as string)}
              </span>
            </div>
          </div>
          {section === "RFC" && (
            <div>
              <div className="mb-1 block font-medium text-muted-foreground text-xs uppercase tracking-wider">
                Risk Level
              </div>
              <Badge className="font-medium" variant="secondary">
                {(rawData.risk as string) || "Standard"}
              </Badge>
            </div>
          )}
          <div>
            <div className="mb-1 block font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Configuration Item
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
                <Layers className="h-4 w-4" />
              </div>
              <span className="font-medium">
                {(rawData.cmdb_ci as string) || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1 block font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Short Description
        </div>
        <p className="font-medium text-lg leading-relaxed">
          {rawData.short_description as string}
        </p>
      </div>

      <div>
        <div className="mb-1 block font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Full Description
        </div>
        <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 font-mono text-sm leading-relaxed">
          {(rawData.description as string) ||
            "No detailed description provided."}
        </div>
      </div>

      <div className="mt-auto">
        <a
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "w-full justify-between"
          )}
          href="https://servicenow.com"
          rel="noreferrer"
          target="_blank"
        >
          <span>View in ServiceNow</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

export function ItsmSelectorDialog({
  open,
  onOpenChange,
  teamId,
  section,
  applications,
  onSelect,
  defaultApplicationId,
}: ItsmSelectorDialogProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ItsmRecord | null>(null);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(
    new Set()
  );
  const [fallbackAppId, setFallbackAppId] = useState<string | undefined>(
    defaultApplicationId
  );
  const [appOverrides, setAppOverrides] = useState<Record<string, string>>({});

  const { data: settings } = useQuery({
    queryKey: ["turnover-settings", teamId],
    queryFn: () => getTurnoverSettings({ data: teamId }),
    enabled: open,
  });

  const { data: queue, isLoading } = useQuery({
    queryKey: ["review-queue", teamId],
    queryFn: () => getReviewQueue({ data: teamId }),
    enabled: open,
  });

  const processMutation = useMutation({
    mutationFn: (vars: { data: { id: string; action: "IMPORT" | "REJECT" } }) =>
      processReviewQueueItem(vars),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["review-queue", teamId] });
      if (variables.data.action === "IMPORT") {
        queryClient.invalidateQueries({
          queryKey: turnoverKeys.entries.all(teamId),
        });
      }
      toast.success(
        variables.data.action === "IMPORT" ? "Item imported" : "Item rejected"
      );
    },
    onError: (error) => {
      console.error("Process error:", error);
      toast.error("Failed to update item");
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: (vars: {
      data: { ids: string[]; fallbackApplicationId?: string };
    }) => bulkImportItsmRecords(vars),
    onSuccess: (result: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["review-queue", teamId] });
      queryClient.invalidateQueries({
        queryKey: turnoverKeys.entries.all(teamId),
      });
      toast.success(result.message || "Records imported successfully");
      setBulkSelectedIds(new Set());
      setSelectedRecord(null);
    },
    onError: (error) => {
      console.error("Import error:", error);
      toast.error("Failed to import records");
    },
  });

  const syncMutation = useMutation({
    mutationFn: (vars: {
      data: { teamId: string; fallbackApplicationId?: string };
    }) => syncItsmItems(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-queue", teamId] });
      queryClient.invalidateQueries({
        queryKey: turnoverKeys.entries.all(teamId),
      });
    },
    onError: (error) => {
      console.error("Sync error:", error);
      toast.error("Background sync failed");
    },
  });

  // Automatically trigger sync when dialog opens
  useEffect(() => {
    if (open) {
      syncMutation.mutate({
        data: { teamId, fallbackApplicationId: defaultApplicationId },
      });
    }
  }, [open, teamId, syncMutation.mutate, defaultApplicationId]);

  const handleReject = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    processMutation.mutate({ data: { id, action: "REJECT" } });
  };

  const handleBulkImport = () => {
    if (bulkSelectedIds.size === 0) {
      return;
    }
    bulkImportMutation.mutate({
      data: {
        ids: Array.from(bulkSelectedIds),
        fallbackApplicationId: fallbackAppId,
      },
    });
  };

  const toggleBulkSelect = (id: string) => {
    const next = new Set(bulkSelectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setBulkSelectedIds(next);
  };

  const itsmQueue = (queue as unknown as ItsmRecord[]) || [];
  const filteredQueue = useMemo(() => {
    let items = itsmQueue.filter((item) => {
      if (item.type !== section) {
        return false;
      }
      if (!searchQuery) {
        return true;
      }
      const search = searchQuery.toLowerCase();
      return (
        item.externalId.toLowerCase().includes(search) ||
        (item.rawData.short_description as string)
          ?.toLowerCase()
          .includes(search) ||
        (item.rawData.description as string)?.toLowerCase().includes(search)
      );
    });

    // Sort: non-Closed incidents at top
    if (section === "INC") {
      items = [...items].sort((a, b) => {
        const stateA = (a.rawData.incident_state as string)?.toLowerCase();
        const stateB = (b.rawData.incident_state as string)?.toLowerCase();

        const isClosedA = stateA === "closed";
        const isClosedB = stateB === "closed";

        if (isClosedA && !isClosedB) {
          return 1;
        }
        if (!isClosedA && isClosedB) {
          return -1;
        }
        return 0;
      });
    }

    return items;
  }, [itsmQueue, section, searchQuery]);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setBulkSelectedIds(new Set(filteredQueue.map((item) => item.id)));
    } else {
      setBulkSelectedIds(new Set());
    }
  };

  // Auto-select first item if none selected
  useMemo(() => {
    if (filteredQueue.length > 0 && !selectedRecord) {
      setSelectedRecord(filteredQueue[0]);
    }
  }, [filteredQueue, selectedRecord]);

  const detailContent = selectedRecord ? (
    <RecordDetailContent
      applications={applications}
      fallbackAppId={fallbackAppId}
      isImporting={bulkImportMutation.isPending}
      onAppOverride={(recordId, appId) => {
        setAppOverrides((prev) => ({ ...prev, [recordId]: appId }));
      }}
      onAutoImport={(id) => {
        const overrideAppId = appOverrides[id];
        bulkImportMutation.mutate({
          data: {
            ids: [id],
            fallbackApplicationId: overrideAppId || fallbackAppId,
          },
        });
      }}
      onReject={handleReject}
      onSelect={onSelect}
      section={section}
      selectedRecord={selectedRecord}
      settings={
        settings as
          | { appCmdbCis: { applicationId: string; cmdbCiName: string }[] }
          | undefined
      }
    />
  ) : (
    <div className="flex h-full flex-col items-center justify-center p-12 text-center opacity-50">
      <div className="mb-4 rounded-full bg-muted p-4">
        <ChevronRight className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-xl">Select a record</h3>
      <p className="mt-1 max-w-[200px] text-muted-foreground text-sm">
        Select a record on the left to see more details and import options
      </p>
    </div>
  );

  let listContent: React.ReactNode;
  if (isLoading) {
    listContent = (
      <div className="space-y-4 p-12">
        {new Array(5).fill(0).map((_, i) => (
          <div
            className="h-20 animate-pulse rounded-xl bg-muted/50"
            key={`skeleton-${i + 1}`}
          />
        ))}
      </div>
    );
  } else if (filteredQueue.length === 0) {
    listContent = (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Search className="h-8 w-8 text-muted-foreground opacity-30" />
        </div>
        <h4 className="font-semibold text-muted-foreground">
          No matches found
        </h4>
        <p className="mt-1 text-muted-foreground/60 text-xs">
          Try adjusting your search query
        </p>
      </div>
    );
  } else {
    listContent = filteredQueue.map((item) => (
      <ItsmQueueItem
        applicationName={
          applications.find((a) => a.id === item.applicationId)?.tla || "APP"
        }
        isBulkSelected={bulkSelectedIds.has(item.id)}
        isSelected={selectedRecord?.id === item.id}
        item={item}
        key={item.id}
        onSelect={setSelectedRecord}
        onToggleBulk={toggleBulkSelect}
      />
    ));
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex h-[90vh] min-w-[95vw] flex-col gap-0 overflow-hidden border-white/20 bg-background/95 p-0 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="border-b bg-muted/20 p-6 pb-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-3 font-bold text-3xl tracking-tight">
                <div className="rounded-xl bg-primary p-2 text-primary-foreground shadow-lg shadow-primary/20">
                  <Inbox className="h-6 w-6" />
                </div>
                ITSM Sync Queue
              </DialogTitle>
              <div className="flex items-center gap-2">
                <DialogDescription className="text-base">
                  Review and import pending {section}s from ServiceNow.
                </DialogDescription>
                {syncMutation.isPending && (
                  <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 text-emerald-600 text-xs">
                    <RefreshCcw className="h-3 w-3 animate-spin" />
                    Syncing...
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {bulkSelectedIds.size > 0 && (
                <div className="mr-2 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5">
                  <span className="font-semibold text-primary text-sm">
                    {bulkSelectedIds.size} items selected
                  </span>
                  <Separator
                    className="h-4 bg-primary/20"
                    orientation="vertical"
                  />
                  <Button
                    className="h-7 px-2 font-bold text-primary text-xs uppercase tracking-tight hover:bg-primary/20"
                    disabled={bulkImportMutation.isPending}
                    onClick={handleBulkImport}
                    size="sm"
                    variant="ghost"
                  >
                    {bulkImportMutation.isPending ? (
                      <RefreshCcw className="mr-1.5 h-3 w-3 animate-spin" />
                    ) : (
                      <Import className="mr-1.5 h-3 w-3" />
                    )}
                    Import Selected
                  </Button>
                </div>
              )}
              <div className="group relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <input
                  className="flex h-10 w-[300px] items-center rounded-xl border border-muted bg-background px-3 pl-9 text-sm transition-all focus:ring-2 focus:ring-primary/20 group-hover:border-muted-foreground/30"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${section}s...`}
                  type="text"
                  value={searchQuery}
                />
              </div>

              {applications.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap font-medium text-muted-foreground text-xs uppercase">
                    Import to:
                  </span>
                  <Select
                    onValueChange={setFallbackAppId}
                    value={fallbackAppId}
                  >
                    <SelectTrigger className="h-10 w-[180px] rounded-xl">
                      <SelectValue placeholder="Select App" />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.applicationName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-full min-h-0 flex-1 divide-x overflow-hidden">
          {/* Left Column: List */}
          <div className="flex h-full min-h-0 w-[400px] flex-col bg-muted/5">
            <div className="flex shrink-0 items-center justify-between border-b p-3 px-4 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={
                    filteredQueue.length > 0 &&
                    bulkSelectedIds.size === filteredQueue.length
                  }
                  onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                />
                <span className="whitespace-nowrap">
                  {filteredQueue.length} Records
                </span>
              </div>
              <Filter className="h-3 w-3" />
            </div>

            <div className="min-h-0 flex-1">
              <ScrollArea className="h-full">
                <div className="flex flex-col divide-y divide-border/50">
                  {listContent}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="relative flex h-full min-h-0 flex-1 flex-col bg-background">
            <ScrollArea className="h-full w-full">{detailContent}</ScrollArea>
            {!selectedRecord && filteredQueue.length > 0 && (
              <div className="absolute inset-0 z-10 grid place-content-center bg-background/50 backdrop-blur-[2px]">
                <Button
                  className="h-12 rounded-full px-6 font-bold shadow-lg"
                  onClick={() => setSelectedRecord(filteredQueue[0])}
                  variant="outline"
                >
                  Select a record to get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
