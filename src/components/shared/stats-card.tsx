/**
 * StatsCard Component
 *
 * A reusable stats card component used across scorecard, turnover, and link manager.
 * Displays a statistic with an icon, label, and optional sublabel.
 *
 * @see skills/code-quality/rules/dry-no-copy-paste.md
 */

import { memo } from 'react'
import type {LucideIcon} from 'lucide-react';
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

export interface StatsCardProps {
  /** Icon to display */
  icon: React.ReactNode
  /** Label text */
  label: string
  /** Value to display */
  value: number | string
  /** Optional sublabel */
  sublabel?: string
  /** Whether to highlight the value (e.g., for warnings) */
  highlight?: boolean
  /** Additional className */
  className?: string
  /** Click handler */
  onClick?: () => void
  /** Whether the card is interactive */
  interactive?: boolean
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
        'bg-card/30 backdrop-blur-sm border-border/50 transition-all duration-300',
        interactive &&
          'cursor-pointer hover:bg-card/50 hover:border-primary/30',
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'h-14 w-14 rounded-2xl flex items-center justify-center shrink-0',
              highlight
                ? 'bg-red-500/10 text-red-500'
                : 'bg-primary/10 text-primary',
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <p
              className={cn(
                'text-2xl font-black tracking-tight',
                highlight && 'text-red-500',
              )}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {sublabel && (
              <p className="text-[10px] font-bold text-muted-foreground/70 mt-0.5">
                {sublabel}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

/**
 * StatsCardSkeleton - Loading state for StatsCard
 */
export function StatsCardSkeleton() {
  return (
    <Card className="bg-card/30 backdrop-blur-sm border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-muted/20 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-20 bg-muted/20 rounded animate-pulse" />
            <div className="h-7 w-16 bg-muted/20 rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * StatsGrid - A grid container for StatsCard components
 */
export interface StatsGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export const StatsGrid = memo(function StatsGrid({
  children,
  columns = 4,
  className,
}: StatsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  )
})
