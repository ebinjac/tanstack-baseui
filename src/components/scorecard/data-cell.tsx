import { ArrowDownRight, ArrowUpRight, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface DataCellProps {
  changeValue?: number | null;
  disabled?: boolean;
  editable: boolean;
  isBreach: boolean;
  onSave: (value: string, reason?: string) => void;
  reason?: string;
  threshold: number;
  type: "availability" | "volume";
  value: string;
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
      const numVal = Number.parseFloat(editValue.replace("%", ""));
      willBreach = !Number.isNaN(numVal) && numVal < threshold;
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
          "cursor-not-allowed rounded-md px-2 py-1 font-bold text-[10px] uppercase tracking-wider opacity-20",
          "bg-muted/30 text-muted-foreground"
        )}
        title="Cannot edit future months"
      >
        <Lock className="h-3 w-3" />
      </div>
    );
  }

  if (!editable) {
    return (
      <div
        className={cn(
          "rounded-md border border-transparent px-2 py-1 font-bold text-[11px] tabular-nums transition-all",
          isBreach
            ? "border-red-500/20 bg-red-500/10 text-red-600"
            : "text-muted-foreground/80"
        )}
        title={reason || undefined}
      >
        {value}
        {isBreach && (
          <div className="mt-0.5 h-1 w-full rounded-full bg-red-500" />
        )}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="zoom-in-95 z-50 min-w-[120px] animate-in space-y-1.5 rounded-lg border border-primary/20 bg-background p-1 shadow-md duration-200">
        <Input
          autoFocus
          className="h-8 w-full border-primary/20 text-center font-bold text-[11px] tabular-nums"
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSave();
            }
            if (e.key === "Escape") {
              setIsEditing(false);
            }
          }}
          placeholder={type === "availability" ? "99.5%" : "10000"}
          value={editValue}
        />
        <Textarea
          className="h-16 resize-none border-primary/10 text-[10px]"
          onChange={(e) => setEditReason(e.target.value)}
          placeholder="Reason for breach..."
          value={editReason}
        />
        <div className="flex gap-1.5">
          <Button
            className="h-7 flex-1 font-bold text-[10px] uppercase tracking-widest"
            onClick={handleSave}
            size="sm"
          >
            Apply
          </Button>
          <Button
            className="h-7 font-bold text-[10px]"
            onClick={() => setIsEditing(false)}
            size="sm"
            variant="ghost"
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
        "w-full rounded-md border border-transparent px-2 py-1.5 font-bold text-[11px] tabular-nums transition-all",
        "group/cell cursor-pointer hover:scale-105 hover:border-primary/20 hover:bg-primary/10 active:scale-95",
        isBreach
          ? "border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/20"
          : "text-foreground group-hover/cell:text-primary"
      )}
      onClick={() => setIsEditing(true)}
      title={
        reason ||
        (isBreach
          ? "Threshold Breach - Click to edit reason"
          : "Click to edit data")
      }
      type="button"
    >
      <span className="relative">
        {value}
        {type === "volume" && changeValue != null && (
          <span
            className={cn(
              "absolute -top-2 -right-3 font-bold text-[8px]",
              changeValue > 0 ? "text-green-600" : "text-red-500"
            )}
          >
            {changeValue > 0 ? (
              <ArrowUpRight className="h-2 w-2" />
            ) : (
              <ArrowDownRight className="h-2 w-2" />
            )}
          </span>
        )}
      </span>
      {isBreach && (
        <div className="mt-1.5 h-0.5 w-full rounded-full bg-red-500" />
      )}
    </button>
  );
}
