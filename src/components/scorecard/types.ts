// Scorecard Types and Interfaces

export interface ScorecardEntry {
  id: string
  applicationId: string
  scorecardIdentifier: string
  name: string
  availabilityThreshold: string
  volumeChangeThreshold: string
}

export interface Application {
  id: string
  applicationName: string
  tla: string
  tier: string | null
  assetId: number
}

export interface AvailabilityRecord {
  id: string
  scorecardEntryId: string
  year: number
  month: number
  availability: string
  reason: string | null
  createdAt?: Date | null
  updatedAt?: Date | null
}

export interface VolumeRecord {
  id: string
  scorecardEntryId: string
  year: number
  month: number
  volume: number
  reason: string | null
  createdAt?: Date | null
  updatedAt?: Date | null
}

export interface MonthInfo {
  year: number
  month: number
  label: string
  isFuture: boolean
}

// View mode type
export type ViewMode = 'period' | 'year'

// Time period options
export type TimePeriod = '1m' | '3m' | '6m' | '12m' | 'ytd'
