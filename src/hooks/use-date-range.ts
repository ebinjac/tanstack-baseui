/**
 * useDateRange Hook
 *
 * A reusable hook for managing date range selection.
 * Extracts common date range patterns found in scorecard and turnover tools.
 *
 * @see skills/react-best-practices/rules/hook-extract-logic.md
 */

import { useState, useCallback, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subYears,
  subDays,
  startOfWeek,
  endOfWeek,
  isValid,
  parseISO,
} from 'date-fns'

export interface DateRange {
  start: Date
  end: Date
}

export type PresetRange =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'last3Months'
  | 'last6Months'
  | 'thisYear'
  | 'lastYear'
  | 'allTime'

export interface UseDateRangeOptions {
  /** Initial date range */
  initialRange?: DateRange | null
  /** Initial preset to use */
  initialPreset?: PresetRange
  /** Minimum allowed date */
  minDate?: Date
  /** Maximum allowed date */
  maxDate?: Date
  /** Format for display (default: 'MMM d, yyyy') */
  displayFormat?: string
}

export interface UseDateRangeReturn {
  /** Current date range */
  range: DateRange | null
  /** Set date range directly */
  setRange: (range: DateRange | null) => void
  /** Set start date */
  setStart: (date: Date) => void
  /** Set end date */
  setEnd: (date: Date) => void
  /** Clear date range */
  clearRange: () => void
  /** Current preset (if set via preset) */
  preset: PresetRange | null
  /** Set range from preset */
  setPreset: (preset: PresetRange) => void
  /** Whether a range is selected */
  hasRange: boolean
  /** Formatted display string */
  displayValue: string
  /** Number of days in range */
  daysInRange: number
  /** Check if a date is within the range */
  isInRange: (date: Date) => boolean
  /** Validate if a date can be set as start */
  canSetStart: (date: Date) => boolean
  /** Validate if a date can be set as end */
  canSetEnd: (date: Date) => boolean
}

/**
 * Get date range for a preset
 */
function getPresetRange(preset: PresetRange): DateRange {
  const now = new Date()

  switch (preset) {
    case 'today':
      return { start: now, end: now }
    case 'yesterday':
      const yesterday = subDays(now, 1)
      return { start: yesterday, end: yesterday }
    case 'thisWeek':
      return { start: startOfWeek(now), end: endOfWeek(now) }
    case 'lastWeek':
      const lastWeekStart = startOfWeek(subDays(now, 7))
      return { start: lastWeekStart, end: endOfWeek(lastWeekStart) }
    case 'thisMonth':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'lastMonth':
      const lastMonth = subMonths(now, 1)
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) }
    case 'last3Months':
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
    case 'last6Months':
      return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) }
    case 'thisYear':
      return { start: startOfYear(now), end: endOfYear(now) }
    case 'lastYear':
      const lastYear = subYears(now, 1)
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) }
    case 'allTime':
      // Return a very wide range
      return { start: new Date(2000, 0, 1), end: new Date(2100, 11, 31) }
    default:
      return { start: now, end: now }
  }
}

/**
 * Hook for managing date range selection.
 *
 * @example
 * ```tsx
 * function DateRangePicker() {
 *   const { range, setRange, setPreset, displayValue, preset } = useDateRange({
 *     initialPreset: 'thisMonth',
 *   })
 *
 *   return (
 *     <div>
 *       <Select value={preset} onValueChange={setPreset}>
 *         <SelectTrigger>{displayValue}</SelectTrigger>
 *         <SelectContent>
 *           <SelectItem value="thisMonth">This Month</SelectItem>
 *           <SelectItem value="lastMonth">Last Month</SelectItem>
 *         </SelectContent>
 *       </Select>
 *     </div>
 *   )
 * }
 * ```
 */
export function useDateRange(
  options: UseDateRangeOptions = {},
): UseDateRangeReturn {
  const {
    initialRange,
    initialPreset,
    minDate,
    maxDate,
    displayFormat = 'MMM d, yyyy',
  } = options

  // Initialize state
  const getInitialState = useCallback(() => {
    if (initialPreset) {
      return { range: getPresetRange(initialPreset), preset: initialPreset }
    }
    if (initialRange) {
      return { range: initialRange, preset: null }
    }
    return { range: null, preset: null }
  }, [initialRange, initialPreset])

  const [state, setState] = useState<{
    range: DateRange | null
    preset: PresetRange | null
  }>(getInitialState)

  // Set range directly
  const setRange = useCallback((range: DateRange | null) => {
    setState({ range, preset: null })
  }, [])

  // Set start date
  const setStart = useCallback((date: Date) => {
    setState((prev) => {
      if (!prev.range) {
        return { range: { start: date, end: date }, preset: null }
      }
      // Ensure start is before end
      const newStart = date
      const newEnd = prev.range.end < newStart ? newStart : prev.range.end
      return { range: { start: newStart, end: newEnd }, preset: null }
    })
  }, [])

  // Set end date
  const setEnd = useCallback((date: Date) => {
    setState((prev) => {
      if (!prev.range) {
        return { range: { start: date, end: date }, preset: null }
      }
      // Ensure end is after start
      const newEnd = date
      const newStart = prev.range.start > newEnd ? newEnd : prev.range.start
      return { range: { start: newStart, end: newEnd }, preset: null }
    })
  }, [])

  // Clear range
  const clearRange = useCallback(() => {
    setState({ range: null, preset: null })
  }, [])

  // Set from preset
  const setPreset = useCallback((preset: PresetRange) => {
    setState({ range: getPresetRange(preset), preset })
  }, [])

  // Computed values
  const hasRange = state.range !== null

  const displayValue = useMemo(() => {
    if (!state.range) return 'Select date range'
    if (state.preset) {
      // Format preset names nicely
      const presetLabels: Record<PresetRange, string> = {
        today: 'Today',
        yesterday: 'Yesterday',
        thisWeek: 'This Week',
        lastWeek: 'Last Week',
        thisMonth: 'This Month',
        lastMonth: 'Last Month',
        last3Months: 'Last 3 Months',
        last6Months: 'Last 6 Months',
        thisYear: 'This Year',
        lastYear: 'Last Year',
        allTime: 'All Time',
      }
      return presetLabels[state.preset]
    }
    return `${format(state.range.start, displayFormat)} - ${format(state.range.end, displayFormat)}`
  }, [state.range, state.preset, displayFormat])

  const daysInRange = useMemo(() => {
    if (!state.range) return 0
    const diff = state.range.end.getTime() - state.range.start.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  }, [state.range])

  // Check if date is in range
  const isInRange = useCallback(
    (date: Date) => {
      if (!state.range) return false
      return date >= state.range.start && date <= state.range.end
    },
    [state.range],
  )

  // Validation helpers
  const canSetStart = useCallback(
    (date: Date) => {
      if (minDate && date < minDate) return false
      if (maxDate && date > maxDate) return false
      return true
    },
    [minDate, maxDate],
  )

  const canSetEnd = useCallback(
    (date: Date) => {
      if (minDate && date < minDate) return false
      if (maxDate && date > maxDate) return false
      return true
    },
    [minDate, maxDate],
  )

  return {
    range: state.range,
    setRange,
    setStart,
    setEnd,
    clearRange,
    preset: state.preset,
    setPreset,
    hasRange,
    displayValue,
    daysInRange,
    isInRange,
    canSetStart,
    canSetEnd,
  }
}

/**
 * Hook for managing year selection (common in scorecard).
 * Simplified version for just year-based filtering.
 *
 * @example
 * ```tsx
 * function YearFilter() {
 *   const { year, setYear, years, nextYear, prevYear } = useYearSelection({
 *     initialYear: 2024,
 *     minYear: 2020,
 *     maxYear: 2025,
 *   })
 * }
 * ```
 */
export interface UseYearSelectionOptions {
  initialYear?: number
  minYear?: number
  maxYear?: number
}

export interface UseYearSelectionReturn {
  year: number
  setYear: (year: number) => void
  years: number[]
  nextYear: () => void
  prevYear: () => void
  hasNextYear: boolean
  hasPrevYear: boolean
}

export function useYearSelection(
  options: UseYearSelectionOptions = {},
): UseYearSelectionReturn {
  const { initialYear, minYear, maxYear } = options
  const currentYear = new Date().getFullYear()

  const [year, setYearState] = useState(initialYear ?? currentYear)

  // Generate available years
  const years = useMemo(() => {
    const min = minYear ?? currentYear - 10
    const max = maxYear ?? currentYear + 1
    const result: number[] = []
    for (let y = min; y <= max; y++) {
      result.push(y)
    }
    return result.reverse() // Most recent first
  }, [minYear, maxYear, currentYear])

  const setYear = useCallback(
    (newYear: number) => {
      if (minYear && newYear < minYear) return
      if (maxYear && newYear > maxYear) return
      setYearState(newYear)
    },
    [minYear, maxYear],
  )

  const nextYear = useCallback(() => {
    setYearState((prev) => {
      const next = prev + 1
      if (maxYear && next > maxYear) return prev
      return next
    })
  }, [maxYear])

  const prevYear = useCallback(() => {
    setYearState((prev) => {
      const next = prev - 1
      if (minYear && next < minYear) return prev
      return next
    })
  }, [minYear])

  const hasNextYear = maxYear ? year < maxYear : true
  const hasPrevYear = minYear ? year > minYear : true

  return {
    year,
    setYear,
    years,
    nextYear,
    prevYear,
    hasNextYear,
    hasPrevYear,
  }
}

/**
 * Hook for managing month/year selection (common in turnover).
 *
 * @example
 * ```tsx
 * function MonthYearFilter() {
 *   const { month, year, setMonth, setYear, displayValue } = useMonthYearSelection()
 * }
 * ```
 */
export interface UseMonthYearSelectionOptions {
  initialMonth?: number // 0-11
  initialYear?: number
}

export interface UseMonthYearSelectionReturn {
  month: number // 0-11
  year: number
  setMonth: (month: number) => void
  setYear: (year: number) => void
  setMonthYear: (month: number, year: number) => void
  displayValue: string
  nextMonth: () => void
  prevMonth: () => void
  date: Date
}

export function useMonthYearSelection(
  options: UseMonthYearSelectionOptions = {},
): UseMonthYearSelectionReturn {
  const now = new Date()
  const { initialMonth = now.getMonth(), initialYear = now.getFullYear() } =
    options

  const [month, setMonthState] = useState(initialMonth)
  const [year, setYearState] = useState(initialYear)

  const setMonth = useCallback((newMonth: number) => {
    if (newMonth < 0 || newMonth > 11) return
    setMonthState(newMonth)
  }, [])

  const setYear = useCallback((newYear: number) => {
    setYearState(newYear)
  }, [])

  const setMonthYear = useCallback((newMonth: number, newYear: number) => {
    setMonthState(newMonth)
    setYearState(newYear)
  }, [])

  const nextMonth = useCallback(() => {
    setMonthState((prev) => {
      if (prev === 11) {
        setYearState((y) => y + 1)
        return 0
      }
      return prev + 1
    })
  }, [])

  const prevMonth = useCallback(() => {
    setMonthState((prev) => {
      if (prev === 0) {
        setYearState((y) => y - 1)
        return 11
      }
      return prev - 1
    })
  }, [])

  const displayValue = useMemo(() => {
    const date = new Date(year, month)
    return format(date, 'MMMM yyyy')
  }, [month, year])

  const date = useMemo(() => new Date(year, month, 1), [month, year])

  return {
    month,
    year,
    setMonth,
    setYear,
    setMonthYear,
    displayValue,
    nextMonth,
    prevMonth,
    date,
  }
}
