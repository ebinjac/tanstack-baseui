"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";
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
        <div className="group">
            {/* Compact Team Header */}
            <div
                className="flex items-center justify-between py-2 px-3 hover:bg-muted/40 cursor-pointer transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-2 min-w-0">
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-medium text-sm truncate">{team.teamName}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                        {teamStats.apps} apps • {teamStats.entries} entries
                    </span>
                    {teamStats.breaches > 0 && (
                        <Badge variant="destructive" className="h-5 text-[10px] px-1.5 shrink-0">
                            {teamStats.breaches}
                        </Badge>
                    )}
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewFull();
                    }}
                >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                </Button>
            </div>

            {/* Team Content */}
            {isExpanded && (
                <div className="pl-6 pr-3 pb-3 space-y-1.5">
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
