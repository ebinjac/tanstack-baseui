"use client";

import { Activity, AlertTriangle, Hash, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScorecardStats } from "./types";

interface StatsSummaryProps {
  stats: ScorecardStats;
}

export function StatsSummary({ stats }: StatsSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-8 py-4 md:grid-cols-4">
      <div className="relative z-10 flex flex-col justify-center py-2">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers className="h-4 w-4" />
          </div>
          <p className="truncate font-bold text-[11px] text-muted-foreground uppercase tracking-widest">
            Teams
          </p>
        </div>
        <p className="font-black text-4xl text-foreground tabular-nums leading-none tracking-tighter md:text-5xl">
          {stats.teams}
        </p>
      </div>

      <div className="relative z-10 flex flex-col justify-center py-2">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <Activity className="h-4 w-4" />
          </div>
          <p className="truncate font-bold text-[11px] text-muted-foreground uppercase tracking-widest">
            Applications
          </p>
        </div>
        <p className="font-black text-4xl text-foreground tabular-nums leading-none tracking-tighter md:text-5xl">
          {stats.apps}
        </p>
      </div>

      <div className="relative z-10 mt-4 flex flex-col justify-center py-2 md:mt-0">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400">
            <Hash className="h-4 w-4" />
          </div>
          <p className="truncate font-bold text-[11px] text-muted-foreground uppercase tracking-widest">
            Metrics
          </p>
        </div>
        <p className="font-black text-4xl text-foreground tabular-nums leading-none tracking-tighter md:text-5xl">
          {stats.entries}
        </p>
      </div>

      <div className="relative z-10 mt-4 flex flex-col justify-center py-2 md:mt-0">
        <div className="mb-3 flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
              stats.availBreaches > 0
                ? "bg-red-500/10 text-red-600 dark:text-red-500"
                : "bg-primary/10 text-primary"
            )}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
          <p
            className={cn(
              "truncate font-bold text-[11px] uppercase tracking-widest",
              stats.availBreaches > 0
                ? "text-red-500/80 dark:text-red-400"
                : "text-muted-foreground"
            )}
          >
            Breaches
          </p>
        </div>
        <p
          className={cn(
            "font-black text-4xl tabular-nums leading-none tracking-tighter md:text-5xl",
            stats.availBreaches > 0
              ? "text-red-600 dark:text-red-500"
              : "text-foreground"
          )}
        >
          {stats.availBreaches}
        </p>
      </div>
    </div>
  );
}
