/**
 * Shared Components Index
 * 
 * Centralized exports for all shared components.
 * These components are used across scorecard, turnover, and link manager tools.
 * 
 * @see skills/code-quality/rules/dry-no-copy-paste.md
 */

// Stats Card
export { StatsCard, StatsCardSkeleton, StatsGrid } from './stats-card'
export type { StatsCardProps, StatsGridProps } from './stats-card'

// Empty State
export { EmptyState, EmptyStateCard, EmptyStateInline } from './empty-state'
export type { EmptyStateProps, EmptyStateVariant } from './empty-state'

// Loading Skeletons
export {
    PageHeaderSkeleton,
    StatsGridSkeleton,
    ListSkeleton,
    TableSkeleton,
    CardGridSkeleton,
    FormSkeleton,
    PageSkeleton,
} from './loading-skeleton'

// Error Boundaries
export {
    ErrorBoundary,
    ErrorFallback,
    ScorecardErrorBoundary,
    TurnoverErrorBoundary,
    LinkManagerErrorBoundary,
    AdminErrorBoundary,
} from './error-boundary'
export type { ErrorBoundaryProps, ErrorFallbackProps } from './error-boundary'