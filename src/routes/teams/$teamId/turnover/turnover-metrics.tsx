import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Star,
  Calendar,
  Download,
  TrendingUp,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegendContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { getTurnoverMetrics } from "@/app/actions/turnover";
import { SECTION_CONFIG, type TurnoverSection } from "@/lib/zod/turnover.schema";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Pie, PieChart as RechartsPieChart, Legend } from "recharts";
import type { DateRange } from "react-day-picker";
import { StatsSummaryItem } from "@/components/link-manager/shared";

export const Route = createFileRoute(
  "/teams/$teamId/turnover/turnover-metrics"
)({
  component: TurnoverMetricsPage,
});

function TurnoverMetricsPage() {
  const { teamId } = Route.useParams();

  // Default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Fetch metrics
  const { data: metrics } = useQuery({
    queryKey: ["turnover-metrics", teamId, dateRange?.from, dateRange?.to],
    queryFn: () =>
      getTurnoverMetrics({
        data: {
          teamId,
          startDate: (dateRange?.from || subDays(new Date(), 30)).toISOString(),
          endDate: (dateRange?.to || new Date()).toISOString(),
        },
      }),
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  // Export CSV
  const handleExport = () => {
    if (!metrics?.activityTrend) return;

    const csvContent = [
      ["Date", "Total Created", "Resolved", "Open"].join(","),
      ...metrics.activityTrend.map((d: any) =>
        [d.date, d.created, d.resolved, d.created - d.resolved].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `turnover-metrics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Prepare pie chart data
  const pieData = useMemo(() => {
    if (!metrics?.sectionDistribution) return [];
    return metrics.sectionDistribution.map((item: any) => ({
      name: item.section,
      value: item.count,
      // Color is now handled by ChartContainer via CSS variables mapped in chartConfig
    }));
  }, [metrics]);

  // Chart config - using direct HSL values for proper color rendering
  const chartConfig = {
    created: {
      label: "Created",
      color: "hsl(221.2 83.2% 53.3%)", // Blue
    },
    resolved: {
      label: "Resolved",
      color: "hsl(142.1 76.2% 36.3%)", // Green
    },
    RFC: {
      label: SECTION_CONFIG.RFC.shortName,
      color: "hsl(221.2 83.2% 53.3%)", // Chart 1 like blue
    },
    INC: {
      label: SECTION_CONFIG.INC.shortName,
      color: "hsl(0 84.2% 60.2%)", // Red
    },
    ALERTS: {
      label: SECTION_CONFIG.ALERTS.shortName,
      color: "hsl(24.6 95% 53.1%)", // Orange
    },
    MIM: {
      label: SECTION_CONFIG.MIM.shortName,
      color: "hsl(262.1 83.3% 57.8%)", // Purple
    },
    COMMS: {
      label: SECTION_CONFIG.COMMS.shortName,
      color: "hsl(142.1 76.2% 36.3%)", // Green
    },
    FYI: {
      label: SECTION_CONFIG.FYI.shortName,
      color: "hsl(215.4 16.3% 46.9%)", // Slate
    },
  };

  return (
    <div className="p-8 mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Turnover Intelligence
            </h1>
            <p className="text-muted-foreground">
              Comprehensive analysis of handover activities and resolution
              performance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger>
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM dd")} -{" "}
                      {format(dateRange.to, "MMM dd, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM dd, yyyy")
                  )
                ) : (
                  "Select date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatsSummaryItem
          label="Total Entries"
          value={metrics?.kpis.totalEntries || 0}
          icon={Activity}
          color="primary"
        />
        <StatsSummaryItem
          label="Resolved"
          value={metrics?.kpis.resolvedEntries || 0}
          icon={CheckCircle2}
          color="blue"
        />
        <StatsSummaryItem
          label="Open Issues"
          value={metrics?.kpis.openEntries || 0}
          icon={AlertCircle}
          color="amber"
        />
        <StatsSummaryItem
          label="Critical Items"
          value={metrics?.kpis.criticalItems || 0}
          icon={Star}
          color="indigo"
        />
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-7 gap-6"
      >
        {/* Activity Trend */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Activity Trend
            </CardTitle>
            <CardDescription>
              Daily volume of created vs resolved items over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.activityTrend && metrics.activityTrend.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <AreaChart data={metrics.activityTrend}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-created)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-created)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-resolved)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-resolved)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => format(new Date(val), "MMM dd")}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stroke="var(--color-created)"
                    fill="url(#colorCreated)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stroke="var(--color-resolved)"
                    fill="url(#colorResolved)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No activity data available for the selected period.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section Distribution */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Section Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of entries by category.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
                <RechartsPieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={pieData.map((item: any) => ({
                      ...item,
                      fill: `var(--color-${item.name})`, // Use CSS variable from config
                    }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  />
                  <Legend
                    content={<ChartLegendContent nameKey="name" />}
                    verticalAlign="bottom"
                    height={36}
                  />
                </RechartsPieChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No section data available.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Section Breakdown Table */}
      {metrics?.sectionDistribution && metrics.sectionDistribution.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Section Breakdown</CardTitle>
              <CardDescription>
                Detailed breakdown of entries by section type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {metrics.sectionDistribution.map((item: any) => {
                  const sConfig = SECTION_CONFIG[item.section as TurnoverSection];
                  return (
                    <div
                      key={item.section}
                      className={cn(
                        "p-4 rounded-xl border",
                        sConfig?.bgClass,
                        sConfig?.borderClass
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="secondary"
                          className={cn(sConfig?.colorClass, "font-bold")}
                        >
                          {sConfig?.shortName || item.section}
                        </Badge>
                      </div>
                      <p className="text-3xl font-black">{item.count}</p>
                      <p className="text-xs text-muted-foreground">entries</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
