// Enterprise Scorecard Type Definitions

export interface Team {
    id: string;
    teamName: string;
}

export interface Application {
    id: string;
    teamId: string;
    applicationName: string;
    tla: string;
    tier: string | null;
    assetId: number;
    ownerSvpName: string | null;
    vpName: string | null;
    directorName: string | null;
    applicationOwnerName: string | null;
    applicationManagerName: string | null;
    unitCioName: string | null;
}

export interface ScorecardEntry {
    id: string;
    applicationId: string;
    scorecardIdentifier: string;
    name: string;
    availabilityThreshold: string;
    volumeChangeThreshold: string;
}

export interface AvailabilityRecord {
    id: string;
    scorecardEntryId: string;
    year: number;
    month: number;
    availability: string;
    reason: string | null;
}

export interface VolumeRecord {
    id: string;
    scorecardEntryId: string;
    year: number;
    month: number;
    volume: number;
    reason: string | null;
}

export interface LeadershipOptions {
    svp?: (string | null)[];
    vp?: (string | null)[];
    director?: (string | null)[];
    appOwner?: (string | null)[];
    appManager?: (string | null)[];
    unitCio?: (string | null)[];
}

export interface ScorecardData {
    teams: Team[];
    applications: Application[];
    entries: ScorecardEntry[];
    availability: AvailabilityRecord[];
    volume: VolumeRecord[];
    leadershipOptions: LeadershipOptions;
}

export interface ScorecardStats {
    teams: number;
    apps: number;
    entries: number;
    availBreaches: number;
}

export interface LeadershipDisplay {
    role: string;
    name: string;
}

export interface VisibleMonth {
    month: number;
    year: number;
}
