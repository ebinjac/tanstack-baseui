"use client";

import { ArrowDown, ArrowUp, ChevronDown, Eye } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AvailabilitySparkline } from "./availability-sparkline";
import { CURRENT_MONTH, CURRENT_YEAR, MONTHS } from "./constants";
import { formatVolume } from "./entry-rows";
import type {
  Application,
  AvailabilityRecord,
  LeadershipDisplay,
  ScorecardEntry,
  Team,
  VolumeRecord,
} from "./types";

interface TeamSectionProps {
  applications: Application[];
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
  entriesByApp: Record<string, ScorecardEntry[]>;
  expandedApps: Set<string>;
  getLeadershipDisplay: (app: Application) => LeadershipDisplay[];
  onToggleApp: (appId: string) => void;
  onViewFull: () => void;
  selectedYear: number;
  team: Team;
  volumeByEntry: Record<string, Record<string, VolumeRecord>>;
}

export function TeamSection({
  team,
  applications,
  entriesByApp,
  availabilityByEntry,
  volumeByEntry,
  selectedYear,
  getLeadershipDisplay,
  expandedApps = new Set(),
  onToggleApp,
  onViewFull,
}: TeamSectionProps) {
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
        for (const av of Object.values(entryAvail)) {
          if (Number.parseFloat(av.availability) < threshold) {
            breaches++;
          }
        }
      }
    }

    return { apps: applications.length, entries: totalEntries, breaches };
  }, [applications, entriesByApp, availabilityByEntry]);

  return (
    <TooltipProvider delay={100}>
      <div className="space-y-4">
        {/* Team Header */}
        <div className="group flex items-center justify-between border-transparent bg-transparent px-4 py-3 transition-colors hover:bg-muted/10">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex flex-col">
              <span className="font-bold text-base text-foreground tracking-tight">
                {team.teamName}
              </span>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="font-bold text-[10px] uppercase tracking-widest opacity-60">
                  {teamStats.apps} Apps
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

            <AvailabilitySparkline
              availabilityByEntry={availabilityByEntry}
              className="hidden opacity-60 md:block"
              entries={applications.flatMap((a) => entriesByApp[a.id] || [])}
              height={28}
              selectedYear={selectedYear}
              width={80}
            />
          </div>

          <Button
            className="gap-2"
            onClick={onViewFull}
            size="sm"
            variant="ghost"
          >
            <Eye className="h-4 w-4" />
            View Report
          </Button>
        </div>

        {/* Applications — always visible, flat rows */}
        <div className="divide-y divide-border/30">
          {applications.map((app) => (
            <AppRow
              app={app}
              availabilityByEntry={availabilityByEntry}
              entries={entriesByApp[app.id] || []}
              isExpanded={expandedApps.has(app.id)}
              key={app.id}
              leadership={getLeadershipDisplay(app)}
              onToggle={() => onToggleApp(app.id)}
              selectedYear={selectedYear}
              volumeByEntry={volumeByEntry}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Compact App Row ─────────────────────────────────────────────────

interface AppRowProps {
  app: Application;
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
  entries: ScorecardEntry[];
  isExpanded: boolean;
  leadership: LeadershipDisplay[];
  onToggle: () => void;
  selectedYear: number;
  volumeByEntry: Record<string, Record<string, VolumeRecord>>;
}

interface MonthMetrics {
  availability: number | null;
  prevAvailability: number | null;
  prevVolume: number;
  reasons: string[];
  threshold: number;
  volThreshold: number;
  volume: number;
}

function computeMonthlyMetrics(
  entries: ScorecardEntry[],
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>,
  volumeByEntry: Record<string, Record<string, VolumeRecord>>,
  selectedYear: number
): MonthMetrics[] {
  const isCurrentYear = selectedYear === CURRENT_YEAR;

  return MONTHS.map((_, i) => {
    const monthNum = i + 1;
    const isFuture = isCurrentYear && monthNum > CURRENT_MONTH;
    if (isFuture) {
      return {
        availability: null,
        prevAvailability: null,
        volume: 0,
        prevVolume: 0,
        reasons: [],
        threshold: 99.5,
        volThreshold: 10,
      };
    }

    const key = `${selectedYear}-${monthNum}`;
    const prevKey =
      monthNum === 1
        ? `${selectedYear - 1}-12`
        : `${selectedYear}-${monthNum - 1}`;

    let totalAvail = 0;
    let availCount = 0;
    let totalVol = 0;
    let totalPrevAvail = 0;
    let prevAvailCount = 0;
    let totalPrevVol = 0;
    let totalThreshold = 0;
    let totalVolThreshold = 0;
    let entryCount = 0;
    const reasons: string[] = [];

    for (const entry of entries) {
      totalThreshold += Number.parseFloat(entry.availabilityThreshold);
      totalVolThreshold += Number.parseFloat(entry.volumeChangeThreshold);
      entryCount++;

      const av = availabilityByEntry[entry.id]?.[key];
      if (av) {
        totalAvail += Number.parseFloat(av.availability);
        availCount++;
        if (av.reason) {
          reasons.push(av.reason);
        }
      }
      const prevAv = availabilityByEntry[entry.id]?.[prevKey];
      if (prevAv) {
        totalPrevAvail += Number.parseFloat(prevAv.availability);
        prevAvailCount++;
      }
      const vol = volumeByEntry[entry.id]?.[key];
      if (vol) {
        totalVol += vol.volume;
      }
      const prevVol = volumeByEntry[entry.id]?.[prevKey];
      if (prevVol) {
        totalPrevVol += prevVol.volume;
      }
    }

    return {
      availability: availCount > 0 ? totalAvail / availCount : null,
      prevAvailability:
        prevAvailCount > 0 ? totalPrevAvail / prevAvailCount : null,
      volume: totalVol,
      prevVolume: totalPrevVol,
      reasons,
      threshold: entryCount > 0 ? totalThreshold / entryCount : 99.5,
      volThreshold: entryCount > 0 ? totalVolThreshold / entryCount : 10,
    };
  });
}

function AppRow({
  app,
  entries,
  availabilityByEntry,
  volumeByEntry,
  selectedYear,
  leadership,
  isExpanded,
  onToggle,
}: AppRowProps) {
  const monthlyMetrics = useMemo(
    () =>
      computeMonthlyMetrics(
        entries,
        availabilityByEntry,
        volumeByEntry,
        selectedYear
      ),
    [entries, availabilityByEntry, volumeByEntry, selectedYear]
  );

  const validMonths = monthlyMetrics.filter((m) => m.availability !== null);
  const avgAvailability =
    validMonths.length > 0
      ? validMonths.reduce((s, m) => s + (m.availability ?? 0), 0) /
        validMonths.length
      : null;
  const totalVolume = monthlyMetrics.reduce((s, m) => s + m.volume, 0);

  const appThreshold =
    entries.length > 0
      ? entries.reduce(
          (s, e) => s + Number.parseFloat(e.availabilityThreshold),
          0
        ) / entries.length
      : 99.5;

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300",
        isExpanded ? "bg-muted/5 pb-4" : "bg-transparent"
      )}
    >
      <button
        aria-expanded={isExpanded}
        className={cn(
          "group flex w-full cursor-pointer items-center justify-between px-4 py-3 pl-8 text-left transition-colors",
          isExpanded ? "bg-primary/[0.02] pl-8" : "hover:bg-muted/10"
        )}
        onClick={onToggle}
        type="button"
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
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
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="truncate font-bold text-base tracking-tight transition-colors group-hover:text-primary">
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
            <span className="text-muted-foreground/30">•</span>
            {leadership.slice(0, 2).map((l) => (
              <span
                className="text-[10px] text-muted-foreground"
                key={`${l.role}-${l.name}`}
              >
                <span className="font-bold uppercase tracking-widest opacity-40">
                  {l.role}
                </span>{" "}
                <span className="font-bold text-foreground/70">{l.name}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-6 sm:flex">
          <AvailabilitySparkline
            availabilityByEntry={availabilityByEntry}
            className="hidden opacity-50 md:block"
            entries={entries}
            height={20}
            selectedYear={selectedYear}
            width={50}
          />
          {avgAvailability !== null && (
            <div className="flex flex-col items-end">
              <span className="font-bold text-[9px] text-muted-foreground uppercase tracking-widest opacity-60">
                Avg Avail
              </span>
              <span
                className={cn(
                  "font-bold text-foreground/80 text-xl tabular-nums leading-none"
                )}
              >
                {avgAvailability.toFixed(2)}%
                {avgAvailability < appThreshold && (
                  <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-rose-500" />
                )}
              </span>
            </div>
          )}
          {totalVolume > 0 && (
            <div className="flex flex-col items-end">
              <span className="font-bold text-[9px] text-muted-foreground uppercase tracking-widest opacity-60">
                Total Volume
              </span>
              <span className="font-bold text-indigo-600 text-xl tabular-nums leading-none">
                {formatVolume(totalVolume)}
              </span>
            </div>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pt-2 pb-4 pl-16">
          <div className="overflow-hidden bg-transparent">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-center">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="w-[120px] px-3 py-2 text-left font-bold text-[10px] uppercase tracking-widest">
                      Type{" "}
                      <span className="ml-1 text-[8px] italic opacity-40">
                        (SLA: {appThreshold.toFixed(2)}%)
                      </span>
                    </th>
                    {MONTHS.map((m) => (
                      <th
                        className="w-[60px] px-1 py-2 font-bold text-[10px] text-muted-foreground uppercase tracking-widest"
                        key={m}
                      >
                        {m}
                      </th>
                    ))}
                    <th className="w-[80px] bg-primary/10 px-3 py-2 font-bold text-[10px] text-primary uppercase tracking-widest">
                      Annual
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-border/50 border-b last:border-b-0 hover:bg-transparent">
                    <td className="px-3 py-2 text-left font-bold text-[12px] text-green-700 uppercase tracking-widest dark:text-green-400">
                      AVAIL
                    </td>
                    {monthlyMetrics.map((m, i) => (
                      <td className="px-0.5 py-2" key={MONTHS[i]}>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex cursor-default flex-col items-center">
                              {m.availability !== null ? (
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-1">
                                    <span className="font-bold text-[13px] text-foreground/80 tabular-nums">
                                      {m.availability.toFixed(1)}%
                                    </span>
                                    {m.prevAvailability !== null &&
                                      m.availability !== m.prevAvailability && (
                                        <span className="scale-75 opacity-70">
                                          {m.availability >
                                          m.prevAvailability ? (
                                            <ArrowUp className="h-2.5 w-2.5 text-emerald-500" />
                                          ) : (
                                            <ArrowDown className="h-2.5 w-2.5 text-rose-500" />
                                          )}
                                        </span>
                                      )}
                                  </div>
                                  {m.availability < m.threshold && (
                                    <div className="mt-0.5 h-1 w-1 rounded-full bg-rose-500" />
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/30">
                                  —
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          {m.availability !== null && (
                            <TooltipContent className="rounded-xl border-border/50 bg-background/80 px-4 py-2.5 shadow-xl backdrop-blur-md">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={cn(
                                      "h-2 w-2 rounded-full",
                                      m.availability < 99
                                        ? "bg-red-500"
                                        : "bg-emerald-500"
                                    )}
                                  />
                                  <span className="font-bold text-[12px] text-foreground tracking-tight">
                                    {MONTHS[i]} {selectedYear}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                  <span className="text-[11px] text-muted-foreground">
                                    Precision Avail
                                  </span>
                                  <span className="font-black text-[11px] text-foreground tabular-nums">
                                    {m.availability.toFixed(4)}%
                                  </span>
                                </div>
                                {m.reasons.length > 0 && (
                                  <div className="border-border/30 border-t pt-1.5">
                                    <span className="font-bold text-[9px] text-red-500 uppercase tracking-wider">
                                      Impact Details
                                    </span>
                                    <div className="mt-1 space-y-1">
                                      {Array.from(new Set(m.reasons)).map(
                                        (reason) => (
                                          <p
                                            className="text-[11px] text-muted-foreground leading-tight"
                                            key={reason}
                                          >
                                            • {reason}
                                          </p>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </td>
                    ))}
                    <td className="bg-primary/5 px-3 py-2">
                      {avgAvailability !== null ? (
                        <span
                          className={cn(
                            "font-bold text-[13px] text-foreground/80 tabular-nums"
                          )}
                        >
                          {avgAvailability.toFixed(2)}%
                          {avgAvailability < appThreshold && (
                            <span className="ml-1 inline-block h-1 w-1 rounded-full bg-rose-500" />
                          )}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/30">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-transparent">
                    <td className="px-3 py-2 text-left font-bold text-[12px] text-indigo-700 uppercase tracking-widest dark:text-indigo-400">
                      VOL
                    </td>
                    {monthlyMetrics.map((m, i) => (
                      <td className="px-0.5 py-2" key={MONTHS[i]}>
                        <div className="flex flex-col items-center">
                          {m.volume > 0 ? (
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-[13px] text-muted-foreground/70 tabular-nums">
                                {formatVolume(m.volume)}
                              </span>
                              {m.prevVolume !== null &&
                                m.prevVolume > 0 &&
                                m.volume !== m.prevVolume && (
                                  <span className="scale-75 opacity-50">
                                    {m.volume > m.prevVolume ? (
                                      <ArrowUp className="h-2.5 w-2.5 text-blue-500/60" />
                                    ) : (
                                      <ArrowDown className="h-2.5 w-2.5 text-indigo-500/60" />
                                    )}
                                  </span>
                                )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/30">
                              —
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                    <td className="bg-primary/5 px-3 py-2">
                      {totalVolume > 0 ? (
                        <span className="font-bold text-[13px] text-indigo-600 tabular-nums">
                          {formatVolume(totalVolume)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/30">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
