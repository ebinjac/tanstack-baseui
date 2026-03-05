import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Plus, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { createScorecardEntry } from "@/app/actions/scorecard";
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
import { CreateScorecardEntrySchema } from "@/lib/zod/scorecard.schema";

interface AddEntryDialogProps {
  applicationId: string;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
}

function getIdentifierPreview(
  identifierValid: boolean,
  isValidationError: boolean,
  monthsFound: number
): { text: string; isValid: boolean } {
  if (identifierValid) {
    return {
      text: `✓ Found ${monthsFound} month${monthsFound !== 1 ? "s" : ""} of data — will be auto-imported on save`,
      isValid: true,
    };
  }
  if (isValidationError) {
    return {
      text: "⚠ Could not reach the Year Data API — check the server and try again",
      isValid: false,
    };
  }
  return {
    text: "⚠ No data found for this identifier — double-check the application name",
    isValid: false,
  };
}

export function AddEntryDialog({
  applicationId,
  open,
  onOpenChange,
  onSuccess,
}: AddEntryDialogProps) {
  const queryClient = useQueryClient();
  const [debouncedIdentifier, setDebouncedIdentifier] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<z.infer<typeof CreateScorecardEntrySchema>>({
    resolver: zodResolver(CreateScorecardEntrySchema),
    defaultValues: {
      applicationId,
      scorecardIdentifier: "",
      name: "",
      availabilityThreshold: 98,
      volumeChangeThreshold: 20,
    },
  });

  const liveIdentifier = watch("scorecardIdentifier");

  // Debounce the identifier field by 500 ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedIdentifier(liveIdentifier?.trim() ?? "");
    }, 500);
    return () => clearTimeout(timer);
  }, [liveIdentifier]);

  // Only validate via API when the user has typed something
  const hasIdentifier = debouncedIdentifier.length >= 2;

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

  // Sync mutation — only runs after entry creation when an identifier was provided
  const syncMutation = useMutation({
    mutationFn: (entryId: string) =>
      syncScorecardEntry({ data: { entryId, timeframe: "12" } }),
    onSuccess: (result) => {
      const parts: string[] = [`${result.synced} months synced`];
      if (result.skippedZeros > 0) {
        parts.push(
          `${result.skippedZeros} zero-value records skipped (likely bad API data)`
        );
      }
      if (result.skippedManual > 0) {
        parts.push(`${result.skippedManual} manual corrections preserved`);
      }
      toast.success("Metrics auto-populated from API", {
        description: parts.join(" · "),
      });
      queryClient.invalidateQueries({
        queryKey: scorecardKeys.team(applicationId),
      });
    },
    onError: () => {
      toast.warning(
        "Entry created, but auto-populate failed — you can sync manually later"
      );
    },
  });

  const createMutation = useMutation({
    mutationFn: createScorecardEntry,
    onSuccess: (result) => {
      toast.success("Sub-application added successfully");
      reset();
      onSuccess();
      // Only sync when an identifier is actually set
      if (result.entry?.id && result.entry.scorecardIdentifier) {
        syncMutation.mutate(result.entry.id);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add sub-application");
    },
  });

  const onSubmit = (values: z.infer<typeof CreateScorecardEntrySchema>) => {
    createMutation.mutate({ data: values });
  };

  const isPending = createMutation.isPending || syncMutation.isPending;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Sub-Application
          </DialogTitle>
          <DialogDescription>
            Create a new scorecard entry. Provide a Scorecard Identifier if this
            application is tracked by the Year Data API — metrics will be
            auto-populated on save.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4 py-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name">
              Display Name
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., KMS (short label shown in the scorecard)"
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>

          {/* Scorecard Identifier — optional, drives API lookup when provided */}
          <div className="space-y-2">
            <Label htmlFor="scorecardIdentifier">
              Scorecard Identifier
              <span className="ml-2 text-muted-foreground text-xs">
                (optional — for Year Data API automation)
              </span>
            </Label>
            <div className="relative">
              <Input
                id="scorecardIdentifier"
                {...register("scorecardIdentifier")}
                className="pr-8"
                placeholder="e.g., Key Management Services V1 Global"
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

            {/* Show preview chip only when identifier is typed */}
            {hasIdentifier &&
              !isValidating &&
              (() => {
                const preview = getIdentifierPreview(
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="availabilityThreshold">
                Availability Threshold (%)
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="availabilityThreshold"
                step="0.1"
                type="number"
                {...register("availabilityThreshold", { valueAsNumber: true })}
              />
              {errors.availabilityThreshold && (
                <p className="text-destructive text-sm">
                  {errors.availabilityThreshold.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="volumeChangeThreshold">
                Volume Change Threshold (%)
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="volumeChangeThreshold"
                step="0.1"
                type="number"
                {...register("volumeChangeThreshold", { valueAsNumber: true })}
              />
              {errors.volumeChangeThreshold && (
                <p className="text-destructive text-sm">
                  {errors.volumeChangeThreshold.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {syncMutation.isPending ? "Syncing data…" : "Add Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
