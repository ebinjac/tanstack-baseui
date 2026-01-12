import React from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Settings2, Loader2 } from "lucide-react";
import { updateScorecardEntry } from "@/app/actions/scorecard";
import { UpdateScorecardEntrySchema } from "@/lib/zod/scorecard.schema";
import type { ScorecardEntry } from "./types";

interface EditEntryDialogProps {
    entry: ScorecardEntry;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
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
            availabilityThreshold: parseFloat(entry.availabilityThreshold),
            volumeChangeThreshold: parseFloat(entry.volumeChangeThreshold),
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
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-name">Display Name</Label>
                        <Input id="edit-name" {...register("name")} />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
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
                            <p className="text-sm text-destructive">
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
                                type="number"
                                step="0.1"
                                {...register("availabilityThreshold", { valueAsNumber: true })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-volumeChangeThreshold">
                                Volume Change Threshold (%)
                            </Label>
                            <Input
                                id="edit-volumeChangeThreshold"
                                type="number"
                                step="0.1"
                                {...register("volumeChangeThreshold", { valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending}>
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
