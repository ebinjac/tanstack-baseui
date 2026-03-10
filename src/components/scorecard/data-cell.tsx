import { ArrowDownRight, ArrowUpRight, Info, Lock } from "lucide-react";
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

function parseAvailabilityReason(str: string) {
  if (!str) {
    return { planned: "", unplanned: "" };
  }
  if (!(str.includes("Planned Outage:") || str.includes("Unplanned Outage:"))) {
    return { planned: "", unplanned: str };
  }

  const parts = str.split("Unplanned Outage:");
  const plannedPart = parts[0].replace("Planned Outage:", "").trim();
  const unplannedPart = (parts[1] || "").trim();

  return {
    planned: plannedPart === "None" ? "" : plannedPart,
    unplanned: unplannedPart === "None" ? "" : unplannedPart,
  };
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
  const [planned, setPlanned] = useState(
    () => parseAvailabilityReason(reason || "").planned
  );
  const [unplanned, setUnplanned] = useState(
    () => parseAvailabilityReason(reason || "").unplanned
  );

  const handleSave = () => {
    if (!editValue) {
      setIsEditing(false);
      return;
    }

    // Check if breach requires reason
    let willBreach = false;
    let finalReason = editReason;

    if (type === "availability") {
      const numVal = Number.parseFloat(editValue.replace("%", ""));
      willBreach = !Number.isNaN(numVal) && numVal < threshold;

      const p = planned.trim();
      const u = unplanned.trim();
      if (p || u) {
        finalReason = `Planned Outage:\n${p || "None"}\n\nUnplanned Outage:\n${u || "None"}`;
      } else {
        finalReason = "";
      }
    }

    if (willBreach && !finalReason.trim()) {
      toast.error("Please provide a reason for the threshold breach");
      return;
    }

    onSave(editValue, finalReason || undefined);
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
          "relative rounded-md border border-transparent px-2 py-1 font-bold text-[11px] tabular-nums transition-all",
          "text-muted-foreground/80"
        )}
        title={reason || undefined}
      >
        <span className="relative">
          {value}
          <span className="absolute -top-1 -right-3 flex items-center gap-0.5">
            {reason && (
              <Info className="h-2.5 w-2.5 text-muted-foreground/60 transition-colors" />
            )}
          </span>
        </span>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="zoom-in-95 z-50 min-w-[160px] animate-in space-y-1.5 rounded-lg border border-primary/20 bg-background p-1 shadow-md duration-200">
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
        {type === "availability" ? (
          <div className="space-y-2">
            <div className="space-y-1">
              <span className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                Planned Outage
              </span>
              <Textarea
                className="min-h-[50px] resize-none border-primary/10 text-[10px]"
                onChange={(e) => setPlanned(e.target.value)}
                placeholder="Details of planned downtime..."
                value={planned}
              />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-[10px] text-orange-500 uppercase tracking-wider dark:text-orange-400">
                Unplanned Outage
              </span>
              <Textarea
                className="min-h-[50px] resize-none border-primary/10 text-[10px]"
                onChange={(e) => setUnplanned(e.target.value)}
                placeholder="Details of incidents/unplanned downtime..."
                value={unplanned}
              />
            </div>
          </div>
        ) : (
          <Textarea
            className="min-h-[80px] resize-none border-primary/10 text-[10px]"
            onChange={(e) => setEditReason(e.target.value)}
            placeholder="Reason for breach..."
            value={editReason}
          />
        )}
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
        "group/cell cursor-pointer text-foreground hover:scale-105 hover:border-primary/20 hover:bg-primary/10 active:scale-95 group-hover/cell:text-primary"
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
        <span className="absolute -top-1.5 -right-3.5 flex items-center gap-0.5">
          {reason && (
            <Info className="h-2.5 w-2.5 text-muted-foreground/60 transition-colors group-hover/cell:text-primary" />
          )}
          {type === "volume" && changeValue != null && (
            <span
              className={cn(
                "font-bold text-[8px]",
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
      </span>
    </button>
  );
}
