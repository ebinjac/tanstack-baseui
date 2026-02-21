/**
 * Route Loader Helpers
 *
 * Utilities for using TanStack Router loaders with TanStack Query.
 * Implements the ensureQueryData pattern for optimal data loading.
 *
 * @see skills/tanstack-router/rules/load-ensure-query-data.md
 */

import type { QueryClient } from '@tanstack/react-query'

/**
 * Helper to ensure query data is loaded in a route loader.
 * This pattern prevents redundant fetches when the same query is used in the component.
 *
 * @example
 * ```tsx
 * export const Route = createFileRoute('/teams/$teamId/scorecard')({
 *   loader: ({ context, params }) => {
 *     return ensureQueryDataInLoader(context.queryClient, scorecardDataOptions({
 *       teamId: params.teamId,
 *       year: currentYear,
 *     }))
 *   },
 * })
 * ```
 */
export async function ensureQueryDataInLoader<T>(
  queryClient: QueryClient,
  options: { queryKey: ReadonlyArray<unknown>; queryFn: () => Promise<T> },
): Promise<T> {
  return queryClient.ensureQueryData(options)
}

/**
 * Helper to ensure multiple queries are loaded in parallel.
 *
 * @example
 * ```tsx
 * export const Route = createFileRoute('/teams/$teamId/scorecard')({
 *   loader: async ({ context, params }) => {
 *     return ensureMultipleQueries(context.queryClient, [
 *       scorecardDataOptions({ teamId: params.teamId, year: currentYear }),
 *       scorecardPublishStatusOptions({ teamId: params.teamId, year: currentYear }),
 *     ])
 *   },
 * })
 * ```
 */
export async function ensureMultipleQueries(
  queryClient: QueryClient,
  optionsList: Array<{
    queryKey: ReadonlyArray<unknown>
    queryFn: () => Promise<any>
  }>,
): Promise<Array<any>> {
  return Promise.all(
    optionsList.map((options) => queryClient.ensureQueryData(options)),
  )
}

/**
 * Type for route context with query client
 */
export interface RouteContextWithQueryClient {
  queryClient: QueryClient
}

/**
 * Helper to invalidate queries in a route action.
 *
 * @example
 * ```tsx
 * const action = createRouteAction({
 *   actionFn: async ({ context, data }) => {
 *     const result = await saveScorecardEntry(data)
 *     await invalidateInAction(context.queryClient, [
 *       scorecardKeys.team(data.teamId),
 *     ])
 *     return result
 *   },
 * })
 * ```
 */
export async function invalidateInAction(
  queryClient: QueryClient,
  keys: Array<ReadonlyArray<unknown>>,
): Promise<void> {
  await Promise.all(
    keys.map((key) =>
      queryClient.invalidateQueries({ queryKey: key as Array<unknown> }),
    ),
  )
}
