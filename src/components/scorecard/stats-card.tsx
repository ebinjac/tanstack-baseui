import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    highlight?: boolean;
    sublabel?: string;
}

export function StatsCard({
    icon,
    label,
    value,
    highlight = false,
    sublabel,
}: StatsCardProps) {
    return (
        <Card
            className={cn(
                "relative overflow-hidden transition-all duration-300 border-border/50",
                highlight ? "bg-red-500/[0.03] border-red-500/20" : "bg-card/50 backdrop-blur-sm"
            )}
        >
            {/* Background Accent */}
            <div className={cn(
                "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] rounded-full",
                highlight ? "bg-red-500" : "bg-primary"
            )} />

            <CardContent className="p-4 flex items-center gap-4 relative z-10">
                <div
                    className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110",
                        highlight
                            ? "bg-red-500/10 text-red-600 border border-red-500/20"
                            : "bg-primary/10 text-primary border border-primary/20"
                    )}
                >
                    {icon}
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                    <p className={cn(
                        "text-2xl font-bold tabular-nums tracking-tight leading-none",
                        highlight && "text-red-600"
                    )}>{value}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                        {label}
                    </p>
                    {sublabel && (
                        <div className="flex items-center gap-1.5 mt-1 opacity-70">
                            <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{sublabel}</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
