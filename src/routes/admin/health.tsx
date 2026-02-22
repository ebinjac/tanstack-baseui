import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Database,
  HardDrive,
  RefreshCcw,
  Server,
  Settings,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { HealthCheck } from "@/app/actions/health";
import { getSystemHealth } from "@/app/actions/health";
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

export const Route = createFileRoute("/admin/health")({
  component: HealthPage,
});

function HealthPage() {
  const [autoRefresh, setAutoRefresh] = useState(true); // Changed from React.useState
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set()); // Changed from React.useState

  const {
    data: health,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["system-health"],
    queryFn: () => getSystemHealth(),
    refetchInterval: autoRefresh ? 30_000 : false,
  });

  const getOverallBorderClass = (overall: string) => {
    if (overall === "healthy") {
      return "border-emerald-500/20 bg-emerald-500/5";
    }
    if (overall === "degraded") {
      return "border-amber-500/20 bg-amber-500/5";
    }
    return "border-red-500/20 bg-red-500/5";
  };

  const getOverallBgClass = (overall: string) => {
    if (overall === "healthy") {
      return "bg-emerald-500/10";
    }
    if (overall === "degraded") {
      return "bg-amber-500/10";
    }
    return "bg-red-500/10";
  };

  const getOverallIcon = (overall: string) => {
    if (overall === "healthy") {
      return <CheckCircle2 className="h-8 w-8 text-emerald-500" />;
    }
    if (overall === "degraded") {
      return <AlertTriangle className="h-8 w-8 text-amber-500" />;
    }
    return <XCircle className="h-8 w-8 text-red-500" />;
  };

  const getOverallLabel = (overall: string) => {
    if (overall === "healthy") {
      return "Operational";
    }
    if (overall === "degraded") {
      return "Degraded";
    }
    return "Down";
  };

  const toggleExpand = (name: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const getStatusIcon = (status: HealthCheck["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "unhealthy":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: HealthCheck["status"]) => {
    switch (status) {
      case "healthy":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "degraded":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "unhealthy":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "";
    }
  };

  const getCheckIcon = (name: string) => {
    if (
      name.toLowerCase().includes("database") ||
      name.toLowerCase().includes("postgres")
    ) {
      return Database;
    }
    if (name.toLowerCase().includes("memory")) {
      return Cpu;
    }
    if (
      name.toLowerCase().includes("server") ||
      name.toLowerCase().includes("runtime")
    ) {
      return Server;
    }
    if (name.toLowerCase().includes("environment")) {
      return Settings;
    }
    return Activity;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86_400);
    const hours = Math.floor((seconds % 86_400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="space-y-8">
      {/* Premium Admin Header Banner */}
      <PageHeader
        description="Monitor the health and status of all Ensemble services."
        title="System Health"
      >
        <Button
          className={`border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white ${autoRefresh ? "border-emerald-500 text-emerald-100" : ""}`}
          onClick={() => setAutoRefresh(!autoRefresh)}
          size="sm"
          variant="outline"
        >
          <Clock className="mr-2 h-4 w-4" />
          Auto-refresh {autoRefresh ? "ON" : "OFF"}
        </Button>
        <Button
          className="bg-white text-primary hover:bg-white/90"
          disabled={isFetching}
          onClick={() => refetch()}
          size="sm"
        >
          <RefreshCcw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh Now
        </Button>
      </PageHeader>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...new Array(4)].map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items
            <Card className="animate-pulse" key={i}>
              <CardContent className="p-6">
                <div className="h-20 rounded-lg bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!(isLoading || health) && (
        <Card>
          <CardContent className="p-12 text-center">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h3 className="mb-2 font-semibold text-lg">
              Failed to load health data
            </h3>
            <p className="mb-4 text-muted-foreground">
              There was an error fetching system health information.
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && health && (
        <>
          {/* Overall Status Banner */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-6 ${getOverallBorderClass(health.overall)}`}
            initial={{ opacity: 0, y: -10 }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`rounded-xl p-3 ${getOverallBgClass(health.overall)}`}
                >
                  {getOverallIcon(health.overall)}
                </div>
                <div>
                  <h2 className="font-bold text-2xl capitalize">
                    System {getOverallLabel(health.overall)}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Last checked: {new Date(health.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Uptime:</span>
                  <span className="font-semibold">
                    {formatUptime(health.uptime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Memory:</span>
                  <span className="font-semibold">
                    {health.environment.memoryUsage.percentage}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Node:</span>
                  <span className="font-semibold">
                    {health.environment.nodeVersion}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Health Checks Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {health.checks.map((check, index) => {
                const IconComponent = getCheckIcon(check.name);
                const isExpanded = expandedCards.has(check.name);

                return (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 20 }}
                    key={check.name}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-border/50 transition-all hover:ring-border">
                      <CardHeader
                        className="cursor-pointer pb-3"
                        onClick={() => toggleExpand(check.name)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-xl p-2.5 ${getStatusColor(check.status)}`}
                            >
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                {check.name}
                                {getStatusIcon(check.status)}
                              </CardTitle>
                              <CardDescription className="mt-0.5">
                                {check.message}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {check.latency !== undefined && (
                              <Badge
                                className="font-mono text-xs"
                                variant="outline"
                              >
                                {check.latency}ms
                              </Badge>
                            )}
                            <Button
                              className="h-8 w-8"
                              size="icon"
                              variant="ghost"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <AnimatePresence>
                        {isExpanded && check.details && (
                          <motion.div
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            initial={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CardContent className="pt-0">
                              <div className="space-y-2 rounded-lg bg-muted/30 p-4">
                                {Object.entries(check.details).map(
                                  ([key, value]) => (
                                    <div
                                      className="flex justify-between text-sm"
                                      key={key}
                                    >
                                      <span className="text-muted-foreground capitalize">
                                        {key.replace(/([A-Z])/g, " $1").trim()}
                                      </span>
                                      <span className="font-mono text-foreground">
                                        {String(value)}
                                      </span>
                                    </div>
                                  )
                                )}
                              </div>
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Quick Actions */}
          <Card className="border-none shadow-sm ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>
                Common administrative tasks and diagnostics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Button
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => refetch()}
                  variant="outline"
                >
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <span>Test DB Connection</span>
                </Button>
                <Button
                  className="h-auto flex-col gap-2 py-4"
                  variant="outline"
                >
                  <RefreshCcw className="h-5 w-5 text-muted-foreground" />
                  <span>Clear Cache</span>
                </Button>
                <Button
                  className="h-auto flex-col gap-2 py-4"
                  variant="outline"
                >
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <span>View Logs</span>
                </Button>
                <Button
                  className="h-auto flex-col gap-2 py-4"
                  variant="outline"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <span>Configuration</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
