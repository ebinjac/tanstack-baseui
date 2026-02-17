/**
 * Query Key Factory
 * 
 * Centralized query key definitions following TanStack Query best practices.
 * Uses factory pattern for type safety, autocomplete, and consistent invalidation.
 * 
 * @see skills/tanstack-query/rules/qk-factory-pattern.md
 */

// ============================================================================
// Types
// ============================================================================

export interface DateRangeFilter {
  from?: Date
  to?: Date
}

export interface LinkFilters {
  search?: string
  visibility?: 'all' | 'private' | 'public'
  applicationId?: string
  categoryId?: string
}

export interface TurnoverFilters {
  applicationIds?: string[]
  section?: string
  includeResolved?: boolean
}

export interface GlobalScorecardFilters {
  year: number
  leadershipType?: string
  leadershipSearch?: string
}

// ============================================================================
// Scorecard Keys
// ============================================================================

/**
 * Query keys for Scorecard feature
 * Hierarchical structure: all -> team -> year -> specific data
 */
export const scorecardKeys = {
  all: ['scorecard'] as const,
  
  // Team-level keys
  team: (teamId: string) => [...scorecardKeys.all, teamId] as const,
  
  // Year-level keys (includes all entries for a team/year)
  year: (teamId: string, year: number) => 
    [...scorecardKeys.team(teamId), year] as const,
  
  // Publish status for a team/year
  publishStatus: {
    all: (teamId: string) => 
      [...scorecardKeys.team(teamId), 'publish-status'] as const,
    year: (teamId: string, year: number) => 
      [...scorecardKeys.team(teamId), 'publish-status', year] as const,
  },
  
  // Global/enterprise scorecard
  global: {
    all: ['global-scorecard'] as const,
    filtered: (filters: GlobalScorecardFilters) => 
      [...scorecardKeys.global.all, filters] as const,
  },
} as const

// ============================================================================
// Turnover Keys
// ============================================================================

/**
 * Query keys for Turnover feature
 * Covers entries, groups, finalized snapshots, and metrics
 */
export const turnoverKeys = {
  all: ['turnover'] as const,
  
  // Team-level keys
  team: (teamId: string) => [...turnoverKeys.all, teamId] as const,
  
  // Entries with optional filters
  entries: {
    all: (teamId: string) => 
      [...turnoverKeys.team(teamId), 'entries'] as const,
    filtered: (teamId: string, filters?: TurnoverFilters) => 
      [...turnoverKeys.team(teamId), 'entries', filters] as const,
    section: (teamId: string, applicationIds: string[], section: string, withResolved?: string) => 
      [...turnoverKeys.team(teamId), 'entries', applicationIds, section, withResolved] as const,
  },
  
  // Dispatch entries (current turnover items)
  dispatch: (teamId: string) => 
    [...turnoverKeys.team(teamId), 'dispatch'] as const,
  
  // Can finalize check
  canFinalize: (teamId: string) => 
    [...turnoverKeys.team(teamId), 'can-finalize'] as const,
  
  // Finalized turnover snapshots
  finalized: {
    all: (teamId: string) => 
      [...turnoverKeys.team(teamId), 'finalized'] as const,
    filtered: (teamId: string, dateRange?: DateRangeFilter, search?: string, page?: number) => 
      [...turnoverKeys.team(teamId), 'finalized', dateRange, search, page] as const,
  },
  
  // Turnover metrics
  metrics: (teamId: string, dateRange?: DateRangeFilter) => 
    [...turnoverKeys.team(teamId), 'metrics', dateRange] as const,
  
  // Application groups for turnover
  groups: (teamId: string) => 
    [...turnoverKeys.team(teamId), 'groups'] as const,
} as const

// ============================================================================
// Link Keys
// ============================================================================

/**
 * Query keys for Link Manager feature
 * Covers links, categories, and statistics
 */
export const linkKeys = {
  all: ['links'] as const,
  
  // Team-level keys
  team: (teamId: string) => [...linkKeys.all, teamId] as const,
  
  // Links list with filters (for infinite query)
  list: (teamId: string, filters?: LinkFilters) => 
    [...linkKeys.team(teamId), 'list', filters] as const,
  
  // Categories
  categories: (teamId: string) => 
    [...linkKeys.team(teamId), 'categories'] as const,
  
  // Statistics
  stats: (teamId: string) => 
    [...linkKeys.team(teamId), 'stats'] as const,
} as const

// ============================================================================
// Team Keys
// ============================================================================

/**
 * Query keys for Team management
 * Covers teams list, individual teams, applications, and LDAP lookups
 */
export const teamKeys = {
  all: ['teams'] as const,
  
  // List of all teams
  list: () => [...teamKeys.all, 'list'] as const,
  
  // Individual team
  detail: (teamId: string) => [...teamKeys.all, teamId] as const,
  
  // Team applications
  applications: (teamId: string) => 
    [...teamKeys.detail(teamId), 'applications'] as const,
  
  // LDAP group members
  ldap: (group: string) => [...teamKeys.all, 'ldap', group] as const,
  
  // Team applications with TLA check
  tlaCheck: (tla: string) => [...teamKeys.all, 'tla-check', tla] as const,
} as const

// ============================================================================
// Admin Keys
// ============================================================================

/**
 * Query keys for Admin features
 * Covers registration requests and system health
 */
export const adminKeys = {
  all: ['admin'] as const,
  
  // Registration requests
  registrationRequests: () => 
    [...adminKeys.all, 'registration-requests'] as const,
  
  // System health
  health: () => [...adminKeys.all, 'health'] as const,
} as const

// ============================================================================
// Application Keys
// ============================================================================

/**
 * Query keys for Application management
 * Used across multiple features
 */
export const applicationKeys = {
  all: ['applications'] as const,
  
  // Team applications
  team: (teamId: string) => [...applicationKeys.all, teamId] as const,
  
  // Application search (Central Registry)
  search: (assetId: number) => 
    [...applicationKeys.all, 'search', assetId] as const,
} as const

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Helper to invalidate all queries for a team
 * Useful when team settings change
 */
export function getTeamQueryKeys(teamId: string) {
  return {
    scorecard: scorecardKeys.team(teamId),
    turnover: turnoverKeys.team(teamId),
    links: linkKeys.team(teamId),
    team: teamKeys.detail(teamId),
    applications: teamKeys.applications(teamId),
  }
}

/**
 * Helper to get all query keys that should be invalidated
 * when team membership/permissions change
 */
export function getPermissionInvalidationKeys(teamId: string) {
  return [
    scorecardKeys.team(teamId),
    turnoverKeys.team(teamId),
    linkKeys.team(teamId),
    teamKeys.applications(teamId),
    turnoverKeys.groups(teamId),
  ]
}
