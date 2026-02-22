"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  getApplicationGroups,
  toggleTurnoverGrouping,
} from "@/app/actions/application-groups";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { GroupManagementDragDrop } from "./group-management-dnd";

interface GroupManagementProps {
  teamId: string;
  trigger?: React.ReactNode;
}

export function GroupManagementDialog({
  teamId,
  trigger,
}: GroupManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["application-groups", teamId],
    queryFn: () => getApplicationGroups({ data: { teamId } }),
    enabled: isOpen,
  });

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      toggleTurnoverGrouping({ data: { teamId, enabled } }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({
        queryKey: ["application-groups", teamId],
      });
    },
  });

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      {trigger ? (
        <SheetTrigger render={trigger as React.ReactElement} />
      ) : (
        <SheetTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-2"
          )}
        >
          <Layers className="h-4 w-4" />
          Manage Groups
        </SheetTrigger>
      )}
      <SheetContent
        className="!w-[90vw] !max-w-[1200px] flex flex-col gap-0 overflow-hidden p-0"
        showCloseButton={true}
        side="right"
      >
        <SheetHeader className="z-20 shrink-0 border-b bg-background p-6 pb-4">
          <SheetTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            Application Groups Management
          </SheetTitle>
          <SheetDescription>
            Drag and drop applications to organize them into groups. Group names
            are automatically generated based on the application TLAs.
          </SheetDescription>
        </SheetHeader>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/5">
          {/* Toolbar */}
          <div className="flex shrink-0 items-center justify-between border-b bg-background/50 px-6 py-4 backdrop-blur-sm">
            <div className="space-y-0.5">
              <Label className="font-medium text-sm">Enable Grouped View</Label>
              <p className="text-muted-foreground text-xs">
                Show applications organized by groups in Turnover
              </p>
            </div>
            <Switch
              checked={data?.groupingEnabled ?? false}
              disabled={toggleMutation.isPending || isLoading}
              onCheckedChange={(checked) => toggleMutation.mutate(checked)}
            />
          </div>

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-hidden">
              {!data && (
                <div className="flex flex-1 items-center justify-center text-muted-foreground">
                  Failed to load groups. Please try again.
                </div>
              )}
              {data && !data.groupingEnabled && (
                <div className="m-6 flex h-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/10 p-8 text-center">
                  <Layers className="mb-6 h-16 w-16 text-muted-foreground/30" />
                  <h3 className="mb-3 font-semibold text-xl">
                    Grouping is Disabled
                  </h3>
                  <p className="mb-8 max-w-md text-muted-foreground">
                    Enable grouping above to start organizing your applications
                    into logical groups for a better turnover experience.
                  </p>
                  <Button
                    className="gap-2"
                    disabled={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate(true)}
                    size="lg"
                  >
                    <Layers className="h-5 w-5" />
                    Enable Grouping
                  </Button>
                </div>
              )}
              {data?.groupingEnabled && (
                <GroupManagementDragDrop
                  initialGroups={data.groups}
                  initialUngrouped={data.ungroupedApplications}
                  onClose={() => setIsOpen(false)}
                  teamId={teamId}
                />
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
