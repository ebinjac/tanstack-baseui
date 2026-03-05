import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  Settings2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { updateScorecardEntry } from "@/app/actions/scorecard";
import { fetchYearData, syncScorecardEntry } from "@/app/actions/year-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { scorecardKeys } from "@/lib/query-keys";
import { UpdateScorecardEntrySchema } from "@/lib/zod/scorecard.schema";
import type { ScorecardEntry } from "./types";

interface EditEntryDialogProps {
  entry: ScorecardEntry;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
  teamId: string;
}

function getEditPreviewMessage(
  identifierValid: boolean,
  isValidationError: boolean,
  monthsFound: number
): { text: string; isValid: boolean } {
  if (identifierValid) {
    return {
      text: `✓ API returned ${monthsFound} month${monthsFound !== 1 ? "s" : ""} of data`,
      isValid: true,
    };
  }
  if (isValidationError) {
    return { text: "⚠ Could not reach the Year Data API", isValid: false };
  }
  return { text: "⚠ No data found for this identifier", isValid: false };
}

export function EditEntryDialog({
  entry,
  open,
  onOpenChange,
  onSuccess,
  teamId,
}: EditEntryDialogProps) {
  const queryClient = useQueryClient();
  const [debouncedIdentifier, setDebouncedIdentifier] = useState(
    entry.scorecardIdentifier
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<z.infer<typeof UpdateScorecardEntrySchema>>({
    resolver: zodResolver(UpdateScorecardEntrySchema),
    defaultValues: {
      id: entry.id,
      name: entry.name,
      scorecardIdentifier: entry.scorecardIdentifier,
      availabilityThreshold: Number.parseFloat(entry.availabilityThreshold),
      volumeChangeThreshold: Number.parseFloat(entry.volumeChangeThreshold),
    },
  });

  const liveIdentifier = watch("scorecardIdentifier");

  // Debounce the identifier field
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedIdentifier(liveIdentifier?.trim() ?? "");
    }, 500);
    return () => clearTimeout(timer);
  }, [liveIdentifier]);

  const hasIdentifier = debouncedIdentifier.length >= 2;

  // Validate identifier against the Year Data API (1-month preview)
  const {
    data: previewData,
    isFetching: isValidating,
    isError: isValidationError,
  } = useQuery({
    queryKey: ["year-data-preview", debouncedIdentifier],
    queryFn: () =>
      fetchYearData({
        data: { scorecardIdentifier: debouncedIdentifier, timeframe: "1" },
      }),
    enabled: hasIdentifier,
    retry: false,
    staleTime: 30_000,
  });

  const monthsFound = previewData?.results?.[0]?.data?.length ?? 0;
  const identifierValid =
    hasIdentifier && !isValidationError && monthsFound > 0;

  // Sync mutation — manual "Sync Now" trigger
  const syncMutation = useMutation({
    mutationFn: () =>
      syncScorecardEntry({ data: { entryId: entry.id, timeframe: "12" } }),
    onSuccess: (result) => {
      const parts: string[] = [`${result.synced} months synced`];
      if (result.skippedZeros > 0) {
        parts.push(`${result.skippedZeros} zero-value records skipped`);
      }
      if (result.skippedManual > 0) {
        parts.push(`${result.skippedManual} manual corrections preserved`);
      }
      toast.success("Sync complete", { description: parts.join(" · ") });
      queryClient.invalidateQueries({ queryKey: scorecardKeys.team(teamId) });
    },
    onError: (err: Error) => {
      toast.error(`Sync failed: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateScorecardEntry,
    onSuccess: () => {
      toast.success("Entry updated successfully");
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update entry");
    },
  });

  const onSubmit = (values: z.infer<typeof UpdateScorecardEntrySchema>) => {
    updateMutation.mutate({ data: values });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Edit Entry
          </DialogTitle>
          <DialogDescription>
            Update the entry settings. Use "Sync Now" to re-pull the latest
            metrics from the Year Data API.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4 py-4" onSubmit={handleSubmit(onSubmit)}>
          {/* Scorecard Identifier — optional, drives API lookup when provided */}
          <div className="space-y-2">
            <Label htmlFor="edit-scorecardIdentifier">
              Scorecard Identifier
              <span className="ml-2 text-muted-foreground text-xs">
                (optional — for Year Data API automation)
              </span>
            </Label>
            <div className="relative">
              <Input
                id="edit-scorecardIdentifier"
                {...register("scorecardIdentifier")}
                className="pr-8"
              />
              {hasIdentifier && isValidating && (
                <Loader2 className="absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
              {hasIdentifier && !isValidating && identifierValid && (
                <CheckCircle2 className="absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-green-600" />
              )}
              {hasIdentifier && !isValidating && !identifierValid && (
                <XCircle className="absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-amber-500" />
              )}
            </div>

            {/* Data preview chip — only shown when identifier is provided */}
            {hasIdentifier &&
              !isValidating &&
              (() => {
                const preview = getEditPreviewMessage(
                  identifierValid,
                  isValidationError,
                  monthsFound
                );
                return (
                  <p
                    className={
                      preview.isValid
                        ? "text-green-700 text-xs dark:text-green-400"
                        : "text-amber-600 text-xs dark:text-amber-400"
                    }
                  >
                    {preview.text}
                  </p>
                );
              })()}

            {errors.scorecardIdentifier && (
              <p className="text-destructive text-sm">
                {errors.scorecardIdentifier.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Display Name</Label>
            <Input id="edit-name" {...register("name")} />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-availabilityThreshold">
                Availability Threshold (%)
              </Label>
              <Input
                id="edit-availabilityThreshold"
                step="0.1"
                type="number"
                {...register("availabilityThreshold", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-volumeChangeThreshold">
                Volume Change Threshold (%)
              </Label>
              <Input
                id="edit-volumeChangeThreshold"
                step="0.1"
                type="number"
                {...register("volumeChangeThreshold", { valueAsNumber: true })}
              />
            </div>
          </div>

          <DialogFooter className="flex-wrap gap-2 sm:justify-between">
            {/* Sync Now button — only available when identifier is linked to API */}
            {hasIdentifier ? (
              <Button
                disabled={syncMutation.isPending}
                onClick={() => syncMutation.mutate()}
                type="button"
                variant="outline"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {syncMutation.isPending ? "Syncing…" : "Sync Now"}
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={updateMutation.isPending} type="submit">
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
