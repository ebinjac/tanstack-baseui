import React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Loader2 } from "lucide-react";
import { deleteScorecardEntry } from "@/app/actions/scorecard";
import type { ScorecardEntry } from "./types";

interface DeleteEntryDialogProps {
    entry: ScorecardEntry;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DeleteEntryDialog({
    entry,
    open,
    onOpenChange,
    onSuccess,
}: DeleteEntryDialogProps) {
    const deleteMutation = useMutation({
        mutationFn: deleteScorecardEntry,
        onSuccess: () => {
            toast.success("Entry deleted successfully");
            onSuccess();
        },
        onError: (err: Error) => {
            toast.error(err.message || "Failed to delete entry");
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Delete Entry
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete{" "}
                        <span className="font-semibold">{entry.name}</span>? This will also
                        delete all associated availability and volume data. This action
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() =>
                            deleteMutation.mutate({ data: { entryId: entry.id } })
                        }
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
