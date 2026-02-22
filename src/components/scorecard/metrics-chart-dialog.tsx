import {
  AreaChart as AreaChartIcon,
  BarChartIcon,
  LineChart as LineChartIcon,
  TrendingUp,
} from "lucide-react";
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
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChartDataPoint {
  availability: number | null;
  month: string;
  volume: number;
}

interface MetricsChartDialogProps {
  chartData: ChartDataPoint[];
  chartMetric: "availability" | "volume";
  chartType: "line" | "bar" | "area";
  filterLabel: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  setChartMetric: (metric: "availability" | "volume") => void;
  setChartType: (type: "line" | "bar" | "area") => void;
}

const chartConfig = {
  availability: {
    label: "Availability (%)",
    color: "var(--primary)",
  },
  volume: {
    label: "Volume",
    color: "var(--blue-500)",
  },
} satisfies ChartConfig;

export function MetricsChartDialog({
  open,
  onOpenChange,
  chartData,
  chartMetric,
  setChartMetric,
  chartType,
  setChartType,
  filterLabel,
}: MetricsChartDialogProps) {
  const yDomain = chartMetric === "availability" ? [90, 100] : ["auto", "auto"];
  const chartKey = `${chartType}-${chartMetric}`;
  const margin = { top: 10, right: 10, left: 0, bottom: 0 };
  const color = chartConfig[chartMetric].color;

  const renderChart = () => {
    if (chartType === "area") {
      return (
        <AreaChart data={chartData} key={chartKey} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="month"
            fontSize={12}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            axisLine={false}
            domain={yDomain}
            fontSize={12}
            tickLine={false}
            tickMargin={8}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <ChartLegend content={<ChartLegendContent />} />
          <defs>
            <linearGradient
              id={`${chartMetric}Gradient`}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="5%" stopColor={color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area
            animationDuration={1500}
            dataKey={chartMetric}
            fill={`url(#${chartMetric}Gradient)`}
            fillOpacity={1}
            stroke={color}
            type="monotone"
          />
        </AreaChart>
      );
    }
    if (chartType === "bar") {
      return (
        <BarChart data={chartData} key={chartKey} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="month"
            fontSize={12}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            axisLine={false}
            domain={yDomain}
            fontSize={12}
            tickLine={false}
            tickMargin={8}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            animationDuration={1500}
            dataKey={chartMetric}
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      );
    }
    return (
      <LineChart data={chartData} key={chartKey} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="month"
          fontSize={12}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          axisLine={false}
          domain={yDomain}
          fontSize={12}
          tickLine={false}
          tickMargin={8}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          activeDot={{ r: 6 }}
          animationDuration={1500}
          dataKey={chartMetric}
          dot={{ r: 4, fill: "var(--background)", strokeWidth: 2 }}
          stroke={color}
          strokeWidth={2}
          type="monotone"
        />
      </LineChart>
    );
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Metrics Visualization
          </DialogTitle>
          <DialogDescription>
            Visualizing aggregated performance across all applications for{" "}
            {filterLabel}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-start justify-between gap-4 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center">
            <Tabs
              className="w-full sm:w-auto"
              onValueChange={(v) => setChartMetric(v)}
              value={chartMetric}
            >
              <TabsList>
                <TabsTrigger value="availability">Availability</TabsTrigger>
                <TabsTrigger value="volume">Volume</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs
              className="w-full sm:w-auto"
              onValueChange={(v) => setChartType(v)}
              value={chartType}
            >
              <TabsList>
                <TabsTrigger value="area">
                  <AreaChartIcon className="mr-2 h-4 w-4" />
                  Area
                </TabsTrigger>
                <TabsTrigger value="bar">
                  <BarChartIcon className="mr-2 h-4 w-4" />
                  Bar
                </TabsTrigger>
                <TabsTrigger value="line">
                  <LineChartIcon className="mr-2 h-4 w-4" />
                  Line
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="h-[400px] w-full rounded-xl border bg-background p-4 shadow-xs">
            <ChartContainer className="h-full w-full" config={chartConfig}>
              {renderChart()}
            </ChartContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
