import {
  ArrowUpRight,
  BarChart3,
  Link2,
  RefreshCw,
  Server,
  Wrench,
} from 'lucide-react'
import { ToolItem } from './shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ResourcesTabProps {
  stats: {
    total: number
    active: number
    tiers: { critical: number; other: number }
  }
}

export function ResourcesTab({ stats }: ResourcesTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Inventory Insights */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Inventory Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Tier Distribution</span>
                  <span className="text-muted-foreground">
                    {Math.round(
                      (stats.tiers.critical / (stats.total || 1)) * 100,
                    )}
                    % Critical
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{
                      width: `${(stats.tiers.critical / (stats.total || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Production Ratio</span>
                  <span className="text-muted-foreground">
                    {Math.round((stats.active / (stats.total || 1)) * 100)}%
                    Live
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${(stats.active / (stats.total || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="pt-4 border-t space-y-2">
              <p className="text-xs text-muted-foreground font-medium">
                Capabilities
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 font-medium"
                >
                  Support
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 font-medium"
                >
                  SNOW
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 font-medium"
                >
                  Slack
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operational Tooling */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Operational Tooling
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <ToolItem
                icon={<BarChart3 className="h-4 w-4" />}
                title="Scorecard"
                desc="Quality and compliance metrics for application health."
                link="#"
              />
              <ToolItem
                icon={<Server className="h-4 w-4" />}
                title="envMatrix"
                desc="Server and environment management in a single view."
                link="#"
              />
              <ToolItem
                icon={<Link2 className="h-4 w-4" />}
                title="Link Manager"
                desc="Centralized directory for team resources."
                link="#"
              />
              <ToolItem
                icon={<RefreshCw className="h-4 w-4" />}
                title="Turnover"
                desc="Shift handover and transition management."
                link="#"
              />
            </div>
            <div className="p-3 flex justify-center border-t">
              <Button variant="ghost" size="sm">
                Request Access to More Tools{' '}
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
