import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  Loader2,
  Minus,
  PieChart,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import React, { useMemo, useState } from "react";
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
import { analyzeTurnoverMetrics } from "@/app/actions/ai/analyze-turnover-metrics";
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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { TurnoverSection } from "@/lib/zod/turnover.schema";
import { SECTION_CONFIG } from "@/lib/zod/turnover.schema";

export const Route = createFileRoute(
  "/teams/$teamId/turnover/turnover-metrics"
)({
  component: TurnoverMetricsPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type ResolutionRating = "excellent" | "good" | "needs-attention" | "critical";
type TeamLoadRating = "low" | "moderate" | "high" | "overloaded";
type AnomalySeverity = "info" | "warning" | "critical";

interface Anomaly {
  detail: string;
  severity: AnomalySeverity;
  title: string;
}

interface MetricsInsights {
  anomalies: Anomaly[];
  headline: string;
  narrative: string;
  recommendation: string;
  resolutionRating: ResolutionRating;
  teamLoadRating: TeamLoadRating;
}

// ─── AI Intelligence Panel ───────────────────────────────────────────────────

const RESOLUTION_BADGE: Record<
  ResolutionRating,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  excellent: { label: "Excellent", variant: "default" },
  good: { label: "Good", variant: "secondary" },
  "needs-attention": { label: "Needs Attention", variant: "outline" },
  critical: { label: "Critical", variant: "destructive" },
};

const LOAD_BADGE: Record<
  TeamLoadRating,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  low: { label: "Low Load", variant: "secondary" },
  moderate: { label: "Moderate Load", variant: "outline" },
  high: { label: "High Load", variant: "default" },
  overloaded: { label: "Overloaded", variant: "destructive" },
};

const ANOMALY_STYLES: Record<
  AnomalySeverity,
  { icon: React.ElementType; bg: string; border: string; dot: string }
> = {
  info: {
    icon: Minus,
    bg: "bg-muted/50",
    border: "border-muted",
    dot: "bg-muted-foreground",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
  },
  critical: {
    icon: AlertCircle,
    bg: "bg-destructive/5",
    border: "border-destructive/20",
    dot: "bg-destructive",
  },
};

function TrendIcon({ trend }: { trend: "up" | "down" | "neutral" }) {
  if (trend === "up") {
    return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  }
  if (trend === "down") {
    return <TrendingDown className="h-3.5 w-3.5 text-destructive" />;
  }
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function ratingToTrend(r: ResolutionRating): "up" | "down" | "neutral" {
  if (r === "excellent" || r === "good") {
    return "up";
  }
  if (r === "critical") {
    return "down";
  }
  return "neutral";
}

interface AIMetricsPanelProps {
  activityTrend: { date: string; created: number; resolved: number }[];
  dateRange: string;
  kpis: {
    totalEntries: number;
    resolvedEntries: number;
    openEntries: number;
    criticalItems: number;
    resolutionRate: number;
  };
  sectionDistribution: { section: string; count: number }[];
}

function AIMetricsPanel({
  dateRange,
  kpis,
  sectionDistribution,
  activityTrend,
}: AIMetricsPanelProps) {
  const [insights, setInsights] = React.useState<MetricsInsights | null>(null);

  const analysisMutation = useMutation({
    mutationFn: () =>
      analyzeTurnoverMetrics({
        data: { dateRange, kpis, sectionDistribution, activityTrend },
      }),
    onSuccess: (result) => setInsights(result as MetricsInsights),
  });

  const hasData = kpis.totalEntries > 0;

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border-primary/10 bg-primary/[0.02]">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">AI Intelligence Brief</CardTitle>
              <CardDescription className="text-[12px]">
                AI-generated analysis of {dateRange}
              </CardDescription>
            </div>
          </div>

          {!analysisMutation.isPending && (
            <Button
              className="gap-2"
              disabled={!hasData}
              onClick={() => analysisMutation.mutate()}
              size="sm"
              title={
                hasData ? "Analyse this period with AI" : "No data to analyse"
              }
              variant="outline"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {insights ? "Re-analyse" : "Analyse Period"}
            </Button>
          )}

          {analysisMutation.isPending && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              Analysing…
            </div>
          )}
        </CardHeader>

        {/* Prompt state */}
        {!(insights || analysisMutation.isPending) && (
          <CardContent className="px-6 pb-6">
            <p className="rounded-xl border border-muted-foreground/20 border-dashed bg-muted/30 p-5 text-center text-[13px] text-muted-foreground">
              {hasData
                ? 'Click "Analyse Period" to get an AI-powered intelligence brief for the metrics above.'
                : "No data in the selected range. Expand the date window and try again."}
            </p>
          </CardContent>
        )}

        {/* Loading shimmer */}
        {analysisMutation.isPending && (
          <CardContent className="space-y-3 px-6 pb-6">
            {[72, 88, 55, 80, 65].map((w) => (
              <div
                className="h-3 animate-pulse rounded-full bg-muted"
                key={w}
                style={{ width: `${w}%` }}
              />
            ))}
          </CardContent>
        )}

        {/* Results */}
        {insights && !analysisMutation.isPending && (
          <CardContent className="px-6 pb-6">
            {/* Headline + Badges */}
            <div className="mb-5 flex flex-wrap items-start gap-3">
              <p className="flex-1 font-semibold text-base text-foreground leading-snug">
                {insights.headline}
              </p>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Badge
                  className="gap-1 rounded-full"
                  variant={RESOLUTION_BADGE[insights.resolutionRating].variant}
                >
                  <TrendIcon trend={ratingToTrend(insights.resolutionRating)} />
                  {RESOLUTION_BADGE[insights.resolutionRating].label}
                </Badge>
                <Badge
                  className="gap-1 rounded-full"
                  variant={LOAD_BADGE[insights.teamLoadRating].variant}
                >
                  <Users className="h-3 w-3" />
                  {LOAD_BADGE[insights.teamLoadRating].label}
                </Badge>
              </div>
            </div>

            {/* Narrative */}
            <p className="mb-5 text-[13px] text-foreground/80 leading-relaxed">
              {insights.narrative}
            </p>

            {/* Anomalies */}
            {insights.anomalies.length > 0 && (
              <>
                <Separator className="mb-4" />
                <div className="mb-5">
                  <p className="mb-3 flex items-center gap-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Notable Patterns
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {insights.anomalies.map((a) => {
                      const style = ANOMALY_STYLES[a.severity];
                      return (
                        <div
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-3",
                            style.bg,
                            style.border
                          )}
                          key={a.title}
                        >
                          <span
                            className={cn(
                              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                              style.dot
                            )}
                          />
                          <div>
                            <p className="font-semibold text-foreground text-xs">
                              {a.title}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">
                              {a.detail}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Recommendation */}
            {insights.recommendation && (
              <>
                <Separator className="mb-4" />
                <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3">
                  <p className="mb-1 font-semibold text-[11px] text-primary uppercase tracking-wider">
                    Recommendation
                  </p>
                  <p className="text-[13px] text-foreground/80 leading-relaxed">
                    {insights.recommendation}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

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
      })
    );
  }, [metrics]);

  // Human-readable date range label for AI
  const dateRangeLabel = useMemo(() => {
    if (!dateRange?.from) {
      return "last 30 days";
    }
    const from = format(dateRange.from, "MMM dd, yyyy");
    const to = dateRange.to ? format(dateRange.to, "MMM dd, yyyy") : "today";
    return `${from} – ${to}`;
  }, [dateRange]);

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

      {/* AI Intelligence Brief */}
      {metrics && (
        <AIMetricsPanel
          activityTrend={metrics.activityTrend ?? []}
          dateRange={dateRangeLabel}
          kpis={
            metrics.kpis ?? {
              totalEntries: 0,
              resolvedEntries: 0,
              openEntries: 0,
              criticalItems: 0,
              resolutionRate: 0,
            }
          }
          sectionDistribution={metrics.sectionDistribution ?? []}
        />
      )}
    </div>
  );
}
