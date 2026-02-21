'use client'

import { useMemo } from 'react'
import { AlertTriangle, ChevronDown, Lock } from 'lucide-react'
import { EntryRows } from './entry-rows'
import { CURRENT_MONTH, CURRENT_YEAR, MONTHS } from './constants'
import type {
  Application,
  AvailabilityRecord,
  LeadershipDisplay,
  ScorecardEntry,
  VisibleMonth,
  VolumeRecord,
} from './types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface ApplicationCardProps {
  app: Application
  isExpanded: boolean
  onToggle: () => void
  entries: Array<ScorecardEntry>
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>
  volumeByEntry: Record<string, Record<string, VolumeRecord>>
  selectedYear: number
  leadership: Array<LeadershipDisplay>
  visibleMonths?: Array<VisibleMonth>
}

export function ApplicationCard({
  app,
  isExpanded,
  onToggle,
  entries,
  availabilityByEntry,
  volumeByEntry,
  selectedYear,
  leadership,
  visibleMonths,
}: ApplicationCardProps) {
  const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    year: selectedYear,
  }))
  const monthsToShow = visibleMonths || ALL_MONTHS

  // Calculate app-level average availability
  const avgAvailability = useMemo(() => {
    let total = 0
    let count = 0

    entries.forEach((entry) => {
      const entryAvail = availabilityByEntry[entry.id] || {}
      monthsToShow.forEach(({ month, year }) => {
        const av = entryAvail[`${year}-${month}`]
        if (av) {
          total += parseFloat(av.availability)
          count++
        }
      })
    })

    return count > 0 ? total / count : null
  }, [entries, availabilityByEntry, monthsToShow])

  // Calculate app-level total volume
  const totalVolume = useMemo(() => {
    let total = 0
    let hasData = false

    entries.forEach((entry) => {
      const entryVol = volumeByEntry[entry.id] || {}
      monthsToShow.forEach(({ month, year }) => {
        const vol = entryVol[`${year}-${month}`]
        if (vol) {
          total += vol.volume
          hasData = true
        }
      })
    })

    return hasData ? total : null
  }, [entries, volumeByEntry, monthsToShow])

  // Count breaches
  const breachCount = useMemo(() => {
    let breaches = 0
    entries.forEach((entry) => {
      const threshold = parseFloat(entry.availabilityThreshold)
      const entryAvail = availabilityByEntry[entry.id] || {}
      monthsToShow.forEach(({ month, year }) => {
        const av = entryAvail[`${year}-${month}`]
        if (av && parseFloat(av.availability) < threshold) {
          breaches++
        }
      })
    })
    return breaches
  }, [entries, availabilityByEntry, monthsToShow])

  return (
    <Card
      className={cn(
        'transition-all duration-300 border-border/50 bg-background/50 group overflow-hidden',
        isExpanded ? 'ring-1 ring-primary/20 shadow-md' : 'hover:bg-muted/30',
      )}
    >
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-4 cursor-pointer relative"
        onClick={onToggle}
      >
        {/* Identity Layer */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Circled arrow indicator */}
          <div
            className={cn(
              'w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300',
              isExpanded
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-muted/30 border-border/50 text-muted-foreground',
            )}
          >
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-300',
                isExpanded ? 'rotate-0' : '-rotate-90',
              )}
            />
          </div>

          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors truncate">
                {app.applicationName}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-bold uppercase tracking-widest bg-background/50 border-primary/20 text-primary px-2 h-5"
              >
                {app.tla}
              </Badge>
              {app.tier && ['0', '1', '2'].includes(String(app.tier)) && (
                <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[9px] font-bold uppercase tracking-widest h-5 px-1.5">
                  T{app.tier}
                </Badge>
              )}
            </div>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
              {leadership.slice(0, 2).map((l, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    {l.role}
                  </span>
                  <span className="text-[10px] font-bold text-foreground/80">
                    {l.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Layer */}
        <div className="flex items-center gap-6 mt-3 sm:mt-0 shrink-0">
          {avgAvailability !== null && (
            <div className="flex flex-col items-end group/stat">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-1.5 opacity-60">
                Availability
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    avgAvailability < 98
                      ? 'bg-red-500 animate-pulse'
                      : 'bg-green-500',
                  )}
                />
                <span
                  className={cn(
                    'text-base font-bold tabular-nums tracking-tight leading-none',
                    avgAvailability < 98 ? 'text-red-600' : 'text-green-600',
                  )}
                >
                  {avgAvailability.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          {totalVolume !== null && (
            <div className="flex flex-col items-end group/stat">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-1.5 opacity-60">
                Annual Volume
              </span>
              <span className="text-base font-bold tabular-nums tracking-tight leading-none text-indigo-600">
                {totalVolume > 1000000
                  ? `${(totalVolume / 1000000).toFixed(1)}M`
                  : totalVolume.toLocaleString()}
              </span>
            </div>
          )}

          {breachCount > 0 && (
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>

      {/* Expanded Content - Metrics Table */}
      {isExpanded && entries.length > 0 && (
        <div className="border-t px-3 pb-3 pt-2 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-bold uppercase w-[160px]">
                  Entry
                </TableHead>
                <TableHead className="text-xs font-bold uppercase w-[50px]">
                  Type
                </TableHead>
                {monthsToShow.map((vm) => {
                  const m = MONTHS[vm.month - 1]
                  const isFuture =
                    vm.year === CURRENT_YEAR && vm.month > CURRENT_MONTH
                  return (
                    <TableHead
                      key={`${vm.year}-${vm.month}`}
                      className={cn(
                        'text-xs font-bold uppercase text-center w-[55px]',
                        isFuture && 'text-muted-foreground/40',
                      )}
                    >
                      <div className="flex flex-col leading-none">
                        <span>{m}</span>
                        {vm.year !== selectedYear && (
                          <span className="text-[7px] opacity-40 mt-0.5">
                            {vm.year}
                          </span>
                        )}
                      </div>
                      {isFuture && <Lock className="h-2 w-2 inline ml-0.5" />}
                    </TableHead>
                  )
                })}
                <TableHead className="text-xs font-bold uppercase text-center w-[60px] bg-muted/30">
                  Avg
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <EntryRows
                  key={entry.id}
                  entry={entry}
                  availability={availabilityByEntry[entry.id] || {}}
                  volume={volumeByEntry[entry.id] || {}}
                  selectedYear={selectedYear}
                  visibleMonths={monthsToShow}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {isExpanded && entries.length === 0 && (
        <div className="border-t px-3 py-4 text-center text-muted-foreground text-sm">
          No scorecard entries for this application
        </div>
      )}
    </Card>
  )
}
