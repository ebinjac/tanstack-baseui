/**
 * useDispatchTurnover Hook
 *
 * Encapsulates all dispatch turnover state management and data fetching logic.
 * Extracts complex state management from the dispatch turnover page component.
 *
 * @see skills/react-best-practices/rules/hook-extract-logic.md
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  canFinalizeTurnover,
  finalizeTurnover,
  getDispatchEntries,
} from "@/app/actions/turnover";
import type { TurnoverEntryWithDetails } from "@/db/schema/turnover";
import { useExpandState } from "@/hooks/use-expand-state";
import { useSearchFilter } from "@/hooks/use-search-filter";
import { turnoverKeys } from "@/lib/query-keys";

export interface UseDispatchTurnoverOptions {
  initialEntries?: TurnoverEntryWithDetails[];
  teamId: string;
}

export interface UseDispatchTurnoverReturn {
  allExpanded: boolean;

  // Finalize
  canFinalize: boolean;
  checkingCooldown: boolean;
  cooldownMessage: string | null;
  // Data
  entries: TurnoverEntryWithDetails[];

  // Expand state
  expandedApps: ReturnType<typeof useExpandState<TurnoverEntryWithDetails>>;
  filteredEntries: TurnoverEntryWithDetails[];
  finalizeDialogOpen: boolean;
  finalizeNotes: string;

  // Grouping
  groupedEntries: Record<string, TurnoverEntryWithDetails[]>;
  handleFinalize: () => void;

  // Actions
  invalidateData: () => void;
  isFinalizing: boolean;
  isLoading: boolean;

  // Search
  searchQuery: string;
  setFinalizeDialogOpen: (open: boolean) => void;
  setFinalizeNotes: (notes: string) => void;
  setSearchQuery: (query: string) => void;

  // Stats
  stats: {
    activeApps: number;
    totalEntries: number;
    criticalItems: number;
  };
  toggleAll: () => void;
}

export function useDispatchTurnover({
  teamId,
  initialEntries,
}: UseDispatchTurnoverOptions): UseDispatchTurnoverReturn {
  const queryClient = useQueryClient();

  // Dialog state
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [finalizeNotes, setFinalizeNotes] = useState("");
  const [allExpanded, setAllExpanded] = useState(false);

  // Fetch entries
  const { data: entries, isLoading } = useQuery({
    queryKey: turnoverKeys.dispatch(teamId),
    queryFn: () => getDispatchEntries({ data: { teamId } }),
    initialData: initialEntries,
    staleTime: 30_000,
  });

  // Check finalize cooldown
  const { data: canFinalizeData, isLoading: checkingCooldown } = useQuery({
    queryKey: turnoverKeys.canFinalize(teamId),
    queryFn: () => canFinalizeTurnover({ data: { teamId } }),
  });

  // Search filter
  const {
    searchTerm: searchQuery,
    setSearchTerm: setSearchQuery,
    filteredItems: filteredEntries,
  } = useSearchFilter({
    items: entries || [],
    searchFields: ["title", "description", "createdBy"] as Array<
      keyof TurnoverEntryWithDetails
    >,
  });

  // Group entries by application
  const groupedEntries = useMemo(() => {
    const grouped: Record<string, TurnoverEntryWithDetails[]> = {};

    for (const entry of filteredEntries) {
      const appId = entry.applicationId;
      if (!grouped[appId]) {
        grouped[appId] = [];
      }
      grouped[appId].push(entry);
    }

    return grouped;
  }, [filteredEntries]);

  // Expand state for applications
  const expandedApps = useExpandState<TurnoverEntryWithDetails>({
    getItemId: (entry) => entry.applicationId,
    initialExpanded: "none",
  });

  // Stats
  const stats = useMemo(() => {
    const allEntries = entries || [];
    const apps = new Set(allEntries.map((e) => e.applicationId));
    const critical = allEntries.filter((e) => e.isImportant);

    return {
      activeApps: apps.size,
      totalEntries: allEntries.length,
      criticalItems: critical.length,
    };
  }, [entries]);

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: () =>
      finalizeTurnover({ data: { teamId, notes: finalizeNotes } }),
    onSuccess: () => {
      toast.success("Turnover finalized successfully");
      queryClient.invalidateQueries({
        queryKey: turnoverKeys.canFinalize(teamId),
      });
      queryClient.invalidateQueries({
        queryKey: turnoverKeys.dispatch(teamId),
      });
      setFinalizeDialogOpen(false);
      setFinalizeNotes("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to finalize turnover");
    },
  });

  // Toggle all handler
  const toggleAll = useCallback(() => {
    const appIds = Object.keys(groupedEntries);
    if (allExpanded) {
      expandedApps.collapseAll();
    } else {
      expandedApps.expandAll(appIds);
    }
    setAllExpanded(!allExpanded);
  }, [allExpanded, expandedApps, groupedEntries]);

  // Handle finalize
  const handleFinalize = useCallback(() => {
    finalizeMutation.mutate();
  }, [finalizeMutation]);

  // Invalidate data helper
  const invalidateData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: turnoverKeys.team(teamId) });
  }, [queryClient, teamId]);

  return {
    // Data
    entries: entries || [],
    isLoading,

    // Search
    searchQuery,
    setSearchQuery,
    filteredEntries,

    // Grouping
    groupedEntries,

    // Expand state
    expandedApps,
    allExpanded,
    toggleAll,

    // Stats
    stats,

    // Finalize
    canFinalize: canFinalizeData?.canFinalize ?? false,
    checkingCooldown,
    cooldownMessage: canFinalizeData?.message ?? null,
    finalizeDialogOpen,
    setFinalizeDialogOpen,
    finalizeNotes,
    setFinalizeNotes,
    handleFinalize,
    isFinalizing: finalizeMutation.isPending,

    // Actions
    invalidateData,
  };
}
