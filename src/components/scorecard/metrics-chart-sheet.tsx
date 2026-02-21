import React, { useState, useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
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
} from 'recharts'
import { TrendingUp, Activity, Filter } from 'lucide-react'
import type {
  Application,
  ScorecardEntry,
  AvailabilityRecord,
  VolumeRecord,
  MonthInfo,
} from './types'
import { cn } from '@/lib/utils'

// Cleaner, more defined color palette
const CHART_COLORS = [
  '#2563eb', // Blue 600
  '#0891b2', // Cyan 600
  '#4f46e5', // Indigo 600
  '#ea580c', // Orange 600
  '#db2777', // Pink 600
  '#16a34a', // Green 600
  '#ca8a04', // Yellow 600
  '#9333ea', // Purple 600
]

interface MetricsChartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applications: Application[]
  entriesByApp: Record<string, ScorecardEntry[]>
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>
  volumeByEntry: Record<string, Record<string, VolumeRecord>>
  displayMonths: MonthInfo[]
  filterLabel: string
}

type ViewLevel = 'applications' | 'entries'

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
  const [chartMetric, setChartMetric] = useState<'availability' | 'volume'>(
    'availability',
  )
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('area')
  const [viewLevel, setViewLevel] = useState<ViewLevel>('applications')

  // For application-level view
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(() => {
    const defaultSet = new Set<string>()
    applications.slice(0, 3).forEach((app) => defaultSet.add(app.id))
    return defaultSet
  })

  // For entry-level view
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(
    new Set(),
  )

  // Get all entries flattened
  const allEntries = useMemo(() => {
    const entries: (ScorecardEntry & { appName: string; appTla: string })[] = []
    applications.forEach((app) => {
      const appEntries = entriesByApp[app.id] || []
      appEntries.forEach((entry) => {
        entries.push({
          ...entry,
          appName: app.applicationName,
          appTla: app.tla || app.applicationName,
        })
      })
    })
    return entries
  }, [applications, entriesByApp])

  // Update selected apps when applications change
  React.useEffect(() => {
    if (applications.length > 0 && selectedAppIds.size === 0) {
      const defaultSet = new Set<string>()
      applications.slice(0, 3).forEach((app) => defaultSet.add(app.id))
      setSelectedAppIds(defaultSet)
    }
  }, [applications])

  // Initialize entry selection when switching to entries view
  React.useEffect(() => {
    if (
      viewLevel === 'entries' &&
      selectedEntryIds.size === 0 &&
      allEntries.length > 0
    ) {
      const defaultSet = new Set<string>()
      allEntries.slice(0, 5).forEach((entry) => defaultSet.add(entry.id))
      setSelectedEntryIds(defaultSet)
    }
  }, [viewLevel, allEntries])

  // Get color for each application
  const appColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    applications.forEach((app, index) => {
      map[app.id] = CHART_COLORS[index % CHART_COLORS.length]
    })
    return map
  }, [applications])

  // Get color for each entry
  const entryColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    allEntries.forEach((entry, index) => {
      map[entry.id] = CHART_COLORS[index % CHART_COLORS.length]
    })
    return map
  }, [allEntries])

  // Build chart config dynamically based on view level
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {}

    if (viewLevel === 'applications') {
      applications.forEach((app) => {
        if (selectedAppIds.has(app.id)) {
          config[app.id] = {
            label: app.tla || app.applicationName,
            color: appColorMap[app.id],
          }
        }
      })
    } else {
      allEntries.forEach((entry) => {
        if (selectedEntryIds.has(entry.id)) {
          config[entry.id] = {
            label: entry.name,
            color: entryColorMap[entry.id],
          }
        }
      })
    }

    return config
  }, [
    viewLevel,
    applications,
    allEntries,
    selectedAppIds,
    selectedEntryIds,
    appColorMap,
    entryColorMap,
  ])

  // Build chart data based on view level
  const chartData = useMemo(() => {
    return displayMonths.map(({ year, month, label, isFuture }) => {
      const dataPoint: Record<string, any> = { month: label }
      const key = `${year}-${month}`

      if (isFuture) {
        return dataPoint
      }

      if (viewLevel === 'applications') {
        // Aggregate by application
        applications.forEach((app) => {
          if (!selectedAppIds.has(app.id)) return

          const appEntries = entriesByApp[app.id] || []

          if (chartMetric === 'availability') {
            let totalAvail = 0
            let availCount = 0

            appEntries.forEach((entry) => {
              const av = availabilityByEntry[entry.id]?.[key]
              if (av) {
                const val = parseFloat(av.availability)
                if (!isNaN(val)) {
                  totalAvail += val
                  availCount++
                }
              }
            })

            dataPoint[app.id] =
              availCount > 0
                ? parseFloat((totalAvail / availCount).toFixed(2))
                : null
          } else {
            let totalVol = 0

            appEntries.forEach((entry) => {
              const vol = volumeByEntry[entry.id]?.[key]
              if (vol) {
                totalVol += vol.volume
              }
            })

            dataPoint[app.id] = totalVol > 0 ? totalVol : null
          }
        })
      } else {
        // Individual entries
        allEntries.forEach((entry) => {
          if (!selectedEntryIds.has(entry.id)) return

          if (chartMetric === 'availability') {
            const av = availabilityByEntry[entry.id]?.[key]
            if (av) {
              const val = parseFloat(av.availability)
              dataPoint[entry.id] = !isNaN(val) ? val : null
            } else {
              dataPoint[entry.id] = null
            }
          } else {
            const vol = volumeByEntry[entry.id]?.[key]
            dataPoint[entry.id] = vol ? vol.volume : null
          }
        })
      }

      return dataPoint
    })
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
  ])

  const toggleApp = (appId: string) => {
    setSelectedAppIds((prev) => {
      const next = new Set(prev)
      if (next.has(appId)) {
        if (next.size > 1) {
          next.delete(appId)
        }
      } else {
        next.add(appId)
      }
      return next
    })
  }

  const toggleEntry = (entryId: string) => {
    setSelectedEntryIds((prev) => {
      const next = new Set(prev)
      if (next.has(entryId)) {
        if (next.size > 1) {
          next.delete(entryId)
        }
      } else {
        next.add(entryId)
      }
      return next
    })
  }

  const selectAllApps = () => {
    setSelectedAppIds(new Set(applications.map((app) => app.id)))
  }

  const clearAllApps = () => {
    if (applications.length > 0) {
      setSelectedAppIds(new Set([applications[0].id]))
    }
  }

  const selectAllEntries = () => {
    setSelectedEntryIds(new Set(allEntries.map((entry) => entry.id)))
  }

  const clearAllEntries = () => {
    if (allEntries.length > 0) {
      setSelectedEntryIds(new Set([allEntries[0].id]))
    }
  }

  const selectedApps = applications.filter((app) => selectedAppIds.has(app.id))
  const selectedEntries = allEntries.filter((entry) =>
    selectedEntryIds.has(entry.id),
  )

  // Format volume for Y axis
  const formatYAxis = (value: number) => {
    if (chartMetric === 'volume') {
      if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
      return String(value)
    }
    return `${value}%`
  }

  // Get current selection based on view level
  const currentColorMap =
    viewLevel === 'applications' ? appColorMap : entryColorMap
  const currentSelection =
    viewLevel === 'applications' ? selectedApps : selectedEntries
  const currentSelectionIds =
    viewLevel === 'applications' ? selectedAppIds : selectedEntryIds

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl lg:max-w-5xl xl:max-w-[1200px] min-w-[50vw] p-0 flex flex-col bg-background"
        showCloseButton={true}
      >
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <SheetTitle className="text-xl font-semibold">
                Metrics Visualization
              </SheetTitle>
              <SheetDescription className="text-muted-foreground text-xs mt-0.5">
                Comparing{' '}
                {viewLevel === 'applications'
                  ? applications.length + ' applications'
                  : allEntries.length + ' sub-applications'}{' '}
                for {filterLabel}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Controls Section */}
          <div className="px-6 py-4 space-y-4 border-b bg-muted/30">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* View Level Toggle */}
                <Tabs
                  value={viewLevel}
                  onValueChange={(v) => setViewLevel(v as ViewLevel)}
                >
                  <TabsList>
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                    <TabsTrigger value="entries">Sub-Apps</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="h-4 w-px bg-border hidden md:block" />

                {/* Metric Toggle */}
                <Tabs
                  value={chartMetric}
                  onValueChange={(v) =>
                    setChartMetric(v as 'availability' | 'volume')
                  }
                >
                  <TabsList>
                    <TabsTrigger value="availability">Availability</TabsTrigger>
                    <TabsTrigger value="volume">Volume</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Chart Type */}
              <div className="flex items-center bg-muted rounded-md p-1 border">
                {(['area', 'bar', 'line'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={chartType === type ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setChartType(type)}
                    className={cn(
                      'h-7 px-2.5 text-xs font-medium rounded-sm',
                      chartType === type &&
                        'bg-white shadow-sm dark:bg-zinc-800',
                    )}
                  >
                    <span className="capitalize">{type}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Selection Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {viewLevel === 'applications'
                    ? 'Applications'
                    : 'Sub-Applications'}{' '}
                  ({currentSelectionIds.size})
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2 text-muted-foreground"
                    onClick={
                      viewLevel === 'applications'
                        ? selectAllApps
                        : selectAllEntries
                    }
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2 text-muted-foreground"
                    onClick={
                      viewLevel === 'applications'
                        ? clearAllApps
                        : clearAllEntries
                    }
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto">
                {viewLevel === 'applications'
                  ? applications.map((app) => {
                      const isSelected = selectedAppIds.has(app.id)
                      const color = appColorMap[app.id]

                      return (
                        <Badge
                          key={app.id}
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() => toggleApp(app.id)}
                          className={cn(
                            'cursor-pointer font-normal text-xs px-2 py-1 gap-2 hover:bg-muted-foreground/10 transition-colors',
                            !isSelected &&
                              'bg-transparent text-muted-foreground border-dashed border-muted-foreground/30',
                          )}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: `${color}15`,
                                  color: color,
                                  borderColor: `${color}40`,
                                  borderWidth: '1px',
                                  borderStyle: 'solid',
                                }
                              : {}
                          }
                        >
                          <div
                            className={cn('w-2 h-2 rounded-full')}
                            style={{
                              backgroundColor: isSelected
                                ? color
                                : 'currentColor',
                              opacity: isSelected ? 1 : 0.3,
                            }}
                          />
                          {app.tla || app.applicationName}
                        </Badge>
                      )
                    })
                  : applications.map((app) => {
                      const appEntries = entriesByApp[app.id] || []
                      if (appEntries.length === 0) return null

                      return (
                        <div key={app.id} className="contents">
                          {appEntries.map((entry) => {
                            const isSelected = selectedEntryIds.has(entry.id)
                            const color = entryColorMap[entry.id]

                            return (
                              <Badge
                                key={entry.id}
                                variant={isSelected ? 'default' : 'outline'}
                                onClick={() => toggleEntry(entry.id)}
                                className={cn(
                                  'cursor-pointer font-normal text-xs px-2 py-1 gap-2 hover:bg-muted-foreground/10 transition-colors',
                                  !isSelected &&
                                    'bg-transparent text-muted-foreground border-dashed border-muted-foreground/30',
                                )}
                                style={
                                  isSelected
                                    ? {
                                        backgroundColor: `${color}15`,
                                        color: color,
                                        borderColor: `${color}40`,
                                        borderWidth: '1px',
                                        borderStyle: 'solid',
                                      }
                                    : {}
                                }
                              >
                                <div
                                  className={cn('w-2 h-2 rounded-full')}
                                  style={{
                                    backgroundColor: isSelected
                                      ? color
                                      : 'currentColor',
                                    opacity: isSelected ? 1 : 0.3,
                                  }}
                                />
                                {entry.name}
                              </Badge>
                            )
                          })}
                        </div>
                      )
                    })}
              </div>
            </div>
          </div>

          {/* Main Chart Area */}
          <div className="flex-1 px-6 py-6 overflow-y-auto min-h-0">
            {currentSelection.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 border-2 border-dashed border-muted-foreground/10 rounded-xl bg-muted/5">
                <div className="p-3 rounded-full bg-muted mb-3">
                  <Filter className="w-6 h-6 opacity-40" />
                </div>
                <p className="font-semibold text-sm text-foreground/70">
                  No Items Selected
                </p>
                <p className="text-xs mt-1 max-w-xs text-center text-muted-foreground">
                  Select{' '}
                  {viewLevel === 'applications'
                    ? 'applications'
                    : 'sub-applications'}{' '}
                  to visualize.
                </p>
              </div>
            ) : (
              <div className="space-y-6 pb-8">
                <div className="h-[450px] w-full border rounded-xl p-4 bg-background shadow-xs">
                  <ChartContainer
                    config={chartConfig}
                    className="h-full w-full"
                  >
                    {chartType === 'area' ? (
                      <AreaChart
                        key={`${chartType}-${chartMetric}-${currentSelectionIds.size}-${viewLevel}`}
                        data={chartData}
                        margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="stroke-muted/20"
                        />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={12}
                          fontSize={11}
                          className="fill-muted-foreground"
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={12}
                          fontSize={11}
                          tickFormatter={formatYAxis}
                          domain={
                            chartMetric === 'availability'
                              ? [0, 100]
                              : ['auto', 'auto']
                          }
                          className="fill-muted-foreground"
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              indicator="line"
                              className="w-48 bg-background border-border shadow-md rounded-md"
                              formatter={(value, name) => {
                                let label = String(name)
                                if (viewLevel === 'applications') {
                                  const app = applications.find(
                                    (a) => a.id === name,
                                  )
                                  label =
                                    app?.tla ||
                                    app?.applicationName ||
                                    String(name)
                                } else {
                                  const entry = allEntries.find(
                                    (e) => e.id === name,
                                  )
                                  label = entry?.name || String(name)
                                }
                                const formattedValue =
                                  chartMetric === 'availability'
                                    ? `${value}%`
                                    : formatYAxis(value as number)
                                return [formattedValue, label]
                              }}
                            />
                          }
                        />
                        <ChartLegend
                          content={<ChartLegendContent className="pt-4" />}
                        />
                        {currentSelection.map((item) => (
                          <Area
                            key={item.id}
                            type="monotone"
                            dataKey={item.id}
                            name={item.id}
                            stroke={currentColorMap[item.id]}
                            strokeWidth={2}
                            fill={currentColorMap[item.id]}
                            fillOpacity={0.1}
                            animationDuration={1000}
                            connectNulls
                          />
                        ))}
                      </AreaChart>
                    ) : chartType === 'bar' ? (
                      <BarChart
                        key={`${chartType}-${chartMetric}-${currentSelectionIds.size}-${viewLevel}`}
                        data={chartData}
                        margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="stroke-muted/20"
                        />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={12}
                          fontSize={11}
                          className="fill-muted-foreground"
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={12}
                          fontSize={11}
                          tickFormatter={formatYAxis}
                          domain={
                            chartMetric === 'availability'
                              ? [0, 100]
                              : ['auto', 'auto']
                          }
                          className="fill-muted-foreground"
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              indicator="line"
                              className="w-48 bg-background border-border shadow-md rounded-md"
                              formatter={(value, name) => {
                                let label = String(name)
                                if (viewLevel === 'applications') {
                                  const app = applications.find(
                                    (a) => a.id === name,
                                  )
                                  label =
                                    app?.tla ||
                                    app?.applicationName ||
                                    String(name)
                                } else {
                                  const entry = allEntries.find(
                                    (e) => e.id === name,
                                  )
                                  label = entry?.name || String(name)
                                }
                                const formattedValue =
                                  chartMetric === 'availability'
                                    ? `${value}%`
                                    : formatYAxis(value as number)
                                return [formattedValue, label]
                              }}
                            />
                          }
                        />
                        <ChartLegend
                          content={<ChartLegendContent className="pt-4" />}
                        />
                        {currentSelection.map((item) => (
                          <Bar
                            key={item.id}
                            dataKey={item.id}
                            name={item.id}
                            fill={currentColorMap[item.id]}
                            radius={[4, 4, 0, 0]}
                            animationDuration={1000}
                            className="opacity-90 hover:opacity-100 transition-opacity"
                          />
                        ))}
                      </BarChart>
                    ) : (
                      <LineChart
                        key={`${chartType}-${chartMetric}-${currentSelectionIds.size}-${viewLevel}`}
                        data={chartData}
                        margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="stroke-muted/20"
                        />
                        <XAxis
                          dataKey="month"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={12}
                          fontSize={11}
                          className="fill-muted-foreground"
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickMargin={12}
                          fontSize={11}
                          tickFormatter={formatYAxis}
                          domain={
                            chartMetric === 'availability'
                              ? [0, 100]
                              : ['auto', 'auto']
                          }
                          className="fill-muted-foreground"
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              indicator="line"
                              className="w-48 bg-background border-border shadow-md rounded-md"
                              formatter={(value, name) => {
                                let label = String(name)
                                if (viewLevel === 'applications') {
                                  const app = applications.find(
                                    (a) => a.id === name,
                                  )
                                  label =
                                    app?.tla ||
                                    app?.applicationName ||
                                    String(name)
                                } else {
                                  const entry = allEntries.find(
                                    (e) => e.id === name,
                                  )
                                  label = entry?.name || String(name)
                                }
                                const formattedValue =
                                  chartMetric === 'availability'
                                    ? `${value}%`
                                    : formatYAxis(value as number)
                                return [formattedValue, label]
                              }}
                            />
                          }
                        />
                        <ChartLegend
                          content={<ChartLegendContent className="pt-4" />}
                        />
                        {currentSelection.map((item) => (
                          <Line
                            key={item.id}
                            type="monotone"
                            dataKey={item.id}
                            name={item.id}
                            stroke={currentColorMap[item.id]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{
                              r: 4,
                              fill: currentColorMap[item.id],
                              strokeWidth: 0,
                            }}
                            animationDuration={1000}
                            connectNulls
                          />
                        ))}
                      </LineChart>
                    )}
                  </ChartContainer>
                </div>

                {/* Summary Cards */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2 text-foreground/80 px-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Performance Breakdown
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {currentSelection.map((item) => {
                      let avgValue = 0
                      let count = 0
                      let totalValue = 0
                      let itemName = ''
                      let subLabel = ''

                      if (viewLevel === 'applications') {
                        const app = item as Application
                        itemName = app.tla || app.applicationName
                        const appEntries = entriesByApp[app.id] || []
                        subLabel = `${appEntries.length} sub-apps`

                        displayMonths.forEach(({ year, month, isFuture }) => {
                          if (isFuture) return
                          const key = `${year}-${month}`

                          if (chartMetric === 'availability') {
                            appEntries.forEach((entry) => {
                              const av = availabilityByEntry[entry.id]?.[key]
                              if (av) {
                                avgValue += parseFloat(av.availability)
                                count++
                              }
                            })
                          } else {
                            appEntries.forEach((entry) => {
                              const vol = volumeByEntry[entry.id]?.[key]
                              if (vol) {
                                totalValue += vol.volume
                                count++
                              }
                            })
                          }
                        })
                      } else {
                        const entry = item as ScorecardEntry & {
                          appName: string
                          appTla: string
                        }
                        itemName = entry.name
                        subLabel = entry.appTla

                        displayMonths.forEach(({ year, month, isFuture }) => {
                          if (isFuture) return
                          const key = `${year}-${month}`

                          if (chartMetric === 'availability') {
                            const av = availabilityByEntry[entry.id]?.[key]
                            if (av) {
                              avgValue += parseFloat(av.availability)
                              count++
                            }
                          } else {
                            const vol = volumeByEntry[entry.id]?.[key]
                            if (vol) {
                              totalValue += vol.volume
                              count++
                            }
                          }
                        })
                      }

                      const displayValue =
                        chartMetric === 'availability'
                          ? count > 0
                            ? `${(avgValue / count).toFixed(2)}%`
                            : 'N/A'
                          : formatYAxis(totalValue)

                      return (
                        <div
                          key={item.id}
                          className="group flex flex-col p-4 bg-card rounded-xl border shadow-sm hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span
                              className="font-medium text-sm truncate pr-2 text-foreground/90"
                              title={itemName}
                            >
                              {itemName}
                            </span>
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: currentColorMap[item.id],
                              }}
                            />
                          </div>

                          <div className="mt-auto">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                              {chartMetric === 'availability'
                                ? 'Average'
                                : 'Tot. Vol.'}
                            </p>
                            <p className="text-xl font-bold tracking-tight mt-0.5 tabular-nums text-foreground">
                              {displayValue}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
