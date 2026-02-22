/**
 * Loading Skeleton Components
 *
 * Reusable loading skeleton components for consistent loading states.
 *
 * @see skills/code-quality/rules/dry-no-copy-paste.md
 */

import { memo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * PageHeaderSkeleton - Skeleton for page headers
 */
export const PageHeaderSkeleton = memo(function PageHeaderSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
});

/**
 * StatsGridSkeleton - Skeleton for stats grid
 */
export const StatsGridSkeleton = memo(function StatsGridSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <Card className="border-muted bg-muted/5" key={i}>
          <CardContent className="flex items-center gap-4 p-6">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

/**
 * ListSkeleton - Skeleton for list items
 */
export const ListSkeleton = memo(function ListSkeleton({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <Card className="mb-4" key={i}>
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-5 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
});

/**
 * TableSkeleton - Skeleton for table views
 */
export const TableSkeleton = memo(function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 border-b bg-muted/20 p-4">
        {Array.from({ length: columns }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <Skeleton className="h-4 flex-1" key={i} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          className="flex items-center gap-4 border-b p-4 last:border-0"
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          key={rowIndex}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            <Skeleton className="h-4 flex-1" key={colIndex} />
          ))}
        </div>
      ))}
    </div>
  );
});

/**
 * CardGridSkeleton - Skeleton for card grid views
 */
export const CardGridSkeleton = memo(function CardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

/**
 * FormSkeleton - Skeleton for form layouts
 */
export const FormSkeleton = memo(function FormSkeleton({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <div className="space-y-2" key={i}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  );
});

/**
 * PageSkeleton - Full page loading skeleton
 */
export const PageSkeleton = memo(function PageSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-7xl space-y-8 p-8", className)}>
      <PageHeaderSkeleton />
      <StatsGridSkeleton />
      <ListSkeleton />
    </div>
  );
});
