
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
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts'
import {
    BarChart3,
    TrendingUp,
    MousePointer2,
    Link as LinkIcon,
    Layers,
    Box,
    Shield,
    ArrowLeft,
    ChevronRight,
    ExternalLink
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

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4'];

function LinkStatsPage() {
    const { teamId } = Route.useParams()
    const initialData = Route.useLoaderData()

    const { data: stats, isLoading } = useQuery({
        queryKey: ['link-stats', teamId],
        queryFn: () => getLinkStats({ data: { teamId } }),
        initialData
    })

    if (!stats) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full" />
                <div className="h-4 w-32 bg-muted rounded" />
            </div>
        </div>
    )

    return (
        <div className="container mx-auto p-8 max-w-7xl space-y-8 pb-16">
            {/* Breadcrumbs & Title */}
            <div className="flex flex-col gap-4">
                <Link
                    to="/teams/$teamId/link-manager"
                    params={{ teamId }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Link Manager
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight mb-2 flex items-center gap-3">
                            <BarChart3 className="w-10 h-10 text-primary" />
                            Link Performance
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Insights into how your team uses and engages with shared resources.
                        </p>
                    </div>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Links"
                    value={stats.totalLinks}
                    icon={LinkIcon}
                    description="Total active bookmarks"
                    color="blue"
                />
                <StatsCard
                    title="Total Engagement"
                    value={stats.totalClicks}
                    icon={MousePointer2}
                    description="Cumulative link clicks"
                    color="purple"
                />
                <StatsCard
                    title="Avg. Clicks/Link"
                    value={stats.totalLinks > 0 ? (stats.totalClicks / stats.totalLinks).toFixed(1) : 0}
                    icon={TrendingUp}
                    description="Across all categories"
                    color="pink"
                />
                <StatsCard
                    title="Active Categories"
                    value={stats.categoryStats.length}
                    icon={Layers}
                    description="Grouping folders"
                    color="green"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Links */}
                <Card className="lg:col-span-2 border-none bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Top Performing Links
                        </CardTitle>
                        <CardDescription>Most clicked resources by your team</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.topLinks.map((link: any, i: number) => (
                                <div
                                    key={link.id}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all group border border-transparent hover:border-border"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center font-bold text-primary shadow-sm border">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{link.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><Layers className="w-3 h-3 text-purple-500" /> {link.category?.name || 'Uncategorized'}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1 font-mono uppercase tracking-tighter"><Box className="w-3 h-3 text-blue-500" /> {link.application?.tla || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-primary leading-none">{link.usageCount}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">clicks</p>
                                        </div>
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border shadow-sm hover:text-primary"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                            {stats.topLinks.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    No tracking data available yet.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Visibility Breakdown */}
                <Card className="border-none bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Visibility Mix
                        </CardTitle>
                        <CardDescription>Public vs Private resources</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.visibilityStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="count"
                                >
                                    {stats.visibilityStats.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'public' ? '#3b82f6' : '#ec4899'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Breakdown */}
                <Card className="border-none bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-primary" />
                            Category Engagement
                        </CardTitle>
                        <CardDescription>Links and interactions per category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.categoryStats}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={12}
                                        width={100}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: '#fff' }}
                                    />
                                    <Bar dataKey="clicks" radius={[0, 4, 4, 0]} barSize={24}>
                                        {stats.categoryStats.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Application Breakdown */}
                <Card className="border-none bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <Box className="w-5 h-5 text-primary" />
                            Application Distribution
                        </CardTitle>
                        <CardDescription>Linked resources by asset</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.applicationStats}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        interval={0}
                                        height={60}
                                        fontSize={10}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: '#fff' }}
                                    />
                                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function StatsCard({ title, value, icon: Icon, description, color }: any) {
    const colorClasses: any = {
        blue: "bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-blue-500/5",
        purple: "bg-purple-500/10 text-purple-600 border-purple-500/20 shadow-purple-500/5",
        pink: "bg-pink-500/10 text-pink-600 border-pink-500/20 shadow-pink-500/5",
        green: "bg-green-500/10 text-green-600 border-green-500/20 shadow-green-500/5",
    }

    const iconBgClasses: any = {
        blue: "bg-blue-500 text-white shadow-blue-500/40",
        purple: "bg-purple-500 text-white shadow-purple-500/40",
        pink: "bg-pink-500 text-white shadow-pink-500/40",
        green: "bg-green-500 text-white shadow-green-500/40",
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Card className={cn("border-none shadow-xl backdrop-blur-sm overflow-hidden group", colorClasses[color])}>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", iconBgClasses[color])}>
                            <Icon className="w-6 h-6" />
                        </div>
                    </div>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground mt-4">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-black">{value}</div>
                    <p className="text-xs text-muted-foreground mt-1 font-medium italic opacity-70">{description}</p>
                </CardContent>
            </Card>
        </motion.div>
    )
}
