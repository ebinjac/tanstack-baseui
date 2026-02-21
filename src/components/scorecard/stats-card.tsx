import React from "react";

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
        <div className="flex flex-col justify-center py-2 px-1">
            <div className="flex items-center gap-2.5 mb-3">
                <div
                    className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        highlight
                            ? "bg-red-500/10 text-red-600 dark:text-red-500"
                            : "bg-primary/10 text-primary"
                    )}
                >
                    {/* The icon itself should inherit text color from parent unless overridden */}
                    {React.isValidElement(icon)
                        ? React.cloneElement(icon as React.ReactElement<any>, {
                            className: cn((icon as React.ReactElement<any>).props.className, "h-4 w-4")
                        })
                        : icon
                    }
                </div>
                <p className={cn(
                    "text-[11px] font-bold uppercase tracking-widest truncate",
                    highlight ? "text-red-500/80" : "text-muted-foreground"
                )}>
                    {label}
                </p>
            </div>
            <div className="flex items-baseline gap-3">
                <p className={cn(
                    "text-4xl md:text-5xl font-black tabular-nums tracking-tighter leading-none",
                    highlight ? "text-red-600 dark:text-red-500" : "text-foreground"
                )}>{value}</p>
                {sublabel && (
                    <div className="flex items-center gap-1.5 opacity-80">
                        <div className={cn("h-1.5 w-1.5 rounded-full", highlight ? "bg-red-500/50" : "bg-primary/40")} />
                        <p className={cn(
                            "text-[10px] font-medium uppercase tracking-wider",
                            highlight ? "text-red-600/70" : "text-muted-foreground"
                        )}>{sublabel}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
