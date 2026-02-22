// Scorecard Types and Interfaces

export interface ScorecardEntry {
  applicationId: string;
  availabilityThreshold: string;
  id: string;
  name: string;
  scorecardIdentifier: string;
  volumeChangeThreshold: string;
}

export interface Application {
  applicationName: string;
  assetId: number;
  id: string;
  tier: string | null;
  tla: string;
}

export interface AvailabilityRecord {
  availability: string;
  createdAt?: Date | null;
  id: string;
  month: number;
  reason: string | null;
  scorecardEntryId: string;
  updatedAt?: Date | null;
  year: number;
}

export interface VolumeRecord {
  createdAt?: Date | null;
  id: string;
  month: number;
  reason: string | null;
  scorecardEntryId: string;
  updatedAt?: Date | null;
  volume: number;
  year: number;
}

export interface MonthInfo {
  isFuture: boolean;
  label: string;
  month: number;
  year: number;
}

// View mode type
export type ViewMode = "period" | "year";

// Time period options
export type TimePeriod = "1m" | "3m" | "6m" | "12m" | "ytd";
