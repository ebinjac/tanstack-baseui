"use client";

import { ChevronDown, Eye } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApplicationCard } from "./application-card";
import type {
  Application,
  AvailabilityRecord,
  LeadershipDisplay,
  ScorecardEntry,
  Team,
  VisibleMonth,
  VolumeRecord,
} from "./types";

interface TeamSectionProps {
  applications: Application[];
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
  entriesByApp: Record<string, ScorecardEntry[]>;
  expandedApps: Set<string>;
  getLeadershipDisplay: (app: Application) => LeadershipDisplay[];
  isExpanded: boolean;
  onToggle: () => void;
  onToggleApp: (appId: string) => void;
  onViewFull: () => void;
  selectedYear: number;
  team: Team;
  visibleMonths?: VisibleMonth[];
  volumeByEntry: Record<string, Record<string, VolumeRecord>>;
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
  const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    year: selectedYear,
  }));
  const monthsToShow = visibleMonths || ALL_MONTHS;

  // Calculate team-level stats
  const teamStats = useMemo(() => {
    let totalEntries = 0;
    let breaches = 0;

    for (const app of applications) {
      const entries = entriesByApp[app.id] || [];
      totalEntries += entries.length;

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
    }

    return { apps: applications.length, entries: totalEntries, breaches };
  }, [applications, entriesByApp, availabilityByEntry, monthsToShow]);

  return (
    <div>
      {/* Team Header */}
      <button
        className={cn(
          "group flex w-full cursor-pointer items-center justify-between border-transparent border-b px-4 py-2.5 text-left transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-primary",
          isExpanded ? "border-border/50 bg-muted/30" : "hover:bg-muted/40"
        )}
        onClick={onToggle}
        type="button"
      >
        <div className="flex min-w-0 items-center gap-4">
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

          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight transition-colors group-hover:text-primary">
              {team.teamName}
            </span>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="font-bold text-[10px] uppercase tracking-widest opacity-60">
                {teamStats.apps} Applications
              </span>
              <span className="text-muted-foreground/30">•</span>
              <span className="font-bold text-[10px] uppercase tracking-widest opacity-60">
                {teamStats.entries} Metrics
              </span>
              {teamStats.breaches > 0 && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <Badge className="h-4 border-red-500/20 bg-red-500/10 px-1.5 font-bold text-[9px] text-red-600 uppercase tracking-widest">
                    {teamStats.breaches} Breaches
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            className="gap-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onViewFull();
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Eye className="h-4 w-4" />
            View Report
          </Button>
        </div>
      </button>

      {/* Team Content */}
      {isExpanded && (
        <div className="space-y-2 py-2 pr-3 pl-6">
          {applications.map((app) => (
            <ApplicationCard
              app={app}
              availabilityByEntry={availabilityByEntry}
              entries={entriesByApp[app.id] || []}
              isExpanded={expandedApps.has(app.id)}
              key={app.id}
              leadership={getLeadershipDisplay(app)}
              onToggle={() => onToggleApp(app.id)}
              selectedYear={selectedYear}
              visibleMonths={monthsToShow}
              volumeByEntry={volumeByEntry}
            />
          ))}
        </div>
      )}
    </div>
  );
}
