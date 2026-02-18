import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
    Pencil,
    Trash2,
} from "lucide-react";
import { upsertAvailability, upsertVolume } from "@/app/actions/scorecard";
import type { ScorecardEntry, AvailabilityRecord, VolumeRecord, MonthInfo } from "./types";
import { DataCell } from "./data-cell";
import { formatVolume, parseVolumeInput } from "./utils";
import { scorecardKeys } from "@/lib/query-keys";

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
            <TableRow className="hover:bg-muted/30 group transition-colors">
                <TableCell rowSpan={2} className="align-top border-r sticky left-0 bg-background/95 backdrop-blur-sm z-10 px-3 py-3 group-hover:bg-muted/20">
                    <div className="flex flex-col gap-1 min-w-[130px]">
                        <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors">{entry.name}</span>
                        <div className="flex items-center gap-1.5 opacity-60">
                            <span className="text-[10px] text-muted-foreground font-mono font-bold">
                                {entry.scorecardIdentifier}
                            </span>
                        </div>
                        <div className="flex gap-1.5 mt-1">
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-muted/30 text-[9px] font-bold uppercase tracking-widest text-muted-foreground" title={`Target: ${availThreshold}%`}>
                                A: {availThreshold}%
                            </div>
                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-muted/30 text-[9px] font-bold uppercase tracking-widest text-muted-foreground" title={`Change Threshold: ${volThreshold}%`}>
                                V: {volThreshold}%
                            </div>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-[10px] font-bold text-green-600 uppercase tracking-widest group-hover:bg-green-500/5 transition-colors border-b-border/30">
                    Avail
                </TableCell>
                {displayMonths.map((monthInfo) => {
                    const key = `${monthInfo.year}-${monthInfo.month}`;
                    const av = availability[key];
                    const value = av?.availability;
                    const isBreach = value !== undefined && parseFloat(value) < availThreshold;

                    return (
                        <TableCell key={key} className="p-1 text-center group-hover:bg-muted/10 transition-colors border-b-border/30">
                            <DataCell
                                value={value ? `${parseFloat(value).toFixed(2)}%` : "—"}
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
                    "p-1 text-center font-bold bg-primary/[0.03] transition-colors border-b-border/30",
                    avgAvailBreach && "bg-red-500/10 text-red-600"
                )}>
                    {avgAvailability !== null ? (
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs tracking-tighter tabular-nums drop-shadow-sm">
                                {avgAvailability.toFixed(2)}%
                            </span>
                            {avgAvailBreach && <div className="h-1 w-4 bg-red-500 rounded-full animate-pulse" />}
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                </TableCell>
                {isAdmin && (
                    <TableCell rowSpan={2} className="align-middle text-right pr-6 group-hover:bg-muted/10">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg transition-all"
                                onClick={onEdit}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-500/60 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all"
                                onClick={onDelete}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </TableCell>
                )}
            </TableRow>

            {/* Volume Row */}
            <TableRow className="hover:bg-muted/30 group border-b-2 border-b-border/30 transition-colors">
                <TableCell className="text-[10px] font-bold text-purple-600 uppercase tracking-widest group-hover:bg-purple-500/5 transition-colors">
                    Vol
                </TableCell>
                {displayMonths.map((monthInfo, index) => {
                    const key = `${monthInfo.year}-${monthInfo.month}`;
                    const vol = volume[key];
                    const value = vol?.volume;
                    const change = getVolumeChange(monthInfo, index);
                    const isBreach = change !== null && Math.abs(change) > volThreshold;

                    return (
                        <TableCell key={key} className="p-1.5 text-center group-hover:bg-muted/10 transition-colors">
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
                <TableCell className="p-1.5 text-center font-bold bg-primary/[0.03] text-indigo-700/80 group-hover:bg-primary/[0.06] transition-colors tabular-nums">
                    {totalVolume !== null ? (
                        <span className="text-xs tracking-tighter">{formatVolume(totalVolume)}</span>
                    ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                </TableCell>
            </TableRow>
        </>
    );
}
