import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { upsertAvailability, upsertVolume } from "@/app/actions/scorecard";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { scorecardKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { DataCell } from "./data-cell";
import type {
  AvailabilityRecord,
  MonthInfo,
  ScorecardEntry,
  VolumeRecord,
} from "./types";
import { formatVolume, parseVolumeInput } from "./utils";

interface EntryRowsProps {
  availability: Record<string, AvailabilityRecord>;
  displayMonths: MonthInfo[];
  entry: ScorecardEntry;
  isAdmin: boolean;
  onDelete: () => void;
  onEdit: () => void;
  teamId: string;
  volume: Record<string, VolumeRecord>;
}

export function EntryRows({
  entry,
  isAdmin,
  availability,
  volume,
  displayMonths,
  onEdit,
  onDelete,
  teamId,
}: EntryRowsProps) {
  const queryClient = useQueryClient();
  const availThreshold = Number.parseFloat(entry.availabilityThreshold);
  const volThreshold = Number.parseFloat(entry.volumeChangeThreshold);

  const availMutation = useMutation({
    mutationFn: upsertAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: scorecardKeys.team(teamId),
      });
    },
  });

  const volMutation = useMutation({
    mutationFn: upsertVolume,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: scorecardKeys.team(teamId),
      });
    },
  });

  // Calculate volume change for each month (compared to previous in display)
  const getVolumeChange = (
    monthInfo: MonthInfo,
    index: number
  ): number | null => {
    if (index === 0) {
      return null;
    }
    const prevMonthInfo = displayMonths[index - 1];
    const currentKey = `${monthInfo.year}-${monthInfo.month}`;
    const prevKey = `${prevMonthInfo.year}-${prevMonthInfo.month}`;
    const currentVol = volume[currentKey]?.volume;
    const prevVol = volume[prevKey]?.volume;
    if (currentVol === undefined || prevVol === undefined) {
      return null;
    }
    if (prevVol === 0) {
      return currentVol > 0 ? 100 : 0;
    }
    return ((currentVol - prevVol) / prevVol) * 100;
  };

  // Calculate average availability (only filled, non-future months)
  const avgAvailability = useMemo(() => {
    const values: number[] = [];
    for (const { year, month, isFuture } of displayMonths) {
      if (isFuture) {
        continue;
      }
      const key = `${year}-${month}`;
      if (availability[key]) {
        values.push(Number.parseFloat(availability[key].availability));
      }
    }
    if (values.length === 0) {
      return null;
    }
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [availability, displayMonths]);

  // Calculate total volume (only filled, non-future months)
  const totalVolume = useMemo(() => {
    let total = 0;
    let hasData = false;
    for (const { year, month, isFuture } of displayMonths) {
      if (isFuture) {
        continue;
      }
      const key = `${year}-${month}`;
      if (volume[key]) {
        total += volume[key].volume;
        hasData = true;
      }
    }
    return hasData ? total : null;
  }, [volume, displayMonths]);

  const avgAvailBreach =
    avgAvailability !== null && avgAvailability < availThreshold;

  return (
    <>
      <TableRow className="group transition-colors hover:bg-muted/30">
        <TableCell
          className="sticky left-0 z-10 border-r bg-background/95 px-3 py-3 align-top backdrop-blur-sm group-hover:bg-muted/20"
          rowSpan={2}
        >
          <div className="flex min-w-[130px] flex-col gap-1">
            <span className="font-bold text-foreground text-sm tracking-tight transition-colors group-hover:text-primary">
              {entry.name}
            </span>
            <div className="flex items-center gap-1.5 opacity-60">
              <span className="font-bold font-mono text-[10px] text-muted-foreground">
                {entry.scorecardIdentifier}
              </span>
            </div>
            <div className="mt-1 flex gap-1.5">
              <div
                className="flex items-center gap-1 rounded border border-border bg-muted/30 px-1.5 py-0.5 font-bold text-[9px] text-muted-foreground uppercase tracking-widest"
                title={`Target: ${availThreshold}%`}
              >
                A: {availThreshold}%
              </div>
              <div
                className="flex items-center gap-1 rounded border border-border bg-muted/30 px-1.5 py-0.5 font-bold text-[9px] text-muted-foreground uppercase tracking-widest"
                title={`Change Threshold: ${volThreshold}%`}
              >
                V: {volThreshold}%
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="border-b-border/30 font-bold text-[10px] text-green-600 uppercase tracking-widest transition-colors group-hover:bg-green-500/5">
          Avail
        </TableCell>
        {displayMonths.map((monthInfo) => {
          const key = `${monthInfo.year}-${monthInfo.month}`;
          const av = availability[key];
          const value = av?.availability;
          const isBreach =
            value !== undefined && Number.parseFloat(value) < availThreshold;

          return (
            <TableCell
              className="border-b-border/30 p-1 text-center transition-colors group-hover:bg-muted/10"
              key={key}
            >
              <DataCell
                disabled={monthInfo.isFuture}
                editable={isAdmin && !monthInfo.isFuture}
                isBreach={isBreach}
                onSave={(newValue, reason) => {
                  const numValue = Number.parseFloat(newValue.replace("%", ""));
                  if (Number.isNaN(numValue)) {
                    return;
                  }
                  availMutation.mutate({
                    data: {
                      scorecardEntryId: entry.id,
                      year: monthInfo.year,
                      month: monthInfo.month,
                      availability: numValue,
                      reason: reason || null,
                    },
                  });
                }}
                reason={av?.reason || undefined}
                threshold={availThreshold}
                type="availability"
                value={value ? `${Number.parseFloat(value).toFixed(2)}%` : "—"}
              />
            </TableCell>
          );
        })}
        {/* Avg Cell */}
        <TableCell
          className={cn(
            "border-b-border/30 bg-primary/[0.03] p-1 text-center font-bold transition-colors",
            avgAvailBreach && "bg-red-500/10 text-red-600"
          )}
        >
          {avgAvailability !== null ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs tabular-nums tracking-tighter drop-shadow-sm">
                {avgAvailability.toFixed(2)}%
              </span>
              {avgAvailBreach && (
                <div className="h-1 w-4 animate-pulse rounded-full bg-red-500" />
              )}
            </div>
          ) : (
            <span className="text-muted-foreground/40 text-xs">—</span>
          )}
        </TableCell>
        {isAdmin && (
          <TableCell
            className="pr-6 text-right align-middle group-hover:bg-muted/10"
            rowSpan={2}
          >
            <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                className="h-8 w-8 rounded-lg transition-all hover:bg-primary/10 hover:text-primary"
                onClick={onEdit}
                size="icon"
                variant="ghost"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                className="h-8 w-8 rounded-lg text-red-500/60 transition-all hover:bg-red-500/10 hover:text-red-600"
                onClick={onDelete}
                size="icon"
                variant="ghost"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        )}
      </TableRow>

      {/* Volume Row */}
      <TableRow className="group border-b-2 border-b-border/30 transition-colors hover:bg-muted/30">
        <TableCell className="font-bold text-[10px] text-purple-600 uppercase tracking-widest transition-colors group-hover:bg-purple-500/5">
          Vol
        </TableCell>
        {displayMonths.map((monthInfo, index) => {
          const key = `${monthInfo.year}-${monthInfo.month}`;
          const vol = volume[key];
          const value = vol?.volume;
          const change = getVolumeChange(monthInfo, index);
          const isBreach = change !== null && Math.abs(change) > volThreshold;

          return (
            <TableCell
              className="p-1.5 text-center transition-colors group-hover:bg-muted/10"
              key={key}
            >
              <DataCell
                changeValue={change}
                disabled={monthInfo.isFuture}
                editable={isAdmin && !monthInfo.isFuture}
                isBreach={isBreach}
                onSave={(newValue, reason) => {
                  const numValue = parseVolumeInput(newValue);
                  if (numValue === null) {
                    return;
                  }
                  volMutation.mutate({
                    data: {
                      scorecardEntryId: entry.id,
                      year: monthInfo.year,
                      month: monthInfo.month,
                      volume: numValue,
                      reason: reason || null,
                    },
                  });
                }}
                reason={vol?.reason || undefined}
                threshold={volThreshold}
                type="volume"
                value={value !== undefined ? formatVolume(value) : "—"}
              />
            </TableCell>
          );
        })}
        {/* Total Cell */}
        <TableCell className="bg-primary/[0.03] p-1.5 text-center font-bold text-indigo-700/80 tabular-nums transition-colors group-hover:bg-primary/[0.06]">
          {totalVolume !== null ? (
            <span className="text-xs tracking-tighter">
              {formatVolume(totalVolume)}
            </span>
          ) : (
            <span className="text-muted-foreground/40 text-xs">—</span>
          )}
        </TableCell>
      </TableRow>
    </>
  );
}
