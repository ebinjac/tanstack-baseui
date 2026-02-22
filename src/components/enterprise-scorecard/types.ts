// Enterprise Scorecard Type Definitions

export interface Team {
  id: string;
  teamName: string;
}

export interface Application {
  applicationManagerName: string | null;
  applicationName: string;
  applicationOwnerName: string | null;
  assetId: number;
  directorName: string | null;
  id: string;
  ownerSvpName: string | null;
  teamId: string;
  tier: string | null;
  tla: string;
  unitCioName: string | null;
  vpName: string | null;
}

export interface ScorecardEntry {
  applicationId: string;
  availabilityThreshold: string;
  id: string;
  name: string;
  scorecardIdentifier: string;
  volumeChangeThreshold: string;
}

export interface AvailabilityRecord {
  availability: string;
  id: string;
  month: number;
  reason: string | null;
  scorecardEntryId: string;
  year: number;
}

export interface VolumeRecord {
  id: string;
  month: number;
  reason: string | null;
  scorecardEntryId: string;
  volume: number;
  year: number;
}

export interface LeadershipOptions {
  appManager?: Array<string | null>;
  appOwner?: Array<string | null>;
  director?: Array<string | null>;
  svp?: Array<string | null>;
  unitCio?: Array<string | null>;
  vp?: Array<string | null>;
}

export interface ScorecardData {
  applications: Application[];
  availability: AvailabilityRecord[];
  entries: ScorecardEntry[];
  leadershipOptions: LeadershipOptions;
  teams: Team[];
  volume: VolumeRecord[];
}

export interface ScorecardStats {
  apps: number;
  availBreaches: number;
  entries: number;
  teams: number;
}

export interface LeadershipDisplay {
  name: string;
  role: string;
}

export interface VisibleMonth {
  month: number;
  year: number;
}
