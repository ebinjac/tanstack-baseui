"use client";

import { BarChart3, Activity, Hash, AlertTriangle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScorecardStats } from "./types";

interface StatsSummaryProps {
    stats: ScorecardStats;
}

export function StatsSummary({ stats }: StatsSummaryProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-muted/60 shadow-sm">
            {/* Title Section */}
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-2 rounded-lg border border-primary/10">
                    <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Enterprise Scorecard</h1>
                    <p className="text-xs text-muted-foreground">Availability & volume across teams</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg border border-transparent hover:border-muted-foreground/20 transition-all group">
                    <Layers className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                    <div>
                        <p className="text-xs text-muted-foreground leading-none">Teams</p>
                        <p className="text-sm font-bold">{stats.teams}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg border border-transparent hover:border-muted-foreground/20 transition-all group">
                    <Activity className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                    <div>
                        <p className="text-xs text-muted-foreground leading-none">Apps</p>
                        <p className="text-sm font-bold">{stats.apps}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg border border-transparent hover:border-muted-foreground/20 transition-all group">
                    <Hash className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform" />
                    <div>
                        <p className="text-xs text-muted-foreground leading-none">Entries</p>
                        <p className="text-sm font-bold">{stats.entries}</p>
                    </div>
                </div>
                <div className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all group",
                    stats.availBreaches > 0
                        ? "bg-red-500/5 border-red-500/20 text-red-600"
                        : "bg-muted/40 border-transparent text-foreground"
                )}>
                    <AlertTriangle className={cn(
                        "h-4 w-4 group-hover:scale-110 transition-transform",
                        stats.availBreaches > 0 ? "text-red-500" : "text-muted-foreground"
                    )} />
                    <div>
                        <p className="text-xs opacity-70 leading-none">Breaches</p>
                        <p className="text-sm font-bold">{stats.availBreaches}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
