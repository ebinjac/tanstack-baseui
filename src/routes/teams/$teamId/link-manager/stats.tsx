// Link Performance Dashboard
import { createFileRoute } from '@tanstack/react-router'
import { getLinkStats } from '@/app/actions/links'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  BarChart3,
  TrendingUp,
  MousePointer2,
  Link as LinkIcon,
  Layers,
  Box,
  Shield,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  StatsSummaryItem,
  PageLoading,
  EmptyState,
  LinkManagerPage,
} from '@/components/link-manager/shared'
import { PageHeader } from '@/components/shared'

export const Route = createFileRoute('/teams/$teamId/link-manager/stats')({
  component: LinkStatsPage,
  loader: async ({ params: { teamId } }) => {
    return await getLinkStats({ data: { teamId } })
  },
})

function LinkStatsPage() {
  const { teamId } = Route.useParams()
  const initialData = Route.useLoaderData()

  const { data: stats } = useQuery({
    queryKey: ['link-stats', teamId],
    queryFn: () => getLinkStats({ data: { teamId } }),
    initialData,
  })

  if (!stats) return <PageLoading message="Loading Analytics..." />

  return (
    <LinkManagerPage>
      <div className="space-y-12">
        <PageHeader
          title="Resource Reports"
          description="Comprehensive overview of resource usage and engagement metrics."
        >
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" /> Export Analytics
          </Button>
        </PageHeader>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsSummaryItem
            label="Verified Resources"
            value={stats.totalLinks}
            icon={LinkIcon}
            color="primary"
          />
          <StatsSummaryItem
            label="Total Engagement"
            value={stats.totalClicks}
            icon={MousePointer2}
            color="blue"
          />
          <StatsSummaryItem
            label="Growth Trend"
            value={
              stats.totalLinks > 0
                ? (stats.totalClicks / stats.totalLinks).toFixed(1)
                : '0.0'
            }
            icon={TrendingUp}
            color="amber"
          />
          <StatsSummaryItem
            label="Active Collections"
            value={stats.categoryStats.length}
            icon={Layers}
            color="indigo"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <TopResourcesCard links={stats.topLinks} />
          <VisibilityChart data={stats.visibilityStats} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CategoryChart data={stats.categoryStats} />
          <ApplicationChart data={stats.applicationStats} />
        </div>
      </div>
    </LinkManagerPage>
  )
}

// ============================================================================
// Top Resources Card
// ============================================================================
function TopResourcesCard({ links }: { links: any[] }) {
  if (links.length === 0) {
    return (
      <Card className="lg:col-span-8 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            Top Resources
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground/70">
            Most clicked resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={BarChart3}
            title="No usage data"
            description="No usage intelligence available yet."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="lg:col-span-8 border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          Top Resources
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/70">
          Most clicked resources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {links.map((link: any, i: number) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all group border border-transparent"
            >
              <div className="flex items-center gap-5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center font-black text-sm text-muted-foreground border border-border group-hover:text-primary group-hover:border-primary/30 transition-all shadow-sm">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="space-y-1.5 min-w-0">
                  <p className="font-bold text-lg tracking-tight text-foreground truncate">
                    {link.title}
                  </p>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className="px-2 py-0 h-5 text-[9px] font-black uppercase tracking-wider bg-muted/50 border-none text-muted-foreground/70"
                    >
                      {link.category?.name || 'Uncategorized'}
                    </Badge>
                    <span className="text-[10px] font-bold text-muted-foreground/30 flex items-center gap-1">
                      <Box className="h-3 w-3" />{' '}
                      {link.application?.tla || 'Global'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-3xl font-black text-foreground tracking-tighter leading-none">
                    {link.usageCount}
                  </p>
                  <p className="text-[10px] font-black text-muted-foreground/40 mt-1 uppercase tracking-wider">
                    Clicks
                  </p>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-2xl bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-border shadow-md hover:text-primary hover:border-primary/40 hover:scale-110 active:scale-95"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Visibility Pie Chart
// ============================================================================
function VisibilityChart({ data }: { data: any[] }) {
  return (
    <Card className="lg:col-span-4 self-stretch border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-chart-1/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-chart-1" />
          </div>
          Visibility Distribution
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/70">
          Public vs private resources
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer
          config={{
            public: { label: 'Public', color: 'var(--chart-1)' },
            private: { label: 'Private', color: 'var(--chart-2)' },
          }}
          className="h-[280px] w-full"
        >
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={3}
              strokeWidth={2}
              stroke="var(--background)"
            >
              {data.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.name === 'public'
                      ? 'var(--color-public)'
                      : 'var(--color-private)'
                  }
                />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              className="mt-4 justify-center gap-6"
            />
          </PieChart>
        </ChartContainer>
        <div className="flex justify-center gap-8 pt-2 border-t border-border/30 mt-2">
          {data.map((item: any) => (
            <div key={item.name} className="text-center">
              <p className="text-2xl font-bold tabular-nums">{item.count}</p>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider capitalize">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Category Bar Chart
// ============================================================================
function CategoryChart({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-chart-3/10 flex items-center justify-center">
              <Layers className="h-4 w-4 text-chart-3" />
            </div>
            Category Breakdown
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground/70">
            Engagement metrics by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Layers}
            title="No category data"
            description="No category data available."
            size="sm"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-chart-3/10 flex items-center justify-center">
            <Layers className="h-4 w-4 text-chart-3" />
          </div>
          Category Breakdown
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/70">
          Engagement metrics by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ clicks: { label: 'Clicks', color: 'var(--chart-3)' } }}
          className="h-[280px] w-full"
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 24, top: 8, bottom: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              vertical={true}
              stroke="var(--border)"
              strokeOpacity={0.3}
            />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              fontSize={11}
              fontWeight={600}
              width={90}
              tick={{ fill: 'var(--muted-foreground)' }}
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
              content={<ChartTooltipContent />}
            />
            <Bar
              dataKey="clicks"
              fill="var(--color-clicks)"
              radius={6}
              barSize={24}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Application Bar Chart
// ============================================================================
function ApplicationChart({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-chart-4/10 flex items-center justify-center">
              <Box className="h-4 w-4 text-chart-4" />
            </div>
            Application Distribution
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground/70">
            Resources per application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Box}
            title="No application data"
            description="No application data available."
            size="sm"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-chart-4/10 flex items-center justify-center">
            <Box className="h-4 w-4 text-chart-4" />
          </div>
          Application Distribution
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/70">
          Resources per application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{ count: { label: 'Resources', color: 'var(--chart-4)' } }}
          className="h-[280px] w-full"
        >
          <BarChart
            data={data}
            margin={{ top: 16, bottom: 16, left: 8, right: 8 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeOpacity={0.3}
            />
            <XAxis
              dataKey="name"
              fontSize={11}
              fontWeight={600}
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              tick={{ fill: 'var(--muted-foreground)' }}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
              content={<ChartTooltipContent />}
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[6, 6, 0, 0]}
              barSize={36}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
