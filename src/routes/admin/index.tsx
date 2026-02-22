import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format, isSameDay, startOfDay, subDays } from "date-fns";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { type ComponentType, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { getRegistrationRequests } from "@/app/actions/team-registration";
import { getTeams } from "@/app/actions/teams";
import { PageHeader } from "@/components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { adminKeys, teamKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: requests } = useQuery({
    queryKey: adminKeys.registrationRequests(),
    queryFn: () => getRegistrationRequests(),
  });

  const { data: teams } = useQuery({
    queryKey: teamKeys.list(),
    queryFn: () => getTeams(),
  });

  // Calculate stats from requests
  const stats = {
    totalRequests: requests?.length || 0,
    pending: requests?.filter((r) => r.status === "pending").length || 0,
    approvedRequests:
      requests?.filter((r) => r.status === "approved").length || 0,
    rejected: requests?.filter((r) => r.status === "rejected").length || 0,
    activeTeams: teams?.length || 0,
  };

  // Process trend data for the last 14 days
  const trendData = useMemo(() => {
    const data: { date: string; requests: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = subDays(startOfDay(new Date()), i);
      const count =
        requests?.filter((r) => isSameDay(new Date(r.requestedAt), date))
          .length || 0;
      data.push({
        date: format(date, "MMM dd"),
        requests: count,
      });
    }
    return data;
  }, [requests]);

  // Process status distribution data
  const statusData = useMemo(
    () => [
      { status: "pending", count: stats.pending, fill: "var(--color-pending)" },
      {
        status: "approved",
        count: stats.approvedRequests,
        fill: "var(--color-approved)",
      },
      {
        status: "rejected",
        count: stats.rejected,
        fill: "var(--color-rejected)",
      },
    ],
    [stats.pending, stats.approvedRequests, stats.rejected]
  );

  const chartConfig = {
    requests: {
      label: "Requests",
      color: "var(--primary)",
    },
    pending: {
      label: "Pending",
      color: "var(--warning)",
    },
    approved: {
      label: "Approved",
      color: "var(--success)",
    },
    rejected: {
      label: "Rejected",
      color: "var(--destructive)",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-8">
      {/* Premium Admin Header Banner */}
      <PageHeader
        description="Monitor system health, team registrations, and activity."
        title="Admin Dashboard"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          color="blue"
          description="Total lifetime requests"
          icon={ClipboardList}
          title="Total Requests"
          value={stats.totalRequests}
        />
        <StatCard
          color="amber"
          description="Awaiting admin action"
          icon={Clock}
          title="Pending Review"
          value={stats.pending}
        />
        <StatCard
          color="emerald"
          description="Currently active in system"
          icon={CheckCircle2}
          title="Active Teams"
          value={stats.activeTeams}
        />
        <StatCard
          color="red"
          description="Requests denied"
          icon={XCircle}
          title="Rejected"
          value={stats.rejected}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend Chart */}
        <Card className="border-none shadow-sm ring-1 ring-gray-100 lg:col-span-2 dark:ring-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-5 w-5 text-primary" />
                Registration Trends
              </CardTitle>
              <CardDescription>
                Daily team registration requests over the last 14 days.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer className="h-[300px] w-full" config={chartConfig}>
              <AreaChart
                data={trendData}
                margin={{ left: -20, right: 10, top: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillRequests" x1="0" x2="0" y1="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-requests)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-requests)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  className="stroke-muted"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  minTickGap={32}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis axisLine={false} tickLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="requests"
                  fill="url(#fillRequests)"
                  fillOpacity={1}
                  stroke="var(--color-requests)"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border-none shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-primary" />
              Request Status
            </CardTitle>
            <CardDescription>
              Distribution of application statuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-4">
            <ChartContainer
              className="mx-auto aspect-square h-[250px]"
              config={chartConfig}
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent hideLabel />}
                  cursor={false}
                />
                <Pie
                  data={statusData}
                  dataKey="count"
                  innerRadius={60}
                  nameKey="status"
                  outerRadius={80}
                  strokeWidth={5}
                >
                  {statusData.map((entry) => (
                    <Cell fill={entry.fill} key={entry.status} />
                  ))}
                </Pie>
                <ChartLegend
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                  content={<ChartLegendContent nameKey="status" />}
                />
              </PieChart>
            </ChartContainer>
            <div className="mt-4 w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approval Rate</span>
                <span className="font-semibold">
                  {stats.totalRequests
                    ? Math.round(
                        (stats.approvedRequests / stats.totalRequests) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-emerald-500"
                  style={{
                    width: `${stats.totalRequests ? (stats.approvedRequests / stats.totalRequests) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: {
  title: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  color: "blue" | "amber" | "emerald" | "red";
  description?: string;
}) {
  const colors = {
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/20",
    amber: "text-amber-600 bg-amber-100 dark:bg-amber-900/20",
    emerald: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20",
    red: "text-red-600 bg-red-100 dark:bg-red-900/20",
  };

  return (
    <Card className="group overflow-hidden border-none shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:shadow-md dark:ring-gray-800">
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium text-gray-500 text-sm dark:text-gray-400">
              {title}
            </p>
            <p className="font-bold text-3xl tracking-tight">{value}</p>
            {description && (
              <p className="text-muted-foreground text-xs">{description}</p>
            )}
          </div>
          <div
            className={`rounded-xl p-3 transition-transform duration-300 group-hover:scale-110 ${colors[color]}`}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="absolute -right-1 -bottom-1 opacity-5 transition-opacity duration-300 group-hover:opacity-10">
          <Icon className="h-16 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
