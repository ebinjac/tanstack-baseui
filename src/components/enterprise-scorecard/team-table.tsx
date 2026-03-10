"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CURRENT_MONTH, CURRENT_YEAR, MONTHS } from "./constants";
import { formatVolume } from "./entry-rows";
import type {
  Application,
  AvailabilityRecord,
  ScorecardEntry,
  Team,
  VolumeRecord,
} from "./types";

interface TeamTableProps {
  applications: Application[];
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
  entriesByApp: Record<string, ScorecardEntry[]>;
  selectedYear: number;
  teams: Team[];
  volumeByEntry: Record<string, Record<string, VolumeRecord>>;
}

// Reuse logic for monthly metrics
function getAppMonthMetrics(
  app: Application,
  entriesByApp: Record<string, ScorecardEntry[]>,
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>,
  volumeByEntry: Record<string, Record<string, VolumeRecord>>,
  key: string
) {
  let totalAvail = 0;
  let availCount = 0;
  let totalVol = 0;
  let totalThreshold = 0;
  let totalVolThreshold = 0;
  let entryCount = 0;
  const reasons: string[] = [];

  for (const entry of entriesByApp[app.id] || []) {
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
    const vol = volumeByEntry[entry.id]?.[key];
    if (vol) {
      totalVol += vol.volume;
    }
  }

  return {
    availability: availCount > 0 ? totalAvail / availCount : null,
    volume: totalVol,
    reasons,
    threshold: entryCount > 0 ? totalThreshold / entryCount : 99.5,
    volThreshold: entryCount > 0 ? totalVolThreshold / entryCount : 10,
  };
}

export function TeamTable({
  applications,
  teams,
  entriesByApp,
  availabilityByEntry,
  volumeByEntry,
  selectedYear,
}: TeamTableProps) {
  const isCurrentYear = selectedYear === CURRENT_YEAR;

  // Group applications by team
  const teamsWithApps = useMemo(() => {
    return teams
      .map((team) => {
        const teamApps = applications.filter((app) => app.teamId === team.id);
        const appData = teamApps.map((app) => {
          const months = MONTHS.map((label, i) => {
            const monthNum = i + 1;
            const isFuture = isCurrentYear && monthNum > CURRENT_MONTH;
            if (isFuture) {
              return {
                month: label,
                availability: null,
                volume: 0,
                reasons: [],
                isFuture: true,
              };
            }

            const key = `${selectedYear}-${monthNum}`;
            const prevKey =
              monthNum === 1
                ? `${selectedYear - 1}-12`
                : `${selectedYear}-${monthNum - 1}`;

            const metrics = getAppMonthMetrics(
              app,
              entriesByApp,
              availabilityByEntry,
              volumeByEntry,
              key
            );
            const prevMetrics = getAppMonthMetrics(
              app,
              entriesByApp,
              availabilityByEntry,
              volumeByEntry,
              prevKey
            );

            return {
              month: label,
              availability: metrics.availability,
              prevAvailability: prevMetrics.availability,
              volume: metrics.volume,
              prevVolume: prevMetrics.volume,
              reasons: metrics.reasons,
              threshold: metrics.threshold,
              volThreshold: metrics.volThreshold,
              isFuture: false,
            };
          });

          const validMonths = months.filter((m) => m.availability !== null);
          const annualAvg =
            validMonths.length > 0
              ? validMonths.reduce((s, m) => s + (m.availability ?? 0), 0) /
                validMonths.length
              : null;

          // Use average threshold for the row
          const appEntries = entriesByApp[app.id] || [];
          const rowThreshold =
            appEntries.length > 0
              ? appEntries.reduce(
                  (s, e) => s + Number.parseFloat(e.availabilityThreshold),
                  0
                ) / appEntries.length
              : 99.5;

          return { app, months, annualAvg, rowThreshold };
        });

        return { team, appData };
      })
      .filter((t) => t.appData.length > 0);
  }, [
    applications,
    teams,
    entriesByApp,
    availabilityByEntry,
    volumeByEntry,
    selectedYear,
    isCurrentYear,
  ]);

  if (teamsWithApps.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delay={100}>
      <div className="space-y-12 pb-20">
        {teamsWithApps.map(({ team, appData }) => (
          <div className="space-y-4" key={team.id}>
            {/* Team Heading */}
            <div className="flex items-center gap-3 px-2">
              <div className="h-6 w-1 rounded-full bg-primary/60" />
              <h3 className="font-bold text-foreground text-xl tracking-tight">
                {team.teamName}
              </h3>
              <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">
                {appData.length} Applications
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-border/50 bg-card/30 shadow-sm backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-muted/10">
                      <th className="sticky left-0 z-20 border-border/40 border-b bg-card/90 px-6 py-4 text-left backdrop-blur-sm">
                        <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-widest">
                          Application
                        </span>
                      </th>
                      <th className="border-border/40 border-b px-2 py-4 text-left">
                        <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-widest">
                          TLA
                        </span>
                      </th>
                      {MONTHS.map((m) => (
                        <th
                          className="border-border/40 border-b px-1 py-4 text-center"
                          key={m}
                        >
                          <span className="font-bold text-[11px] text-muted-foreground/80 uppercase lowercase">
                            {m}
                          </span>
                        </th>
                      ))}
                      <th className="border-border/40 border-b bg-primary/5 px-4 py-4 text-center">
                        <span className="font-bold text-[11px] text-primary uppercase tracking-widest">
                          Annual
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {appData.map(({ app, months, annualAvg, rowThreshold }) => (
                      <tr
                        className="group transition-colors hover:bg-muted/5"
                        key={app.id}
                      >
                        <td className="sticky left-0 z-10 bg-card/95 px-6 py-3 backdrop-blur-sm group-hover:bg-muted/5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-[14px] text-foreground leading-none tracking-tight transition-colors group-hover:text-primary">
                              {app.applicationName}
                            </span>
                            <div className="flex items-center gap-2 opacity-60">
                              <span className="font-bold text-[9px] text-muted-foreground uppercase tracking-widest">
                                Target: {rowThreshold.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <span className="font-bold text-[12px] text-muted-foreground uppercase tabular-nums">
                            {app.tla}
                          </span>
                        </td>
                        {months.map((m) => (
                          <td className="px-1 py-3 text-center" key={m.month}>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex cursor-default flex-col items-center gap-0.5 px-3 py-2 leading-none">
                                  {m.availability !== null ? (
                                    <div className="flex items-center gap-1.5">
                                      {m.availability < m.threshold && (
                                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.4)]" />
                                      )}
                                      <div className="flex items-center gap-1">
                                        <span className="font-bold text-[13px] text-foreground/80 tabular-nums">
                                          {m.availability.toFixed(1)}%
                                        </span>
                                        {m.prevAvailability != null &&
                                          m.availability !==
                                            m.prevAvailability && (
                                            <span className="opacity-70">
                                              {m.availability >
                                              m.prevAvailability ? (
                                                <ArrowUp className="h-2.5 w-2.5 text-emerald-500" />
                                              ) : (
                                                <ArrowDown className="h-2.5 w-2.5 text-rose-500" />
                                              )}
                                            </span>
                                          )}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[12px] text-muted-foreground/30">
                                      —
                                    </span>
                                  )}
                                  {m.volume > 0 && (
                                    <div className="mt-0.5 flex items-center gap-1">
                                      <span className="font-mono text-[10px] text-muted-foreground opacity-60">
                                        {formatVolume(m.volume)}
                                      </span>
                                      {m.prevVolume != null &&
                                        m.prevVolume > 0 &&
                                        m.volume !== m.prevVolume && (
                                          <span className="scale-75 opacity-50">
                                            {m.volume > (m.prevVolume ?? 0) ? (
                                              <ArrowUp className="h-2.5 w-2.5 text-blue-500/70" />
                                            ) : (
                                              <ArrowDown className="h-2.5 w-2.5 text-indigo-500/70" />
                                            )}
                                          </span>
                                        )}
                                    </div>
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
                                            ? "bg-rose-500"
                                            : "bg-emerald-500"
                                        )}
                                      />
                                      <span className="font-bold text-[12px] text-foreground tracking-tight">
                                        {m.month} {selectedYear}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                                      <span className="text-[11px] text-muted-foreground">
                                        Availability
                                      </span>
                                      <span className="font-black text-[11px] text-foreground tabular-nums">
                                        {m.availability.toFixed(4)}%
                                      </span>
                                      {m.volume > 0 && (
                                        <>
                                          <span className="text-[11px] text-muted-foreground">
                                            Volume
                                          </span>
                                          <span className="font-black text-[11px] text-foreground tabular-nums">
                                            {formatVolume(m.volume)}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    {m.reasons.length > 0 && (
                                      <div className="border-border/30 border-t pt-1.5">
                                        <span className="font-bold text-[9px] text-rose-500 uppercase tracking-wider">
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
                        <td className="bg-primary/[0.02] px-4 py-3 text-center">
                          <span
                            className={cn(
                              "font-black text-[15px] tabular-nums tracking-tighter",
                              annualAvg !== null && annualAvg < 99
                                ? "text-rose-600"
                                : "text-primary"
                            )}
                          >
                            {annualAvg !== null
                              ? `${annualAvg.toFixed(2)}%`
                              : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
