"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, Eye } from "lucide-react";
import { ApplicationCard } from "./application-card";
import type {
    Team,
    Application,
    ScorecardEntry,
    AvailabilityRecord,
    VolumeRecord,
    LeadershipDisplay,
    VisibleMonth,
} from "./types";

interface TeamSectionProps {
    team: Team;
    isExpanded: boolean;
    onToggle: () => void;
    applications: Application[];
    entriesByApp: Record<string, ScorecardEntry[]>;
    availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
    volumeByEntry: Record<string, Record<string, VolumeRecord>>;
    expandedApps: Set<string>;
    onToggleApp: (appId: string) => void;
    selectedYear: number;
    getLeadershipDisplay: (app: Application) => LeadershipDisplay[];
    onViewFull: () => void;
    visibleMonths?: VisibleMonth[];
}

export function TeamSection({
    team,
    isExpanded,
    onToggle,
    applications,
    entriesByApp,
    availabilityByEntry,
    volumeByEntry,
    expandedApps,
    onToggleApp,
    selectedYear,
    getLeadershipDisplay,
    onViewFull,
    visibleMonths,
}: TeamSectionProps) {
    const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, year: selectedYear }));
    const monthsToShow = visibleMonths || ALL_MONTHS;

    // Calculate team-level stats
    const teamStats = useMemo(() => {
        let totalEntries = 0;
        let breaches = 0;

        applications.forEach((app) => {
            const entries = entriesByApp[app.id] || [];
            totalEntries += entries.length;

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
        });

        return { apps: applications.length, entries: totalEntries, breaches };
    }, [applications, entriesByApp, availabilityByEntry, monthsToShow]);

    return (
        <div>
            {/* Team Header */}
            <div
                className={cn(
                    "group flex items-center justify-between py-2.5 px-4 transition-all cursor-pointer border-b border-transparent",
                    isExpanded ? "bg-muted/30 border-border/50" : "hover:bg-muted/40"
                )}
                onClick={onToggle}
            >
                <div className="flex items-center gap-4 min-w-0">
                    {/* Circled arrow indicator */}
                    <div className={cn(
                        "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300",
                        isExpanded
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-muted/30 border-border/50 text-muted-foreground"
                    )}>
                        <ChevronDown className={cn(
                            "h-4 w-4 transition-transform duration-300",
                            isExpanded ? "rotate-0" : "-rotate-90"
                        )} />
                    </div>

                    <div className="flex flex-col">
                        <span className="font-bold text-base tracking-tight group-hover:text-primary transition-colors">
                            {team.teamName}
                        </span>
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                {teamStats.apps} Applications
                            </span>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                {teamStats.entries} Metrics
                            </span>
                            {teamStats.breaches > 0 && (
                                <>
                                    <span className="text-muted-foreground/30">•</span>
                                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[9px] font-bold uppercase tracking-widest h-4 px-1.5">
                                        {teamStats.breaches} Breaches
                                    </Badge>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewFull();
                        }}
                    >
                        <Eye className="h-4 w-4" />
                        View Report
                    </Button>
                </div>
            </div>

            {/* Team Content */}
            {isExpanded && (
                <div className="pl-6 pr-3 py-2 space-y-2">
                    {applications.map((app) => (
                        <ApplicationCard
                            key={app.id}
                            app={app}
                            isExpanded={expandedApps.has(app.id)}
                            onToggle={() => onToggleApp(app.id)}
                            entries={entriesByApp[app.id] || []}
                            availabilityByEntry={availabilityByEntry}
                            volumeByEntry={volumeByEntry}
                            selectedYear={selectedYear}
                            leadership={getLeadershipDisplay(app)}
                            visibleMonths={monthsToShow}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
