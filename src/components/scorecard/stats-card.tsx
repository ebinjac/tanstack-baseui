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
                "shadow-sm border-muted/60 bg-muted/5",
                highlight && "border-red-500/30 bg-red-500/5"
            )}
        >
            <CardContent className="p-3 flex items-center gap-3">
                <div
                    className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        highlight ? "bg-red-500/10" : "bg-background border shadow-sm text-muted-foreground"
                    )}
                >
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xl font-bold leading-tight">{value}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider truncate">
                        {label}
                    </p>
                    {sublabel && (
                        <p className="text-[9px] text-muted-foreground/60 leading-tight truncate">{sublabel}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
