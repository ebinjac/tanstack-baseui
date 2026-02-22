import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  PieChart,
  Star,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
} from "recharts";
import { getTurnoverMetrics } from "@/app/actions/turnover";
import { StatsSummaryItem } from "@/components/link-manager/shared";
import { PageHeader } from "@/components/shared";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TurnoverSection } from "@/lib/zod/turnover.schema";
import { SECTION_CONFIG } from "@/lib/zod/turnover.schema";

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
    if (!metrics?.activityTrend) {
      return;
    }

    const csvContent = [
      ["Date", "Total Created", "Resolved", "Open"].join(","),
      ...metrics.activityTrend.map(
        (d: { date: string; created: number; resolved: number }) =>
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
    if (!metrics?.sectionDistribution) {
      return [];
    }
    return metrics.sectionDistribution.map(
      (item: { section: string; count: number }) => ({
        name: item.section,
        value: item.count,
        // Color is now handled by ChartContainer via CSS variables mapped in chartConfig
      })
    );
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
    <div className="mx-auto space-y-8 p-8">
      {/* Header */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -20 }}
      >
        <PageHeader
          className="w-full"
          description="Comprehensive analysis of handover activities and resolution performance."
          title="Turnover Intelligence"
        >
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger>
              <Button
                className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                variant="outline"
              >
                <Calendar className="h-4 w-4" />
                {!dateRange?.from && "Select date range"}
                {dateRange?.from &&
                  !dateRange.to &&
                  format(dateRange.from, "MMM dd, yyyy")}
                {dateRange?.from && dateRange.to && (
                  <>
                    {format(dateRange.from, "MMM dd")} -{" "}
                    {format(dateRange.to, "MMM dd, yyyy")}
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <CalendarComponent
                initialFocus
                mode="range"
                numberOfMonths={2}
                onSelect={setDateRange}
                selected={dateRange}
              />
            </PopoverContent>
          </Popover>

          <Button
            className="gap-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            onClick={handleExport}
            variant="outline"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </PageHeader>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.1 }}
      >
        <StatsSummaryItem
          color="primary"
          icon={Activity}
          label="Total Entries"
          value={metrics?.kpis.totalEntries || 0}
        />
        <StatsSummaryItem
          color="blue"
          icon={CheckCircle2}
          label="Resolved"
          value={metrics?.kpis.resolvedEntries || 0}
        />
        <StatsSummaryItem
          color="amber"
          icon={AlertCircle}
          label="Open Issues"
          value={metrics?.kpis.openEntries || 0}
        />
        <StatsSummaryItem
          color="indigo"
          icon={Star}
          label="Critical Items"
          value={metrics?.kpis.criticalItems || 0}
        />
      </motion.div>

      {/* Charts */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-7"
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.2 }}
      >
        {/* Activity Trend */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Activity Trend
            </CardTitle>
            <CardDescription>
              Daily volume of created vs resolved items over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.activityTrend && metrics.activityTrend.length > 0 ? (
              <ChartContainer className="h-[300px] w-full" config={chartConfig}>
                <AreaChart data={metrics.activityTrend}>
                  <defs>
                    <linearGradient
                      id="colorCreated"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-created)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-created)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorResolved"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-resolved)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-resolved)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    axisLine={false}
                    dataKey="date"
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(val) => format(new Date(val), "MMM dd")}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    axisLine={false}
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="created"
                    fill="url(#colorCreated)"
                    stroke="var(--color-created)"
                    strokeWidth={2}
                    type="monotone"
                  />
                  <Area
                    dataKey="resolved"
                    fill="url(#colorResolved)"
                    stroke="var(--color-resolved)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <EmptyState
                description="No activity data available for the selected period."
                icon={BarChart3}
                size="sm"
                title="No activity data"
              />
            )}
          </CardContent>
        </Card>

        {/* Section Distribution */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Section Distribution
            </CardTitle>
            <CardDescription>Breakdown of entries by category.</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ChartContainer
                className="mx-auto aspect-square max-h-[300px]"
                config={chartConfig}
              >
                <RechartsPieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel />}
                    cursor={false}
                  />
                  <Pie
                    data={pieData.map(
                      (item: { name: string; value: number }) => ({
                        ...item,
                        fill: `var(--color-${item.name})`, // Use CSS variable from config
                      })
                    )}
                    dataKey="value"
                    innerRadius={60}
                    nameKey="name"
                    strokeWidth={5}
                  />
                  <Legend
                    content={<ChartLegendContent nameKey="name" />}
                    height={36}
                    verticalAlign="bottom"
                  />
                </RechartsPieChart>
              </ChartContainer>
            ) : (
              <EmptyState
                description="No section data available."
                icon={PieChart}
                size="sm"
                title="No section data"
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Section Breakdown Table */}
      {metrics?.sectionDistribution &&
        metrics.sectionDistribution.length > 0 && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
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
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                  {metrics.sectionDistribution.map(
                    (item: { section: string; count: number }) => {
                      const sConfig =
                        SECTION_CONFIG[item.section as TurnoverSection];
                      return (
                        <div
                          className={cn(
                            "rounded-xl border p-4",
                            sConfig?.bgClass,
                            sConfig?.borderClass
                          )}
                          key={item.section}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <Badge
                              className={cn(sConfig?.colorClass, "font-bold")}
                              variant="secondary"
                            >
                              {sConfig?.shortName || item.section}
                            </Badge>
                          </div>
                          <p className="font-black text-3xl">{item.count}</p>
                          <p className="text-muted-foreground text-xs">
                            entries
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
    </div>
  );
}
