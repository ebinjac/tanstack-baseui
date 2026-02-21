/**
 * Query Options Factory
 *
 * Centralized query options following TanStack Query best practices.
 * These options can be used with useQuery, useSuspenseQuery, and ensureQueryData.
 *
 * @see skills/tanstack-query/rules/qk-factory-pattern.md
 * @see skills/tanstack-router/rules/load-ensure-query-data.md
 */

import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import {
  adminKeys,
  linkKeys,
  scorecardKeys,
  teamKeys,
  turnoverKeys,
} from './query-keys'
import {
  getGlobalScorecardData,
  getPublishStatus,
  getScorecardData,
} from '@/app/actions/scorecard'
import {
  getDispatchEntries,
  getFinalizedTurnovers,
  getTurnoverEntries,
  getTurnoverMetrics,
} from '@/app/actions/turnover'
import { getLinkCategories, getLinkStats, getLinks } from '@/app/actions/links'
import { getTeamById, getTeams } from '@/app/actions/teams'
import { getSystemHealth } from '@/app/actions/health'
import { getApplicationGroups } from '@/app/actions/application-groups'
import { getTeamApplications } from '@/app/actions/applications'
import { getRegistrationRequests } from '@/app/actions/team-registration'

// ==========================================
// Scorecard Query Options
// ==========================================

export interface ScorecardDataOptions {
  teamId: string
  year: number
}

/**
 * Query options for fetching scorecard data for a specific team and year.
 */
export const scorecardDataOptions = ({ teamId, year }: ScorecardDataOptions) =>
  queryOptions({
    queryKey: scorecardKeys.year(teamId, year),
    queryFn: () => getScorecardData({ data: { teamId, year } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

/**
 * Query options for fetching publish status for a specific team and year.
 */
export const scorecardPublishStatusOptions = ({
  teamId,
  year,
}: ScorecardDataOptions) =>
  queryOptions({
    queryKey: scorecardKeys.publishStatus.year(teamId, year),
    queryFn: () => getPublishStatus({ data: { teamId, year } }),
    staleTime: 1000 * 60 * 2, // 2 minutes (more frequent updates needed)
  })

/**
 * Query options for fetching global scorecard data.
 */
export const globalScorecardOptions = (year: number) =>
  queryOptions({
    queryKey: scorecardKeys.global.filtered({ year }),
    queryFn: () => getGlobalScorecardData({ data: { year } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

// ==========================================
// Turnover Query Options
// ==========================================

export interface TurnoverDataOptions {
  teamId: string
  year: number
}

/**
 * Query options for fetching turnover entries for a team.
 */
export const turnoverEntriesOptions = (
  teamId: string,
  applicationIds?: Array<string>,
  section?: string,
) =>
  queryOptions({
    queryKey: turnoverKeys.entries.section(
      teamId,
      applicationIds || [],
      section || '',
    ),
    queryFn: () =>
      getTurnoverEntries({ data: { teamId, applicationIds, section } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

/**
 * Query options for fetching dispatch entries (current turnover).
 */
export const dispatchEntriesOptions = (teamId: string) =>
  queryOptions({
    queryKey: turnoverKeys.dispatch(teamId),
    queryFn: () => getDispatchEntries({ data: { teamId } }),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

/**
 * Query options for fetching turnover metrics.
 */
export const turnoverMetricsOptions = (
  teamId: string,
  startDate?: Date,
  endDate?: Date,
) =>
  queryOptions({
    queryKey: turnoverKeys.metrics(teamId, { from: startDate, to: endDate }),
    queryFn: () => getTurnoverMetrics({ data: { teamId, startDate, endDate } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

/**
 * Query options for fetching finalized turnovers.
 */
export const finalizedTurnoversOptions = (
  teamId: string,
  page?: number,
  startDate?: Date,
  endDate?: Date,
  search?: string,
) =>
  queryOptions({
    queryKey: turnoverKeys.finalized.filtered(
      teamId,
      { from: startDate, to: endDate },
      search,
      page,
    ),
    queryFn: () =>
      getFinalizedTurnovers({
        data: { teamId, page, startDate, endDate, search },
      }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

/**
 * Query options for fetching application groups for turnover.
 */
export const turnoverGroupsOptions = (teamId: string) =>
  queryOptions({
    queryKey: turnoverKeys.groups(teamId),
    queryFn: () => getApplicationGroups({ data: { teamId } }),
    staleTime: 1000 * 60 * 10, // 10 minutes (groups change less frequently)
  })

// ==========================================
// Links Query Options
// ==========================================

export interface LinksOptions {
  teamId: string
  pageSize?: number
}

/**
 * Query options for fetching links with infinite scrolling.
 */
export const linksInfiniteOptions = ({ teamId, pageSize = 20 }: LinksOptions) =>
  infiniteQueryOptions({
    queryKey: linkKeys.list(teamId),
    queryFn: ({ pageParam }) =>
      getLinks({
        data: { teamId, limit: pageSize, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.nextCursor) return undefined
      return lastPage.nextCursor
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

/**
 * Query options for fetching link statistics.
 */
export const linkStatsOptions = (teamId: string) =>
  queryOptions({
    queryKey: linkKeys.stats(teamId),
    queryFn: () => getLinkStats({ data: { teamId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

/**
 * Query options for fetching link categories.
 */
export const linkCategoriesOptions = (teamId: string) =>
  queryOptions({
    queryKey: linkKeys.categories(teamId),
    queryFn: () => getLinkCategories({ data: { teamId } }),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

// ==========================================
// Teams Query Options
// ==========================================

/**
 * Query options for fetching a single team by ID.
 */
export const teamOptions = (teamId: string) =>
  queryOptions({
    queryKey: teamKeys.detail(teamId),
    queryFn: () => getTeamById({ data: { teamId } }),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

/**
 * Query options for fetching all teams the user has access to.
 */
export const teamsOptions = () =>
  queryOptions({
    queryKey: teamKeys.list(),
    queryFn: () => getTeams(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

/**
 * Query options for fetching team applications.
 */
export const teamApplicationsOptions = (teamId: string) =>
  queryOptions({
    queryKey: teamKeys.applications(teamId),
    queryFn: () => getTeamApplications({ data: { teamId } }),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })

// ==========================================
// Admin Query Options
// ==========================================

/**
 * Query options for fetching registration requests.
 */
export const registrationRequestsOptions = () =>
  queryOptions({
    queryKey: adminKeys.registrationRequests(),
    queryFn: () => getRegistrationRequests(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

/**
 * Query options for fetching system health status.
 */
export const healthOptions = () =>
  queryOptions({
    queryKey: adminKeys.health(),
    queryFn: () => getSystemHealth(),
    staleTime: 1000 * 30, // 30 seconds (health status changes frequently)
    refetchInterval: 1000 * 60, // Refetch every minute
  })
