/**
 * Shared Hooks Index
 *
 * Centralized exports for all shared hooks.
 * These hooks extract common patterns from scorecard, turnover, and link manager tools.
 *
 * @see skills/react-best-practices/rules/hook-extract-logic.md
 */

// Pagination hooks
export { usePagination, usePaginatedItems } from './use-pagination'
export type {
  UsePaginationOptions,
  UsePaginationReturn,
} from './use-pagination'

// Search and filter hooks
export { useSearchFilter, useMultiFilter } from './use-search-filter'
export type {
  UseSearchFilterOptions,
  UseSearchFilterReturn,
  UseMultiFilterOptions,
  UseMultiFilterReturn,
} from './use-search-filter'

// Expand/collapse state hooks
export {
  useExpandState,
  useSingleExpand,
  useAccordionExpand,
} from './use-expand-state'
export type {
  UseExpandStateOptions,
  UseExpandStateReturn,
} from './use-expand-state'

// Date range hooks
export {
  useDateRange,
  useYearSelection,
  useMonthYearSelection,
} from './use-date-range'
export type {
  UseDateRangeOptions,
  UseDateRangeReturn,
  UseYearSelectionOptions,
  UseYearSelectionReturn,
  UseMonthYearSelectionOptions,
  UseMonthYearSelectionReturn,
  DateRange,
  PresetRange,
} from './use-date-range'
