"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Hash,
  Layers,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { CURRENT_MONTH, CURRENT_YEAR, MONTHS } from "./constants";
import { formatVolume } from "./entry-rows";
import type { AvailabilityRecord, ScorecardEntry, VolumeRecord } from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────

function aggregateMonthData(
  entries: ScorecardEntry[],
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>,
  volumeByEntry: Record<string, Record<string, VolumeRecord>>,
  key: string
): {
  totalAvail: number;
  availCount: number;
  totalVol: number;
  breaches: number;
} {
  let totalAvail = 0;
  let availCount = 0;
  let totalVol = 0;
  let breaches = 0;

  for (const entry of entries) {
    const av = availabilityByEntry[entry.id]?.[key];
    if (av) {
      const val = Number.parseFloat(av.availability);
      totalAvail += val;
      availCount++;
      if (val < Number.parseFloat(entry.availabilityThreshold)) {
        breaches++;
      }
    }

    const vol = volumeByEntry[entry.id]?.[key];
    if (vol) {
      totalVol += vol.volume;
    }
  }

  return { totalAvail, availCount, totalVol, breaches };
}

// ─── Types ───────────────────────────────────────────────────────────

interface MonthlyDataPoint {
  availability: number | null;
  breaches: number;
  month: string;
  monthIndex: number;
  volume: number;
}

interface EnterpriseAnalyticsProps {
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
  entries: ScorecardEntry[];
  selectedYear: number;
  totalApps: number;
  totalTeams: number;
  volumeByEntry: Record<string, Record<string, VolumeRecord>>;
}

// ─── Chart Config ────────────────────────────────────────────────────

const availConfig = {
  availability: {
    label: "Avg Availability %",
    color: "hsl(142, 71%, 45%)",
  },
} satisfies ChartConfig;

const volumeConfig = {
  volume: {
    label: "Total Volume",
    color: "hsl(221, 83%, 53%)",
  },
} satisfies ChartConfig;

const breachConfig = {
  breaches: {
    label: "SLA Breaches",
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig;

// ─── Component ───────────────────────────────────────────────────────

export function EnterpriseAnalytics({
  entries,
  availabilityByEntry,
  volumeByEntry,
  selectedYear,
  totalTeams,
  totalApps,
}: EnterpriseAnalyticsProps) {
  // Build monthly aggregated data
  const monthlyData = useMemo((): MonthlyDataPoint[] => {
    const isCurrentYear = selectedYear === CURRENT_YEAR;

    return MONTHS.map((label, i) => {
      const monthNum = i + 1;
      const key = `${selectedYear}-${monthNum}`;
      const isFuture = isCurrentYear && monthNum > CURRENT_MONTH;

      if (isFuture) {
        return {
          month: label,
          monthIndex: monthNum,
          availability: null,
          volume: 0,
          breaches: 0,
        };
      }

      const agg = aggregateMonthData(
        entries,
        availabilityByEntry,
        volumeByEntry,
        key
      );

      return {
        month: label,
        monthIndex: monthNum,
        availability:
          agg.availCount > 0 ? agg.totalAvail / agg.availCount : null,
        volume: agg.totalVol,
        breaches: agg.breaches,
      };
    });
  }, [entries, availabilityByEntry, volumeByEntry, selectedYear]);

  // Current & previous month data for delta calculations
  const currentData = useMemo(() => {
    const isCurrentYear = selectedYear === CURRENT_YEAR;
    const currentMonth = isCurrentYear ? CURRENT_MONTH : 12;
    return monthlyData[currentMonth - 1];
  }, [monthlyData, selectedYear]);

  const previousData = useMemo(() => {
    const isCurrentYear = selectedYear === CURRENT_YEAR;
    const currentMonth = isCurrentYear ? CURRENT_MONTH : 12;
    if (currentMonth > 1) {
      return monthlyData[currentMonth - 2];
    }
    return null;
  }, [monthlyData, selectedYear]);

  // Aggregate totals
  const totals = useMemo(() => {
    let totalBreaches = 0;
    let totalAvail = 0;
    let availCount = 0;
    let totalVol = 0;

    for (const dp of monthlyData) {
      totalBreaches += dp.breaches;
      totalVol += dp.volume;
      if (dp.availability !== null) {
        totalAvail += dp.availability;
        availCount++;
      }
    }

    return {
      breaches: totalBreaches,
      avgAvailability: availCount > 0 ? totalAvail / availCount : null,
      totalVolume: totalVol,
    };
  }, [monthlyData]);

  // Filter to past months only (for chart rendering)
  const chartData = useMemo(() => {
    return monthlyData.filter((d) => d.availability !== null);
  }, [monthlyData]);

  // Delta helpers
  const availDelta =
    currentData?.availability !== null && previousData?.availability !== null
      ? (currentData.availability ?? 0) - (previousData?.availability ?? 0)
      : null;

  const breachDelta =
    previousData !== null
      ? currentData.breaches - (previousData?.breaches ?? 0)
      : null;

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-8 py-4 lg:grid-cols-4">
        {/* Teams */}
        <KPICard
          icon={<Layers className="h-4 w-4" />}
          iconClassName="bg-primary/10 text-primary"
          label="Teams"
          value={String(totalTeams)}
        />

        {/* Applications */}
        <KPICard
          icon={<Activity className="h-4 w-4" />}
          iconClassName="bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
          label="Applications"
          value={String(totalApps)}
        />

        {/* Avg Availability */}
        <KPICard
          delta={availDelta}
          deltaLabel="vs prev month"
          deltaSuffix="%"
          icon={<Hash className="h-4 w-4" />}
          iconClassName="bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400"
          label="Avg Availability"
          value={
            totals.avgAvailability !== null
              ? `${totals.avgAvailability.toFixed(2)}%`
              : "—"
          }
          valueClassName={
            totals.avgAvailability !== null && totals.avgAvailability < 99
              ? "text-amber-600"
              : "text-green-600"
          }
        />

        {/* Breaches */}
        <KPICard
          delta={breachDelta}
          deltaLabel="vs prev month"
          icon={<AlertTriangle className="h-4 w-4" />}
          iconClassName={
            totals.breaches > 0
              ? "bg-red-500/10 text-red-600"
              : "bg-primary/10 text-primary"
          }
          invertDelta
          label="SLA Breaches"
          labelClassName={totals.breaches > 0 ? "text-red-500/80" : undefined}
          value={String(totals.breaches)}
          valueClassName={totals.breaches > 0 ? "text-red-600" : undefined}
        />
      </div>

      {/* Charts Row */}
      {chartData.length > 1 && (
        <div className="grid gap-8 py-4 lg:grid-cols-3">
          {/* Availability Trend */}
          <div className="relative z-10 flex flex-col py-2">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <h3 className="font-bold text-sm tracking-tight">
                Availability Trend
              </h3>
            </div>
            <div className="h-[180px] w-full">
              <ChartContainer className="h-full w-full" config={availConfig}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="availGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(142, 71%, 45%)"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(142, 71%, 45%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    strokeOpacity={0.3}
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="month"
                    fontSize={10}
                    tickLine={false}
                    tickMargin={6}
                  />
                  <YAxis
                    axisLine={false}
                    domain={[95, 100]}
                    fontSize={10}
                    tickFormatter={(v: number) => `${v}%`}
                    tickLine={false}
                    tickMargin={4}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    animationDuration={800}
                    dataKey="availability"
                    fill="url(#availGrad)"
                    stroke="hsl(142, 71%, 45%)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>

          {/* Volume Trend */}
          <div className="relative z-10 flex flex-col py-2">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <h3 className="font-bold text-sm tracking-tight">
                Monthly Volume
              </h3>
            </div>
            <div className="h-[180px] w-full">
              <ChartContainer className="h-full w-full" config={volumeConfig}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    strokeOpacity={0.3}
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="month"
                    fontSize={10}
                    tickLine={false}
                    tickMargin={6}
                  />
                  <YAxis
                    axisLine={false}
                    fontSize={10}
                    tickFormatter={(v: number) => formatVolume(v)}
                    tickLine={false}
                    tickMargin={4}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar
                    animationDuration={800}
                    dataKey="volume"
                    fill="hsl(221, 83%, 53%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          {/* Breach Trend */}
          <div className="relative z-10 flex flex-col py-2">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <h3 className="font-bold text-sm tracking-tight">
                SLA Breaches by Month
              </h3>
            </div>
            <div className="h-[180px] w-full">
              <ChartContainer className="h-full w-full" config={breachConfig}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="breachGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(0, 84%, 60%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(0, 84%, 60%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    strokeOpacity={0.3}
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="month"
                    fontSize={10}
                    tickLine={false}
                    tickMargin={6}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    fontSize={10}
                    tickLine={false}
                    tickMargin={4}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    animationDuration={800}
                    dataKey="breaches"
                    fill="url(#breachGrad)"
                    stroke="hsl(0, 84%, 60%)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────

interface KPICardProps {
  delta?: number | null;
  deltaLabel?: string;
  deltaSuffix?: string;
  icon: React.ReactNode;
  iconClassName?: string;
  invertDelta?: boolean;
  label: string;
  labelClassName?: string;
  value: string;
  valueClassName?: string;
}

function KPICard({
  label,
  value,
  icon,
  iconClassName,
  valueClassName,
  labelClassName,
  delta,
  deltaLabel,
  deltaSuffix = "",
  invertDelta = false,
}: KPICardProps) {
  const isPositive = delta !== null && delta !== undefined && delta > 0;
  const isNegative = delta !== null && delta !== undefined && delta < 0;

  // For breaches, positive delta is bad (inverted)
  const isGood = invertDelta ? isNegative : isPositive;
  const isBad = invertDelta ? isPositive : isNegative;

  return (
    <div className="relative z-10 flex flex-col justify-center py-2">
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            iconClassName
          )}
        >
          {icon}
        </div>
        <p
          className={cn(
            "truncate font-bold text-[11px] text-muted-foreground uppercase tracking-widest",
            labelClassName
          )}
        >
          {label}
        </p>
      </div>
      <div className="flex items-end gap-3">
        <p
          className={cn(
            "font-black text-3xl text-foreground tabular-nums leading-none tracking-tighter md:text-4xl",
            valueClassName
          )}
        >
          {value}
        </p>
        {delta !== null && delta !== undefined && delta !== 0 && (
          <div
            className={cn(
              "mb-0.5 flex items-center gap-1 rounded-full px-2 py-0.5 font-bold text-[10px] tabular-nums",
              isGood && "bg-green-500/10 text-green-600",
              isBad && "bg-red-500/10 text-red-600"
            )}
          >
            {isPositive ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {Math.abs(delta).toFixed(deltaSuffix === "%" ? 2 : 0)}
            {deltaSuffix}
            {deltaLabel && (
              <span className="ml-0.5 font-normal opacity-60">
                {deltaLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
