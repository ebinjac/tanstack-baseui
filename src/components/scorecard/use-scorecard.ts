/**
 * useScorecard Hook
 *
 * Encapsulates all scorecard state management and data fetching logic.
 * Extracts complex state management from the scorecard page component.
 *
 * @see skills/react-best-practices/rules/hook-extract-logic.md
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { publishScorecard, unpublishScorecard } from "@/app/actions/scorecard";
import { useYearSelection } from "@/hooks/use-date-range";
import { useExpandState } from "@/hooks/use-expand-state";
import { scorecardKeys } from "@/lib/query-keys";
import {
  scorecardDataOptions,
  scorecardPublishStatusOptions,
} from "@/lib/query-options";
import {
  currentYear,
  getMonthsForPeriod,
  getMonthsForYear,
  TIME_PERIOD_OPTIONS,
} from "./constants";
import type {
  Application,
  AvailabilityRecord,
  MonthInfo,
  ScorecardEntry,
  TimePeriod,
  ViewMode,
  VolumeRecord,
} from "./types";

export interface UseScorecardOptions {
  isAdmin: boolean;
  teamId: string;
}

export interface ScorecardData {
  applications: Application[];
  availability: AvailabilityRecord[];
  entries: ScorecardEntry[];
  volume: VolumeRecord[];
}

export interface UseScorecardReturn {
  // Dialog state
  addEntryAppId: string | null;
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
  confirmPublishAction: () => void;
  deletingEntry: ScorecardEntry | null;

  // Display months
  displayMonths: MonthInfo[];
  editingEntry: ScorecardEntry | null;

  // Lookup maps
  entriesByApp: Record<string, ScorecardEntry[]>;

  // Expand state
  expandedApps: ReturnType<typeof useExpandState<Application>>;
  filterLabel: string;
  handlePublishClick: (year: number, month: number) => void;
  handleUnpublishClick: (year: number, month: number) => void;

  // Actions
  invalidateData: () => void;
  isLoading: boolean;
  isPublishing: boolean;
  pendingChangesMonths: MonthInfo[];
  publishAction: "publish" | "unpublish";
  publishMonth: { year: number; month: number } | null;
  publishStatusByMonth: Record<
    string,
    {
      isPublished: boolean;
      publishedBy: string | null;
      publishedAt: Date | null;
    }
  >;

  // Data
  scorecardData: ScorecardData;
  selectedPeriod: TimePeriod;
  selectedYear: number;
  setAddEntryAppId: (id: string | null) => void;
  setDeletingEntry: (entry: ScorecardEntry | null) => void;
  setEditingEntry: (entry: ScorecardEntry | null) => void;
  setSelectedPeriod: (period: TimePeriod) => void;
  setSelectedYear: (year: number) => void;
  setShowChart: (show: boolean) => void;
  setShowPublishDialog: (show: boolean) => void;
  setViewMode: (mode: ViewMode) => void;

  // Chart state
  showChart: boolean;
  showPublishDialog: boolean;

  // Stats
  stats: {
    apps: number;
    entries: number;
    availRecords: number;
    volRecords: number;
    availBreaches: number;
  };

  // Publish state
  unpublishedMonths: MonthInfo[];
  // View state
  viewMode: ViewMode;
  volumeByEntry: Record<string, Record<string, VolumeRecord>>;
  yearsToFetch: number[];
}

function getLatestDate(
  updatedAt: string | Date | null | undefined,
  createdAt: string | Date | null | undefined
): Date | null {
  if (updatedAt) {
    return new Date(updatedAt);
  }
  if (createdAt) {
    return new Date(createdAt);
  }
  return null;
}

function hasDataChangedSince(
  key: string,
  publishedAt: Date,
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>,
  volumeByEntry: Record<string, Record<string, VolumeRecord>>
): boolean {
  for (const entryAvail of Object.values(availabilityByEntry)) {
    const av = entryAvail[key];
    if (av) {
      const dataUpdatedAt = getLatestDate(av.updatedAt, av.createdAt);
      if (dataUpdatedAt && dataUpdatedAt > publishedAt) {
        return true;
      }
    }
  }
  for (const entryVol of Object.values(volumeByEntry)) {
    const vol = entryVol[key];
    if (vol) {
      const dataUpdatedAt = getLatestDate(vol.updatedAt, vol.createdAt);
      if (dataUpdatedAt && dataUpdatedAt > publishedAt) {
        return true;
      }
    }
  }
  return false;
}

function countStatsForEntry(
  entry: ScorecardEntry,
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>,
  volumeByEntry: Record<string, Record<string, VolumeRecord>>,
  pastMonths: MonthInfo[]
): { availRecords: number; volRecords: number; availBreaches: number } {
  const threshold = Number.parseFloat(entry.availabilityThreshold);
  const entryAvailability = availabilityByEntry[entry.id] || {};
  const entryVolume = volumeByEntry[entry.id] || {};
  let availRecords = 0;
  let volRecords = 0;
  let availBreaches = 0;

  for (const { year, month } of pastMonths) {
    const key = `${year}-${month}`;
    if (entryAvailability[key]) {
      availRecords++;
      if (Number.parseFloat(entryAvailability[key].availability) < threshold) {
        availBreaches++;
      }
    }
    if (entryVolume[key]) {
      volRecords++;
    }
  }

  return { availRecords, volRecords, availBreaches };
}

export function useScorecard({
  teamId,
}: UseScorecardOptions): UseScorecardReturn {
  const queryClient = useQueryClient();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("period");
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("ytd");
  const yearSelection = useYearSelection({ initialYear: currentYear });

  // Dialog state
  const [addEntryAppId, setAddEntryAppId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<ScorecardEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<ScorecardEntry | null>(
    null
  );

  // Chart state
  const [showChart, setShowChart] = useState(false);

  // Publish dialog state
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishMonth, setPublishMonth] = useState<{
    year: number;
    month: number;
  } | null>(null);
  const [publishAction, setPublishAction] = useState<"publish" | "unpublish">(
    "publish"
  );

  // Expand state for applications
  const expandedApps = useExpandState<Application>({
    getItemId: (app) => app.id,
    initialExpanded: "none",
  });

  // Get the months to display based on view mode
  const displayMonths = useMemo(() => {
    if (viewMode === "year") {
      return getMonthsForYear(yearSelection.year);
    }
    return getMonthsForPeriod(selectedPeriod);
  }, [viewMode, selectedPeriod, yearSelection.year]);

  // Determine which years we need to fetch data for
  const yearsToFetch = useMemo(() => {
    const years = new Set<number>();
    for (const m of displayMonths) {
      years.add(m.year);
    }
    return Array.from(years);
  }, [displayMonths]);

  // Fetch scorecard data for current year
  const { data: currentYearData, isLoading: isLoadingCurrent } = useQuery(
    scorecardDataOptions({ teamId, year: currentYear })
  );

  // Fetch scorecard data for previous year (if needed)
  const { data: prevYearData, isLoading: isLoadingPrev } = useQuery({
    ...scorecardDataOptions({ teamId, year: currentYear - 1 }),
    enabled: yearsToFetch.includes(currentYear - 1),
  });

  const isLoading =
    isLoadingCurrent ||
    (yearsToFetch.includes(currentYear - 1) && isLoadingPrev);

  // Merge data from both years
  const scorecardData: ScorecardData = useMemo(() => {
    const apps = currentYearData?.applications || [];
    const entries = currentYearData?.entries || [];

    const availability = [
      ...(currentYearData?.availability || []),
      ...(prevYearData?.availability || []),
    ];

    const volume = [
      ...(currentYearData?.volume || []),
      ...(prevYearData?.volume || []),
    ];

    return { applications: apps, entries, availability, volume };
  }, [currentYearData, prevYearData]);

  // Fetch publish status for current year
  const { data: publishStatusCurrentYear } = useQuery(
    scorecardPublishStatusOptions({ teamId, year: currentYear })
  );

  // Fetch publish status for previous year (if needed)
  const { data: publishStatusPrevYear } = useQuery({
    ...scorecardPublishStatusOptions({ teamId, year: currentYear - 1 }),
    enabled: yearsToFetch.includes(currentYear - 1),
  });

  // Combine publish status from both years
  const publishStatusByMonth = useMemo(() => {
    const status: Record<
      string,
      {
        isPublished: boolean;
        publishedBy: string | null;
        publishedAt: Date | null;
      }
    > = {};

    if (publishStatusCurrentYear?.statusByMonth) {
      for (const [month, data] of Object.entries(
        publishStatusCurrentYear.statusByMonth
      )) {
        status[`${currentYear}-${month}`] = data;
      }
    }

    if (publishStatusPrevYear?.statusByMonth) {
      for (const [month, data] of Object.entries(
        publishStatusPrevYear.statusByMonth
      )) {
        status[`${currentYear - 1}-${month}`] = data;
      }
    }

    return status;
  }, [publishStatusCurrentYear, publishStatusPrevYear]);

  // Build lookup maps with year-month composite key
  const { entriesByApp, availabilityByEntry, volumeByEntry } = useMemo(() => {
    const entriesByApp: Record<string, ScorecardEntry[]> = {};
    const availabilityByEntry: Record<
      string,
      Record<string, AvailabilityRecord>
    > = {};
    const volumeByEntry: Record<string, Record<string, VolumeRecord>> = {};

    for (const entry of scorecardData.entries) {
      if (!entriesByApp[entry.applicationId]) {
        entriesByApp[entry.applicationId] = [];
      }
      entriesByApp[entry.applicationId].push(entry);
    }

    for (const av of scorecardData.availability) {
      if (!availabilityByEntry[av.scorecardEntryId]) {
        availabilityByEntry[av.scorecardEntryId] = {};
      }
      const key = `${av.year}-${av.month}`;
      availabilityByEntry[av.scorecardEntryId][key] = av;
    }

    for (const vol of scorecardData.volume) {
      if (!volumeByEntry[vol.scorecardEntryId]) {
        volumeByEntry[vol.scorecardEntryId] = {};
      }
      const key = `${vol.year}-${vol.month}`;
      volumeByEntry[vol.scorecardEntryId][key] = vol;
    }

    return { entriesByApp, availabilityByEntry, volumeByEntry };
  }, [scorecardData]);

  // Calculate months requiring publishing
  const { unpublishedMonths, pendingChangesMonths } = useMemo(() => {
    const unpublished: typeof displayMonths = [];
    const pendingChanges: typeof displayMonths = [];

    for (const { year, month, isFuture, label } of displayMonths) {
      if (isFuture) {
        continue;
      }

      const key = `${year}-${month}`;
      const status = publishStatusByMonth[key];

      if (!status?.isPublished) {
        unpublished.push({ year, month, isFuture, label });
        continue;
      }

      const publishedAt = status.publishedAt
        ? new Date(status.publishedAt)
        : null;
      if (!publishedAt) {
        unpublished.push({ year, month, isFuture, label });
        continue;
      }

      const hasPendingChanges = hasDataChangedSince(
        key,
        publishedAt,
        availabilityByEntry,
        volumeByEntry
      );

      if (hasPendingChanges) {
        pendingChanges.push({ year, month, isFuture, label });
      }
    }

    return {
      unpublishedMonths: unpublished,
      pendingChangesMonths: pendingChanges,
    };
  }, [displayMonths, publishStatusByMonth, availabilityByEntry, volumeByEntry]);

  // Stats calculation
  const stats = useMemo(() => {
    const apps = scorecardData.applications.length;
    const entries = scorecardData.entries.length;
    const pastMonths = displayMonths.filter((m) => !m.isFuture);

    let availRecords = 0;
    let volRecords = 0;
    let availBreaches = 0;

    for (const entry of scorecardData.entries) {
      const result = countStatsForEntry(
        entry,
        availabilityByEntry,
        volumeByEntry,
        pastMonths
      );
      availRecords += result.availRecords;
      volRecords += result.volRecords;
      availBreaches += result.availBreaches;
    }

    return { apps, entries, availRecords, volRecords, availBreaches };
  }, [scorecardData, availabilityByEntry, volumeByEntry, displayMonths]);

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: (params: { year: number; month: number }) =>
      publishScorecard({
        data: { teamId, year: params.year, month: params.month },
      }),
    onSuccess: () => {
      toast.success("Scorecard published successfully", {
        description: "Data is now visible in the Enterprise Scorecard.",
      });
      queryClient.invalidateQueries({
        queryKey: scorecardKeys.publishStatus.all(teamId),
      });
      setShowPublishDialog(false);
      setPublishMonth(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to publish scorecard", {
        description: error.message,
      });
    },
  });

  // Unpublish mutation
  const unpublishMutation = useMutation({
    mutationFn: (params: { year: number; month: number }) =>
      unpublishScorecard({
        data: { teamId, year: params.year, month: params.month },
      }),
    onSuccess: () => {
      toast.success("Scorecard unpublished", {
        description: "Data is no longer visible in the Enterprise Scorecard.",
      });
      queryClient.invalidateQueries({
        queryKey: scorecardKeys.publishStatus.all(teamId),
      });
      setShowPublishDialog(false);
      setPublishMonth(null);
    },
    onError: (error: Error) => {
      toast.error("Failed to unpublish scorecard", {
        description: error.message,
      });
    },
  });

  // Publish handlers
  const handlePublishClick = useCallback((year: number, month: number) => {
    setPublishMonth({ year, month });
    setPublishAction("publish");
    setShowPublishDialog(true);
  }, []);

  const handleUnpublishClick = useCallback((year: number, month: number) => {
    setPublishMonth({ year, month });
    setPublishAction("unpublish");
    setShowPublishDialog(true);
  }, []);

  const confirmPublishAction = useCallback(() => {
    if (!publishMonth) {
      return;
    }
    if (publishAction === "publish") {
      publishMutation.mutate(publishMonth);
    } else {
      unpublishMutation.mutate(publishMonth);
    }
  }, [publishMonth, publishAction, publishMutation, unpublishMutation]);

  // Invalidate data helper
  const invalidateData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: scorecardKeys.team(teamId) });
  }, [queryClient, teamId]);

  // Get the period/year description
  const filterLabel =
    viewMode === "year"
      ? `Year ${yearSelection.year}`
      : TIME_PERIOD_OPTIONS.find((p) => p.value === selectedPeriod)?.label ||
        "";

  return {
    // View state
    viewMode,
    setViewMode,
    selectedPeriod,
    setSelectedPeriod,
    selectedYear: yearSelection.year,
    setSelectedYear: yearSelection.setYear,

    // Display months
    displayMonths,
    filterLabel,
    yearsToFetch,

    // Data
    scorecardData,
    isLoading,
    publishStatusByMonth,

    // Lookup maps
    entriesByApp,
    availabilityByEntry,
    volumeByEntry,

    // Expand state
    expandedApps,

    // Stats
    stats,

    // Publish state
    unpublishedMonths,
    pendingChangesMonths,
    showPublishDialog,
    publishMonth,
    publishAction,
    handlePublishClick,
    handleUnpublishClick,
    confirmPublishAction,
    isPublishing: publishMutation.isPending || unpublishMutation.isPending,
    setShowPublishDialog,

    // Dialog state
    addEntryAppId,
    setAddEntryAppId,
    editingEntry,
    setEditingEntry,
    deletingEntry,
    setDeletingEntry,

    // Chart state
    showChart,
    setShowChart,

    // Actions
    invalidateData,
  };
}
