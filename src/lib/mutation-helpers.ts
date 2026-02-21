/**
 * Mutation Helpers
 *
 * Standardized mutation helpers for consistent invalidation patterns.
 * Follows TanStack Query best practices for cache invalidation.
 *
 * @see skills/tanstack-query/rules/mut-invalidate-queries.md
 */

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  adminKeys,
  linkKeys,
  scorecardKeys,
  teamKeys,
  turnoverKeys,
} from './query-keys'

// ==========================================
// Scorecard Mutation Helpers
// ==========================================

/**
 * Hook for invalidating scorecard queries after mutations.
 */
export function useScorecardMutations(teamId: string) {
  const queryClient = useQueryClient()

  const invalidateAll = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: scorecardKeys.team(teamId),
    })
  }, [queryClient, teamId])

  const invalidateYear = useCallback(
    (year: number) => {
      return queryClient.invalidateQueries({
        queryKey: scorecardKeys.year(teamId, year),
      })
    },
    [queryClient, teamId],
  )

  const invalidatePublishStatus = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: scorecardKeys.publishStatus.all(teamId),
    })
  }, [queryClient, teamId])

  const invalidateGlobal = useCallback(
    (filters?: {
      year: number
      leadershipType?: string
      leadershipSearch?: string
    }) => {
      if (filters) {
        return queryClient.invalidateQueries({
          queryKey: scorecardKeys.global.filtered(filters),
        })
      }
      return queryClient.invalidateQueries({
        queryKey: scorecardKeys.global.all,
      })
    },
    [queryClient],
  )

  return {
    invalidateAll,
    invalidateYear,
    invalidatePublishStatus,
    invalidateGlobal,
  }
}

// ==========================================
// Turnover Mutation Helpers
// ==========================================

/**
 * Hook for invalidating turnover queries after mutations.
 */
export function useTurnoverMutations(teamId: string) {
  const queryClient = useQueryClient()

  const invalidateAll = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: turnoverKeys.team(teamId),
    })
  }, [queryClient, teamId])

  const invalidateEntries = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: turnoverKeys.entries.all(teamId),
    })
  }, [queryClient, teamId])

  const invalidateGroups = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: turnoverKeys.groups(teamId),
    })
  }, [queryClient, teamId])

  const invalidateDispatch = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: turnoverKeys.dispatch(teamId),
    })
  }, [queryClient, teamId])

  const invalidateCanFinalize = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: turnoverKeys.canFinalize(teamId),
    })
  }, [queryClient, teamId])

  const invalidateFinalized = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: turnoverKeys.finalized.all(teamId),
    })
  }, [queryClient, teamId])

  const invalidateMetrics = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: turnoverKeys.metrics(teamId),
    })
  }, [queryClient, teamId])

  return {
    invalidateAll,
    invalidateEntries,
    invalidateGroups,
    invalidateDispatch,
    invalidateCanFinalize,
    invalidateFinalized,
    invalidateMetrics,
  }
}

// ==========================================
// Links Mutation Helpers
// ==========================================

/**
 * Hook for invalidating link queries after mutations.
 */
export function useLinksMutations(teamId: string) {
  const queryClient = useQueryClient()

  const invalidateAll = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: linkKeys.team(teamId),
    })
  }, [queryClient, teamId])

  const invalidateList = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: linkKeys.list(teamId),
    })
  }, [queryClient, teamId])

  const invalidateStats = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: linkKeys.stats(teamId),
    })
  }, [queryClient, teamId])

  const invalidateCategories = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: linkKeys.categories(teamId),
    })
  }, [queryClient, teamId])

  return {
    invalidateAll,
    invalidateList,
    invalidateStats,
    invalidateCategories,
  }
}

// ==========================================
// Team Mutation Helpers
// ==========================================

/**
 * Hook for invalidating team queries after mutations.
 */
export function useTeamMutations() {
  const queryClient = useQueryClient()

  const invalidateAll = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: teamKeys.all,
    })
  }, [queryClient])

  const invalidateList = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: teamKeys.list(),
    })
  }, [queryClient])

  const invalidateDetail = useCallback(
    (teamId: string) => {
      return queryClient.invalidateQueries({
        queryKey: teamKeys.detail(teamId),
      })
    },
    [queryClient],
  )

  const invalidateApplications = useCallback(
    (teamId: string) => {
      return queryClient.invalidateQueries({
        queryKey: teamKeys.applications(teamId),
      })
    },
    [queryClient],
  )

  return {
    invalidateAll,
    invalidateList,
    invalidateDetail,
    invalidateApplications,
  }
}

// ==========================================
// Admin Mutation Helpers
// ==========================================

/**
 * Hook for invalidating admin queries after mutations.
 */
export function useAdminMutations() {
  const queryClient = useQueryClient()

  const invalidateAll = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: adminKeys.all,
    })
  }, [queryClient])

  const invalidateRegistrationRequests = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: adminKeys.registrationRequests(),
    })
  }, [queryClient])

  const invalidateHealth = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: adminKeys.health(),
    })
  }, [queryClient])

  return {
    invalidateAll,
    invalidateRegistrationRequests,
    invalidateHealth,
  }
}

// ==========================================
// Generic Mutation Helper
// ==========================================

/**
 * Generic hook for creating mutations with standardized invalidation.
 *
 * @example
 * ```tsx
 * const { mutate, isPending } = useMutationWithInvalidation({
 *   mutationFn: (data) => createEntry(data),
 *   invalidateKeys: [scorecardKeys.team(teamId)],
 *   onSuccess: () => toast.success('Entry created'),
 *   onError: (err) => toast.error(err.message),
 * })
 * ```
 */
export function useMutationWithInvalidation<TData, TVariables>({
  mutationFn,
  invalidateKeys,
  onSuccess,
  onError,
}: {
  mutationFn: (variables: TVariables) => Promise<TData>
  invalidateKeys: Array<ReadonlyArray<unknown>>
  onSuccess?: (data: TData) => void
  onError?: (error: Error) => void
}) {
  const queryClient = useQueryClient()

  return {
    mutate: async (variables: TVariables) => {
      try {
        const data = await mutationFn(variables)

        // Invalidate all specified keys
        await Promise.all(
          invalidateKeys.map((key) =>
            queryClient.invalidateQueries({ queryKey: key as Array<unknown> }),
          ),
        )

        onSuccess?.(data)
        return { success: true, data } as const
      } catch (error) {
        const err = error as Error
        onError?.(err)
        return { success: false, error: err } as const
      }
    },
  }
}
