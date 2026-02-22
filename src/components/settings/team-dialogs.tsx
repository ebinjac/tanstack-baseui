import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { updateTeam } from "@/app/actions/teams";
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
import { UpdateTeamSchema } from "@/lib/zod/team.schema";

interface TeamRecord {
  adminGroup: string;
  contactEmail?: string | null;
  contactName?: string | null;
  id: string;
  teamName: string;
  userGroup: string;
}

interface EditTeamDialogProps {
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  open: boolean;
  team: TeamRecord;
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
      contactName: team.contactName || "",
      contactEmail: team.contactEmail || "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof UpdateTeamSchema>) =>
      updateTeam({ data: values }),
    onSuccess: () => {
      toast.success("Team updated successfully");
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to update team");
    },
  });

  const onSubmit = (values: z.infer<typeof UpdateTeamSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team Details</DialogTitle>
          <DialogDescription>
            Update your team's core information and access groups.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4 py-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              {...register("teamName")}
              placeholder="Enter team name"
            />
            {errors.teamName && (
              <p className="text-destructive text-xs">
                {errors.teamName.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminGroup">Admin Group</Label>
              <Input
                id="adminGroup"
                {...register("adminGroup")}
                placeholder="AD Group Name"
              />
              {errors.adminGroup && (
                <p className="text-destructive text-xs">
                  {errors.adminGroup.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="userGroup">Member Group</Label>
              <Input
                id="userGroup"
                {...register("userGroup")}
                placeholder="AD Group Name"
              />
              {errors.userGroup && (
                <p className="text-destructive text-xs">
                  {errors.userGroup.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactName">Primary Contact Name</Label>
            <Input
              id="contactName"
              {...register("contactName")}
              placeholder="Full Name"
            />
            {errors.contactName && (
              <p className="text-destructive text-xs">
                {errors.contactName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Primary Contact Email</Label>
            <Input
              id="contactEmail"
              {...register("contactEmail")}
              placeholder="email@example.com"
            />
            {errors.contactEmail && (
              <p className="text-destructive text-xs">
                {errors.contactEmail.message}
              </p>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending && (
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
