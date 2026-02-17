// Link Performance Dashboard
import { createFileRoute } from '@tanstack/react-router'
import { getLinkStats } from '@/app/actions/links'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { BarChart3, TrendingUp, MousePointer2, Link as LinkIcon, Layers, Box, Shield, ExternalLink, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatsSummaryItem, PageLoading, EmptyState } from '@/components/link-manager/shared'

export const Route = createFileRoute('/teams/$teamId/link-manager/stats')({
    component: LinkStatsPage,
    loader: async ({ params: { teamId } }) => {
        return await getLinkStats({ data: { teamId } })
    }
})

function LinkStatsPage() {
    const { teamId } = Route.useParams()
    const initialData = Route.useLoaderData()

    const { data: stats } = useQuery({
        queryKey: ['link-stats', teamId],
        queryFn: () => getLinkStats({ data: { teamId } }),
        initialData
    })

    if (!stats) return <PageLoading message="Loading Analytics..." />

    return (
        <div className="flex-1 min-h-screen bg-background pb-24">
            <div className="max-w-7xl mx-auto space-y-12 p-8 pt-6">
                {/* Header */}
                <div className="flex flex-col gap-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border/50">
                        <div className="flex items-center gap-8">
                            <Link
                                to="/teams/$teamId/link-manager"
                                params={{ teamId }}
                                className="h-14 w-14 rounded-2xl bg-background border border-border flex items-center justify-center hover:bg-muted/50 transition-all group shadow-sm active:scale-95"
                            >
                                <ArrowLeft className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </Link>
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Badge variant="outline" className="text-[10px] font-black bg-primary/5 border-primary/20 text-primary px-2.5 h-5 uppercase tracking-wider">
                                        Link Manager
                                    </Badge>
                                    <span className="text-muted-foreground/30">/</span>
                                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Insight Analytics</span>
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">Resource Reports</h1>
                            </div>
                        </div>
                        <Button variant="outline">
                            <ExternalLink className="h-4 w-4" /> Export Analytics
                        </Button>
                    </div>

                    {/* Stats Summary Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatsSummaryItem label="Verified Resources" value={stats.totalLinks} icon={LinkIcon} color="primary" />
                        <StatsSummaryItem label="Total Engagement" value={stats.totalClicks} icon={MousePointer2} color="blue" />
                        <StatsSummaryItem label="Growth Trend" value={stats.totalLinks > 0 ? (stats.totalClicks / stats.totalLinks).toFixed(1) : "0.0"} icon={TrendingUp} color="amber" />
                        <StatsSummaryItem label="Active Collections" value={stats.categoryStats.length} icon={Layers} color="indigo" />
                    </div>
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
        </div>
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
                    <CardDescription className="text-xs text-muted-foreground/70">Most clicked resources</CardDescription>
                </CardHeader>
                <CardContent>
                    <EmptyState icon={BarChart3} title="No usage data" description="No usage intelligence available yet." />
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
                <CardDescription className="text-xs text-muted-foreground/70">Most clicked resources</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3">
                    {links.map((link: any, i: number) => (
                        <div key={link.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all group border border-transparent">
                            <div className="flex items-center gap-5 min-w-0">
                                <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center font-black text-sm text-muted-foreground border border-border group-hover:text-primary group-hover:border-primary/30 transition-all shadow-sm">
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                <div className="space-y-1.5 min-w-0">
                                    <p className="font-bold text-lg tracking-tight text-foreground truncate">{link.title}</p>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="secondary" className="px-2 py-0 h-5 text-[9px] font-black uppercase tracking-wider bg-muted/50 border-none text-muted-foreground/70">
                                            {link.category?.name || 'Uncategorized'}
                                        </Badge>
                                        <span className="text-[10px] font-bold text-muted-foreground/30 flex items-center gap-1">
                                            <Box className="h-3 w-3" /> {link.application?.tla || 'Global'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="text-3xl font-black text-foreground tracking-tighter leading-none">{link.usageCount}</p>
                                    <p className="text-[10px] font-black text-muted-foreground/40 mt-1 uppercase tracking-wider">Clicks</p>
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
                <CardDescription className="text-xs text-muted-foreground/70">Public vs private resources</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <ChartContainer
                    config={{
                        public: { label: "Public", color: "var(--chart-1)" },
                        private: { label: "Private", color: "var(--chart-2)" }
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
                                    fill={entry.name === 'public' ? "var(--color-public)" : "var(--color-private)"}
                                />
                            ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} className="mt-4 justify-center gap-6" />
                    </PieChart>
                </ChartContainer>
                <div className="flex justify-center gap-8 pt-2 border-t border-border/30 mt-2">
                    {data.map((item: any) => (
                        <div key={item.name} className="text-center">
                            <p className="text-2xl font-bold tabular-nums">{item.count}</p>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider capitalize">{item.name}</p>
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
                    <CardDescription className="text-xs text-muted-foreground/70">Engagement metrics by category</CardDescription>
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
                <CardDescription className="text-xs text-muted-foreground/70">Engagement metrics by category</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={{ clicks: { label: "Clicks", color: "var(--chart-3)" } }}
                    className="h-[280px] w-full"
                >
                    <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
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
                    <CardDescription className="text-xs text-muted-foreground/70">Resources per application</CardDescription>
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
                <CardDescription className="text-xs text-muted-foreground/70">Resources per application</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={{ count: { label: "Resources", color: "var(--chart-4)" } }}
                    className="h-[280px] w-full"
                >
                    <BarChart data={data} margin={{ top: 16, bottom: 16, left: 8, right: 8 }}>
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
