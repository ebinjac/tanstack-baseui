/**
 * useLinkManager Hook
 *
 * Encapsulates all link manager state management and data fetching logic.
 * Extracts complex state management from the link manager page component.
 *
 * @see skills/react-best-practices/rules/hook-extract-logic.md
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import type { LinkWithRelations } from '@/db/schema/links'
import { linkKeys } from '@/lib/query-keys'
import { bulkUpdateLinks, getLinks } from '@/app/actions/links'

export interface UseLinkManagerOptions {
  teamId: string
  initialData: {
    items: Array<LinkWithRelations>
    nextCursor: string | null
    totalCount: number
  }
  searchParams?: {
    search?: string
    visibility?: 'all' | 'private' | 'public'
    applicationId?: string
    categoryId?: string
  }
  pageSize?: number
}

export interface UseLinkManagerReturn {
  // Data
  links: Array<LinkWithRelations>
  totalCount: number
  isLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean

  // Selection
  selectedLinks: Set<string>
  toggleSelectLink: (linkId: string) => void
  selectAllLinks: () => void
  clearSelection: () => void
  hasSelection: boolean
  selectedCount: number

  // Bulk actions
  handleBulkVisibility: (visibility: 'public' | 'private') => void
  handleBulkCategory: (categoryId: string | null) => void
  isBulkUpdating: boolean

  // Stats
  stats: {
    total: number
    public: number
    private: number
    usage: number
  }

  // Infinite scroll
  sentinelRef: React.RefObject<HTMLDivElement | null>

  // Actions
  invalidateData: () => void
}

export function useLinkManager({
  teamId,
  initialData,
  searchParams = {},
  pageSize = 30,
}: UseLinkManagerOptions): UseLinkManagerReturn {
  const queryClient = useQueryClient()
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Selection state
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set())

  // Infinite query for paginated links
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: linkKeys.list(teamId, {
        search: searchParams.search,
        visibility: searchParams.visibility,
        applicationId: searchParams.applicationId,
        categoryId: searchParams.categoryId,
      }),
      queryFn: ({ pageParam }) =>
        getLinks({
          data: {
            teamId,
            search: searchParams.search,
            visibility: searchParams.visibility || 'all',
            applicationId: searchParams.applicationId,
            categoryId: searchParams.categoryId,
            limit: pageSize,
            cursor: pageParam,
          },
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialData: { pages: [initialData], pageParams: [undefined] },
    })

  // Flatten all loaded pages into a single array
  const links = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data])
  const totalCount = data?.pages[0]?.totalCount ?? 0

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (params: {
      teamId: string
      linkIds: Array<string>
      updates: { visibility?: 'public' | 'private'; categoryId?: string | null }
    }) => bulkUpdateLinks({ data: params }),
    onSuccess: (result) => {
      toast.success(
        `Successfully updated ${result.count} link${result.count !== 1 ? 's' : ''}`,
      )
      queryClient.invalidateQueries({ queryKey: linkKeys.team(teamId) })
      setSelectedLinks(new Set())
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update links')
    },
  })

  // Selection handlers
  const toggleSelectLink = useCallback((linkId: string) => {
    setSelectedLinks((prev) => {
      const next = new Set(prev)
      next.has(linkId) ? next.delete(linkId) : next.add(linkId)
      return next
    })
  }, [])

  const selectAllLinks = useCallback(() => {
    setSelectedLinks((prev) =>
      prev.size === links.length ? new Set() : new Set(links.map((l) => l.id)),
    )
  }, [links])

  const clearSelection = useCallback(() => setSelectedLinks(new Set()), [])

  // Bulk action handlers
  const handleBulkVisibility = useCallback(
    (visibility: 'public' | 'private') => {
      bulkUpdateMutation.mutate({
        teamId,
        linkIds: Array.from(selectedLinks),
        updates: { visibility },
      })
    },
    [bulkUpdateMutation, teamId, selectedLinks],
  )

  const handleBulkCategory = useCallback(
    (categoryId: string | null) => {
      bulkUpdateMutation.mutate({
        teamId,
        linkIds: Array.from(selectedLinks),
        updates: { categoryId },
      })
    },
    [bulkUpdateMutation, teamId, selectedLinks],
  )

  // Stats calculation
  const stats = useMemo(
    () => ({
      total: totalCount,
      public: links.filter((l) => l.visibility === 'public').length,
      private: links.filter((l) => l.visibility === 'private').length,
      usage: links.reduce((acc, l) => acc + (l.usageCount || 0), 0),
    }),
    [links, totalCount],
  )

  // Invalidate data helper
  const invalidateData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: linkKeys.team(teamId) })
  }, [queryClient, teamId])

  return {
    // Data
    links,
    totalCount,
    isLoading: false,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,

    // Selection
    selectedLinks,
    toggleSelectLink,
    selectAllLinks,
    clearSelection,
    hasSelection: selectedLinks.size > 0,
    selectedCount: selectedLinks.size,

    // Bulk actions
    handleBulkVisibility,
    handleBulkCategory,
    isBulkUpdating: bulkUpdateMutation.isPending,

    // Stats
    stats,

    // Infinite scroll
    sentinelRef,

    // Actions
    invalidateData,
  }
}
