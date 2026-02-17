/**
 * useDispatchTurnover Hook
 * 
 * Encapsulates all dispatch turnover state management and data fetching logic.
 * Extracts complex state management from the dispatch turnover page component.
 * 
 * @see skills/react-best-practices/rules/hook-extract-logic.md
 */

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useExpandState } from '@/hooks/use-expand-state'
import { useSearchFilter } from '@/hooks/use-search-filter'
import { turnoverKeys } from '@/lib/query-keys'
import {
    getDispatchEntries,
    canFinalizeTurnover,
    finalizeTurnover,
} from '@/app/actions/turnover'
import { toast } from 'sonner'
import type { TurnoverEntryWithDetails } from '@/db/schema/turnover'

export interface UseDispatchTurnoverOptions {
    teamId: string
    initialEntries?: TurnoverEntryWithDetails[]
}

export interface UseDispatchTurnoverReturn {
    // Data
    entries: TurnoverEntryWithDetails[]
    isLoading: boolean
    
    // Search
    searchQuery: string
    setSearchQuery: (query: string) => void
    filteredEntries: TurnoverEntryWithDetails[]
    
    // Grouping
    groupedEntries: Record<string, TurnoverEntryWithDetails[]>
    
    // Expand state
    expandedApps: ReturnType<typeof useExpandState<TurnoverEntryWithDetails>>
    allExpanded: boolean
    toggleAll: () => void
    
    // Stats
    stats: {
        activeApps: number
        totalEntries: number
        criticalItems: number
    }
    
    // Finalize
    canFinalize: boolean
    checkingCooldown: boolean
    cooldownMessage: string | null
    finalizeDialogOpen: boolean
    setFinalizeDialogOpen: (open: boolean) => void
    finalizeNotes: string
    setFinalizeNotes: (notes: string) => void
    handleFinalize: () => void
    isFinalizing: boolean
    
    // Actions
    invalidateData: () => void
}

export function useDispatchTurnover({
    teamId,
    initialEntries,
}: UseDispatchTurnoverOptions): UseDispatchTurnoverReturn {
    const queryClient = useQueryClient()
    
    // Dialog state
    const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false)
    const [finalizeNotes, setFinalizeNotes] = useState('')
    const [allExpanded, setAllExpanded] = useState(false)
    
    // Fetch entries
    const { data: entries, isLoading } = useQuery({
        queryKey: turnoverKeys.dispatch(teamId),
        queryFn: () => getDispatchEntries({ data: { teamId } }),
        initialData: initialEntries,
        staleTime: 30000,
    })
    
    // Check finalize cooldown
    const { data: canFinalizeData, isLoading: checkingCooldown } = useQuery({
        queryKey: turnoverKeys.canFinalize(teamId),
        queryFn: () => canFinalizeTurnover({ data: { teamId } }),
    })
    
    // Search filter
    const { searchTerm: searchQuery, setSearchTerm: setSearchQuery, filteredItems: filteredEntries } = useSearchFilter({
        items: entries || [],
        searchFields: ['title', 'description', 'createdBy'] as (keyof TurnoverEntryWithDetails)[],
    })
    
    // Group entries by application
    const groupedEntries = useMemo(() => {
        const grouped: Record<string, TurnoverEntryWithDetails[]> = {}
        
        filteredEntries.forEach((entry) => {
            const appId = entry.applicationId
            if (!grouped[appId]) {
                grouped[appId] = []
            }
            grouped[appId].push(entry)
        })
        
        return grouped
    }, [filteredEntries])
    
    // Expand state for applications
    const expandedApps = useExpandState<TurnoverEntryWithDetails>({
        getItemId: (entry) => entry.applicationId,
        initialExpanded: 'none',
    })
    
    // Stats
    const stats = useMemo(() => {
        const allEntries = entries || []
        const apps = new Set(allEntries.map((e) => e.applicationId))
        const critical = allEntries.filter((e) => e.isImportant)
        
        return {
            activeApps: apps.size,
            totalEntries: allEntries.length,
            criticalItems: critical.length,
        }
    }, [entries])
    
    // Finalize mutation
    const finalizeMutation = useMutation({
        mutationFn: () =>
            finalizeTurnover({ data: { teamId, notes: finalizeNotes } }),
        onSuccess: () => {
            toast.success('Turnover finalized successfully')
            queryClient.invalidateQueries({ queryKey: turnoverKeys.canFinalize(teamId) })
            queryClient.invalidateQueries({ queryKey: turnoverKeys.dispatch(teamId) })
            setFinalizeDialogOpen(false)
            setFinalizeNotes('')
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to finalize turnover')
        },
    })
    
    // Toggle all handler
    const toggleAll = useCallback(() => {
        const appIds = Object.keys(groupedEntries)
        if (allExpanded) {
            expandedApps.collapseAll()
        } else {
            expandedApps.expandAll(appIds)
        }
        setAllExpanded(!allExpanded)
    }, [allExpanded, expandedApps, groupedEntries])
    
    // Handle finalize
    const handleFinalize = useCallback(() => {
        finalizeMutation.mutate()
    }, [finalizeMutation])
    
    // Invalidate data helper
    const invalidateData = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: turnoverKeys.team(teamId) })
    }, [queryClient, teamId])
    
    return {
        // Data
        entries: entries || [],
        isLoading,
        
        // Search
        searchQuery,
        setSearchQuery,
        filteredEntries,
        
        // Grouping
        groupedEntries,
        
        // Expand state
        expandedApps,
        allExpanded,
        toggleAll,
        
        // Stats
        stats,
        
        // Finalize
        canFinalize: canFinalizeData?.canFinalize ?? false,
        checkingCooldown,
        cooldownMessage: canFinalizeData?.message ?? null,
        finalizeDialogOpen,
        setFinalizeDialogOpen,
        finalizeNotes,
        setFinalizeNotes,
        handleFinalize,
        isFinalizing: finalizeMutation.isPending,
        
        // Actions
        invalidateData,
    }
}