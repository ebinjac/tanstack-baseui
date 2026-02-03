
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
    ArrowLeft,
    ExternalLink,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/teams/$teamId/link-manager/stats')({
    component: LinkStatsPage,
    loader: async ({ params: { teamId } }) => {
        return await getLinkStats({ data: { teamId } })
    }
})

// const COLORS = ['#3b82f6', '#8b5cf6', '#a855f7', '#d946ef', '#f43f5e', '#f97316'];

function LinkStatsPage() {
    const { teamId } = Route.useParams()
    const initialData = Route.useLoaderData()

    const { data: stats } = useQuery({
        queryKey: ['link-stats', teamId],
        queryFn: () => getLinkStats({ data: { teamId } }),
        initialData
    })

    if (!stats) return (
        <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-bold">Loading Analytics...</p>
            </div>
        </div>
    )
    return (
        <div className="flex-1 min-h-screen bg-background pb-24">
            <div className="max-w-7xl mx-auto space-y-12 p-8 pt-6">
                {/* Professional Header */}
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
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    Resource Reports
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button variant="outline" className="h-12 px-6 gap-2 border-border hover:bg-muted/30 transition-all font-bold text-xs rounded-xl shadow-xl shadow-primary/5 bg-background">
                                <ExternalLink className="h-4 w-4" /> Export Analytics
                            </Button>
                        </div>
                    </div>

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
                            value={stats.totalLinks > 0 ? (stats.totalClicks / stats.totalLinks).toFixed(1) : "0.0"}
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Top Resources Card - Spanning 8 columns */}
                    <Card className="lg:col-span-8">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold flex items-center gap-3">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        Top Resources
                                    </CardTitle>
                                    <CardDescription className="text-xs text-muted-foreground mt-1">
                                        Most clicked resources
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3">
                                {stats.topLinks.map((link: any, i: number) => (
                                    <div
                                        key={link.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all group border border-transparent"
                                    >
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
                                {stats.topLinks.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                                            <BarChart3 className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-bold uppercase tracking-widest">No usage intelligence available</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Visibility Distribution Chart - Spanning 4 columns */}
                    <Card className="lg:col-span-4 self-stretch">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-3">
                                <Shield className="h-5 w-5 text-indigo-500" />
                                Visibility
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground mt-1">Distribution of public vs private</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 flex flex-col items-center">
                            <ChartContainer
                                config={{
                                    public: { label: "Public", color: "#3b82f6" },
                                    private: { label: "Private", color: "#6366f1" }
                                }}
                                className="h-[320px] w-full"
                            >
                                <PieChart>
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Pie
                                        data={stats.visibilityStats}
                                        dataKey="count"
                                        nameKey="name"
                                        innerRadius={75}
                                        outerRadius={105}
                                        paddingAngle={4}
                                        stroke="transparent"
                                    >
                                        {stats.visibilityStats.map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.name === 'public' ? "var(--color-public)" : "var(--color-private)"}
                                            />
                                        ))}
                                    </Pie>
                                    <ChartLegend content={<ChartLegendContent nameKey="name" />} className="flex-wrap gap-4 mt-4" />
                                </PieChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Engagement by Category Bar Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-3">
                                <Layers className="h-5 w-5 text-purple-500" />
                                Categories
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground mt-1">Engagement by category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={{
                                    clicks: {
                                        label: "Clicks",
                                        color: "#8b5cf6",
                                    },
                                }}
                                className="h-[300px] w-full"
                            >
                                <BarChart
                                    data={stats.categoryStats}
                                    layout="vertical"
                                    margin={{ left: 24, right: 24 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} opacity={0.03} />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tickLine={false}
                                        tickMargin={12}
                                        axisLine={false}
                                        fontSize={11}
                                        fontWeight={800}
                                        width={100}
                                        className="fill-muted-foreground/60"
                                    />
                                    <XAxis type="number" hide />
                                    <ChartTooltip
                                        cursor={{ fill: 'rgba(var(--primary), 0.05)', radius: 12 }}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar dataKey="clicks" fill="var(--color-clicks)" radius={8} barSize={32} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    {/* Application Distribution Bar Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-3">
                                <Box className="h-5 w-5 text-blue-500" />
                                Applications
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground mt-1">Resource count per application</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer
                                config={{
                                    count: {
                                        label: "Assets",
                                        color: "#3b82f6",
                                    },
                                }}
                                className="h-[300px] w-full"
                            >
                                <BarChart
                                    data={stats.applicationStats}
                                    margin={{ top: 24, bottom: 24 }}
                                >
                                    <CartesianGrid vertical={false} opacity={0.03} />
                                    <XAxis
                                        dataKey="name"
                                        fontSize={11}
                                        fontWeight={800}
                                        axisLine={false}
                                        tickLine={false}
                                        tickMargin={12}
                                        className="fill-muted-foreground/60"
                                    />
                                    <ChartTooltip
                                        cursor={{ fill: 'rgba(var(--primary), 0.05)', radius: 12 }}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Bar dataKey="count" fill="var(--color-count)" radius={10} barSize={40} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function StatsSummaryItem({ label, value, icon: Icon, color = 'primary' }: any) {
    const variants: Record<string, any> = {
        primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", glow: "bg-primary" },
        blue: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20", glow: "bg-blue-500" },
        amber: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20", glow: "bg-amber-500" },
        indigo: { bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-500/20", glow: "bg-indigo-500" },
    }

    const style = variants[color] || variants.primary

    return (
        <div
            className={cn(
                "relative overflow-hidden transition-all duration-300 border border-border/50 bg-card/40 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 group hover:border-primary/30",
                color === 'blue' && "hover:border-blue-500/30",
                color === 'amber' && "hover:border-amber-500/30",
                color === 'indigo' && "hover:border-indigo-500/30"
            )}
        >
            <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] rounded-full", style.glow)} />
            <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-transform relative z-10 group-hover:scale-110",
                style.bg, style.text, style.border
            )}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="relative z-10 min-w-0 flex flex-col justify-center">
                <p className={cn("text-2xl font-bold tabular-nums tracking-tighter leading-none", style.text)}>{value}</p>
                <p className="text-[10px] text-muted-foreground font-bold mt-1.5 opacity-60">
                    {label}
                </p>
            </div>
        </div>
    )
}
