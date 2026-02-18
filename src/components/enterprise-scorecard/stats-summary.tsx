"use client";

import { Activity, Hash, AlertTriangle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScorecardStats } from "./types";

interface StatsSummaryProps {
    stats: ScorecardStats;
}

export function StatsSummary({ stats }: StatsSummaryProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative overflow-hidden transition-all duration-300 border border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
                <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] rounded-full bg-primary" />
                <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary border border-primary/20 relative z-10">
                    <Layers className="h-5 w-5" />
                </div>
                <div className="relative z-10 min-w-0 flex flex-col justify-center">
                    <p className="text-2xl font-bold tabular-nums tracking-tight leading-none">{stats.teams}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Teams</p>
                </div>
            </div>

            <div className="relative overflow-hidden transition-all duration-300 border border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
                <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] rounded-full bg-indigo-500" />
                <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 relative z-10">
                    <Activity className="h-5 w-5" />
                </div>
                <div className="relative z-10 min-w-0 flex flex-col justify-center">
                    <p className="text-2xl font-bold tabular-nums tracking-tight leading-none">{stats.apps}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Applications</p>
                </div>
            </div>

            <div className="relative overflow-hidden transition-all duration-300 border border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-4">
                <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] rounded-full bg-green-500" />
                <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-500/10 text-green-600 border border-green-500/20 relative z-10">
                    <Hash className="h-5 w-5" />
                </div>
                <div className="relative z-10 min-w-0 flex flex-col justify-center">
                    <p className="text-2xl font-bold tabular-nums tracking-tight leading-none">{stats.entries}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Metrics</p>
                </div>
            </div>

            <div className={cn(
                "relative overflow-hidden transition-all duration-300 border rounded-2xl p-4 flex items-center gap-4",
                stats.availBreaches > 0
                    ? "bg-red-500/5 border-red-500/20"
                    : "bg-card/50 backdrop-blur-sm border-border/50"
            )}>
                <div className={cn(
                    "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] rounded-full",
                    stats.availBreaches > 0 ? "bg-red-500" : "bg-primary"
                )} />
                <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border relative z-10",
                    stats.availBreaches > 0
                        ? "bg-red-500/10 text-red-600 border-red-500/20"
                        : "bg-primary/10 text-primary border-primary/20"
                )}>
                    <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="relative z-10 min-w-0 flex flex-col justify-center">
                    <p className={cn(
                        "text-2xl font-bold tabular-nums tracking-tight leading-none",
                        stats.availBreaches > 0 && "text-red-600"
                    )}>{stats.availBreaches}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Breaches</p>
                </div>
            </div>
        </div>
    );
}
