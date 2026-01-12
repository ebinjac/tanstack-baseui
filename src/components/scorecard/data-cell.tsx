import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    AlertTriangle,
    Lock,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";

interface DataCellProps {
    value: string;
    isBreach: boolean;
    reason?: string;
    editable: boolean;
    disabled?: boolean;
    onSave: (value: string, reason?: string) => void;
    threshold: number;
    type: "availability" | "volume";
    changeValue?: number | null;
}

export function DataCell({
    value,
    isBreach,
    reason,
    editable,
    disabled = false,
    onSave,
    threshold,
    type,
    changeValue,
}: DataCellProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value === "—" ? "" : value);
    const [editReason, setEditReason] = useState(reason || "");

    const handleSave = () => {
        if (!editValue) {
            setIsEditing(false);
            return;
        }

        // Check if breach requires reason
        let willBreach = false;
        if (type === "availability") {
            const numVal = parseFloat(editValue.replace("%", ""));
            willBreach = !isNaN(numVal) && numVal < threshold;
        }

        if (willBreach && !editReason.trim()) {
            toast.error("Please provide a reason for the threshold breach");
            return;
        }

        onSave(editValue, editReason || undefined);
        setIsEditing(false);
    };

    // Display for disabled/locked cells
    if (disabled) {
        return (
            <div
                className={cn(
                    "text-xs px-2 py-1 rounded opacity-40 cursor-not-allowed",
                    "bg-muted/30 text-muted-foreground"
                )}
                title="Cannot edit future months"
            >
                <Lock className="h-3 w-3 inline mr-1" />
                —
            </div>
        );
    }

    if (!editable) {
        return (
            <div
                className={cn(
                    "text-xs px-2 py-1 rounded",
                    isBreach && "bg-red-500/10 text-red-600 font-semibold"
                )}
                title={reason || undefined}
            >
                {value}
                {isBreach && (
                    <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />
                )}
            </div>
        );
    }

    if (isEditing) {
        return (
            <div className="space-y-1">
                <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-7 text-xs text-center w-full"
                    placeholder={type === "availability" ? "99.5%" : "10000"}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave();
                        if (e.key === "Escape") setIsEditing(false);
                    }}
                    autoFocus
                />
                <Textarea
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    className="h-12 text-xs resize-none"
                    placeholder="Reason (optional)"
                />
                <div className="flex gap-1">
                    <Button size="sm" className="h-6 text-xs flex-1" onClick={handleSave}>
                        Save
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        onClick={() => setIsEditing(false)}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <button
            className={cn(
                "text-xs px-2 py-1 rounded w-full transition-colors",
                "hover:bg-primary/10 cursor-pointer",
                isBreach && "bg-red-500/10 text-red-600 font-semibold"
            )}
            onClick={() => setIsEditing(true)}
            title={reason || undefined}
        >
            {value}
            {isBreach && (
                <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />
            )}
            {type === "volume" && changeValue != null && (
                <span
                    className={cn(
                        "ml-1 text-[9px]",
                        changeValue > 0 ? "text-green-600" : "text-red-600"
                    )}
                >
                    {changeValue > 0 ? (
                        <ArrowUpRight className="h-3 w-3 inline" />
                    ) : (
                        <ArrowDownRight className="h-3 w-3 inline" />
                    )}
                </span>
            )}
        </button>
    );
}
