"use client";

import { useMemo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { CURRENT_MONTH, CURRENT_YEAR } from "./constants";
import type {
  AvailabilityRecord,
  ScorecardEntry,
  VisibleMonth,
  VolumeRecord,
} from "./types";

interface EntryRowsProps {
  availability: Record<string, AvailabilityRecord>;
  entry: ScorecardEntry;
  selectedYear: number;
  visibleMonths?: VisibleMonth[];
  volume: Record<string, VolumeRecord>;
}

export function formatVolume(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  return String(value);
}

export function EntryRows({
  entry,
  availability,
  volume,
  selectedYear,
  visibleMonths,
}: EntryRowsProps) {
  const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    year: selectedYear,
  }));
  const monthsToShow = visibleMonths || ALL_MONTHS;
  const availThreshold = Number.parseFloat(entry.availabilityThreshold);

  // Calculate average availability
  const avgAvail = useMemo(() => {
    const values: number[] = [];
    for (const { month, year } of monthsToShow) {
      const isFuture = year === CURRENT_YEAR && month > CURRENT_MONTH;
      const key = `${year}-${month}`;
      if (!isFuture && availability[key]) {
        values.push(Number.parseFloat(availability[key].availability));
      }
    }
    return values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null;
  }, [availability, monthsToShow]);

  // Calculate total volume
  const totalVol = useMemo(() => {
    let total = 0;
    let hasData = false;
    for (const { month, year } of monthsToShow) {
      const isFuture = year === CURRENT_YEAR && month > CURRENT_MONTH;
      const key = `${year}-${month}`;
      if (!isFuture && volume[key]) {
        total += volume[key].volume;
        hasData = true;
      }
    }
    return hasData ? total : null;
  }, [volume, monthsToShow]);

  const avgBreach = avgAvail !== null && avgAvail < availThreshold;

  return (
    <>
      {/* Availability Row */}
      <TableRow className="hover:bg-muted/10">
        <TableCell className="border-r py-1 align-top" rowSpan={2}>
          <div className="font-medium text-xs">{entry.name}</div>
          <div className="font-mono text-[10px] text-muted-foreground">
            {entry.scorecardIdentifier}
          </div>
        </TableCell>
        <TableCell className="py-1 font-bold text-[10px] text-green-600">
          A%
        </TableCell>
        {monthsToShow.map((vm) => {
          const key = `${vm.year}-${vm.month}`;
          const av = availability[key];
          const isFuture = vm.year === CURRENT_YEAR && vm.month > CURRENT_MONTH;
          const value = av?.availability;
          const isBreach =
            value !== undefined && Number.parseFloat(value) < availThreshold;

          return (
            <TableCell
              className={cn(
                "py-1 text-center text-xs",
                isFuture && "text-muted-foreground/30",
                isBreach && "bg-red-500/5 font-semibold text-red-600"
              )}
              key={key}
            >
              {(() => {
                if (isFuture) {
                  return "—";
                }
                return value ? Number.parseFloat(value).toFixed(2) : "—";
              })()}
            </TableCell>
          );
        })}
        <TableCell
          className={cn(
            "bg-muted/30 py-1 text-center font-semibold text-xs",
            avgBreach && "text-red-600"
          )}
        >
          {avgAvail !== null ? avgAvail.toFixed(2) : "—"}
        </TableCell>
      </TableRow>
      {/* Volume Row */}
      <TableRow className="border-b hover:bg-muted/10">
        <TableCell className="py-1 font-bold text-[10px] text-purple-600">
          Vol
        </TableCell>
        {monthsToShow.map((vm) => {
          const key = `${vm.year}-${vm.month}`;
          const vol = volume[key];
          const isFuture = vm.year === CURRENT_YEAR && vm.month > CURRENT_MONTH;

          return (
            <TableCell
              className={cn(
                "py-1 text-center text-xs",
                isFuture && "text-muted-foreground/30"
              )}
              key={key}
            >
              {(() => {
                if (isFuture) {
                  return "—";
                }
                return vol ? formatVolume(vol.volume) : "—";
              })()}
            </TableCell>
          );
        })}
        <TableCell className="bg-muted/30 py-1 text-center font-semibold text-xs">
          {totalVol !== null ? formatVolume(totalVol) : "—"}
        </TableCell>
      </TableRow>
    </>
  );
}
