import React, { useState, useMemo } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    Bar,
    BarChart,
    Line,
    LineChart,
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";
import {
    TrendingUp,
    LineChart as LineChartIcon,
    AreaChart as AreaChartIcon,
    BarChartIcon,
    Check,
    PieChart,
    Activity,
    Layers,
    Filter,
    ChevronRight,
    Building2,
    Puzzle,
} from "lucide-react";
import type {
    Application,
    ScorecardEntry,
    AvailabilityRecord,
    VolumeRecord,
    MonthInfo,
} from "./types";
import { cn } from "@/lib/utils";

// Vibrant, distinguishable color palette using HSL values
const CHART_COLORS = [
    "hsl(221, 83%, 53%)",   // Blue
    "hsl(142, 71%, 45%)",   // Green
    "hsl(262, 83%, 58%)",   // Purple
    "hsl(25, 95%, 53%)",    // Orange
    "hsl(346, 77%, 49%)",   // Rose
    "hsl(174, 72%, 40%)",   // Teal
    "hsl(43, 96%, 56%)",    // Amber
    "hsl(289, 67%, 53%)",   // Fuchsia
    "hsl(199, 89%, 48%)",   // Cyan
    "hsl(0, 72%, 51%)",     // Red
    "hsl(84, 81%, 44%)",    // Lime
    "hsl(330, 81%, 60%)",   // Pink
];

interface MetricsChartSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    applications: Application[];
    entriesByApp: Record<string, ScorecardEntry[]>;
    availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
    volumeByEntry: Record<string, Record<string, VolumeRecord>>;
    displayMonths: MonthInfo[];
    filterLabel: string;
}

type ViewLevel = "applications" | "entries";

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
    const [chartMetric, setChartMetric] = useState<"availability" | "volume">("availability");
    const [chartType, setChartType] = useState<"line" | "bar" | "area">("area");
    const [viewLevel, setViewLevel] = useState<ViewLevel>("applications");

    // For application-level view
    const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(() => {
        const defaultSet = new Set<string>();
        applications.slice(0, 3).forEach(app => defaultSet.add(app.id));
        return defaultSet;
    });

    // For entry-level view
    const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());

    // Get all entries flattened
    const allEntries = useMemo(() => {
        const entries: (ScorecardEntry & { appName: string; appTla: string })[] = [];
        applications.forEach(app => {
            const appEntries = entriesByApp[app.id] || [];
            appEntries.forEach(entry => {
                entries.push({
                    ...entry,
                    appName: app.applicationName,
                    appTla: app.tla || app.applicationName,
                });
            });
        });
        return entries;
    }, [applications, entriesByApp]);

    // Update selected apps when applications change
    React.useEffect(() => {
        if (applications.length > 0 && selectedAppIds.size === 0) {
            const defaultSet = new Set<string>();
            applications.slice(0, 3).forEach(app => defaultSet.add(app.id));
            setSelectedAppIds(defaultSet);
        }
    }, [applications]);

    // Initialize entry selection when switching to entries view
    React.useEffect(() => {
        if (viewLevel === "entries" && selectedEntryIds.size === 0 && allEntries.length > 0) {
            const defaultSet = new Set<string>();
            allEntries.slice(0, 5).forEach(entry => defaultSet.add(entry.id));
            setSelectedEntryIds(defaultSet);
        }
    }, [viewLevel, allEntries]);

    // Get color for each application
    const appColorMap = useMemo(() => {
        const map: Record<string, string> = {};
        applications.forEach((app, index) => {
            map[app.id] = CHART_COLORS[index % CHART_COLORS.length];
        });
        return map;
    }, [applications]);

    // Get color for each entry
    const entryColorMap = useMemo(() => {
        const map: Record<string, string> = {};
        allEntries.forEach((entry, index) => {
            map[entry.id] = CHART_COLORS[index % CHART_COLORS.length];
        });
        return map;
    }, [allEntries]);

    // Build chart config dynamically based on view level
    const chartConfig = useMemo(() => {
        const config: ChartConfig = {};

        if (viewLevel === "applications") {
            applications.forEach((app) => {
                if (selectedAppIds.has(app.id)) {
                    config[app.id] = {
                        label: app.tla || app.applicationName,
                        color: appColorMap[app.id],
                    };
                }
            });
        } else {
            allEntries.forEach((entry) => {
                if (selectedEntryIds.has(entry.id)) {
                    config[entry.id] = {
                        label: entry.name,
                        color: entryColorMap[entry.id],
                    };
                }
            });
        }

        return config;
    }, [viewLevel, applications, allEntries, selectedAppIds, selectedEntryIds, appColorMap, entryColorMap]);

    // Build chart data based on view level
    const chartData = useMemo(() => {
        return displayMonths.map(({ year, month, label, isFuture }) => {
            const dataPoint: Record<string, any> = { month: label };
            const key = `${year}-${month}`;

            if (isFuture) {
                return dataPoint;
            }

            if (viewLevel === "applications") {
                // Aggregate by application
                applications.forEach((app) => {
                    if (!selectedAppIds.has(app.id)) return;

                    const appEntries = entriesByApp[app.id] || [];

                    if (chartMetric === "availability") {
                        let totalAvail = 0;
                        let availCount = 0;

                        appEntries.forEach((entry) => {
                            const av = availabilityByEntry[entry.id]?.[key];
                            if (av) {
                                const val = parseFloat(av.availability);
                                if (!isNaN(val)) {
                                    totalAvail += val;
                                    availCount++;
                                }
                            }
                        });

                        dataPoint[app.id] = availCount > 0
                            ? parseFloat((totalAvail / availCount).toFixed(2))
                            : null;
                    } else {
                        let totalVol = 0;

                        appEntries.forEach((entry) => {
                            const vol = volumeByEntry[entry.id]?.[key];
                            if (vol) {
                                totalVol += vol.volume;
                            }
                        });

                        dataPoint[app.id] = totalVol > 0 ? totalVol : null;
                    }
                });
            } else {
                // Individual entries
                allEntries.forEach((entry) => {
                    if (!selectedEntryIds.has(entry.id)) return;

                    if (chartMetric === "availability") {
                        const av = availabilityByEntry[entry.id]?.[key];
                        if (av) {
                            const val = parseFloat(av.availability);
                            dataPoint[entry.id] = !isNaN(val) ? val : null;
                        } else {
                            dataPoint[entry.id] = null;
                        }
                    } else {
                        const vol = volumeByEntry[entry.id]?.[key];
                        dataPoint[entry.id] = vol ? vol.volume : null;
                    }
                });
            }

            return dataPoint;
        });
    }, [displayMonths, viewLevel, applications, allEntries, selectedAppIds, selectedEntryIds, entriesByApp, availabilityByEntry, volumeByEntry, chartMetric]);

    const toggleApp = (appId: string) => {
        setSelectedAppIds(prev => {
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
        setSelectedEntryIds(prev => {
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
        setSelectedAppIds(new Set(applications.map(app => app.id)));
    };

    const clearAllApps = () => {
        if (applications.length > 0) {
            setSelectedAppIds(new Set([applications[0].id]));
        }
    };

    const selectAllEntries = () => {
        setSelectedEntryIds(new Set(allEntries.map(entry => entry.id)));
    };

    const clearAllEntries = () => {
        if (allEntries.length > 0) {
            setSelectedEntryIds(new Set([allEntries[0].id]));
        }
    };

    const selectedApps = applications.filter(app => selectedAppIds.has(app.id));
    const selectedEntries = allEntries.filter(entry => selectedEntryIds.has(entry.id));

    // Format volume for Y axis
    const formatYAxis = (value: number) => {
        if (chartMetric === "volume") {
            if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
            if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
            if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
            return String(value);
        }
        return `${value}%`;
    };

    // Get current selection based on view level
    const currentColorMap = viewLevel === "applications" ? appColorMap : entryColorMap;
    const currentSelection = viewLevel === "applications" ? selectedApps : selectedEntries;
    const currentSelectionIds = viewLevel === "applications" ? selectedAppIds : selectedEntryIds;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-3xl lg:max-w-5xl xl:max-w-[1400px] min-w-[90vw] p-0 flex flex-col bg-slate-50/50 dark:bg-zinc-950/50 backdrop-blur-md"
                showCloseButton={true}
            >
                <SheetHeader className="px-8 py-6 border-b sticky top-0 bg-background/80 backdrop-blur-xl z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-inner border border-white/50 dark:border-white/5">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
                                Metrics Visualization
                            </SheetTitle>
                            <SheetDescription className="text-muted-foreground/90 font-medium mt-1">
                                Comparing {viewLevel === "applications" ? applications.length + " applications" : allEntries.length + " sub-applications"} for {filterLabel}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Controls Section */}
                    <div className="px-8 py-6 z-10 space-y-6">

                        {/* Top Toolbar */}
                        <div className="flex flex-col xl:flex-row gap-4 p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border shadow-sm">

                            {/* View Level Toggle */}
                            <div className="bg-muted/30 p-1.5 rounded-xl flex">
                                <button
                                    onClick={() => setViewLevel("applications")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
                                        viewLevel === "applications"
                                            ? "bg-white dark:bg-zinc-800 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <Building2 className="w-4 h-4" />
                                    Applications
                                </button>
                                <button
                                    onClick={() => setViewLevel("entries")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
                                        viewLevel === "entries"
                                            ? "bg-white dark:bg-zinc-800 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <Puzzle className="w-4 h-4" />
                                    Sub-Apps
                                </button>
                            </div>

                            <div className="w-px bg-border my-2 hidden xl:block" />

                            {/* Metric Toggle */}
                            <div className="bg-muted/30 p-1.5 rounded-xl flex-1 flex">
                                <button
                                    onClick={() => setChartMetric("availability")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
                                        chartMetric === "availability"
                                            ? "bg-white dark:bg-zinc-800 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <Activity className="w-4 h-4" />
                                    Availability
                                </button>
                                <button
                                    onClick={() => setChartMetric("volume")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
                                        chartMetric === "volume"
                                            ? "bg-white dark:bg-zinc-800 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                >
                                    <PieChart className="w-4 h-4" />
                                    Volume
                                </button>
                            </div>

                            <div className="w-px bg-border my-2 hidden xl:block" />

                            {/* Chart Type Toggle */}
                            <div className="bg-muted/30 p-1.5 rounded-xl flex items-center">
                                {(["area", "bar", "line"] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setChartType(type)}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                                            chartType === type
                                                ? "bg-white dark:bg-zinc-800 text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        {type === "area" && <AreaChartIcon className="w-4 h-4" />}
                                        {type === "bar" && <BarChartIcon className="w-4 h-4" />}
                                        {type === "line" && <LineChartIcon className="w-4 h-4" />}
                                        <span className="capitalize hidden sm:inline">{type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Selection Area */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                                    <Layers className="w-4 h-4 text-primary" />
                                    {viewLevel === "applications" ? "Select Applications" : "Select Sub-Applications"}
                                    <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                                        {currentSelectionIds.size} Selected
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs font-medium gap-1.5 hover:bg-primary/5 hover:text-primary transition-colors text-muted-foreground"
                                        onClick={viewLevel === "applications" ? selectAllApps : selectAllEntries}
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs font-medium gap-1.5 hover:bg-destructive/5 hover:text-destructive transition-colors text-muted-foreground"
                                        onClick={viewLevel === "applications" ? clearAllApps : clearAllEntries}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2.5 max-h-[160px] overflow-y-auto pr-2 pb-2">
                                {viewLevel === "applications" ? (
                                    // Application chips
                                    applications.map((app) => {
                                        const isSelected = selectedAppIds.has(app.id);
                                        const color = appColorMap[app.id];
                                        const entryCount = entriesByApp[app.id]?.length || 0;

                                        return (
                                            <button
                                                key={app.id}
                                                onClick={() => toggleApp(app.id)}
                                                className={cn(
                                                    "group relative inline-flex items-center gap-2 pl-2 pr-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border select-none overflow-hidden",
                                                    isSelected
                                                        ? "border-transparent bg-white dark:bg-zinc-800 text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                                        : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "absolute left-0 top-0 bottom-0 w-1 transition-all",
                                                        isSelected ? "opacity-100" : "opacity-0"
                                                    )}
                                                    style={{ backgroundColor: color }}
                                                />

                                                <div
                                                    className={cn(
                                                        "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 border",
                                                        isSelected ? "border-transparent text-white scale-100" : "border-muted-foreground/30 bg-transparent scale-90"
                                                    )}
                                                    style={isSelected ? { backgroundColor: color } : {}}
                                                >
                                                    {isSelected && <Check className="w-2.5 h-2.5" strokeWidth={3} />}
                                                </div>

                                                <span className="truncate max-w-[120px]">
                                                    {app.tla || app.applicationName}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
                                                    {entryCount}
                                                </span>
                                            </button>
                                        );
                                    })
                                ) : (
                                    // Entry chips - grouped by application
                                    applications.map((app) => {
                                        const appEntries = entriesByApp[app.id] || [];
                                        if (appEntries.length === 0) return null;

                                        return (
                                            <div key={app.id} className="flex flex-wrap gap-2 items-center">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1 bg-muted/30 rounded-lg flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" />
                                                    {app.tla || app.applicationName}
                                                    <ChevronRight className="w-3 h-3" />
                                                </span>
                                                {appEntries.map((entry) => {
                                                    const isSelected = selectedEntryIds.has(entry.id);
                                                    const color = entryColorMap[entry.id];

                                                    return (
                                                        <button
                                                            key={entry.id}
                                                            onClick={() => toggleEntry(entry.id)}
                                                            className={cn(
                                                                "group relative inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 border select-none overflow-hidden",
                                                                isSelected
                                                                    ? "border-transparent bg-white dark:bg-zinc-800 text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                                                    : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70"
                                                            )}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    "absolute left-0 top-0 bottom-0 w-1 transition-all",
                                                                    isSelected ? "opacity-100" : "opacity-0"
                                                                )}
                                                                style={{ backgroundColor: color }}
                                                            />

                                                            <div
                                                                className={cn(
                                                                    "w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300 border",
                                                                    isSelected ? "border-transparent text-white scale-100" : "border-muted-foreground/30 bg-transparent scale-90"
                                                                )}
                                                                style={isSelected ? { backgroundColor: color } : {}}
                                                            >
                                                                {isSelected && <Check className="w-2 h-2" strokeWidth={3} />}
                                                            </div>

                                                            <span className="truncate max-w-[100px]">
                                                                {entry.name}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Chart Area */}
                    <div className="flex-1 px-8 pb-8 overflow-y-auto min-h-0">
                        {currentSelection.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 border-2 border-dashed border-muted-foreground/10 rounded-3xl bg-white/50 dark:bg-zinc-900/50">
                                <div className="p-4 rounded-full bg-muted/50 mb-4">
                                    <Filter className="w-8 h-8 opacity-40" />
                                </div>
                                <p className="font-semibold text-lg text-foreground/70">No Items Selected</p>
                                <p className="text-sm mt-1 max-w-xs text-center">
                                    Select {viewLevel === "applications" ? "applications" : "sub-applications"} from the list above to visualize their metrics.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8 pb-8">
                                <div className="h-[500px] w-full border rounded-3xl p-6 bg-white dark:bg-zinc-900 shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                                    <ChartContainer config={chartConfig} className="h-full w-full">
                                        {chartType === 'area' ? (
                                            <AreaChart
                                                key={`${chartType}-${chartMetric}-${currentSelectionIds.size}-${viewLevel}`}
                                                data={chartData}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                            >
                                                <defs>
                                                    {currentSelection.map((item) => (
                                                        <linearGradient key={`gradient-${item.id}`} id={`gradient-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={currentColorMap[item.id]} stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor={currentColorMap[item.id]} stopOpacity={0.05} />
                                                        </linearGradient>
                                                    ))}
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                                                <XAxis
                                                    dataKey="month"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={12}
                                                    fontSize={12}
                                                    className="fill-muted-foreground font-medium"
                                                />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={12}
                                                    fontSize={12}
                                                    tickFormatter={formatYAxis}
                                                    domain={chartMetric === 'availability' ? [0, 100] : ['auto', 'auto']}
                                                    className="fill-muted-foreground font-medium"
                                                />
                                                <ChartTooltip
                                                    content={
                                                        <ChartTooltipContent
                                                            indicator="dot"
                                                            className="w-56 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-border/50 shadow-xl rounded-xl"
                                                            formatter={(value, name) => {
                                                                let label = String(name);
                                                                if (viewLevel === "applications") {
                                                                    const app = applications.find(a => a.id === name);
                                                                    label = app?.tla || app?.applicationName || String(name);
                                                                } else {
                                                                    const entry = allEntries.find(e => e.id === name);
                                                                    label = entry?.name || String(name);
                                                                }
                                                                const formattedValue = chartMetric === 'availability'
                                                                    ? `${value}%`
                                                                    : formatYAxis(value as number);
                                                                return [formattedValue, label];
                                                            }}
                                                        />
                                                    }
                                                />
                                                <ChartLegend content={<ChartLegendContent className="py-6" />} />
                                                {currentSelection.map((item) => (
                                                    <Area
                                                        key={item.id}
                                                        type="monotone"
                                                        dataKey={item.id}
                                                        name={item.id}
                                                        stroke={currentColorMap[item.id]}
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill={`url(#gradient-${item.id})`}
                                                        animationDuration={1500}
                                                        connectNulls
                                                    />
                                                ))}
                                            </AreaChart>
                                        ) : chartType === 'bar' ? (
                                            <BarChart
                                                key={`${chartType}-${chartMetric}-${currentSelectionIds.size}-${viewLevel}`}
                                                data={chartData}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                                                <XAxis
                                                    dataKey="month"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={12}
                                                    fontSize={12}
                                                    className="fill-muted-foreground font-medium"
                                                />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={12}
                                                    fontSize={12}
                                                    tickFormatter={formatYAxis}
                                                    domain={chartMetric === 'availability' ? [0, 100] : ['auto', 'auto']}
                                                    className="fill-muted-foreground font-medium"
                                                />
                                                <ChartTooltip
                                                    content={
                                                        <ChartTooltipContent
                                                            indicator="dot"
                                                            className="w-56 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-border/50 shadow-xl rounded-xl"
                                                            formatter={(value, name) => {
                                                                let label = String(name);
                                                                if (viewLevel === "applications") {
                                                                    const app = applications.find(a => a.id === name);
                                                                    label = app?.tla || app?.applicationName || String(name);
                                                                } else {
                                                                    const entry = allEntries.find(e => e.id === name);
                                                                    label = entry?.name || String(name);
                                                                }
                                                                const formattedValue = chartMetric === 'availability'
                                                                    ? `${value}%`
                                                                    : formatYAxis(value as number);
                                                                return [formattedValue, label];
                                                            }}
                                                        />
                                                    }
                                                />
                                                <ChartLegend content={<ChartLegendContent className="py-6" />} />
                                                {currentSelection.map((item) => (
                                                    <Bar
                                                        key={item.id}
                                                        dataKey={item.id}
                                                        name={item.id}
                                                        fill={currentColorMap[item.id]}
                                                        radius={[6, 6, 0, 0]}
                                                        animationDuration={1500}
                                                        className="opacity-90 hover:opacity-100 transition-opacity"
                                                    />
                                                ))}
                                            </BarChart>
                                        ) : (
                                            <LineChart
                                                key={`${chartType}-${chartMetric}-${currentSelectionIds.size}-${viewLevel}`}
                                                data={chartData}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                                                <XAxis
                                                    dataKey="month"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={12}
                                                    fontSize={12}
                                                    className="fill-muted-foreground font-medium"
                                                />
                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickMargin={12}
                                                    fontSize={12}
                                                    tickFormatter={formatYAxis}
                                                    domain={chartMetric === 'availability' ? [0, 100] : ['auto', 'auto']}
                                                    className="fill-muted-foreground font-medium"
                                                />
                                                <ChartTooltip
                                                    content={
                                                        <ChartTooltipContent
                                                            indicator="dot"
                                                            className="w-56 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-border/50 shadow-xl rounded-xl"
                                                            formatter={(value, name) => {
                                                                let label = String(name);
                                                                if (viewLevel === "applications") {
                                                                    const app = applications.find(a => a.id === name);
                                                                    label = app?.tla || app?.applicationName || String(name);
                                                                } else {
                                                                    const entry = allEntries.find(e => e.id === name);
                                                                    label = entry?.name || String(name);
                                                                }
                                                                const formattedValue = chartMetric === 'availability'
                                                                    ? `${value}%`
                                                                    : formatYAxis(value as number);
                                                                return [formattedValue, label];
                                                            }}
                                                        />
                                                    }
                                                />
                                                <ChartLegend content={<ChartLegendContent className="py-6" />} />
                                                {currentSelection.map((item) => (
                                                    <Line
                                                        key={item.id}
                                                        type="monotone"
                                                        dataKey={item.id}
                                                        name={item.id}
                                                        stroke={currentColorMap[item.id]}
                                                        strokeWidth={3}
                                                        dot={{ r: 4, fill: currentColorMap[item.id], strokeWidth: 2, stroke: "#fff" }}
                                                        activeDot={{ r: 7, fill: currentColorMap[item.id], strokeWidth: 4, stroke: "white" }}
                                                        animationDuration={1500}
                                                        connectNulls
                                                    />
                                                ))}
                                            </LineChart>
                                        )}
                                    </ChartContainer>
                                </div>

                                {/* Summary Cards */}
                                <div className="space-y-4">
                                    <h3 className="text-base font-semibold flex items-center gap-2 text-foreground/80 px-1">
                                        <TrendingUp className="w-5 h-5 text-primary" />
                                        Performance Breakdown
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {currentSelection.map((item) => {
                                            let avgValue = 0;
                                            let count = 0;
                                            let totalValue = 0;
                                            let itemName = "";
                                            let subLabel = "";

                                            if (viewLevel === "applications") {
                                                const app = item as Application;
                                                itemName = app.tla || app.applicationName;
                                                const appEntries = entriesByApp[app.id] || [];
                                                subLabel = `${appEntries.length} sub-apps`;

                                                displayMonths.forEach(({ year, month, isFuture }) => {
                                                    if (isFuture) return;
                                                    const key = `${year}-${month}`;

                                                    if (chartMetric === "availability") {
                                                        appEntries.forEach((entry) => {
                                                            const av = availabilityByEntry[entry.id]?.[key];
                                                            if (av) {
                                                                avgValue += parseFloat(av.availability);
                                                                count++;
                                                            }
                                                        });
                                                    } else {
                                                        appEntries.forEach((entry) => {
                                                            const vol = volumeByEntry[entry.id]?.[key];
                                                            if (vol) {
                                                                totalValue += vol.volume;
                                                                count++;
                                                            }
                                                        });
                                                    }
                                                });
                                            } else {
                                                const entry = item as ScorecardEntry & { appName: string; appTla: string };
                                                itemName = entry.name;
                                                subLabel = entry.appTla;

                                                displayMonths.forEach(({ year, month, isFuture }) => {
                                                    if (isFuture) return;
                                                    const key = `${year}-${month}`;

                                                    if (chartMetric === "availability") {
                                                        const av = availabilityByEntry[entry.id]?.[key];
                                                        if (av) {
                                                            avgValue += parseFloat(av.availability);
                                                            count++;
                                                        }
                                                    } else {
                                                        const vol = volumeByEntry[entry.id]?.[key];
                                                        if (vol) {
                                                            totalValue += vol.volume;
                                                            count++;
                                                        }
                                                    }
                                                });
                                            }

                                            const displayValue = chartMetric === "availability"
                                                ? count > 0 ? `${(avgValue / count).toFixed(2)}%` : "N/A"
                                                : formatYAxis(totalValue);

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="group flex flex-col p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden"
                                                >
                                                    <div
                                                        className="absolute left-0 top-0 bottom-0 w-1.5 transition-all"
                                                        style={{ backgroundColor: currentColorMap[item.id] }}
                                                    />
                                                    <div
                                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                                        style={{ background: `linear-gradient(120deg, ${currentColorMap[item.id]}10 0%, transparent 40%)` }}
                                                    />

                                                    <div className="flex items-start justify-between mb-1 relative">
                                                        <span className="font-semibold text-sm truncate pr-2 text-foreground/90" title={itemName}>
                                                            {itemName}
                                                        </span>
                                                        <div
                                                            className="w-2 h-2 rounded-full shadow-sm shrink-0"
                                                            style={{ backgroundColor: currentColorMap[item.id] }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground mb-3">{subLabel}</span>

                                                    <div className="mt-auto relative">
                                                        <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">
                                                            {chartMetric === "availability" ? "Average" : "Tot. Vol."}
                                                        </p>
                                                        <p className="text-2xl font-black tracking-tight mt-1 tabular-nums text-foreground">
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
