/**
 * Shared Hooks Index
 *
 * Centralized exports for all shared hooks.
 * These hooks extract common patterns from scorecard, turnover, and link manager tools.
 *
 * @see skills/react-best-practices/rules/hook-extract-logic.md
 */

export type {
  DateRange,
  PresetRange,
  UseDateRangeOptions,
  UseDateRangeReturn,
  UseMonthYearSelectionOptions,
  UseMonthYearSelectionReturn,
  UseYearSelectionOptions,
  UseYearSelectionReturn,
} from "./use-date-range";
// Date range hooks
export {
  useDateRange,
  useMonthYearSelection,
  useYearSelection,
} from "./use-date-range";
export type {
  UseExpandStateOptions,
  UseExpandStateReturn,
} from "./use-expand-state";
// Expand/collapse state hooks
export {
  useAccordionExpand,
  useExpandState,
  useSingleExpand,
} from "./use-expand-state";
export type {
  UsePaginationOptions,
  UsePaginationReturn,
} from "./use-pagination";
// Pagination hooks
export { usePaginatedItems, usePagination } from "./use-pagination";
export type {
  UseMultiFilterOptions,
  UseMultiFilterReturn,
  UseSearchFilterOptions,
  UseSearchFilterReturn,
} from "./use-search-filter";
// Search and filter hooks
export { useMultiFilter, useSearchFilter } from "./use-search-filter";
