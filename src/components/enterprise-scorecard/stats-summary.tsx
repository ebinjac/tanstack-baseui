'use client'

import { Activity, AlertTriangle, Hash, Layers } from 'lucide-react'
import type { ScorecardStats } from './types'
import { cn } from '@/lib/utils'

interface StatsSummaryProps {
  stats: ScorecardStats
}

export function StatsSummary({ stats }: StatsSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-4">
      <div className="flex flex-col justify-center py-2 relative z-10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
            <Layers className="h-4 w-4" />
          </div>
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest truncate">
            Teams
          </p>
        </div>
        <p className="text-4xl md:text-5xl font-black tabular-nums tracking-tighter text-foreground leading-none">
          {stats.teams}
        </p>
      </div>

      <div className="flex flex-col justify-center py-2 relative z-10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-500/20">
            <Activity className="h-4 w-4" />
          </div>
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest truncate">
            Applications
          </p>
        </div>
        <p className="text-4xl md:text-5xl font-black tabular-nums tracking-tighter text-foreground leading-none">
          {stats.apps}
        </p>
      </div>

      <div className="flex flex-col justify-center py-2 relative z-10 mt-4 md:mt-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-500/10 text-green-600 dark:text-green-400 dark:bg-green-500/20">
            <Hash className="h-4 w-4" />
          </div>
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest truncate">
            Metrics
          </p>
        </div>
        <p className="text-4xl md:text-5xl font-black tabular-nums tracking-tighter text-foreground leading-none">
          {stats.entries}
        </p>
      </div>

      <div className="flex flex-col justify-center py-2 relative z-10 mt-4 md:mt-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
              stats.availBreaches > 0
                ? 'bg-red-500/10 text-red-600 dark:text-red-500'
                : 'bg-primary/10 text-primary',
            )}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p
            className={cn(
              'text-[11px] font-bold uppercase tracking-widest truncate',
              stats.availBreaches > 0
                ? 'text-red-500/80 dark:text-red-400'
                : 'text-muted-foreground',
            )}
          >
            Breaches
          </p>
        </div>
        <p
          className={cn(
            'text-4xl md:text-5xl font-black tabular-nums tracking-tighter leading-none',
            stats.availBreaches > 0
              ? 'text-red-600 dark:text-red-500'
              : 'text-foreground',
          )}
        >
          {stats.availBreaches}
        </p>
      </div>
    </div>
  )
}
