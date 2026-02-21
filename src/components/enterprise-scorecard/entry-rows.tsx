'use client'

import { useMemo } from 'react'
import { CURRENT_MONTH, CURRENT_YEAR } from './constants'
import type {
  AvailabilityRecord,
  ScorecardEntry,
  VisibleMonth,
  VolumeRecord,
} from './types'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface EntryRowsProps {
  entry: ScorecardEntry
  availability: Record<string, AvailabilityRecord>
  volume: Record<string, VolumeRecord>
  selectedYear: number
  visibleMonths?: Array<VisibleMonth>
}

export function formatVolume(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
  return String(value)
}

export function EntryRows({
  entry,
  availability,
  volume,
  selectedYear,
  visibleMonths,
}: EntryRowsProps) {
  const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    year: selectedYear,
  }))
  const monthsToShow = visibleMonths || ALL_MONTHS
  const availThreshold = parseFloat(entry.availabilityThreshold)

  // Calculate average availability
  const avgAvail = useMemo(() => {
    const values: Array<number> = []
    monthsToShow.forEach(({ month, year }) => {
      const isFuture = year === CURRENT_YEAR && month > CURRENT_MONTH
      const key = `${year}-${month}`
      if (!isFuture && availability[key]) {
        values.push(parseFloat(availability[key].availability))
      }
    })
    return values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null
  }, [availability, monthsToShow])

  // Calculate total volume
  const totalVol = useMemo(() => {
    let total = 0
    let hasData = false
    monthsToShow.forEach(({ month, year }) => {
      const isFuture = year === CURRENT_YEAR && month > CURRENT_MONTH
      const key = `${year}-${month}`
      if (!isFuture && volume[key]) {
        total += volume[key].volume
        hasData = true
      }
    })
    return hasData ? total : null
  }, [volume, monthsToShow])

  const avgBreach = avgAvail !== null && avgAvail < availThreshold

  return (
    <>
      {/* Availability Row */}
      <TableRow className="hover:bg-muted/10">
        <TableCell rowSpan={2} className="align-top border-r py-1">
          <div className="text-xs font-medium">{entry.name}</div>
          <div className="text-[10px] text-muted-foreground font-mono">
            {entry.scorecardIdentifier}
          </div>
        </TableCell>
        <TableCell className="text-[10px] font-bold text-green-600 py-1">
          A%
        </TableCell>
        {monthsToShow.map((vm) => {
          const key = `${vm.year}-${vm.month}`
          const av = availability[key]
          const isFuture = vm.year === CURRENT_YEAR && vm.month > CURRENT_MONTH
          const value = av?.availability
          const isBreach =
            value !== undefined && parseFloat(value) < availThreshold

          return (
            <TableCell
              key={key}
              className={cn(
                'text-center py-1 text-xs',
                isFuture && 'text-muted-foreground/30',
                isBreach && 'text-red-600 font-semibold bg-red-500/5',
              )}
            >
              {isFuture ? '—' : value ? parseFloat(value).toFixed(2) : '—'}
            </TableCell>
          )
        })}
        <TableCell
          className={cn(
            'text-center py-1 text-xs font-semibold bg-muted/30',
            avgBreach && 'text-red-600',
          )}
        >
          {avgAvail !== null ? avgAvail.toFixed(2) : '—'}
        </TableCell>
      </TableRow>
      {/* Volume Row */}
      <TableRow className="hover:bg-muted/10 border-b">
        <TableCell className="text-[10px] font-bold text-purple-600 py-1">
          Vol
        </TableCell>
        {monthsToShow.map((vm) => {
          const key = `${vm.year}-${vm.month}`
          const vol = volume[key]
          const isFuture = vm.year === CURRENT_YEAR && vm.month > CURRENT_MONTH

          return (
            <TableCell
              key={key}
              className={cn(
                'text-center py-1 text-xs',
                isFuture && 'text-muted-foreground/30',
              )}
            >
              {isFuture ? '—' : vol ? formatVolume(vol.volume) : '—'}
            </TableCell>
          )
        })}
        <TableCell className="text-center py-1 text-xs font-semibold bg-muted/30">
          {totalVol !== null ? formatVolume(totalVol) : '—'}
        </TableCell>
      </TableRow>
    </>
  )
}
