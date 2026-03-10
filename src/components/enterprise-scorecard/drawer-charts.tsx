"use client";

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CURRENT_MONTH, CURRENT_YEAR } from "./constants";
import { formatVolume } from "./entry-rows";
import type {
  Application,
  AvailabilityRecord,
  ScorecardEntry,
  VisibleMonth,
  VolumeRecord,
} from "./types";

// Helper to aggregate availability/volume for one app in one month
function aggregateAppMonth(
  appEntries: ScorecardEntry[],
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>,
  volumeByEntry: Record<string, Record<string, VolumeRecord>>,
  key: string
): { avgAvail: number | null; totalVol: number } {
  let totalAvail = 0;
  let availCount = 0;
  let totalVol = 0;

  for (const entry of appEntries) {
    const av = availabilityByEntry[entry.id]?.[key];
    if (av) {
      totalAvail += Number.parseFloat(av.availability);
      availCount++;
    }
    const vol = volumeByEntry[entry.id]?.[key];
    if (vol) {
      totalVol += vol.volume;
    }
  }

  return {
    avgAvail: availCount > 0 ? totalAvail / availCount : null,
    totalVol,
  };
}

const CHART_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(262, 83%, 58%)",
  "hsl(24, 95%, 53%)",
  "hsl(330, 81%, 60%)",
  "hsl(174, 72%, 40%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 84%, 60%)",
];

interface DrawerChartsProps {
  applications: Application[];
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
  entriesByApp: Record<string, ScorecardEntry[]>;
  visibleMonths: VisibleMonth[];
  volumeByEntry: Record<string, Record<string, VolumeRecord>>;
}

export function DrawerCharts({
  applications,
  entriesByApp,
  availabilityByEntry,
  volumeByEntry,
  visibleMonths,
}: DrawerChartsProps) {
  // Build chart config dynamically from applications
  const { chartConfig, chartData } = useMemo(() => {
    const config: ChartConfig = {};
    const pastMonths = visibleMonths.filter((vm) => {
      if (vm.year === CURRENT_YEAR && vm.month > CURRENT_MONTH) {
        return false;
      }
      return true;
    });

    for (const [i, app] of applications.entries()) {
      const colorIdx = i % CHART_COLORS.length;
      config[`avail_${app.id}`] = {
        label: app.tla || app.applicationName.slice(0, 12),
        color: CHART_COLORS[colorIdx],
      };
      config[`vol_${app.id}`] = {
        label: app.tla || app.applicationName.slice(0, 12),
        color: CHART_COLORS[colorIdx],
      };
    }

    const data = pastMonths.map((vm) => {
      const key = `${vm.year}-${vm.month}`;
      const monthLabels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const point: Record<string, string | number | null> = {
        month: monthLabels[vm.month - 1],
      };

      for (const app of applications) {
        const { avgAvail, totalVol } = aggregateAppMonth(
          entriesByApp[app.id] || [],
          availabilityByEntry,
          volumeByEntry,
          key
        );
        point[`avail_${app.id}`] = avgAvail;
        point[`vol_${app.id}`] = totalVol;
      }

      return point;
    });

    return { chartConfig: config, chartData: data };
  }, [
    applications,
    entriesByApp,
    availabilityByEntry,
    volumeByEntry,
    visibleMonths,
  ]);

  if (chartData.length < 2 || applications.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Multi-App Availability Trend */}
      <div className="rounded-xl border bg-card/50 p-5 shadow-sm">
        <h4 className="mb-4 font-bold text-sm tracking-tight">
          Availability by Application
        </h4>
        <div className="h-[220px] w-full">
          <ChartContainer className="h-full w-full" config={chartConfig}>
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
            >
              <defs>
                {applications.map((app, i) => (
                  <linearGradient
                    id={`grad-${app.id}`}
                    key={app.id}
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLORS[i % CHART_COLORS.length]}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLORS[i % CHART_COLORS.length]}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
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
              <ChartLegend content={<ChartLegendContent />} />
              {applications.map((app, i) => (
                <Area
                  animationDuration={800}
                  dataKey={`avail_${app.id}`}
                  fill={`url(#grad-${app.id})`}
                  key={app.id}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  type="monotone"
                />
              ))}
            </AreaChart>
          </ChartContainer>
        </div>
      </div>

      {/* Volume Comparison */}
      <div className="rounded-xl border bg-card/50 p-5 shadow-sm">
        <h4 className="mb-4 font-bold text-sm tracking-tight">
          Volume by Application
        </h4>
        <div className="h-[220px] w-full">
          <ChartContainer className="h-full w-full" config={chartConfig}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
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
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <ChartLegend content={<ChartLegendContent />} />
              {applications.map((app, i) => (
                <Bar
                  animationDuration={800}
                  dataKey={`vol_${app.id}`}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  key={app.id}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
