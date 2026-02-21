/**
 * Loading Skeleton Components
 *
 * Reusable loading skeleton components for consistent loading states.
 *
 * @see skills/code-quality/rules/dry-no-copy-paste.md
 */

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

/**
 * PageHeaderSkeleton - Skeleton for page headers
 */
export const PageHeaderSkeleton = memo(function PageHeaderSkeleton({
  className,
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-2xl" />
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
  )
})

/**
 * StatsGridSkeleton - Skeleton for stats grid
 */
export const StatsGridSkeleton = memo(function StatsGridSkeleton({
  count = 4,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="bg-muted/5 border-muted">
          <CardContent className="p-6 flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
})

/**
 * ListSkeleton - Skeleton for list items
 */
export const ListSkeleton = memo(function ListSkeleton({
  count = 5,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="mb-4">
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
  )
})

/**
 * TableSkeleton - Skeleton for table views
 */
export const TableSkeleton = memo(function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border', className)}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-muted/20">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 p-4 border-b last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
})

/**
 * CardGridSkeleton - Skeleton for card grid views
 */
export const CardGridSkeleton = memo(function CardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
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
  )
})

/**
 * FormSkeleton - Skeleton for form layouts
 */
export const FormSkeleton = memo(function FormSkeleton({
  fields = 4,
  className,
}: {
  fields?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  )
})

/**
 * PageSkeleton - Full page loading skeleton
 */
export const PageSkeleton = memo(function PageSkeleton({
  className,
}: {
  className?: string
}) {
  return (
    <div className={cn('p-8 max-w-7xl mx-auto space-y-8', className)}>
      <PageHeaderSkeleton />
      <StatsGridSkeleton />
      <ListSkeleton />
    </div>
  )
})
