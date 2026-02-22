import { AlertTriangle, ChevronDown, Lock } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CURRENT_MONTH, CURRENT_YEAR, MONTHS } from "./constants";
import { EntryRows } from "./entry-rows";
import type {
  Application,
  AvailabilityRecord,
  LeadershipDisplay,
  ScorecardEntry,
  VisibleMonth,
  VolumeRecord,
} from "./types";

interface ApplicationCardProps {
  app: Application;
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
  entries: ScorecardEntry[];
  isExpanded: boolean;
  leadership: LeadershipDisplay[];
  onToggle: () => void;
  selectedYear: number;
  visibleMonths?: VisibleMonth[];
  volumeByEntry: Record<string, Record<string, VolumeRecord>>;
}

export function ApplicationCard({
  app,
  isExpanded,
  onToggle,
  entries,
  availabilityByEntry,
  volumeByEntry,
  selectedYear,
  leadership,
  visibleMonths,
}: ApplicationCardProps) {
  const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    year: selectedYear,
  }));
  const monthsToShow = visibleMonths || ALL_MONTHS;

  // Calculate app-level average availability
  const avgAvailability = useMemo(() => {
    let total = 0;
    let count = 0;

    for (const entry of entries) {
      const entryAvail = availabilityByEntry[entry.id] || {};
      for (const { month, year } of monthsToShow) {
        const av = entryAvail[`${year}-${month}`];
        if (av) {
          total += Number.parseFloat(av.availability);
          count++;
        }
      }
    }

    return count > 0 ? total / count : null;
  }, [entries, availabilityByEntry, monthsToShow]);

  // Calculate app-level total volume
  const totalVolume = useMemo(() => {
    let total = 0;
    let hasData = false;

    for (const entry of entries) {
      const entryVol = volumeByEntry[entry.id] || {};
      for (const { month, year } of monthsToShow) {
        const vol = entryVol[`${year}-${month}`];
        if (vol) {
          total += vol.volume;
          hasData = true;
        }
      }
    }

    return hasData ? total : null;
  }, [entries, volumeByEntry, monthsToShow]);

  // Count breaches
  const breachCount = useMemo(() => {
    let breaches = 0;
    for (const entry of entries) {
      const threshold = Number.parseFloat(entry.availabilityThreshold);
      const entryAvail = availabilityByEntry[entry.id] || {};
      for (const { month, year } of monthsToShow) {
        const av = entryAvail[`${year}-${month}`];
        if (av && Number.parseFloat(av.availability) < threshold) {
          breaches++;
        }
      }
    }
    return breaches;
  }, [entries, availabilityByEntry, monthsToShow]);

  return (
    <Card
      className={cn(
        "group overflow-hidden border-border/50 bg-background/50 transition-all duration-300",
        isExpanded ? "shadow-md ring-1 ring-primary/20" : "hover:bg-muted/30"
      )}
    >
      <button
        className="relative flex w-full cursor-pointer flex-col justify-between px-4 py-2.5 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-primary sm:flex-row sm:items-center"
        onClick={onToggle}
        type="button"
      >
        {/* Identity Layer */}
        <div className="flex min-w-0 items-center gap-4">
          {/* Circled arrow indicator */}
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
              isExpanded
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border/50 bg-muted/30 text-muted-foreground"
            )}
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-300",
                isExpanded ? "rotate-0" : "-rotate-90"
              )}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-bold text-sm tracking-tight transition-colors group-hover:text-primary">
                {app.applicationName}
              </span>
              <Badge
                className="h-5 border-primary/20 bg-background/50 px-2 font-bold text-[10px] text-primary uppercase tracking-widest"
                variant="outline"
              >
                {app.tla}
              </Badge>
              {app.tier && ["0", "1", "2"].includes(String(app.tier)) && (
                <Badge className="h-5 border-red-500/20 bg-red-500/10 px-1.5 font-bold text-[9px] text-red-600 uppercase tracking-widest">
                  T{app.tier}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
              {leadership.slice(0, 2).map((l) => (
                <div
                  className="flex items-center gap-1.5"
                  key={`${l.role}-${l.name}`}
                >
                  <span className="font-bold text-[10px] uppercase tracking-widest opacity-40">
                    {l.role}
                  </span>
                  <span className="font-bold text-[10px] text-foreground/80">
                    {l.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Layer */}
        <div className="mt-3 flex shrink-0 items-center gap-6 sm:mt-0">
          {avgAvailability !== null && (
            <div className="group/stat flex flex-col items-end">
              <span className="mb-1.5 font-bold text-[9px] text-muted-foreground uppercase leading-none tracking-widest opacity-60">
                Availability
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    avgAvailability < 98
                      ? "animate-pulse bg-red-500"
                      : "bg-green-500"
                  )}
                />
                <span
                  className={cn(
                    "font-bold text-base tabular-nums leading-none tracking-tight",
                    avgAvailability < 98 ? "text-red-600" : "text-green-600"
                  )}
                >
                  {avgAvailability.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          {totalVolume !== null && (
            <div className="group/stat flex flex-col items-end">
              <span className="mb-1.5 font-bold text-[9px] text-muted-foreground uppercase leading-none tracking-widest opacity-60">
                Annual Volume
              </span>
              <span className="font-bold text-base text-indigo-600 tabular-nums leading-none tracking-tight">
                {totalVolume > 1_000_000
                  ? `${(totalVolume / 1_000_000).toFixed(1)}M`
                  : totalVolume.toLocaleString()}
              </span>
            </div>
          )}

          {breachCount > 0 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}
        </div>
      </button>

      {/* Expanded Content - Metrics Table */}
      {isExpanded && entries.length > 0 && (
        <div className="overflow-x-auto border-t px-3 pt-2 pb-3">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[160px] font-bold text-xs uppercase">
                  Entry
                </TableHead>
                <TableHead className="w-[50px] font-bold text-xs uppercase">
                  Type
                </TableHead>
                {monthsToShow.map((vm) => {
                  const m = MONTHS[vm.month - 1];
                  const isFuture =
                    vm.year === CURRENT_YEAR && vm.month > CURRENT_MONTH;
                  return (
                    <TableHead
                      className={cn(
                        "w-[55px] text-center font-bold text-xs uppercase",
                        isFuture && "text-muted-foreground/40"
                      )}
                      key={`${vm.year}-${vm.month}`}
                    >
                      <div className="flex flex-col leading-none">
                        <span>{m}</span>
                        {vm.year !== selectedYear && (
                          <span className="mt-0.5 text-[7px] opacity-40">
                            {vm.year}
                          </span>
                        )}
                      </div>
                      {isFuture && <Lock className="ml-0.5 inline h-2 w-2" />}
                    </TableHead>
                  );
                })}
                <TableHead className="w-[60px] bg-muted/30 text-center font-bold text-xs uppercase">
                  Avg
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <EntryRows
                  availability={availabilityByEntry[entry.id] || {}}
                  entry={entry}
                  key={entry.id}
                  selectedYear={selectedYear}
                  visibleMonths={monthsToShow}
                  volume={volumeByEntry[entry.id] || {}}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {isExpanded && entries.length === 0 && (
        <div className="border-t px-3 py-4 text-center text-muted-foreground text-sm">
          No scorecard entries for this application
        </div>
      )}
    </Card>
  );
}
