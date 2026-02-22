import {
  ArrowUpRight,
  BarChart3,
  Link2,
  RefreshCw,
  Server,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolItem } from "./shared";

interface ResourcesTabProps {
  stats: {
    total: number;
    active: number;
    tiers: { critical: number; other: number };
  };
}

export function ResourcesTab({ stats }: ResourcesTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Inventory Insights */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
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
                      (stats.tiers.critical / (stats.total || 1)) * 100
                    )}
                    % Critical
                  </span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-red-500"
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
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{
                      width: `${(stats.active / (stats.total || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2 border-t pt-4">
              <p className="font-medium text-muted-foreground text-xs">
                Capabilities
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  className="h-5 font-medium text-[10px]"
                  variant="outline"
                >
                  Support
                </Badge>
                <Badge
                  className="h-5 font-medium text-[10px]"
                  variant="outline"
                >
                  SNOW
                </Badge>
                <Badge
                  className="h-5 font-medium text-[10px]"
                  variant="outline"
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
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-primary" />
              Operational Tooling
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              <ToolItem
                desc="Quality and compliance metrics for application health."
                icon={<BarChart3 className="h-4 w-4" />}
                link="#"
                title="Scorecard"
              />
              <ToolItem
                desc="Server and environment management in a single view."
                icon={<Server className="h-4 w-4" />}
                link="#"
                title="envMatrix"
              />
              <ToolItem
                desc="Centralized directory for team resources."
                icon={<Link2 className="h-4 w-4" />}
                link="#"
                title="Link Manager"
              />
              <ToolItem
                desc="Shift handover and transition management."
                icon={<RefreshCw className="h-4 w-4" />}
                link="#"
                title="Turnover"
              />
            </div>
            <div className="flex justify-center border-t p-3">
              <Button size="sm" variant="ghost">
                Request Access to More Tools{" "}
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
