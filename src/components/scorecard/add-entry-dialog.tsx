import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createScorecardEntry } from '@/app/actions/scorecard'
import { CreateScorecardEntrySchema } from '@/lib/zod/scorecard.schema'

interface AddEntryDialogProps {
  applicationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
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
      scorecardIdentifier: '',
      name: '',
      availabilityThreshold: 98,
      volumeChangeThreshold: 20,
    },
  })

  const createMutation = useMutation({
    mutationFn: createScorecardEntry,
    onSuccess: () => {
      toast.success('Sub-application added successfully')
      reset()
      onSuccess()
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add sub-application')
    },
  })

  const onSubmit = (values: z.infer<typeof CreateScorecardEntrySchema>) => {
    createMutation.mutate({ data: values })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., KMS-IDEAL"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scorecardIdentifier">
              Scorecard Identifier
              <span className="text-xs text-muted-foreground ml-2">
                (optional, for automation)
              </span>
            </Label>
            <Input
              id="scorecardIdentifier"
              {...register('scorecardIdentifier')}
              placeholder="e.g., kms-ideal-01"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              A unique identifier used for API integrations. Leave empty to
              auto-generate.
            </p>
            {errors.scorecardIdentifier && (
              <p className="text-sm text-destructive">
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
                type="number"
                step="0.1"
                {...register('availabilityThreshold', { valueAsNumber: true })}
              />
              {errors.availabilityThreshold && (
                <p className="text-sm text-destructive">
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
                type="number"
                step="0.1"
                {...register('volumeChangeThreshold', { valueAsNumber: true })}
              />
              {errors.volumeChangeThreshold && (
                <p className="text-sm text-destructive">
                  {errors.volumeChangeThreshold.message}
                </p>
              )}
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
