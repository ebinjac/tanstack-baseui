import React, { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
    Pencil,
    Trash2,
    AlertTriangle,
} from "lucide-react";
import { upsertAvailability, upsertVolume } from "@/app/actions/scorecard";
import type { ScorecardEntry, AvailabilityRecord, VolumeRecord, MonthInfo } from "./types";
import { DataCell } from "./data-cell";
import { formatVolume, parseVolumeInput } from "./utils";

interface EntryRowsProps {
    entry: ScorecardEntry;
    isAdmin: boolean;
    availability: Record<string, AvailabilityRecord>;
    volume: Record<string, VolumeRecord>;
    displayMonths: MonthInfo[];
    onEdit: () => void;
    onDelete: () => void;
    teamId: string;
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
    const availThreshold = parseFloat(entry.availabilityThreshold);
    const volThreshold = parseFloat(entry.volumeChangeThreshold);

    const availMutation = useMutation({
        mutationFn: upsertAvailability,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["scorecard", teamId],
            });
        },
    });

    const volMutation = useMutation({
        mutationFn: upsertVolume,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["scorecard", teamId],
            });
        },
    });

    // Calculate volume change for each month (compared to previous in display)
    const getVolumeChange = (monthInfo: MonthInfo, index: number): number | null => {
        if (index === 0) return null;
        const prevMonthInfo = displayMonths[index - 1];
        const currentKey = `${monthInfo.year}-${monthInfo.month}`;
        const prevKey = `${prevMonthInfo.year}-${prevMonthInfo.month}`;
        const currentVol = volume[currentKey]?.volume;
        const prevVol = volume[prevKey]?.volume;
        if (currentVol === undefined || prevVol === undefined) return null;
        if (prevVol === 0) return currentVol > 0 ? 100 : 0;
        return ((currentVol - prevVol) / prevVol) * 100;
    };

    // Calculate average availability (only filled, non-future months)
    const avgAvailability = useMemo(() => {
        const values: number[] = [];
        displayMonths.forEach(({ year, month, isFuture }) => {
            if (isFuture) return;
            const key = `${year}-${month}`;
            if (availability[key]) {
                values.push(parseFloat(availability[key].availability));
            }
        });
        if (values.length === 0) return null;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }, [availability, displayMonths]);

    // Calculate total volume (only filled, non-future months)
    const totalVolume = useMemo(() => {
        let total = 0;
        let hasData = false;
        displayMonths.forEach(({ year, month, isFuture }) => {
            if (isFuture) return;
            const key = `${year}-${month}`;
            if (volume[key]) {
                total += volume[key].volume;
                hasData = true;
            }
        });
        return hasData ? total : null;
    }, [volume, displayMonths]);

    const avgAvailBreach = avgAvailability !== null && avgAvailability < availThreshold;

    return (
        <>
            {/* Availability Row */}
            <TableRow className="hover:bg-muted/20">
                <TableCell rowSpan={2} className="align-top border-r sticky left-0 bg-background z-10">
                    <div className="flex flex-col">
                        <span className="font-semibold text-sm">{entry.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                            {entry.scorecardIdentifier}
                        </span>
                        <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0" title={`Availability Threshold: ${availThreshold}%`}>
                                A: {availThreshold}%
                            </Badge>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0" title={`Volume Change Threshold: ${volThreshold}%`}>
                                V: {volThreshold}%
                            </Badge>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-[10px] font-bold text-green-600 uppercase">
                    Avail
                </TableCell>
                {displayMonths.map((monthInfo) => {
                    const key = `${monthInfo.year}-${monthInfo.month}`;
                    const av = availability[key];
                    const value = av?.availability;
                    const isBreach = value !== undefined && parseFloat(value) < availThreshold;

                    return (
                        <TableCell key={key} className="p-1 text-center">
                            <DataCell
                                value={value ? `${parseFloat(value).toFixed(1)}%` : "—"}
                                isBreach={isBreach}
                                reason={av?.reason || undefined}
                                editable={isAdmin && !monthInfo.isFuture}
                                disabled={monthInfo.isFuture}
                                onSave={(newValue, reason) => {
                                    const numValue = parseFloat(newValue.replace("%", ""));
                                    if (isNaN(numValue)) return;
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
                                threshold={availThreshold}
                                type="availability"
                            />
                        </TableCell>
                    );
                })}
                {/* Avg Cell */}
                <TableCell className={cn(
                    "p-1 text-center font-semibold bg-primary/5",
                    avgAvailBreach && "bg-red-500/10 text-red-600"
                )}>
                    {avgAvailability !== null ? (
                        <span className="text-xs">
                            {avgAvailability.toFixed(1)}%
                            {avgAvailBreach && <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />}
                        </span>
                    ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                    )}
                </TableCell>
                {isAdmin && (
                    <TableCell rowSpan={2} className="align-middle text-right">
                        <div className="flex justify-end gap-1">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={onEdit}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-500 hover:text-red-600"
                                onClick={onDelete}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </TableCell>
                )}
            </TableRow>

            {/* Volume Row */}
            <TableRow className="hover:bg-muted/20 border-b-2">
                <TableCell className="text-[10px] font-bold text-purple-600 uppercase">
                    Vol
                </TableCell>
                {displayMonths.map((monthInfo, index) => {
                    const key = `${monthInfo.year}-${monthInfo.month}`;
                    const vol = volume[key];
                    const value = vol?.volume;
                    const change = getVolumeChange(monthInfo, index);
                    const isBreach = change !== null && Math.abs(change) > volThreshold;

                    return (
                        <TableCell key={key} className="p-1 text-center">
                            <DataCell
                                value={value !== undefined ? formatVolume(value) : "—"}
                                isBreach={isBreach}
                                reason={vol?.reason || undefined}
                                editable={isAdmin && !monthInfo.isFuture}
                                disabled={monthInfo.isFuture}
                                onSave={(newValue, reason) => {
                                    const numValue = parseVolumeInput(newValue);
                                    if (numValue === null) return;
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
                                threshold={volThreshold}
                                type="volume"
                                changeValue={change}
                            />
                        </TableCell>
                    );
                })}
                {/* Total Cell */}
                <TableCell className="p-1 text-center font-semibold bg-primary/5">
                    {totalVolume !== null ? (
                        <span className="text-xs">{formatVolume(totalVolume)}</span>
                    ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                    )}
                </TableCell>
            </TableRow>
        </>
    );
}
