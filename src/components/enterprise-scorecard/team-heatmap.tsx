"use client";

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

interface TeamHeatmapProps {
  appsByTeam: Record<string, Application[]>;
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
  entriesByApp: Record<string, ScorecardEntry[]>;
  selectedYear: number;
  teams: Team[];
  volumeByEntry: Record<string, Record<string, VolumeRecord>>;
}

interface MonthCell {
  availability: number | null;
  isFuture: boolean;
  month: string;
  reasons: string[];
  status: StatusTheme;
  volume: number;
}

interface StatusTheme {
  bg: string;
  dot: string;
  label: string;
  ring: string;
  text: string;
}

const STATUS_THEMES = {
  NO_DATA: {
    bg: "bg-muted/5",
    dot: "bg-muted-foreground/20",
    text: "text-muted-foreground/30",
    ring: "group-hover:ring-muted/20",
    label: "No Data",
  },
  EXCEPTIONAL: {
    bg: "bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12]",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    ring: "group-hover:ring-emerald-500/30",
    label: "Pristine",
  },
  MET: {
    bg: "bg-blue-500/[0.08] dark:bg-blue-500/[0.12]",
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
    ring: "group-hover:ring-blue-500/30",
    label: "On Target",
  },
  VOL_BREACH: {
    bg: "bg-indigo-500/[0.08] dark:bg-indigo-500/[0.12]",
    dot: "bg-indigo-500",
    text: "text-indigo-700 dark:text-indigo-400",
    ring: "group-hover:ring-indigo-500/30",
    label: "Volume Breach",
  },
  MINOR_BREACH: {
    bg: "bg-amber-500/[0.08] dark:bg-amber-500/[0.12]",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    ring: "group-hover:ring-amber-500/30",
    label: "Minor Breach",
  },
  MAJOR_BREACH: {
    bg: "bg-rose-500/[0.08] dark:bg-rose-500/[0.12]",
    dot: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-400",
    ring: "group-hover:ring-rose-500/30",
    label: "Major Breach",
  },
} as const;

function computeStatus(
  avail: number | null,
  threshold: number,
  volRatio: number | null,
  volThreshold: number
): StatusTheme {
  const diff = avail !== null ? avail - threshold : null;
  const isVolBreach = volRatio !== null && volRatio >= volThreshold;

  if (avail === null) {
    return STATUS_THEMES.NO_DATA;
  }

  if (diff !== null && diff < 0) {
    // Availability Breach
    if (diff < -0.5) {
      return STATUS_THEMES.MAJOR_BREACH;
    }
    return STATUS_THEMES.MINOR_BREACH;
  }

  if (isVolBreach) {
    return STATUS_THEMES.VOL_BREACH;
  }

  if (diff !== null && diff >= 0.05) {
    return STATUS_THEMES.EXCEPTIONAL;
  }
  return STATUS_THEMES.MET;
}

// Compute metrics helpers (keep existing logic but clean up types)
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
  const reasons: string[] = [];

  const entries = entriesByApp[app.id] || [];
  for (const entry of entries) {
    totalThreshold += Number.parseFloat(entry.availabilityThreshold);
    totalVolThreshold += Number.parseFloat(entry.volumeChangeThreshold);

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
    threshold: entries.length > 0 ? totalThreshold / entries.length : 99.5,
    volThreshold: entries.length > 0 ? totalVolThreshold / entries.length : 10,
  };
}

function getTeamMonthMetrics(
  teamApps: Application[],
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

  for (const app of teamApps) {
    const entries = entriesByApp[app.id] || [];
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
      const vol = volumeByEntry[entry.id]?.[key];
      if (vol) {
        totalVol += vol.volume;
      }
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

export function TeamHeatmap({
  teams,
  appsByTeam,
  entriesByApp,
  availabilityByEntry,
  volumeByEntry,
  selectedYear,
}: TeamHeatmapProps) {
  const isCurrentYear = selectedYear === CURRENT_YEAR;

  const heatmapData = useMemo(() => {
    return teams.map((team) => {
      const teamApps = appsByTeam[team.id] || [];
      const months: MonthCell[] = MONTHS.map((label, i) => {
        const monthNum = i + 1;
        const isFuture = isCurrentYear && monthNum > CURRENT_MONTH;
        const key = `${selectedYear}-${monthNum}`;
        const prevKey =
          monthNum === 1
            ? `${selectedYear - 1}-12`
            : `${selectedYear}-${monthNum - 1}`;

        if (isFuture) {
          return {
            month: label,
            availability: null,
            volume: 0,
            reasons: [],
            isFuture: true,
            status: STATUS_THEMES.NO_DATA,
          };
        }
        const metrics = getTeamMonthMetrics(
          teamApps,
          entriesByApp,
          availabilityByEntry,
          volumeByEntry,
          key
        );

        const prevMetrics = getTeamMonthMetrics(
          teamApps,
          entriesByApp,
          availabilityByEntry,
          volumeByEntry,
          prevKey
        );

        let volRatio = 0;
        if (metrics.volume > 0 && prevMetrics.volume > 0) {
          volRatio =
            Math.abs(
              (metrics.volume - prevMetrics.volume) / prevMetrics.volume
            ) * 100;
        }

        return {
          month: label,
          availability: metrics.availability,
          volume: metrics.volume,
          reasons: metrics.reasons,
          status: computeStatus(
            metrics.availability,
            metrics.threshold,
            volRatio,
            metrics.volThreshold
          ),
          isFuture: false,
        };
      });

      const apps = teamApps.map((app) => {
        const appMonths: MonthCell[] = MONTHS.map((label, i) => {
          const monthNum = i + 1;
          const isFuture = isCurrentYear && monthNum > CURRENT_MONTH;
          const key = `${selectedYear}-${monthNum}`;
          const prevKey =
            monthNum === 1
              ? `${selectedYear - 1}-12`
              : `${selectedYear}-${monthNum - 1}`;

          if (isFuture) {
            return {
              month: label,
              availability: null,
              volume: 0,
              reasons: [],
              isFuture: true,
              status: STATUS_THEMES.NO_DATA,
            };
          }
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

          let volRatio = 0;
          if (metrics.volume > 0 && prevMetrics.volume > 0) {
            volRatio =
              Math.abs(
                (metrics.volume - prevMetrics.volume) / prevMetrics.volume
              ) * 100;
          }

          return {
            month: label,
            availability: metrics.availability,
            volume: metrics.volume,
            reasons: metrics.reasons,
            status: computeStatus(
              metrics.availability,
              metrics.threshold,
              volRatio,
              metrics.volThreshold
            ),
            isFuture: false,
          };
        });
        return { app, months: appMonths };
      });

      return { team, months, apps };
    });
  }, [
    teams,
    appsByTeam,
    entriesByApp,
    availabilityByEntry,
    volumeByEntry,
    selectedYear,
    isCurrentYear,
  ]);

  if (teams.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delay={100}>
      <div className="space-y-12 pb-20">
        {heatmapData.map(({ team, months, apps }) => {
          const validTeamMonths = months.filter((m) => m.availability !== null);
          const teamAvg =
            validTeamMonths.length > 0
              ? validTeamMonths.reduce((s, m) => s + (m.availability ?? 0), 0) /
                validTeamMonths.length
              : null;
          const teamTotalVol = months.reduce((s, m) => s + m.volume, 0);

          // Aggregate thresholds for the team annual average
          let totalTeamThreshold = 0;
          let totalTeamVolThreshold = 0;
          let teamEntryCount = 0;
          for (const app of appsByTeam[team.id] || []) {
            const entries = entriesByApp[app.id] || [];
            for (const entry of entries) {
              totalTeamThreshold += Number.parseFloat(
                entry.availabilityThreshold
              );
              totalTeamVolThreshold += Number.parseFloat(
                entry.volumeChangeThreshold
              );
              teamEntryCount++;
            }
          }
          const teamAnnualThreshold =
            teamEntryCount > 0 ? totalTeamThreshold / teamEntryCount : 99.5;
          const teamAnnualVolThreshold =
            teamEntryCount > 0 ? totalTeamVolThreshold / teamEntryCount : 10;
          const teamStatus = computeStatus(
            teamAvg,
            teamAnnualThreshold,
            0, // Vol ratio not computed for annual average
            teamAnnualVolThreshold
          );

          return (
            <div key={team.id}>
              {/* Team Heading */}
              <div className="flex items-center gap-3 px-2">
                <div className="h-6 w-1 rounded-full bg-primary/60" />
                <h3 className="font-bold text-foreground text-xl tracking-tight">
                  {team.teamName}
                </h3>
                <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">
                  {apps.length} Applications
                </span>
              </div>

              <div className="group/heatmap-container overflow-hidden rounded-2xl border border-border/50 bg-card/30 shadow-sm backdrop-blur-sm">
                <div className="scrollbar-thin scrollbar-track-muted/5 scrollbar-thumb-muted-foreground/10 overflow-x-auto">
                  <table className="w-full min-w-[1000px] border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-muted/5">
                        <th className="sticky left-0 z-20 w-[240px] border-border/40 border-b bg-card/90 px-6 py-4 text-left backdrop-blur-md">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                              Hierarchy
                            </span>
                            <span className="font-semibold text-foreground text-xs">
                              Application Name
                            </span>
                          </div>
                        </th>
                        {MONTHS.map((m) => (
                          <th
                            className="border-border/40 border-b px-1 py-4 text-center"
                            key={m}
                          >
                            <span className="font-bold text-[10px] text-muted-foreground/80 uppercase tracking-wider">
                              {m}
                            </span>
                          </th>
                        ))}
                        <th className="border-border/40 border-b bg-muted/10 px-4 py-4 text-center">
                          <span className="font-bold text-[10px] text-primary uppercase tracking-widest">
                            Annual
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Team Aggregate Row */}
                      <tr className="group/row bg-muted/5 hover:bg-muted/10">
                        <td className="sticky left-0 z-10 border-border/20 border-b bg-muted-foreground/[0.03] px-6 py-3 backdrop-blur-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                            <span className="font-bold text-[13px] text-foreground tracking-tight">
                              Team Average
                            </span>
                          </div>
                        </td>
                        {months.map((m) => (
                          <HeatmapCell key={m.month} month={m} />
                        ))}
                        <td className="border-border/20 border-b bg-muted/15 px-2 py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span
                              className={cn(
                                "font-black text-[14px] tabular-nums tracking-tighter",
                                teamStatus.text
                              )}
                            >
                              {teamAvg !== null
                                ? `${teamAvg.toFixed(2)}%`
                                : "—"}
                            </span>
                            {teamTotalVol > 0 && (
                              <span className="font-mono text-[11px] text-muted-foreground opacity-60">
                                {formatVolume(teamTotalVol)}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Application Rows */}
                      {apps.map(({ app, months: appMonths }) => {
                        const validAppMonths = appMonths.filter(
                          (m) => m.availability !== null
                        );
                        const appRowAvg =
                          validAppMonths.length > 0
                            ? validAppMonths.reduce(
                                (s, m) => s + (m.availability ?? 0),
                                0
                              ) / validAppMonths.length
                            : null;
                        const appTotalVol = appMonths.reduce(
                          (s, m) => s + m.volume,
                          0
                        );

                        // Aggregate thresholds for the app annual average
                        let totalAppThreshold = 0;
                        let totalAppVolThreshold = 0;
                        let appEntryCount = 0;
                        const entries = entriesByApp[app.id] || [];
                        for (const entry of entries) {
                          totalAppThreshold += Number.parseFloat(
                            entry.availabilityThreshold
                          );
                          totalAppVolThreshold += Number.parseFloat(
                            entry.volumeChangeThreshold
                          );
                          appEntryCount++;
                        }
                        const appAnnualThreshold =
                          appEntryCount > 0
                            ? totalAppThreshold / appEntryCount
                            : 99.5;
                        const appAnnualVolThreshold =
                          appEntryCount > 0
                            ? totalAppVolThreshold / appEntryCount
                            : 10;
                        const appStatus = computeStatus(
                          appRowAvg,
                          appAnnualThreshold,
                          0, // Vol ratio not computed for annual average
                          appAnnualVolThreshold
                        );

                        return (
                          <tr
                            className="group/subitem hover:bg-muted/5"
                            key={app.id}
                          >
                            <td className="sticky left-0 z-10 border-border/5 border-b bg-card/95 px-6 py-2.5 pl-12 transition-colors group-hover/subitem:bg-muted/5">
                              <span className="font-medium text-[11.5px] text-muted-foreground/80 tracking-tight transition-colors group-hover/subitem:text-foreground">
                                {app.applicationName}
                              </span>
                            </td>
                            {appMonths.map((m) => (
                              <HeatmapCell isAppRow key={m.month} month={m} />
                            ))}
                            <td className="border-border/5 border-b bg-muted/5 px-2 py-2.5 text-center">
                              <span
                                className={cn(
                                  "font-bold text-[13px] tabular-nums tracking-tighter",
                                  appStatus.text
                                )}
                              >
                                {appRowAvg !== null
                                  ? `${appRowAvg.toFixed(2)}%`
                                  : "—"}
                              </span>
                              {appTotalVol > 0 && (
                                <span className="block font-mono text-[10px] text-muted-foreground opacity-60">
                                  {formatVolume(appTotalVol)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Legend for individual team table */}
                <div className="flex flex-wrap items-center gap-6 border-border/40 border-t bg-muted/5 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[11px] text-muted-foreground uppercase tracking-widest">
                      Performance Index
                    </span>
                  </div>
                  {[
                    {
                      label: "Pristine",
                      theme: STATUS_THEMES.EXCEPTIONAL,
                      desc: "> Target + 0.05%",
                    },
                    {
                      label: "On Target",
                      theme: STATUS_THEMES.MET,
                      desc: "≥ Target %",
                    },
                    {
                      label: "Volume Breach",
                      theme: STATUS_THEMES.VOL_BREACH,
                      desc: "Throughput drop",
                    },
                    {
                      label: "Minor Breach",
                      theme: STATUS_THEMES.MINOR_BREACH,
                      desc: "< Target %",
                    },
                    {
                      label: "Major Breach",
                      theme: STATUS_THEMES.MAJOR_BREACH,
                      desc: "Fail > 0.5%",
                    },
                  ].map((item) => {
                    return (
                      <div
                        className="group/legend flex items-center gap-2"
                        key={item.label}
                      >
                        <div
                          className={cn(
                            "h-3 w-3 rounded-full shadow-sm transition-transform group-hover/legend:scale-125",
                            item.theme.dot
                          )}
                        />
                        <div className="flex flex-col leading-none">
                          <span className="font-bold text-[10px] text-foreground tracking-tight">
                            {item.label}
                          </span>
                          <span className="font-bold text-[9px] text-muted-foreground uppercase opacity-70">
                            {item.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

/**
 * Single Heatmap Cell with Premium status styling
 */
function HeatmapCell({
  month: m,
  isAppRow,
}: {
  month: MonthCell;
  isAppRow?: boolean;
}) {
  const theme = m.status;

  if (m.isFuture) {
    return (
      <td className="border-border/5 border-b bg-muted/5 px-1 py-2 text-center">
        <span className="text-[10px] text-muted-foreground/20 italic">—</span>
      </td>
    );
  }

  return (
    <td className="group relative border-border/10 border-b p-0" key={m.month}>
      <Tooltip>
        <TooltipTrigger className="flex h-full w-full flex-col items-center justify-center gap-0.5 px-1 py-2.5 outline-hidden transition-all duration-300">
          <div
            className={cn(
              "absolute inset-0 z-0 transition-opacity duration-300 group-hover:opacity-80",
              theme.bg
            )}
          />
          <div
            className={cn(
              "absolute top-1.5 right-1.5 h-1 w-1 rounded-full opacity-0 transition-opacity group-hover:opacity-100",
              theme.dot
            )}
          />

          <span
            className={cn(
              "z-10 tabular-nums leading-none tracking-tighter",
              theme.text,
              isAppRow ? "text-[12px]" : "text-[14px]"
            )}
          >
            {m.availability !== null ? `${m.availability.toFixed(1)}%` : "—"}
          </span>

          {!isAppRow && m.volume > 0 && (
            <span className="mt-1 font-mono text-[11px] text-foreground/40 tabular-nums leading-none tracking-tight">
              {formatVolume(m.volume)}
            </span>
          )}

          {/* Luxury Hover Glow */}
          <div
            className={cn(
              "absolute inset-0 -z-10 rounded-[10px] opacity-0 transition-opacity duration-300 group-hover:opacity-10 dark:opacity-0 dark:group-hover:opacity-20",
              theme.dot
            )}
            style={{ filter: "blur(6px)" }}
          />
        </TooltipTrigger>
        <TooltipContent
          className="rounded-xl border-border/50 bg-background/80 px-4 py-2.5 shadow-xl backdrop-blur-md"
          side="top"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", theme.dot)} />
              <span className="font-bold text-[13px] text-foreground tracking-tight">
                {theme.label} Status
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="font-medium text-muted-foreground text-xs">
                Availability
              </span>
              <span
                className={cn("font-black text-xs tabular-nums", theme.text)}
              >
                {m.availability !== null
                  ? `${m.availability.toFixed(4)}%`
                  : "N/A"}
              </span>
              {m.volume > 0 && (
                <>
                  <span className="font-medium text-muted-foreground text-xs">
                    Throughput
                  </span>
                  <span className="font-black text-foreground text-xs tabular-nums">
                    {m.volume.toLocaleString()}
                  </span>
                </>
              )}
            </div>
            {m.reasons.length > 0 && (
              <div className="border-border/30 border-t pt-1.5">
                <span className="font-bold text-[10px] text-rose-500 uppercase tracking-wider">
                  Impact Details
                </span>
                <div className="mt-1 space-y-1">
                  {Array.from(new Set(m.reasons)).map((reason) => (
                    <p
                      className="text-[11px] text-muted-foreground leading-tight"
                      key={reason}
                    >
                      • {reason}
                    </p>
                  ))}
                </div>
              </div>
            )}
            <div className="border-border/30 border-t pt-1.5">
              <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                Reporting Period: {m.month}
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </td>
  );
}
