import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getRegistrationRequests } from '@/app/actions/team-registration'
import { getTeams } from '@/app/actions/teams'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ClipboardList, Clock, CheckCircle2, XCircle, TrendingUp, Users } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell
} from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart'
import { format, subDays, startOfDay, isSameDay } from 'date-fns'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const { data: requests } = useQuery({
    queryKey: ['registration-requests'],
    queryFn: () => getRegistrationRequests(),
  })

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => getTeams(),
  })

  // Calculate stats from requests
  const stats = {
    totalRequests: requests?.length || 0,
    pending: requests?.filter(r => r.status === 'pending').length || 0,
    approvedRequests: requests?.filter(r => r.status === 'approved').length || 0,
    rejected: requests?.filter(r => r.status === 'rejected').length || 0,
    activeTeams: teams?.length || 0,
  }

  // Process trend data for the last 14 days
  const trendData = React.useMemo(() => {
    const data = []
    for (let i = 13; i >= 0; i--) {
      const date = subDays(startOfDay(new Date()), i)
      const count = requests?.filter(r => isSameDay(new Date(r.requestedAt), date)).length || 0
      data.push({
        date: format(date, 'MMM dd'),
        requests: count,
      })
    }
    return data
  }, [requests])

  // Process status distribution data
  const statusData = React.useMemo(() => [
    { status: 'pending', count: stats.pending, fill: 'var(--color-pending)' },
    { status: 'approved', count: stats.approvedRequests, fill: 'var(--color-approved)' },
    { status: 'rejected', count: stats.rejected, fill: 'var(--color-rejected)' },
  ], [stats])

  const chartConfig = {
    requests: {
      label: 'Requests',
      color: 'var(--primary)',
    },
    pending: {
      label: 'Pending',
      color: 'var(--warning)',
    },
    approved: {
      label: 'Approved',
      color: 'var(--success)',
    },
    rejected: {
      label: 'Rejected',
      color: 'var(--destructive)',
    },
  } satisfies ChartConfig

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor system health, team registrations, and activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Requests" value={stats.totalRequests} icon={ClipboardList} color="blue" description="Total lifetime requests" />
        <StatCard title="Pending Review" value={stats.pending} icon={Clock} color="amber" description="Awaiting admin action" />
        <StatCard title="Active Teams" value={stats.activeTeams} icon={CheckCircle2} color="emerald" description="Currently active in system" />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" description="Requests denied" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Registration Trends
              </CardTitle>
              <CardDescription>Daily team registration requests over the last 14 days.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={trendData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-requests)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-requests)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="var(--color-requests)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#fillRequests)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-none shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Request Status
            </CardTitle>
            <CardDescription>Distribution of application statuses.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-4">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  outerRadius={80}
                  strokeWidth={5}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="status" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
              </PieChart>
            </ChartContainer>
            <div className="mt-4 w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approval Rate</span>
                <span className="font-semibold">{stats.totalRequests ? Math.round((stats.approvedRequests / stats.totalRequests) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${stats.totalRequests ? (stats.approvedRequests / stats.totalRequests) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, description }: { title: string, value: number, icon: any, color: 'blue' | 'amber' | 'emerald' | 'red', description?: string }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
    emerald: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/20',
  }

  return (
    <Card className="border-none shadow-sm ring-1 ring-gray-100 dark:ring-gray-800 hover:shadow-md transition-all duration-300 group overflow-hidden">
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 duration-300 ${colors[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="absolute -bottom-1 -right-1 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
          <Icon className="h-16 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}
