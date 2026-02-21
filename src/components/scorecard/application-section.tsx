import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { ChevronDown, Plus, Activity, Info, Hash } from 'lucide-react'
import type {
  Application,
  ScorecardEntry,
  AvailabilityRecord,
  VolumeRecord,
  MonthInfo,
} from './types'
import { EntryRows } from './entry-rows'

interface ApplicationSectionProps {
  app: Application
  isAdmin: boolean
  isExpanded: boolean
  onToggle: () => void
  entries: ScorecardEntry[]
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>
  volumeByEntry: Record<string, Record<string, VolumeRecord>>
  displayMonths: MonthInfo[]
  onAddEntry: () => void
  onEditEntry: (entry: ScorecardEntry) => void
  onDeleteEntry: (entry: ScorecardEntry) => void
  teamId: string
}

export function ApplicationSection({
  app,
  isAdmin,
  isExpanded,
  onToggle,
  entries,
  availabilityByEntry,
  volumeByEntry,
  displayMonths,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  teamId,
}: ApplicationSectionProps) {
  const appStats = useMemo(() => {
    let totalAvail = 0
    let availCount = 0
    let totalVol = 0

    entries.forEach((entry) => {
      const entryAvailability = availabilityByEntry[entry.id] || {}
      const entryVolume = volumeByEntry[entry.id] || {}

      displayMonths.forEach(({ year, month, isFuture }) => {
        if (isFuture) return
        const key = `${year}-${month}`

        if (entryAvailability[key]) {
          totalAvail += parseFloat(entryAvailability[key].availability)
          availCount++
        }

        if (entryVolume[key]) {
          totalVol += entryVolume[key].volume
        }
      })
    })

    return {
      avgAvailability: availCount > 0 ? totalAvail / availCount : null,
      totalVolume: totalVol,
    }
  }, [entries, availabilityByEntry, volumeByEntry, displayMonths])

  // Format volume to show billions, millions, or thousands
  const formatVolume = (value: number): string => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
    return value.toLocaleString()
  }

  return (
    <div
      className={cn(
        'transition-all duration-500 overflow-hidden',
        isExpanded ? 'bg-muted/5 pb-6' : 'bg-transparent',
      )}
    >
      {/* Header - clickable to expand/collapse */}
      <div
        className={cn(
          'flex flex-col sm:flex-row sm:items-center justify-between p-5 cursor-pointer transition-all group relative',
          isExpanded
            ? 'border-l-4 border-l-primary bg-primary/[0.02]'
            : 'hover:bg-muted/30 border-l-4 border-l-transparent',
        )}
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        {/* Left Side: App Identity */}
        <div className="flex items-center gap-4">
          {/* Circled arrow indicator */}
          <div
            className={cn(
              'w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300',
              isExpanded
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-muted/30 border-border/50 text-muted-foreground',
            )}
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-300',
                isExpanded ? 'rotate-0' : '-rotate-90',
              )}
            />
          </div>
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-bold text-xl tracking-tight group-hover:text-primary transition-colors truncate">
                {app.applicationName}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-bold uppercase tracking-widest bg-background/50 border-primary/20 text-primary px-2 h-5"
              >
                {app.tla}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded text-[11px] font-bold font-mono">
                <Hash className="h-3 w-3 opacity-60" />
                {app.assetId}
              </div>
              <span className="text-muted-foreground/30">•</span>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-70">
                <Activity className="h-3 w-3" />
                {entries.length}{' '}
                {entries.length === 1 ? 'Component' : 'Components'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Summary Metrics & Actions */}
        <div className="flex items-center gap-8 mt-4 sm:mt-0">
          <div className="hidden lg:flex items-center gap-8 border-r border-border/50 pr-8">
            {appStats.avgAvailability !== null && (
              <div className="flex flex-col items-end group/stat">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-2">
                  Availability
                </span>
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full animate-pulse',
                      appStats.avgAvailability < 98
                        ? 'bg-red-500'
                        : 'bg-green-500',
                    )}
                  />
                  <span
                    className={cn(
                      'text-2xl font-bold tabular-nums tracking-tighter leading-none',
                      appStats.avgAvailability < 98
                        ? 'text-red-600'
                        : 'text-green-600',
                    )}
                  >
                    {appStats.avgAvailability.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col items-end group/stat">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-2 text-right">
                Annual Volume
              </span>
              <div className="flex items-center gap-2 text-indigo-600">
                <Hash className="h-3.5 w-3.5" />
                <span className="text-2xl font-bold tabular-nums tracking-tighter leading-none">
                  {formatVolume(appStats.totalVolume)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddEntry()
                }}
              >
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-5">
          {entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-background/50 border-2 border-dashed border-border/50 rounded-2xl mx-5 mb-5">
              <Info className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <h4 className="font-bold text-foreground">No Performance Data</h4>
              <p className="text-xs max-w-[200px] mx-auto mt-1">
                Start tracking metrics by adding components to this application.
              </p>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-5 gap-2"
                  onClick={onAddEntry}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Your First Entry
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-background rounded-2xl border border-border/50 shadow-sm overflow-hidden mb-2">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                      <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-widest sticky left-0 bg-muted/80 backdrop-blur-sm z-10 py-2.5">
                        Component
                      </TableHead>
                      <TableHead className="w-[50px] font-bold text-[10px] uppercase tracking-widest py-2.5">
                        Type
                      </TableHead>
                      {displayMonths.map((m) => (
                        <TableHead
                          key={`${m.year}-${m.month}`}
                          className={cn(
                            'w-[65px] text-center font-bold text-[10px] uppercase tracking-widest py-2.5',
                            m.isFuture && 'text-muted-foreground/30',
                          )}
                        >
                          {m.label}
                        </TableHead>
                      ))}
                      {/* Avg/Total Column */}
                      <TableHead className="w-[95px] text-center font-bold text-[10px] uppercase tracking-widest bg-primary/10 text-primary py-2.5">
                        Performance
                      </TableHead>
                      {isAdmin && (
                        <TableHead className="w-[100px] text-right font-bold text-[10px] uppercase tracking-widest py-2.5 pr-6">
                          Manage
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <EntryRows
                        key={entry.id}
                        entry={entry}
                        isAdmin={isAdmin}
                        availability={availabilityByEntry[entry.id] || {}}
                        volume={volumeByEntry[entry.id] || {}}
                        displayMonths={displayMonths}
                        onEdit={() => onEditEntry(entry)}
                        onDelete={() => onDeleteEntry(entry)}
                        teamId={teamId}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
