import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { createScorecardEntry } from "@/app/actions/scorecard";
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
import { CreateScorecardEntrySchema } from "@/lib/zod/scorecard.schema";

interface AddEntryDialogProps {
  applicationId: string;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
}

export function AddEntryDialog({
  applicationId,
  open,
  onOpenChange,
  onSuccess,
}: AddEntryDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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

  const createMutation = useMutation({
    mutationFn: createScorecardEntry,
    onSuccess: () => {
      toast.success("Sub-application added successfully");
      reset();
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add sub-application");
    },
  });

  const onSubmit = (values: z.infer<typeof CreateScorecardEntrySchema>) => {
    createMutation.mutate({ data: values });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Sub-Application
          </DialogTitle>
          <DialogDescription>
            Create a new scorecard entry to track metrics for a sub-application.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4 py-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., KMS-IDEAL"
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scorecardIdentifier">
              Scorecard Identifier
              <span className="ml-2 text-muted-foreground text-xs">
                (optional, for automation)
              </span>
            </Label>
            <Input
              id="scorecardIdentifier"
              {...register("scorecardIdentifier")}
              className="font-mono"
              placeholder="e.g., kms-ideal-01"
            />
            <p className="text-muted-foreground text-xs">
              A unique identifier used for API integrations. Leave empty to
              auto-generate.
            </p>
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
            <Button disabled={createMutation.isPending} type="submit">
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
