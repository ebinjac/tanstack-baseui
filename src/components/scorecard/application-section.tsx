import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Activity,
    BarChart3,
    Info,
    Hash,
    Lock,
} from "lucide-react";
import type {
    Application,
    ScorecardEntry,
    AvailabilityRecord,
    VolumeRecord,
    MonthInfo,
} from "./types";
import { EntryRows } from "./entry-rows";

interface ApplicationSectionProps {
    app: Application;
    isAdmin: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    entries: ScorecardEntry[];
    availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
    volumeByEntry: Record<string, Record<string, VolumeRecord>>;
    displayMonths: MonthInfo[];
    onAddEntry: () => void;
    onEditEntry: (entry: ScorecardEntry) => void;
    onDeleteEntry: (entry: ScorecardEntry) => void;
    teamId: string;
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

        entries.forEach((entry) => {
            const entryAvailability = availabilityByEntry[entry.id] || {};
            const entryVolume = volumeByEntry[entry.id] || {};

            displayMonths.forEach(({ year, month, isFuture }) => {
                if (isFuture) return;
                const key = `${year}-${month}`;

                if (entryAvailability[key]) {
                    totalAvail += parseFloat(entryAvailability[key].availability);
                    availCount++;
                }

                if (entryVolume[key]) {
                    totalVol += entryVolume[key].volume;
                }
            });
        });

        return {
            avgAvailability: availCount > 0 ? totalAvail / availCount : null,
            totalVolume: totalVol,
        };
    }, [entries, availabilityByEntry, volumeByEntry, displayMonths]);

    // Format volume to show billions, millions, or thousands
    const formatVolume = (value: number): string => {
        if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
        if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
        return value.toLocaleString();
    };

    return (
        <div>
            {/* Header - clickable to expand/collapse */}
            <div
                className="flex items-center justify-between p-4 hover:bg-muted/20 cursor-pointer transition-all group border-l-4 border-l-transparent aria-expanded:border-l-primary"
                onClick={onToggle}
                aria-expanded={isExpanded}
            >
                {/* Left Side: App Identity */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors">
                        {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-primary" />
                        ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                        )}
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">
                                {app.applicationName}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-bold bg-background px-2 h-5 border-muted-foreground/20">
                                {app.tla}
                            </Badge>
                            {app.tier && ["0", "1", "2"].includes(String(app.tier)) && (
                                <Badge
                                    variant="secondary"
                                    className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20 font-bold px-2 h-5"
                                >
                                    T{app.tier}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                                <Hash className="h-3 w-3 opacity-50" />
                                {app.assetId}
                            </span>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-[11px] text-muted-foreground font-medium">
                                {entries.length} tracked {entries.length === 1 ? "entry" : "entries"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Summary Metrics & Actions */}
                <div className="flex items-center gap-10">
                    <div className="hidden xl:flex items-center gap-10 border-r border-muted/50 pr-10">
                        {appStats.avgAvailability !== null && (
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">
                                    Accumulated Availability
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Activity className={cn(
                                        "h-4 w-4",
                                        appStats.avgAvailability < 98 ? "text-red-500" : "text-green-500"
                                    )} />
                                    <span className={cn(
                                        "text-xl font-black tabular-nums tracking-tighter",
                                        appStats.avgAvailability < 98 ? "text-red-600" : "text-green-600"
                                    )}>
                                        {appStats.avgAvailability.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">
                                Total Annual Volume
                            </span>
                            <div className="flex items-center gap-2 mt-1 text-indigo-600">
                                <BarChart3 className="h-4 w-4" />
                                <span className="text-xl font-black tabular-nums tracking-tighter">
                                    {formatVolume(appStats.totalVolume)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 gap-2 shadow-sm border-muted-foreground/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all font-bold px-4"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddEntry();
                                }}
                            >
                                <Plus className="h-4 w-4" />
                                Add Sub-App
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="px-4 pb-4">
                    {entries.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
                            <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No sub-applications tracked yet.</p>
                            {isAdmin && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-3 gap-2"
                                    onClick={onAddEntry}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add First Entry
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[180px] font-bold text-xs uppercase tracking-wider sticky left-0 bg-background z-10">
                                            Entry
                                        </TableHead>
                                        <TableHead className="w-[50px] font-bold text-xs uppercase tracking-wider">
                                            Type
                                        </TableHead>
                                        {displayMonths.map((m) => (
                                            <TableHead
                                                key={`${m.year}-${m.month}`}
                                                className={cn(
                                                    "w-[70px] text-center font-bold text-xs uppercase tracking-wider",
                                                    m.isFuture && "text-muted-foreground/50"
                                                )}
                                            >
                                                {m.label}
                                                {m.isFuture && <Lock className="h-2.5 w-2.5 inline ml-1 opacity-50" />}
                                            </TableHead>
                                        ))}
                                        {/* Avg/Total Column */}
                                        <TableHead className="w-[80px] text-center font-bold text-xs uppercase tracking-wider bg-primary/5">
                                            Avg/Total
                                        </TableHead>
                                        {isAdmin && (
                                            <TableHead className="w-[80px] text-right font-bold text-xs uppercase tracking-wider">
                                                Actions
                                            </TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries.map((entry) => (
                                        <EntryRows
                                            key={entry.id}
                                            entry={entry}
                                            isAdmin={isAdmin}
                                            availability={availabilityByEntry[entry.id] || {}}
                                            volume={volumeByEntry[entry.id] || {}}
                                            displayMonths={displayMonths}
                                            onEdit={() => onEditEntry(entry)}
                                            onDelete={() => onDeleteEntry(entry)}
                                            teamId={teamId}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
