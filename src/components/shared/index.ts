/**
 * Shared Components Index
 *
 * Centralized exports for all shared components.
 * These components are used across scorecard, turnover, and link manager tools.
 *
 * @see skills/code-quality/rules/dry-no-copy-paste.md
 */

export type { EmptyStateProps, EmptyStateVariant } from "./empty-state";
// Empty State
export { EmptyState, EmptyStateCard, EmptyStateInline } from "./empty-state";
export type { ErrorBoundaryProps, ErrorFallbackProps } from "./error-boundary";
// Error Boundaries
export {
  AdminErrorBoundary,
  ErrorBoundary,
  ErrorFallback,
  LinkManagerErrorBoundary,
  ScorecardErrorBoundary,
  TurnoverErrorBoundary,
} from "./error-boundary";
// Loading Skeletons
export {
  CardGridSkeleton,
  FormSkeleton,
  ListSkeleton,
  PageHeaderSkeleton,
  PageSkeleton,
  StatsGridSkeleton,
  TableSkeleton,
} from "./loading-skeleton";
export * from "./page-header";
export type { StatsCardProps, StatsGridProps } from "./stats-card";
// Stats Card
export { StatsCard, StatsCardSkeleton, StatsGrid } from "./stats-card";
