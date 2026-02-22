import { Activity, Filter, TrendingUp } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type {
  Application,
  AvailabilityRecord,
  MonthInfo,
  ScorecardEntry,
  VolumeRecord,
} from "./types";

// Cleaner, more defined color palette
const CHART_COLORS = [
  "#2563eb", // Blue 600
  "#0891b2", // Cyan 600
  "#4f46e5", // Indigo 600
  "#ea580c", // Orange 600
  "#db2777", // Pink 600
  "#16a34a", // Green 600
  "#ca8a04", // Yellow 600
  "#9333ea", // Purple 600
];

interface MetricsChartSheetProps {
  applications: Application[];
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
  displayMonths: MonthInfo[];
  entriesByApp: Record<string, ScorecardEntry[]>;
  filterLabel: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  volumeByEntry: Record<string, Record<string, VolumeRecord>>;
}

type ViewLevel = "applications" | "entries";

function buildDefaultSet<T extends { id: string }>(
  items: T[],
  count: number
): Set<string> {
  return new Set(items.slice(0, count).map((item) => item.id));
}

function aggregateAppAvailability(
  appEntries: ScorecardEntry[],
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>,
  key: string
): { totalAvail: number; availCount: number } {
  let totalAvail = 0;
  let availCount = 0;
  for (const entry of appEntries) {
    const av = availabilityByEntry[entry.id]?.[key];
    if (av) {
      const val = Number.parseFloat(av.availability);
      if (!Number.isNaN(val)) {
        totalAvail += val;
        availCount++;
      }
    }
  }
  return { totalAvail, availCount };
}

function aggregateAppVolume(
  appEntries: ScorecardEntry[],
  volumeByEntry: Record<string, Record<string, VolumeRecord>>,
  key: string
): number {
  let totalVol = 0;
  for (const entry of appEntries) {
    const vol = volumeByEntry[entry.id]?.[key];
    if (vol) {
      totalVol += vol.volume;
    }
  }
  return totalVol;
}

function buildAppDataPoint(
  dataPoint: Record<string, string | number | null>,
  applications: Application[],
  selectedAppIds: Set<string>,
  entriesByApp: Record<string, ScorecardEntry[]>,
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>,
  volumeByEntry: Record<string, Record<string, VolumeRecord>>,
  chartMetric: "availability" | "volume",
  key: string
): void {
  for (const app of applications) {
    if (!selectedAppIds.has(app.id)) {
      continue;
    }
    const appEntries = entriesByApp[app.id] || [];

    if (chartMetric === "availability") {
      const { totalAvail, availCount } = aggregateAppAvailability(
        appEntries,
        availabilityByEntry,
        key
      );
      dataPoint[app.id] =
        availCount > 0
          ? Number.parseFloat((totalAvail / availCount).toFixed(2))
          : null;
    } else {
      const totalVol = aggregateAppVolume(appEntries, volumeByEntry, key);
      dataPoint[app.id] = totalVol > 0 ? totalVol : null;
    }
  }
}

function buildEntryDataPoint(
  dataPoint: Record<string, string | number | null>,
  allEntries: Array<ScorecardEntry & { appName: string; appTla: string }>,
  selectedEntryIds: Set<string>,
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>,
  volumeByEntry: Record<string, Record<string, VolumeRecord>>,
  chartMetric: "availability" | "volume",
  key: string
): void {
  for (const entry of allEntries) {
    if (!selectedEntryIds.has(entry.id)) {
      continue;
    }

    if (chartMetric === "availability") {
      const av = availabilityByEntry[entry.id]?.[key];
      if (av) {
        const val = Number.parseFloat(av.availability);
        dataPoint[entry.id] = Number.isNaN(val) ? null : val;
      } else {
        dataPoint[entry.id] = null;
      }
    } else {
      const vol = volumeByEntry[entry.id]?.[key];
      dataPoint[entry.id] = vol ? vol.volume : null;
    }
  }
}

export function MetricsChartSheet({
  open,
  onOpenChange,
  applications,
  entriesByApp,
  availabilityByEntry,
  volumeByEntry,
  displayMonths,
  filterLabel,
}: MetricsChartSheetProps) {
  const [chartMetric, setChartMetric] = useState<"availability" | "volume">(
    "availability"
  );
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("area");
  const [viewLevel, setViewLevel] = useState<ViewLevel>("applications");

  // For application-level view
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(() =>
    buildDefaultSet(applications, 3)
  );

  // For entry-level view
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(
    new Set()
  );

  // Get all entries flattened
  const allEntries = useMemo(() => {
    const entries: Array<ScorecardEntry & { appName: string; appTla: string }> =
      [];
    for (const app of applications) {
      const appEntries = entriesByApp[app.id] || [];
      for (const entry of appEntries) {
        entries.push({
          ...entry,
          appName: app.applicationName,
          appTla: app.tla || app.applicationName,
        });
      }
    }
    return entries;
  }, [applications, entriesByApp]);

  // Update selected apps when applications change
  const selectedAppCount = selectedAppIds.size;
  React.useEffect(() => {
    if (applications.length > 0 && selectedAppCount === 0) {
      setSelectedAppIds(buildDefaultSet(applications, 3));
    }
  }, [applications, selectedAppCount]);

  // Initialize entry selection when switching to entries view
  const selectedEntryCount = selectedEntryIds.size;
  React.useEffect(() => {
    if (
      viewLevel === "entries" &&
      selectedEntryCount === 0 &&
      allEntries.length > 0
    ) {
      setSelectedEntryIds(buildDefaultSet(allEntries, 5));
    }
  }, [viewLevel, allEntries, selectedEntryCount]);

  // Get color for each application
  const appColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [index, app] of applications.entries()) {
      map[app.id] = CHART_COLORS[index % CHART_COLORS.length];
    }
    return map;
  }, [applications]);

  // Get color for each entry
  const entryColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [index, entry] of allEntries.entries()) {
      map[entry.id] = CHART_COLORS[index % CHART_COLORS.length];
    }
    return map;
  }, [allEntries]);

  // Build chart config dynamically based on view level
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};

    if (viewLevel === "applications") {
      for (const app of applications) {
        if (selectedAppIds.has(app.id)) {
          config[app.id] = {
            label: app.tla || app.applicationName,
            color: appColorMap[app.id],
          };
        }
      }
    } else {
      for (const entry of allEntries) {
        if (selectedEntryIds.has(entry.id)) {
          config[entry.id] = {
            label: entry.name,
            color: entryColorMap[entry.id],
          };
        }
      }
    }

    return config;
  }, [
    viewLevel,
    applications,
    allEntries,
    selectedAppIds,
    selectedEntryIds,
    appColorMap,
    entryColorMap,
  ]);

  // Build chart data based on view level
  const chartData = useMemo(() => {
    return displayMonths.map(({ year, month, label, isFuture }) => {
      const dataPoint: Record<string, string | number | null> = {
        month: label,
      };
      const key = `${year}-${month}`;

      if (isFuture) {
        return dataPoint;
      }

      if (viewLevel === "applications") {
        buildAppDataPoint(
          dataPoint,
          applications,
          selectedAppIds,
          entriesByApp,
          availabilityByEntry,
          volumeByEntry,
          chartMetric,
          key
        );
      } else {
        buildEntryDataPoint(
          dataPoint,
          allEntries,
          selectedEntryIds,
          availabilityByEntry,
          volumeByEntry,
          chartMetric,
          key
        );
      }

      return dataPoint;
    });
  }, [
    displayMonths,
    viewLevel,
    applications,
    allEntries,
    selectedAppIds,
    selectedEntryIds,
    entriesByApp,
    availabilityByEntry,
    volumeByEntry,
    chartMetric,
  ]);

  const toggleApp = (appId: string) => {
    setSelectedAppIds((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) {
        if (next.size > 1) {
          next.delete(appId);
        }
      } else {
        next.add(appId);
      }
      return next;
    });
  };

  const toggleEntry = (entryId: string) => {
    setSelectedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        if (next.size > 1) {
          next.delete(entryId);
        }
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const selectAllApps = () => {
    setSelectedAppIds(new Set(applications.map((app) => app.id)));
  };

  const clearAllApps = () => {
    if (applications.length > 0) {
      setSelectedAppIds(new Set([applications[0].id]));
    }
  };

  const selectAllEntries = () => {
    setSelectedEntryIds(new Set(allEntries.map((entry) => entry.id)));
  };

  const clearAllEntries = () => {
    if (allEntries.length > 0) {
      setSelectedEntryIds(new Set([allEntries[0].id]));
    }
  };

  const selectedApps = applications.filter((app) => selectedAppIds.has(app.id));
  const selectedEntries = allEntries.filter((entry) =>
    selectedEntryIds.has(entry.id)
  );

  // Format volume for Y axis
  const formatYAxis = (value: number) => {
    if (chartMetric === "volume") {
      if (value >= 1e9) {
        return `${(value / 1e9).toFixed(1)}B`;
      }
      if (value >= 1e6) {
        return `${(value / 1e6).toFixed(1)}M`;
      }
      if (value >= 1e3) {
        return `${(value / 1e3).toFixed(1)}K`;
      }
      return String(value);
    }
    return `${value}%`;
  };

  // Get current selection based on view level
  const currentColorMap =
    viewLevel === "applications" ? appColorMap : entryColorMap;
  const currentSelection =
    viewLevel === "applications" ? selectedApps : selectedEntries;
  const currentSelectionIds =
    viewLevel === "applications" ? selectedAppIds : selectedEntryIds;

  const tooltipFormatter = (value: unknown, name: unknown) => {
    let label = String(name);
    if (viewLevel === "applications") {
      const app = applications.find((a) => a.id === name);
      label = app?.tla || app?.applicationName || String(name);
    } else {
      const entry = allEntries.find((e) => e.id === name);
      label = entry?.name || String(name);
    }
    const formattedValue =
      chartMetric === "availability"
        ? `${value}%`
        : formatYAxis(value as number);
    return [formattedValue, label];
  };

  const chartKey = `${chartType}-${chartMetric}-${currentSelectionIds.size}-${viewLevel}`;
  const chartMargin = { top: 20, right: 10, left: 0, bottom: 20 };
  const yDomain = chartMetric === "availability" ? [0, 100] : ["auto", "auto"];

  const renderChart = () => {
    if (chartType === "area") {
      return (
        <AreaChart data={chartData} key={chartKey} margin={chartMargin}>
          <CartesianGrid
            className="stroke-muted/20"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            className="fill-muted-foreground"
            dataKey="month"
            fontSize={11}
            tickLine={false}
            tickMargin={12}
          />
          <YAxis
            axisLine={false}
            className="fill-muted-foreground"
            domain={yDomain}
            fontSize={11}
            tickFormatter={formatYAxis}
            tickLine={false}
            tickMargin={12}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-48 rounded-md border-border bg-background shadow-md"
                formatter={tooltipFormatter}
                indicator="line"
              />
            }
          />
          <ChartLegend content={<ChartLegendContent className="pt-4" />} />
          {currentSelection.map((item) => (
            <Area
              animationDuration={1000}
              connectNulls
              dataKey={item.id}
              fill={currentColorMap[item.id]}
              fillOpacity={0.1}
              key={item.id}
              name={item.id}
              stroke={currentColorMap[item.id]}
              strokeWidth={2}
              type="monotone"
            />
          ))}
        </AreaChart>
      );
    }
    if (chartType === "bar") {
      return (
        <BarChart data={chartData} key={chartKey} margin={chartMargin}>
          <CartesianGrid
            className="stroke-muted/20"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            className="fill-muted-foreground"
            dataKey="month"
            fontSize={11}
            tickLine={false}
            tickMargin={12}
          />
          <YAxis
            axisLine={false}
            className="fill-muted-foreground"
            domain={yDomain}
            fontSize={11}
            tickFormatter={formatYAxis}
            tickLine={false}
            tickMargin={12}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                className="w-48 rounded-md border-border bg-background shadow-md"
                formatter={tooltipFormatter}
                indicator="line"
              />
            }
          />
          <ChartLegend content={<ChartLegendContent className="pt-4" />} />
          {currentSelection.map((item) => (
            <Bar
              animationDuration={1000}
              className="opacity-90 transition-opacity hover:opacity-100"
              dataKey={item.id}
              fill={currentColorMap[item.id]}
              key={item.id}
              name={item.id}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      );
    }
    return (
      <LineChart data={chartData} key={chartKey} margin={chartMargin}>
        <CartesianGrid
          className="stroke-muted/20"
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          axisLine={false}
          className="fill-muted-foreground"
          dataKey="month"
          fontSize={11}
          tickLine={false}
          tickMargin={12}
        />
        <YAxis
          axisLine={false}
          className="fill-muted-foreground"
          domain={yDomain}
          fontSize={11}
          tickFormatter={formatYAxis}
          tickLine={false}
          tickMargin={12}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="w-48 rounded-md border-border bg-background shadow-md"
              formatter={tooltipFormatter}
              indicator="line"
            />
          }
        />
        <ChartLegend content={<ChartLegendContent className="pt-4" />} />
        {currentSelection.map((item) => (
          <Line
            activeDot={{
              r: 4,
              fill: currentColorMap[item.id],
              strokeWidth: 0,
            }}
            animationDuration={1000}
            connectNulls
            dataKey={item.id}
            dot={false}
            key={item.id}
            name={item.id}
            stroke={currentColorMap[item.id]}
            strokeWidth={2}
            type="monotone"
          />
        ))}
      </LineChart>
    );
  };

  const formatDisplayValue = (
    metric: "availability" | "volume",
    avgValue: number,
    count: number,
    totalValue: number
  ): string => {
    if (metric === "availability") {
      return count > 0 ? `${(avgValue / count).toFixed(2)}%` : "N/A";
    }
    return formatYAxis(totalValue);
  };

  const computeAppSummary = (app: Application, pastMonths: MonthInfo[]) => {
    let avgValue = 0;
    let count = 0;
    let totalValue = 0;
    const appEntries = entriesByApp[app.id] || [];

    for (const { year, month } of pastMonths) {
      const key = `${year}-${month}`;
      if (chartMetric === "availability") {
        const result = aggregateAppAvailability(
          appEntries,
          availabilityByEntry,
          key
        );
        avgValue += result.totalAvail;
        count += result.availCount;
      } else {
        for (const entry of appEntries) {
          const vol = volumeByEntry[entry.id]?.[key];
          if (vol) {
            totalValue += vol.volume;
            count++;
          }
        }
      }
    }

    return {
      itemName: app.tla || app.applicationName,
      subLabel: `${appEntries.length} sub-apps`,
      displayValue: formatDisplayValue(
        chartMetric,
        avgValue,
        count,
        totalValue
      ),
    };
  };

  const computeEntrySummary = (
    entry: ScorecardEntry & { appName: string; appTla: string },
    pastMonths: MonthInfo[]
  ) => {
    let avgValue = 0;
    let count = 0;
    let totalValue = 0;

    for (const { year, month } of pastMonths) {
      const key = `${year}-${month}`;
      if (chartMetric === "availability") {
        const av = availabilityByEntry[entry.id]?.[key];
        if (av) {
          avgValue += Number.parseFloat(av.availability);
          count++;
        }
      } else {
        const vol = volumeByEntry[entry.id]?.[key];
        if (vol) {
          totalValue += vol.volume;
          count++;
        }
      }
    }

    return {
      itemName: entry.name,
      subLabel: entry.appTla,
      displayValue: formatDisplayValue(
        chartMetric,
        avgValue,
        count,
        totalValue
      ),
    };
  };

  const computeSummaryValues = (
    item: Application | (ScorecardEntry & { appName: string; appTla: string })
  ) => {
    const pastMonths = displayMonths.filter((m) => !m.isFuture);
    if (viewLevel === "applications") {
      return computeAppSummary(item as Application, pastMonths);
    }
    return computeEntrySummary(
      item as ScorecardEntry & { appName: string; appTla: string },
      pastMonths
    );
  };

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="flex w-full min-w-[50vw] flex-col bg-background p-0 sm:max-w-3xl lg:max-w-5xl xl:max-w-[1200px]"
        showCloseButton={true}
        side="right"
      >
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="font-semibold text-xl">
                Metrics Visualization
              </SheetTitle>
              <SheetDescription className="mt-0.5 text-muted-foreground text-xs">
                Comparing{" "}
                {viewLevel === "applications"
                  ? `${applications.length} applications`
                  : `${allEntries.length} sub-applications`}{" "}
                for {filterLabel}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Controls Section */}
          <div className="space-y-4 border-b bg-muted/30 px-6 py-4">
            {/* Top Toolbar */}
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="flex flex-wrap items-center gap-4">
                {/* View Level Toggle */}
                <Tabs
                  onValueChange={(v) => setViewLevel(v as ViewLevel)}
                  value={viewLevel}
                >
                  <TabsList>
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                    <TabsTrigger value="entries">Sub-Apps</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="hidden h-4 w-px bg-border md:block" />

                {/* Metric Toggle */}
                <Tabs
                  onValueChange={(v) =>
                    setChartMetric(v as "availability" | "volume")
                  }
                  value={chartMetric}
                >
                  <TabsList>
                    <TabsTrigger value="availability">Availability</TabsTrigger>
                    <TabsTrigger value="volume">Volume</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Chart Type */}
              <div className="flex items-center rounded-md border bg-muted p-1">
                {(["area", "bar", "line"] as const).map((type) => (
                  <Button
                    className={cn(
                      "h-7 rounded-sm px-2.5 font-medium text-xs",
                      chartType === type &&
                        "bg-white shadow-sm dark:bg-zinc-800"
                    )}
                    key={type}
                    onClick={() => setChartType(type)}
                    size="sm"
                    variant={chartType === type ? "secondary" : "ghost"}
                  >
                    <span className="capitalize">{type}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Selection Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  {viewLevel === "applications"
                    ? "Applications"
                    : "Sub-Applications"}{" "}
                  ({currentSelectionIds.size})
                </span>
                <div className="flex gap-2">
                  <Button
                    className="h-6 px-2 text-[10px] text-muted-foreground"
                    onClick={
                      viewLevel === "applications"
                        ? selectAllApps
                        : selectAllEntries
                    }
                    size="sm"
                    variant="ghost"
                  >
                    Select All
                  </Button>
                  <Button
                    className="h-6 px-2 text-[10px] text-muted-foreground"
                    onClick={
                      viewLevel === "applications"
                        ? clearAllApps
                        : clearAllEntries
                    }
                    size="sm"
                    variant="ghost"
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="flex max-h-[100px] flex-wrap gap-2 overflow-y-auto">
                {viewLevel === "applications"
                  ? applications.map((app) => {
                      const isSelected = selectedAppIds.has(app.id);
                      const color = appColorMap[app.id];

                      return (
                        <Badge
                          className={cn(
                            "cursor-pointer gap-2 px-2 py-1 font-normal text-xs transition-colors hover:bg-muted-foreground/10",
                            !isSelected &&
                              "border-muted-foreground/30 border-dashed bg-transparent text-muted-foreground"
                          )}
                          key={app.id}
                          onClick={() => toggleApp(app.id)}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: `${color}15`,
                                  color,
                                  borderColor: `${color}40`,
                                  borderWidth: "1px",
                                  borderStyle: "solid",
                                }
                              : {}
                          }
                          variant={isSelected ? "default" : "outline"}
                        >
                          <div
                            className={cn("h-2 w-2 rounded-full")}
                            style={{
                              backgroundColor: isSelected
                                ? color
                                : "currentColor",
                              opacity: isSelected ? 1 : 0.3,
                            }}
                          />
                          {app.tla || app.applicationName}
                        </Badge>
                      );
                    })
                  : applications.map((app) => {
                      const appEntries = entriesByApp[app.id] || [];
                      if (appEntries.length === 0) {
                        return null;
                      }

                      return (
                        <div className="contents" key={app.id}>
                          {appEntries.map((entry) => {
                            const isSelected = selectedEntryIds.has(entry.id);
                            const color = entryColorMap[entry.id];

                            return (
                              <Badge
                                className={cn(
                                  "cursor-pointer gap-2 px-2 py-1 font-normal text-xs transition-colors hover:bg-muted-foreground/10",
                                  !isSelected &&
                                    "border-muted-foreground/30 border-dashed bg-transparent text-muted-foreground"
                                )}
                                key={entry.id}
                                onClick={() => toggleEntry(entry.id)}
                                style={
                                  isSelected
                                    ? {
                                        backgroundColor: `${color}15`,
                                        color,
                                        borderColor: `${color}40`,
                                        borderWidth: "1px",
                                        borderStyle: "solid",
                                      }
                                    : {}
                                }
                                variant={isSelected ? "default" : "outline"}
                              >
                                <div
                                  className={cn("h-2 w-2 rounded-full")}
                                  style={{
                                    backgroundColor: isSelected
                                      ? color
                                      : "currentColor",
                                    opacity: isSelected ? 1 : 0.3,
                                  }}
                                />
                                {entry.name}
                              </Badge>
                            );
                          })}
                        </div>
                      );
                    })}
              </div>
            </div>
          </div>

          {/* Main Chart Area */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            {currentSelection.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-muted-foreground/10 border-dashed bg-muted/5 p-12 text-muted-foreground">
                <div className="mb-3 rounded-full bg-muted p-3">
                  <Filter className="h-6 w-6 opacity-40" />
                </div>
                <p className="font-semibold text-foreground/70 text-sm">
                  No Items Selected
                </p>
                <p className="mt-1 max-w-xs text-center text-muted-foreground text-xs">
                  Select{" "}
                  {viewLevel === "applications"
                    ? "applications"
                    : "sub-applications"}{" "}
                  to visualize.
                </p>
              </div>
            ) : (
              <div className="space-y-6 pb-8">
                <div className="h-[450px] w-full rounded-xl border bg-background p-4 shadow-xs">
                  <ChartContainer
                    className="h-full w-full"
                    config={chartConfig}
                  >
                    {renderChart()}
                  </ChartContainer>
                </div>

                {/* Summary Cards */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 px-1 font-medium text-foreground/80 text-sm">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Performance Breakdown
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {currentSelection.map((item) => {
                      const { itemName, displayValue } =
                        computeSummaryValues(item);

                      return (
                        <div
                          className="group relative flex flex-col overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/20"
                          key={item.id}
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <span
                              className="truncate pr-2 font-medium text-foreground/90 text-sm"
                              title={itemName}
                            >
                              {itemName}
                            </span>
                            <div
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: currentColorMap[item.id],
                              }}
                            />
                          </div>

                          <div className="mt-auto">
                            <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-widest">
                              {chartMetric === "availability"
                                ? "Average"
                                : "Tot. Vol."}
                            </p>
                            <p className="mt-0.5 font-bold text-foreground text-xl tabular-nums tracking-tight">
                              {displayValue}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
