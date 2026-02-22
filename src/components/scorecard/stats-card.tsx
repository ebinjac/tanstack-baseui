import React from "react";

import { cn } from "@/lib/utils";

interface StatsCardProps {
  highlight?: boolean;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  value: number | string;
}

export function StatsCard({
  icon,
  label,
  value,
  highlight = false,
  sublabel,
}: StatsCardProps) {
  return (
    <div className="flex flex-col justify-center px-1 py-2">
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
            highlight
              ? "bg-red-500/10 text-red-600 dark:text-red-500"
              : "bg-primary/10 text-primary"
          )}
        >
          {/* The icon itself should inherit text color from parent unless overridden */}
          {React.isValidElement(icon)
            ? React.cloneElement(
                icon as React.ReactElement<{ className?: string }>,
                {
                  className: cn(
                    (icon as React.ReactElement<{ className?: string }>).props
                      .className,
                    "h-4 w-4"
                  ),
                }
              )
            : icon}
        </div>
        <p
          className={cn(
            "truncate font-bold text-[11px] uppercase tracking-widest",
            highlight ? "text-red-500/80" : "text-muted-foreground"
          )}
        >
          {label}
        </p>
      </div>
      <div className="flex items-baseline gap-3">
        <p
          className={cn(
            "font-black text-4xl tabular-nums leading-none tracking-tighter md:text-5xl",
            highlight ? "text-red-600 dark:text-red-500" : "text-foreground"
          )}
        >
          {value}
        </p>
        {sublabel && (
          <div className="flex items-center gap-1.5 opacity-80">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                highlight ? "bg-red-500/50" : "bg-primary/40"
              )}
            />
            <p
              className={cn(
                "font-medium text-[10px] uppercase tracking-wider",
                highlight ? "text-red-600/70" : "text-muted-foreground"
              )}
            >
              {sublabel}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
