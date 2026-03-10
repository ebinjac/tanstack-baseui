"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { CURRENT_MONTH, CURRENT_YEAR, MONTHS } from "./constants";
import type { AvailabilityRecord, ScorecardEntry } from "./types";

interface AvailabilitySparklineProps {
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
  className?: string;
  entries: ScorecardEntry[];
  height?: number;
  selectedYear: number;
  width?: number;
}

export function AvailabilitySparkline({
  entries,
  availabilityByEntry,
  selectedYear,
  width = 80,
  height = 24,
  className,
}: AvailabilitySparklineProps) {
  const sparkData = useMemo(() => {
    const isCurrentYear = selectedYear === CURRENT_YEAR;

    return MONTHS.map((_, i) => {
      const monthNum = i + 1;
      const key = `${selectedYear}-${monthNum}`;
      const isFuture = isCurrentYear && monthNum > CURRENT_MONTH;

      if (isFuture) {
        return null;
      }

      let totalAvail = 0;
      let count = 0;

      for (const entry of entries) {
        const av = availabilityByEntry[entry.id]?.[key];
        if (av) {
          totalAvail += Number.parseFloat(av.availability);
          count++;
        }
      }

      if (count === 0) {
        return null;
      }

      return { month: monthNum, value: totalAvail / count };
    }).filter(Boolean) as Array<{ month: number; value: number }>;
  }, [entries, availabilityByEntry, selectedYear]);

  if (sparkData.length < 2) {
    return null;
  }

  // Color based on latest value
  const latestValue = sparkData.at(-1)?.value ?? 100;
  const color = latestValue < 99 ? "hsl(0, 84%, 60%)" : "hsl(142, 71%, 45%)";

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart
          data={sparkData}
          margin={{ top: 1, right: 1, left: 1, bottom: 1 }}
        >
          <defs>
            <linearGradient
              id={`spark-${latestValue < 99 ? "red" : "green"}`}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            animationDuration={500}
            dataKey="value"
            dot={false}
            fill={`url(#spark-${latestValue < 99 ? "red" : "green"})`}
            stroke={color}
            strokeWidth={1.5}
            type="monotone"
            yAxisId={undefined}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
