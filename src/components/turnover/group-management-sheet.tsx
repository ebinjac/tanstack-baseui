'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Layers, Loader2 } from 'lucide-react'
import { GroupManagementDragDrop } from './group-management-dnd'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  getApplicationGroups,
  toggleTurnoverGrouping,
} from '@/app/actions/application-groups'

interface GroupManagementProps {
  teamId: string
  trigger?: React.ReactNode
}

export function GroupManagementDialog({
  teamId,
  trigger,
}: GroupManagementProps) {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['application-groups', teamId],
    queryFn: () => getApplicationGroups({ data: { teamId } }),
    enabled: isOpen,
  })

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      toggleTurnoverGrouping({ data: { teamId, enabled } }),
    onSuccess: () => {
      refetch()
      queryClient.invalidateQueries({
        queryKey: ['application-groups', teamId],
      })
    },
  })

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <SheetTrigger render={trigger as React.ReactElement} />
      ) : (
        <SheetTrigger
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'gap-2',
          )}
        >
          <Layers className="h-4 w-4" />
          Manage Groups
        </SheetTrigger>
      )}
      <SheetContent
        side="right"
        className="!w-[90vw] !max-w-[1200px] flex flex-col p-0 gap-0 overflow-hidden"
        showCloseButton={true}
      >
        <SheetHeader className="p-6 pb-4 shrink-0 bg-background z-20 border-b">
          <SheetTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            Application Groups Management
          </SheetTitle>
          <SheetDescription>
            Drag and drop applications to organize them into groups. Group names
            are automatically generated based on the application TLAs.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0 relative bg-muted/5 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between py-4 px-6 shrink-0 bg-background/50 backdrop-blur-sm border-b">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Enable Grouped View</Label>
              <p className="text-xs text-muted-foreground">
                Show applications organized by groups in Turnover
              </p>
            </div>
            <Switch
              checked={data?.groupingEnabled ?? false}
              onCheckedChange={(checked) => toggleMutation.mutate(checked)}
              disabled={toggleMutation.isPending || isLoading}
            />
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-hidden">
              {data ? (
                <>
                  {data.groupingEnabled ? (
                    <GroupManagementDragDrop
                      teamId={teamId}
                      initialGroups={data.groups}
                      initialUngrouped={data.ungroupedApplications}
                      onClose={() => setIsOpen(false)}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-muted/10 m-6 rounded-xl border border-dashed">
                      <Layers className="h-16 w-16 text-muted-foreground/30 mb-6" />
                      <h3 className="text-xl font-semibold mb-3">
                        Grouping is Disabled
                      </h3>
                      <p className="text-muted-foreground max-w-md mb-8">
                        Enable grouping above to start organizing your
                        applications into logical groups for a better turnover
                        experience.
                      </p>
                      <Button
                        size="lg"
                        onClick={() => toggleMutation.mutate(true)}
                        disabled={toggleMutation.isPending}
                        className="gap-2"
                      >
                        <Layers className="h-5 w-5" />
                        Enable Grouping
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Failed to load groups. Please try again.
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
