import React from 'react'
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
} from 'recharts'
import {
  AreaChart as AreaChartIcon,
  BarChartIcon,
  LineChart as LineChartIcon,
  TrendingUp,
} from 'lucide-react'
import type {ChartConfig} from '@/components/ui/chart';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart'

interface ChartDataPoint {
  month: string
  availability: number | null
  volume: number
}

interface MetricsChartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chartData: Array<ChartDataPoint>
  chartMetric: 'availability' | 'volume'
  setChartMetric: (metric: 'availability' | 'volume') => void
  chartType: 'line' | 'bar' | 'area'
  setChartType: (type: 'line' | 'bar' | 'area') => void
  filterLabel: string
}

const chartConfig = {
  availability: {
    label: 'Availability (%)',
    color: 'var(--primary)',
  },
  volume: {
    label: 'Volume',
    color: 'var(--blue-500)',
  },
} satisfies ChartConfig

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Metrics Visualization
          </DialogTitle>
          <DialogDescription>
            Visualizing aggregated performance across all applications for{' '}
            {filterLabel}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center bg-muted/40 p-3 rounded-lg border">
            <Tabs
              value={chartMetric}
              onValueChange={(v) => setChartMetric(v)}
              className="w-full sm:w-auto"
            >
              <TabsList>
                <TabsTrigger value="availability">Availability</TabsTrigger>
                <TabsTrigger value="volume">Volume</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs
              value={chartType}
              onValueChange={(v) => setChartType(v)}
              className="w-full sm:w-auto"
            >
              <TabsList>
                <TabsTrigger value="area">
                  <AreaChartIcon className="w-4 h-4 mr-2" />
                  Area
                </TabsTrigger>
                <TabsTrigger value="bar">
                  <BarChartIcon className="w-4 h-4 mr-2" />
                  Bar
                </TabsTrigger>
                <TabsTrigger value="line">
                  <LineChartIcon className="w-4 h-4 mr-2" />
                  Line
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="h-[400px] w-full border rounded-xl p-4 bg-background shadow-xs">
            <ChartContainer config={chartConfig} className="h-full w-full">
              {chartType === 'area' ? (
                <AreaChart
                  key={`${chartType}-${chartMetric}`}
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                    domain={
                      chartMetric === 'availability'
                        ? [90, 100]
                        : ['auto', 'auto']
                    }
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <defs>
                    <linearGradient
                      id={`${chartMetric}Gradient`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={chartConfig[chartMetric].color}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={chartConfig[chartMetric].color}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey={chartMetric}
                    stroke={chartConfig[chartMetric].color}
                    fillOpacity={1}
                    fill={`url(#${chartMetric}Gradient)`}
                    animationDuration={1500}
                  />
                </AreaChart>
              ) : chartType === 'bar' ? (
                <BarChart
                  key={`${chartType}-${chartMetric}`}
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                    domain={
                      chartMetric === 'availability'
                        ? [90, 100]
                        : ['auto', 'auto']
                    }
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey={chartMetric}
                    fill={chartConfig[chartMetric].color}
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              ) : (
                <LineChart
                  key={`${chartType}-${chartMetric}`}
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={12}
                    domain={
                      chartMetric === 'availability'
                        ? [90, 100]
                        : ['auto', 'auto']
                    }
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey={chartMetric}
                    stroke={chartConfig[chartMetric].color}
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'var(--background)', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    animationDuration={1500}
                  />
                </LineChart>
              )}
            </ChartContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
