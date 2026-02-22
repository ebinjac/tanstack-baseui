// Link Performance Dashboard

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Box,
  ExternalLink,
  Layers,
  Link as LinkIcon,
  MousePointer2,
  Shield,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { getLinkStats } from "@/app/actions/links";
import {
  EmptyState,
  LinkManagerPage,
  PageLoading,
  StatsSummaryItem,
} from "@/components/link-manager/shared";
import { PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const Route = createFileRoute("/teams/$teamId/link-manager/stats")({
  component: LinkStatsPage,
  loader: async ({ params: { teamId } }) => {
    return await getLinkStats({ data: { teamId } });
  },
});

function LinkStatsPage() {
  const { teamId } = Route.useParams();
  const initialData = Route.useLoaderData();

  const { data: stats } = useQuery({
    queryKey: ["link-stats", teamId],
    queryFn: () => getLinkStats({ data: { teamId } }),
    initialData,
  });

  if (!stats) {
    return <PageLoading message="Loading Analytics..." />;
  }

  return (
    <LinkManagerPage>
      <div className="space-y-12">
        <PageHeader
          description="Comprehensive overview of resource usage and engagement metrics."
          title="Resource Reports"
        >
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" /> Export Analytics
          </Button>
        </PageHeader>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsSummaryItem
            color="primary"
            icon={LinkIcon}
            label="Verified Resources"
            value={stats.totalLinks}
          />
          <StatsSummaryItem
            color="blue"
            icon={MousePointer2}
            label="Total Engagement"
            value={stats.totalClicks}
          />
          <StatsSummaryItem
            color="amber"
            icon={TrendingUp}
            label="Growth Trend"
            value={
              stats.totalLinks > 0
                ? (stats.totalClicks / stats.totalLinks).toFixed(1)
                : "0.0"
            }
          />
          <StatsSummaryItem
            color="indigo"
            icon={Layers}
            label="Active Collections"
            value={stats.categoryStats.length}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <TopResourcesCard links={stats.topLinks} />
          <VisibilityChart data={stats.visibilityStats} />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <CategoryChart data={stats.categoryStats} />
          <ApplicationChart data={stats.applicationStats} />
        </div>
      </div>
    </LinkManagerPage>
  );
}

// ============================================================================
// Top Resources Card
// ============================================================================
function TopResourcesCard({
  links,
}: {
  links: {
    id: string;
    title: string;
    url: string;
    usageCount: number;
    category?: { name: string } | null;
    application?: { tla: string } | null;
  }[];
}) {
  if (links.length === 0) {
    return (
      <Card className="lg:col-span-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top Resources
          </CardTitle>
          <CardDescription className="text-muted-foreground/70 text-xs">
            Most clicked resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            description="No usage intelligence available yet."
            icon={BarChart3}
            title="No usage data"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Top Resources
        </CardTitle>
        <CardDescription className="text-muted-foreground/70 text-xs">
          Most clicked resources
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {links.map((link, i: number) => (
            <div
              className="group flex items-center justify-between rounded-md border bg-card p-4 transition-colors hover:bg-muted/50"
              key={link.id}
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted/50 font-medium text-muted-foreground text-sm transition-colors group-hover:border-primary/50 group-hover:text-primary">
                  {i + 1}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium text-sm leading-none">
                    {link.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      className="h-4 px-1.5 py-0 font-normal text-[10px]"
                      variant="secondary"
                    >
                      {link.category?.name || "Uncategorized"}
                    </Badge>
                    <span className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Box className="h-3 w-3" />
                      {link.application?.tla || "Global"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-bold text-xl leading-none">
                    {link.usageCount}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground uppercase tracking-wider">
                    Clicks
                  </p>
                </div>
                <a
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground opacity-0 transition-colors hover:border-border hover:bg-muted hover:text-foreground group-hover:opacity-100 md:opacity-100"
                  href={link.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Visibility Pie Chart
// ============================================================================
function VisibilityChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  return (
    <Card className="self-stretch border-border/50 lg:col-span-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2.5 font-bold text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-1/10">
            <Shield className="h-4 w-4 text-chart-1" />
          </div>
          Visibility Distribution
        </CardTitle>
        <CardDescription className="text-muted-foreground/70 text-xs">
          Public vs private resources
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer
          className="h-[280px] w-full"
          config={{
            public: { label: "Public", color: "var(--chart-1)" },
            private: { label: "Private", color: "var(--chart-2)" },
          }}
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
            <Pie
              data={data}
              dataKey="count"
              innerRadius={70}
              nameKey="name"
              outerRadius={100}
              paddingAngle={3}
              stroke="var(--background)"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell
                  fill={
                    entry.name === "public"
                      ? "var(--color-public)"
                      : "var(--color-private)"
                  }
                  key={entry.name}
                />
              ))}
            </Pie>
            <ChartLegend
              className="mt-4 justify-center gap-6"
              content={<ChartLegendContent nameKey="name" />}
            />
          </PieChart>
        </ChartContainer>
        <div className="mt-2 flex justify-center gap-8 border-border/30 border-t pt-2">
          {data.map((item) => (
            <div className="text-center" key={item.name}>
              <p className="font-bold text-2xl tabular-nums">{item.count}</p>
              <p className="font-bold text-[10px] text-muted-foreground/60 uppercase capitalize tracking-wider">
                {item.name}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Category Bar Chart
// ============================================================================
function CategoryChart({
  data,
}: {
  data: { name: string; clicks: number; count: number }[];
}) {
  if (data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2.5 font-bold text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-3/10">
              <Layers className="h-4 w-4 text-chart-3" />
            </div>
            Category Breakdown
          </CardTitle>
          <CardDescription className="text-muted-foreground/70 text-xs">
            Engagement metrics by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            description="No category data available."
            icon={Layers}
            size="sm"
            title="No category data"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2.5 font-bold text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-3/10">
            <Layers className="h-4 w-4 text-chart-3" />
          </div>
          Category Breakdown
        </CardTitle>
        <CardDescription className="text-muted-foreground/70 text-xs">
          Engagement metrics by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="h-[280px] w-full"
          config={{ clicks: { label: "Clicks", color: "var(--chart-3)" } }}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: 24, top: 8, bottom: 8 }}
          >
            <CartesianGrid
              horizontal={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
              strokeOpacity={0.3}
              vertical={true}
            />
            <YAxis
              axisLine={false}
              dataKey="name"
              fontSize={11}
              fontWeight={600}
              tick={{ fill: "var(--muted-foreground)" }}
              tickLine={false}
              tickMargin={8}
              type="category"
              width={90}
            />
            <XAxis hide type="number" />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            />
            <Bar
              barSize={24}
              dataKey="clicks"
              fill="var(--color-clicks)"
              radius={6}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Application Bar Chart
// ============================================================================
function ApplicationChart({
  data,
}: {
  data: { name: string; count: number; clicks: number }[];
}) {
  if (data.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2.5 font-bold text-base">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-4/10">
              <Box className="h-4 w-4 text-chart-4" />
            </div>
            Application Distribution
          </CardTitle>
          <CardDescription className="text-muted-foreground/70 text-xs">
            Resources per application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            description="No application data available."
            icon={Box}
            size="sm"
            title="No application data"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2.5 font-bold text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-4/10">
            <Box className="h-4 w-4 text-chart-4" />
          </div>
          Application Distribution
        </CardTitle>
        <CardDescription className="text-muted-foreground/70 text-xs">
          Resources per application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="h-[280px] w-full"
          config={{ count: { label: "Resources", color: "var(--chart-4)" } }}
        >
          <BarChart
            data={data}
            margin={{ top: 16, bottom: 16, left: 8, right: 8 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeOpacity={0.3}
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="name"
              fontSize={11}
              fontWeight={600}
              tick={{ fill: "var(--muted-foreground)" }}
              tickLine={false}
              tickMargin={12}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            />
            <Bar
              barSize={36}
              dataKey="count"
              fill="var(--color-count)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
