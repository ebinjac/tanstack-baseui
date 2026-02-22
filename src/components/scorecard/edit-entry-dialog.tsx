import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Settings2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { updateScorecardEntry } from "@/app/actions/scorecard";
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
import { UpdateScorecardEntrySchema } from "@/lib/zod/scorecard.schema";
import type { ScorecardEntry } from "./types";

interface EditEntryDialogProps {
  entry: ScorecardEntry;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
}

export function EditEntryDialog({
  entry,
  open,
  onOpenChange,
  onSuccess,
}: EditEntryDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
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
            Update the entry name and threshold settings.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4 py-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="edit-name">Display Name</Label>
            <Input id="edit-name" {...register("name")} />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-scorecardIdentifier">
              Scorecard Identifier
            </Label>
            <Input
              id="edit-scorecardIdentifier"
              {...register("scorecardIdentifier")}
              className="font-mono"
            />
            {errors.scorecardIdentifier && (
              <p className="text-destructive text-sm">
                {errors.scorecardIdentifier.message}
              </p>
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

          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
