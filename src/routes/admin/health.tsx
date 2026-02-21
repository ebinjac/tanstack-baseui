import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
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
} from 'lucide-react'
import type {HealthCheck} from '@/app/actions/health';
import { PageHeader } from '@/components/shared'
import {  getSystemHealth } from '@/app/actions/health'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/admin/health')({
  component: HealthPage,
})

function HealthPage() {
  const [autoRefresh, setAutoRefresh] = useState(true) // Changed from React.useState
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set()) // Changed from React.useState

  const {
    data: health,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => getSystemHealth(),
    refetchInterval: autoRefresh ? 30000 : false,
  })

  const toggleExpand = (name: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
      case 'degraded':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'unhealthy':
        return 'bg-red-500/10 text-red-600 border-red-500/20'
    }
  }

  const getCheckIcon = (name: string) => {
    if (
      name.toLowerCase().includes('database') ||
      name.toLowerCase().includes('postgres')
    ) {
      return Database
    }
    if (name.toLowerCase().includes('memory')) {
      return Cpu
    }
    if (
      name.toLowerCase().includes('server') ||
      name.toLowerCase().includes('runtime')
    ) {
      return Server
    }
    if (name.toLowerCase().includes('environment')) {
      return Settings
    }
    return Activity
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  return (
    <div className="space-y-8">
      {/* Premium Admin Header Banner */}
      <PageHeader
        title="System Health"
        description="Monitor the health and status of all Ensemble services."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white ${autoRefresh ? 'border-emerald-500 text-emerald-100' : ''}`}
        >
          <Clock className="h-4 w-4 mr-2" />
          Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
        </Button>
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          size="sm"
          className="bg-white text-primary hover:bg-white/90"
        >
          <RefreshCcw
            className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
          />
          Refresh Now
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : health ? (
        <>
          {/* Overall Status Banner */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-6 border ${
              health.overall === 'healthy'
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : health.overall === 'degraded'
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-red-500/5 border-red-500/20'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl ${
                    health.overall === 'healthy'
                      ? 'bg-emerald-500/10'
                      : health.overall === 'degraded'
                        ? 'bg-amber-500/10'
                        : 'bg-red-500/10'
                  }`}
                >
                  {health.overall === 'healthy' ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  ) : health.overall === 'degraded' ? (
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold capitalize">
                    System{' '}
                    {health.overall === 'healthy'
                      ? 'Operational'
                      : health.overall === 'degraded'
                        ? 'Degraded'
                        : 'Down'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {health.checks.map((check, index) => {
                const IconComponent = getCheckIcon(check.name)
                const isExpanded = expandedCards.has(check.name)

                return (
                  <motion.div
                    key={check.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-none shadow-sm ring-1 ring-border/50 hover:ring-border transition-all overflow-hidden">
                      <CardHeader
                        className="pb-3 cursor-pointer"
                        onClick={() => toggleExpand(check.name)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2.5 rounded-xl ${getStatusColor(check.status)}`}
                            >
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
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
                                variant="outline"
                                className="text-xs font-mono"
                              >
                                {check.latency}ms
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
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
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CardContent className="pt-0">
                              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                                {Object.entries(check.details).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      className="flex justify-between text-sm"
                                    >
                                      <span className="text-muted-foreground capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                      </span>
                                      <span className="font-mono text-foreground">
                                        {String(value)}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                )
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => refetch()}
                >
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <span>Test DB Connection</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                >
                  <RefreshCcw className="h-5 w-5 text-muted-foreground" />
                  <span>Clear Cache</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  <span>View Logs</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <span>Configuration</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Failed to load health data
            </h3>
            <p className="text-muted-foreground mb-4">
              There was an error fetching system health information.
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
