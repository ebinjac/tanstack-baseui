"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, AlertTriangle, Lock } from "lucide-react";
import { EntryRows } from "./entry-rows";
import { MONTHS, CURRENT_YEAR, CURRENT_MONTH } from "./constants";
import type {
    Application,
    ScorecardEntry,
    AvailabilityRecord,
    VolumeRecord,
    LeadershipDisplay,
    VisibleMonth,
} from "./types";

interface ApplicationCardProps {
    app: Application;
    isExpanded: boolean;
    onToggle: () => void;
    entries: ScorecardEntry[];
    availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
    volumeByEntry: Record<string, Record<string, VolumeRecord>>;
    selectedYear: number;
    leadership: LeadershipDisplay[];
    visibleMonths?: VisibleMonth[];
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
    const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, year: selectedYear }));
    const monthsToShow = visibleMonths || ALL_MONTHS;

    // Calculate app-level average availability
    const avgAvailability = useMemo(() => {
        let total = 0;
        let count = 0;

        entries.forEach((entry) => {
            const entryAvail = availabilityByEntry[entry.id] || {};
            monthsToShow.forEach(({ month, year }) => {
                const av = entryAvail[`${year}-${month}`];
                if (av) {
                    total += parseFloat(av.availability);
                    count++;
                }
            });
        });

        return count > 0 ? total / count : null;
    }, [entries, availabilityByEntry, monthsToShow]);

    // Calculate app-level total volume
    const totalVolume = useMemo(() => {
        let total = 0;
        let hasData = false;

        entries.forEach((entry) => {
            const entryVol = volumeByEntry[entry.id] || {};
            monthsToShow.forEach(({ month, year }) => {
                const vol = entryVol[`${year}-${month}`];
                if (vol) {
                    total += vol.volume;
                    hasData = true;
                }
            });
        });

        return hasData ? total : null;
    }, [entries, volumeByEntry, monthsToShow]);

    // Count breaches
    const breachCount = useMemo(() => {
        let breaches = 0;
        entries.forEach((entry) => {
            const threshold = parseFloat(entry.availabilityThreshold);
            const entryAvail = availabilityByEntry[entry.id] || {};
            monthsToShow.forEach(({ month, year }) => {
                const av = entryAvail[`${year}-${month}`];
                if (av && parseFloat(av.availability) < threshold) {
                    breaches++;
                }
            });
        });
        return breaches;
    }, [entries, availabilityByEntry, monthsToShow]);

    return (
        <Card className={cn(
            "shadow-sm",
            breachCount > 0 && "border-red-500/30"
        )}>
            <div
                className="flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-2.5 flex-1">
                    {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{app.applicationName}</span>
                            <Badge variant="outline" className="text-[9px] h-4 px-1">{app.tla}</Badge>
                            {app.tier && ['0', '1', '2'].includes(String(app.tier)) && (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-red-500/10 text-red-600">
                                    T{app.tier}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            {leadership.map((l, i) => (
                                <span key={i} className="text-[9px] text-muted-foreground">
                                    <span className="font-medium">{l.role}:</span> {l.name}
                                    {i < leadership.length - 1 && " •"}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6 pr-2">
                    {avgAvailability !== null && (
                        <div className={cn(
                            "text-right min-w-[60px]",
                            avgAvailability < 98 ? "text-red-600" : "text-green-600"
                        )}>
                            <p className="text-sm font-black leading-none tabular-nums tracking-tighter">
                                {avgAvailability.toFixed(1)}%
                            </p>
                            <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Avail</p>
                        </div>
                    )}
                    {totalVolume !== null && (
                        <div className="text-right min-w-[80px] text-blue-600">
                            <p className="text-sm font-black leading-none tabular-nums tracking-tighter">
                                {totalVolume > 1000000 ? `${(totalVolume / 1000000).toFixed(1)}M` : totalVolume.toLocaleString()}
                            </p>
                            <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Volume</p>
                        </div>
                    )}
                    {breachCount > 0 && (
                        <Badge variant="destructive" className="text-[10px] h-5 px-1.5 font-bold">
                            <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                            {breachCount}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Expanded Content - Metrics Table */}
            {isExpanded && entries.length > 0 && (
                <div className="border-t px-3 pb-3 pt-2 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-xs font-bold uppercase w-[160px]">Entry</TableHead>
                                <TableHead className="text-xs font-bold uppercase w-[50px]">Type</TableHead>
                                {monthsToShow.map((vm) => {
                                    const m = MONTHS[vm.month - 1];
                                    const isFuture = vm.year === CURRENT_YEAR && vm.month > CURRENT_MONTH;
                                    return (
                                        <TableHead
                                            key={`${vm.year}-${vm.month}`}
                                            className={cn(
                                                "text-xs font-bold uppercase text-center w-[55px]",
                                                isFuture && "text-muted-foreground/40"
                                            )}
                                        >
                                            <div className="flex flex-col leading-none">
                                                <span>{m}</span>
                                                {vm.year !== selectedYear && <span className="text-[7px] opacity-40 mt-0.5">{vm.year}</span>}
                                            </div>
                                            {isFuture && <Lock className="h-2 w-2 inline ml-0.5" />}
                                        </TableHead>
                                    );
                                })}
                                <TableHead className="text-xs font-bold uppercase text-center w-[60px] bg-muted/30">Avg</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((entry) => (
                                <EntryRows
                                    key={entry.id}
                                    entry={entry}
                                    availability={availabilityByEntry[entry.id] || {}}
                                    volume={volumeByEntry[entry.id] || {}}
                                    selectedYear={selectedYear}
                                    visibleMonths={monthsToShow}
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
