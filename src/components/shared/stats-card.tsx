/**
 * StatsCard Component
 *
 * A reusable stats card component used across scorecard, turnover, and link manager.
 * Displays a statistic with an icon, label, and optional sublabel.
 *
 * @see skills/code-quality/rules/dry-no-copy-paste.md
 */

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatsCardProps {
  /** Additional className */
  className?: string;
  /** Whether to highlight the value (e.g., for warnings) */
  highlight?: boolean;
  /** Icon to display */
  icon: React.ReactNode;
  /** Whether the card is interactive */
  interactive?: boolean;
  /** Label text */
  label: string;
  /** Click handler */
  onClick?: () => void;
  /** Optional sublabel */
  sublabel?: string;
  /** Value to display */
  value: number | string;
}

/**
 * A stats card component for displaying metrics.
 *
 * @example
 * ```tsx
 * <StatsCard
 *   icon={<Activity className="text-blue-500" />}
 *   label="Applications"
 *   value={42}
 * />
 * ```
 */
export const StatsCard = memo(function StatsCard({
  icon,
  label,
  value,
  sublabel,
  highlight = false,
  className,
  onClick,
  interactive = false,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-300",
        interactive &&
          "cursor-pointer hover:border-primary/30 hover:bg-card/50",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              highlight
                ? "bg-red-500/10 text-red-500"
                : "bg-primary/10 text-primary"
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-muted-foreground text-xs uppercase tracking-wider">
              {label}
            </p>
            <p
              className={cn(
                "font-black text-2xl tracking-tight",
                highlight && "text-red-500"
              )}
            >
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {sublabel && (
              <p className="mt-0.5 font-bold text-[10px] text-muted-foreground/70">
                {sublabel}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

/**
 * StatsCardSkeleton - Loading state for StatsCard
 */
export function StatsCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-2xl bg-muted/20" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-muted/20" />
            <div className="h-7 w-16 animate-pulse rounded bg-muted/20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * StatsGrid - A grid container for StatsCard components
 */
export interface StatsGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3 | 4 | 5;
}

export const StatsGrid = memo(function StatsGrid({
  children,
  columns = 4,
  className,
}: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
});
