import { Activity, ChevronDown, Hash, Info, Plus } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EntryRows } from "./entry-rows";
import type {
  Application,
  AvailabilityRecord,
  MonthInfo,
  ScorecardEntry,
  VolumeRecord,
} from "./types";

interface ApplicationSectionProps {
  app: Application;
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
  displayMonths: MonthInfo[];
  entries: ScorecardEntry[];
  isAdmin: boolean;
  isExpanded: boolean;
  onAddEntry: () => void;
  onDeleteEntry: (entry: ScorecardEntry) => void;
  onEditEntry: (entry: ScorecardEntry) => void;
  onToggle: () => void;
  teamId: string;
  volumeByEntry: Record<string, Record<string, VolumeRecord>>;
}

export function ApplicationSection({
  app,
  isAdmin,
  isExpanded,
  onToggle,
  entries,
  availabilityByEntry,
  volumeByEntry,
  displayMonths,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  teamId,
}: ApplicationSectionProps) {
  const appStats = useMemo(() => {
    let totalAvail = 0;
    let availCount = 0;
    let totalVol = 0;
    const pastMonths = displayMonths.filter((m) => !m.isFuture);

    for (const entry of entries) {
      const entryAvailability = availabilityByEntry[entry.id] || {};
      const entryVolume = volumeByEntry[entry.id] || {};

      for (const { year, month } of pastMonths) {
        const key = `${year}-${month}`;
        const availRecord = entryAvailability[key];
        const volRecord = entryVolume[key];

        if (availRecord) {
          totalAvail += Number.parseFloat(availRecord.availability);
          availCount++;
        }

        if (volRecord) {
          totalVol += volRecord.volume;
        }
      }
    }

    return {
      avgAvailability: availCount > 0 ? totalAvail / availCount : null,
      totalVolume: totalVol,
    };
  }, [entries, availabilityByEntry, volumeByEntry, displayMonths]);

  // Format volume to show billions, millions, or thousands
  const formatVolume = (value: number): string => {
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B`;
    }
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    }
    if (value >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-500",
        isExpanded ? "bg-muted/5 pb-6" : "bg-transparent"
      )}
    >
      {/* Header - clickable to expand/collapse */}
      <button
        aria-expanded={isExpanded}
        className={cn(
          "group relative flex w-full cursor-pointer flex-col justify-between p-5 text-left transition-all sm:flex-row sm:items-center",
          isExpanded
            ? "border-l-4 border-l-primary bg-primary/[0.02]"
            : "border-l-4 border-l-transparent hover:bg-muted/30"
        )}
        onClick={onToggle}
        type="button"
      >
        {/* Left Side: App Identity */}
        <div className="flex items-center gap-4">
          {/* Circled arrow indicator */}
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
              isExpanded
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border/50 bg-muted/30 text-muted-foreground"
            )}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                isExpanded ? "rotate-0" : "-rotate-90"
              )}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-bold text-xl tracking-tight transition-colors group-hover:text-primary">
                {app.applicationName}
              </span>
              <Badge
                className="h-5 border-primary/20 bg-background/50 px-2 font-bold text-[10px] text-primary uppercase tracking-widest"
                variant="outline"
              >
                {app.tla}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1 rounded bg-muted/50 px-2 py-0.5 font-bold font-mono text-[11px]">
                <Hash className="h-3 w-3 opacity-60" />
                {app.assetId}
              </div>
              <span className="text-muted-foreground/30">•</span>
              <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider opacity-70">
                <Activity className="h-3 w-3" />
                {entries.length}{" "}
                {entries.length === 1 ? "Component" : "Components"}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Summary Metrics & Actions */}
        <div className="mt-4 flex items-center gap-8 sm:mt-0">
          <div className="hidden items-center gap-8 border-border/50 border-r pr-8 lg:flex">
            {appStats.avgAvailability !== null && (
              <div className="group/stat flex flex-col items-end">
                <span className="mb-2 font-bold text-[10px] text-muted-foreground uppercase leading-none tracking-widest">
                  Availability
                </span>
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "h-2 w-2 animate-pulse rounded-full",
                      appStats.avgAvailability < 98
                        ? "bg-red-500"
                        : "bg-green-500"
                    )}
                  />
                  <span
                    className={cn(
                      "font-bold text-2xl tabular-nums leading-none tracking-tighter",
                      appStats.avgAvailability < 98
                        ? "text-red-600"
                        : "text-green-600"
                    )}
                  >
                    {appStats.avgAvailability.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            <div className="group/stat flex flex-col items-end">
              <span className="mb-2 text-right font-bold text-[10px] text-muted-foreground uppercase leading-none tracking-widest">
                Annual Volume
              </span>
              <div className="flex items-center gap-2 text-indigo-600">
                <Hash className="h-3.5 w-3.5" />
                <span className="font-bold text-2xl tabular-nums leading-none tracking-tighter">
                  {formatVolume(appStats.totalVolume)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddEntry();
                }}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
            )}
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-5">
          {entries.length === 0 ? (
            <div className="mx-5 mb-5 rounded-2xl border-2 border-border/50 border-dashed bg-background/50 py-12 text-center text-muted-foreground">
              <Info className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <h4 className="font-bold text-foreground">No Performance Data</h4>
              <p className="mx-auto mt-1 max-w-[200px] text-xs">
                Start tracking metrics by adding components to this application.
              </p>
              {isAdmin && (
                <Button
                  className="mt-5 gap-2"
                  onClick={onAddEntry}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Your First Entry
                </Button>
              )}
            </div>
          ) : (
            <div className="mb-2 overflow-hidden rounded-2xl border border-border/50 bg-background shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border/50 border-b hover:bg-transparent">
                      <TableHead className="sticky left-0 z-10 w-[120px] bg-muted/80 py-2.5 font-bold text-[10px] uppercase tracking-widest backdrop-blur-sm">
                        Component
                      </TableHead>
                      <TableHead className="w-[50px] py-2.5 font-bold text-[10px] uppercase tracking-widest">
                        Type
                      </TableHead>
                      {displayMonths.map((m) => (
                        <TableHead
                          className={cn(
                            "w-[65px] py-2.5 text-center font-bold text-[10px] uppercase tracking-widest",
                            m.isFuture && "text-muted-foreground/30"
                          )}
                          key={`${m.year}-${m.month}`}
                        >
                          {m.label}
                        </TableHead>
                      ))}
                      {/* Avg/Total Column */}
                      <TableHead className="w-[95px] bg-primary/10 py-2.5 text-center font-bold text-[10px] text-primary uppercase tracking-widest">
                        Performance
                      </TableHead>
                      {isAdmin && (
                        <TableHead className="w-[100px] py-2.5 pr-6 text-right font-bold text-[10px] uppercase tracking-widest">
                          Manage
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <EntryRows
                        availability={availabilityByEntry[entry.id] || {}}
                        displayMonths={displayMonths}
                        entry={entry}
                        isAdmin={isAdmin}
                        key={entry.id}
                        onDelete={() => onDeleteEntry(entry)}
                        onEdit={() => onEditEntry(entry)}
                        teamId={teamId}
                        volume={volumeByEntry[entry.id] || {}}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
