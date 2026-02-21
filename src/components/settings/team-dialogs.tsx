import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UpdateTeamSchema } from '@/lib/zod/team.schema'
import { updateTeam } from '@/app/actions/teams'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface EditTeamDialogProps {
  team: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditTeamDialog({
  team,
  open,
  onOpenChange,
  onSuccess,
}: EditTeamDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof UpdateTeamSchema>>({
    resolver: zodResolver(UpdateTeamSchema),
    defaultValues: {
      id: team.id,
      teamName: team.teamName,
      userGroup: team.userGroup,
      adminGroup: team.adminGroup,
      contactName: team.contactName || '',
      contactEmail: team.contactEmail || '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof UpdateTeamSchema>) =>
      updateTeam({ data: values }),
    onSuccess: () => {
      toast.success('Team updated successfully')
      onSuccess()
    },
    onError: () => {
      toast.error('Failed to update team')
    },
  })

  const onSubmit = (values: z.infer<typeof UpdateTeamSchema>) => {
    mutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team Details</DialogTitle>
          <DialogDescription>
            Update your team's core information and access groups.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              {...register('teamName')}
              placeholder="Enter team name"
            />
            {errors.teamName && (
              <p className="text-xs text-destructive">
                {errors.teamName.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminGroup">Admin Group</Label>
              <Input
                id="adminGroup"
                {...register('adminGroup')}
                placeholder="AD Group Name"
              />
              {errors.adminGroup && (
                <p className="text-xs text-destructive">
                  {errors.adminGroup.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="userGroup">Member Group</Label>
              <Input
                id="userGroup"
                {...register('userGroup')}
                placeholder="AD Group Name"
              />
              {errors.userGroup && (
                <p className="text-xs text-destructive">
                  {errors.userGroup.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactName">Primary Contact Name</Label>
            <Input
              id="contactName"
              {...register('contactName')}
              placeholder="Full Name"
            />
            {errors.contactName && (
              <p className="text-xs text-destructive">
                {errors.contactName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Primary Contact Email</Label>
            <Input
              id="contactEmail"
              {...register('contactEmail')}
              placeholder="email@example.com"
            />
            {errors.contactEmail && (
              <p className="text-xs text-destructive">
                {errors.contactEmail.message}
              </p>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
