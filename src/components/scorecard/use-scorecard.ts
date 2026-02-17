/**
 * useScorecard Hook
 * 
 * Encapsulates all scorecard state management and data fetching logic.
 * Extracts complex state management from the scorecard page component.
 * 
 * @see skills/react-best-practices/rules/hook-extract-logic.md
 */

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useExpandState } from '@/hooks/use-expand-state'
import { useYearSelection } from '@/hooks/use-date-range'
import { scorecardKeys } from '@/lib/query-keys'
import { scorecardDataOptions, scorecardPublishStatusOptions } from '@/lib/query-options'
import { getScorecardData, getPublishStatus, publishScorecard, unpublishScorecard } from '@/app/actions/scorecard'
import { toast } from 'sonner'
import type { ViewMode, TimePeriod, ScorecardEntry, Application, AvailabilityRecord, VolumeRecord, MonthInfo } from './types'
import { TIME_PERIOD_OPTIONS, currentYear, getMonthsForPeriod, getMonthsForYear, MONTH_NAMES } from './constants'

export interface UseScorecardOptions {
    teamId: string
    isAdmin: boolean
}

export interface ScorecardData {
    applications: Application[]
    entries: ScorecardEntry[]
    availability: AvailabilityRecord[]
    volume: VolumeRecord[]
}

export interface UseScorecardReturn {
    // View state
    viewMode: ViewMode
    setViewMode: (mode: ViewMode) => void
    selectedPeriod: TimePeriod
    setSelectedPeriod: (period: TimePeriod) => void
    selectedYear: number
    setSelectedYear: (year: number) => void
    
    // Display months
    displayMonths: MonthInfo[]
    filterLabel: string
    yearsToFetch: number[]
    
    // Data
    scorecardData: ScorecardData
    isLoading: boolean
    publishStatusByMonth: Record<string, { isPublished: boolean; publishedBy: string | null; publishedAt: Date | null }>
    
    // Lookup maps
    entriesByApp: Record<string, ScorecardEntry[]>
    availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>
    volumeByEntry: Record<string, Record<string, VolumeRecord>>
    
    // Expand state
    expandedApps: ReturnType<typeof useExpandState<Application>>
    
    // Stats
    stats: {
        apps: number
        entries: number
        availRecords: number
        volRecords: number
        availBreaches: number
    }
    
    // Publish state
    unpublishedMonths: MonthInfo[]
    pendingChangesMonths: MonthInfo[]
    showPublishDialog: boolean
    publishMonth: { year: number; month: number } | null
    publishAction: 'publish' | 'unpublish'
    handlePublishClick: (year: number, month: number) => void
    handleUnpublishClick: (year: number, month: number) => void
    confirmPublishAction: () => void
    isPublishing: boolean
    setShowPublishDialog: (show: boolean) => void
    
    // Dialog state
    addEntryAppId: string | null
    setAddEntryAppId: (id: string | null) => void
    editingEntry: ScorecardEntry | null
    setEditingEntry: (entry: ScorecardEntry | null) => void
    deletingEntry: ScorecardEntry | null
    setDeletingEntry: (entry: ScorecardEntry | null) => void
    
    // Chart state
    showChart: boolean
    setShowChart: (show: boolean) => void
    
    // Actions
    invalidateData: () => void
}

export function useScorecard({ teamId, isAdmin }: UseScorecardOptions): UseScorecardReturn {
    const queryClient = useQueryClient()
    
    // View state
    const [viewMode, setViewMode] = useState<ViewMode>('period')
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('ytd')
    const yearSelection = useYearSelection({ initialYear: currentYear })
    
    // Dialog state
    const [addEntryAppId, setAddEntryAppId] = useState<string | null>(null)
    const [editingEntry, setEditingEntry] = useState<ScorecardEntry | null>(null)
    const [deletingEntry, setDeletingEntry] = useState<ScorecardEntry | null>(null)
    
    // Chart state
    const [showChart, setShowChart] = useState(false)
    
    // Publish dialog state
    const [showPublishDialog, setShowPublishDialog] = useState(false)
    const [publishMonth, setPublishMonth] = useState<{ year: number; month: number } | null>(null)
    const [publishAction, setPublishAction] = useState<'publish' | 'unpublish'>('publish')
    
    // Expand state for applications
    const expandedApps = useExpandState<Application>({
        getItemId: (app) => app.id,
        initialExpanded: 'none',
    })
    
    // Get the months to display based on view mode
    const displayMonths = useMemo(() => {
        if (viewMode === 'year') {
            return getMonthsForYear(yearSelection.year)
        }
        return getMonthsForPeriod(selectedPeriod)
    }, [viewMode, selectedPeriod, yearSelection.year])
    
    // Determine which years we need to fetch data for
    const yearsToFetch = useMemo(() => {
        const years = new Set<number>()
        displayMonths.forEach(m => years.add(m.year))
        return Array.from(years)
    }, [displayMonths])
    
    // Fetch scorecard data for current year
    const { data: currentYearData, isLoading: isLoadingCurrent } = useQuery(
        scorecardDataOptions({ teamId, year: currentYear })
    )
    
    // Fetch scorecard data for previous year (if needed)
    const { data: prevYearData, isLoading: isLoadingPrev } = useQuery({
        ...scorecardDataOptions({ teamId, year: currentYear - 1 }),
        enabled: yearsToFetch.includes(currentYear - 1),
    })
    
    const isLoading = isLoadingCurrent || (yearsToFetch.includes(currentYear - 1) && isLoadingPrev)
    
    // Merge data from both years
    const scorecardData: ScorecardData = useMemo(() => {
        const apps = currentYearData?.applications || []
        const entries = currentYearData?.entries || []
        
        const availability = [
            ...(currentYearData?.availability || []),
            ...(prevYearData?.availability || []),
        ]
        
        const volume = [
            ...(currentYearData?.volume || []),
            ...(prevYearData?.volume || []),
        ]
        
        return { applications: apps, entries, availability, volume }
    }, [currentYearData, prevYearData])
    
    // Fetch publish status for current year
    const { data: publishStatusCurrentYear } = useQuery(
        scorecardPublishStatusOptions({ teamId, year: currentYear })
    )
    
    // Fetch publish status for previous year (if needed)
    const { data: publishStatusPrevYear } = useQuery({
        ...scorecardPublishStatusOptions({ teamId, year: currentYear - 1 }),
        enabled: yearsToFetch.includes(currentYear - 1),
    })
    
    // Combine publish status from both years
    const publishStatusByMonth = useMemo(() => {
        const status: Record<string, { isPublished: boolean; publishedBy: string | null; publishedAt: Date | null }> = {}
        
        if (publishStatusCurrentYear?.statusByMonth) {
            Object.entries(publishStatusCurrentYear.statusByMonth).forEach(([month, data]) => {
                status[`${currentYear}-${month}`] = data
            })
        }
        
        if (publishStatusPrevYear?.statusByMonth) {
            Object.entries(publishStatusPrevYear.statusByMonth).forEach(([month, data]) => {
                status[`${currentYear - 1}-${month}`] = data
            })
        }
        
        return status
    }, [publishStatusCurrentYear, publishStatusPrevYear])
    
    // Build lookup maps with year-month composite key
    const { entriesByApp, availabilityByEntry, volumeByEntry } = useMemo(() => {
        const entriesByApp: Record<string, ScorecardEntry[]> = {}
        const availabilityByEntry: Record<string, Record<string, AvailabilityRecord>> = {}
        const volumeByEntry: Record<string, Record<string, VolumeRecord>> = {}
        
        scorecardData.entries.forEach((entry) => {
            if (!entriesByApp[entry.applicationId]) {
                entriesByApp[entry.applicationId] = []
            }
            entriesByApp[entry.applicationId].push(entry)
        })
        
        scorecardData.availability.forEach((av) => {
            if (!availabilityByEntry[av.scorecardEntryId]) {
                availabilityByEntry[av.scorecardEntryId] = {}
            }
            const key = `${av.year}-${av.month}`
            availabilityByEntry[av.scorecardEntryId][key] = av
        })
        
        scorecardData.volume.forEach((vol) => {
            if (!volumeByEntry[vol.scorecardEntryId]) {
                volumeByEntry[vol.scorecardEntryId] = {}
            }
            const key = `${vol.year}-${vol.month}`
            volumeByEntry[vol.scorecardEntryId][key] = vol
        })
        
        return { entriesByApp, availabilityByEntry, volumeByEntry }
    }, [scorecardData])
    
    // Calculate months requiring publishing
    const { unpublishedMonths, pendingChangesMonths } = useMemo(() => {
        const unpublished: typeof displayMonths = []
        const pendingChanges: typeof displayMonths = []
        
        displayMonths.forEach(({ year, month, isFuture, label }) => {
            if (isFuture) return
            
            const key = `${year}-${month}`
            const status = publishStatusByMonth[key]
            
            if (!status?.isPublished) {
                unpublished.push({ year, month, isFuture, label })
                return
            }
            
            const publishedAt = status.publishedAt ? new Date(status.publishedAt) : null
            if (!publishedAt) {
                unpublished.push({ year, month, isFuture, label })
                return
            }
            
            let hasPendingChanges = false
            
            Object.values(availabilityByEntry).forEach(entryAvail => {
                const av = entryAvail[key]
                if (av) {
                    const dataUpdatedAt = av.updatedAt ? new Date(av.updatedAt) : (av.createdAt ? new Date(av.createdAt) : null)
                    if (dataUpdatedAt && dataUpdatedAt > publishedAt) {
                        hasPendingChanges = true
                    }
                }
            })
            
            if (!hasPendingChanges) {
                Object.values(volumeByEntry).forEach(entryVol => {
                    const vol = entryVol[key]
                    if (vol) {
                        const dataUpdatedAt = vol.updatedAt ? new Date(vol.updatedAt) : (vol.createdAt ? new Date(vol.createdAt) : null)
                        if (dataUpdatedAt && dataUpdatedAt > publishedAt) {
                            hasPendingChanges = true
                        }
                    }
                })
            }
            
            if (hasPendingChanges) {
                pendingChanges.push({ year, month, isFuture, label })
            }
        })
        
        return { unpublishedMonths: unpublished, pendingChangesMonths: pendingChanges }
    }, [displayMonths, publishStatusByMonth, availabilityByEntry, volumeByEntry])
    
    // Stats calculation
    const stats = useMemo(() => {
        const apps = scorecardData.applications.length
        const entries = scorecardData.entries.length
        
        let availRecords = 0
        let volRecords = 0
        let availBreaches = 0
        
        scorecardData.entries.forEach((entry) => {
            const threshold = parseFloat(entry.availabilityThreshold)
            const entryAvailability = availabilityByEntry[entry.id] || {}
            const entryVolume = volumeByEntry[entry.id] || {}
            
            displayMonths.forEach(({ year, month, isFuture }) => {
                if (isFuture) return
                const key = `${year}-${month}`
                if (entryAvailability[key]) {
                    availRecords++
                    if (parseFloat(entryAvailability[key].availability) < threshold) {
                        availBreaches++
                    }
                }
                if (entryVolume[key]) {
                    volRecords++
                }
            })
        })
        
        return { apps, entries, availRecords, volRecords, availBreaches }
    }, [scorecardData, availabilityByEntry, volumeByEntry, displayMonths])
    
    // Publish mutation
    const publishMutation = useMutation({
        mutationFn: (params: { year: number; month: number }) =>
            publishScorecard({ data: { teamId, year: params.year, month: params.month } }),
        onSuccess: () => {
            toast.success('Scorecard published successfully', {
                description: 'Data is now visible in the Enterprise Scorecard.',
            })
            queryClient.invalidateQueries({ queryKey: scorecardKeys.publishStatus.all(teamId) })
            setShowPublishDialog(false)
            setPublishMonth(null)
        },
        onError: (error: Error) => {
            toast.error('Failed to publish scorecard', {
                description: error.message,
            })
        },
    })
    
    // Unpublish mutation
    const unpublishMutation = useMutation({
        mutationFn: (params: { year: number; month: number }) =>
            unpublishScorecard({ data: { teamId, year: params.year, month: params.month } }),
        onSuccess: () => {
            toast.success('Scorecard unpublished', {
                description: 'Data is no longer visible in the Enterprise Scorecard.',
            })
            queryClient.invalidateQueries({ queryKey: scorecardKeys.publishStatus.all(teamId) })
            setShowPublishDialog(false)
            setPublishMonth(null)
        },
        onError: (error: Error) => {
            toast.error('Failed to unpublish scorecard', {
                description: error.message,
            })
        },
    })
    
    // Publish handlers
    const handlePublishClick = useCallback((year: number, month: number) => {
        setPublishMonth({ year, month })
        setPublishAction('publish')
        setShowPublishDialog(true)
    }, [])
    
    const handleUnpublishClick = useCallback((year: number, month: number) => {
        setPublishMonth({ year, month })
        setPublishAction('unpublish')
        setShowPublishDialog(true)
    }, [])
    
    const confirmPublishAction = useCallback(() => {
        if (!publishMonth) return
        if (publishAction === 'publish') {
            publishMutation.mutate(publishMonth)
        } else {
            unpublishMutation.mutate(publishMonth)
        }
    }, [publishMonth, publishAction, publishMutation, unpublishMutation])
    
    // Invalidate data helper
    const invalidateData = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: scorecardKeys.team(teamId) })
    }, [queryClient, teamId])
    
    // Get the period/year description
    const filterLabel = viewMode === 'year'
        ? `Year ${yearSelection.year}`
        : TIME_PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.label || ''
    
    return {
        // View state
        viewMode,
        setViewMode,
        selectedPeriod,
        setSelectedPeriod,
        selectedYear: yearSelection.year,
        setSelectedYear: yearSelection.setYear,
        
        // Display months
        displayMonths,
        filterLabel,
        yearsToFetch,
        
        // Data
        scorecardData,
        isLoading,
        publishStatusByMonth,
        
        // Lookup maps
        entriesByApp,
        availabilityByEntry,
        volumeByEntry,
        
        // Expand state
        expandedApps,
        
        // Stats
        stats,
        
        // Publish state
        unpublishedMonths,
        pendingChangesMonths,
        showPublishDialog,
        publishMonth,
        publishAction,
        handlePublishClick,
        handleUnpublishClick,
        confirmPublishAction,
        isPublishing: publishMutation.isPending || unpublishMutation.isPending,
        setShowPublishDialog,
        
        // Dialog state
        addEntryAppId,
        setAddEntryAppId,
        editingEntry,
        setEditingEntry,
        deletingEntry,
        setDeletingEntry,
        
        // Chart state
        showChart,
        setShowChart,
        
        // Actions
        invalidateData,
    }
}