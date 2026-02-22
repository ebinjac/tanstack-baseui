import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Hash, Loader2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import {
  deleteApplication,
  updateApplication,
} from "@/app/actions/applications";
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
import { UpdateApplicationSchema } from "@/lib/zod/application.schema";

interface ApplicationRecord {
  applicationManagerBand?: string | null;
  applicationManagerEmail?: string | null;
  applicationManagerName?: string | null;
  applicationName: string;
  applicationOwnerBand?: string | null;
  applicationOwnerEmail?: string | null;
  applicationOwnerName?: string | null;
  assetId: number;
  directorEmail?: string | null;
  directorName?: string | null;
  id: string;
  lifeCycleStatus?: string | null;
  ownerSvpBand?: string | null;
  ownerSvpEmail?: string | null;
  ownerSvpName?: string | null;
  serviceTier?: string | null;
  teamId: string;
  tier?: string | null;
  tla: string;
  vpEmail?: string | null;
  vpName?: string | null;
}

// ─── View Dialog ───

const LabelValue = ({
  label,
  value,
  subValue,
  email,
}: {
  label: string;
  value: string | null | undefined;
  subValue?: string | null;
  email?: string | null;
}) => (
  <div className="space-y-1">
    <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
      {label}
    </p>
    <div className="flex flex-col">
      <p className="font-semibold text-sm">{value || "N/A"}</p>
      {subValue && (
        <p className="text-[10px] text-muted-foreground">{subValue}</p>
      )}
      {email && (
        <a
          className="mt-0.5 flex items-center gap-1 text-[10px] text-primary hover:underline"
          href={`mailto:${email}`}
        >
          <Mail className="h-2.5 w-2.5" /> {email}
        </a>
      )}
    </div>
  </div>
);

export function ViewApplicationDialog({
  app,
  open,
  onOpenChange,
}: {
  app: ApplicationRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!app) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Hash className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <DialogTitle className="font-bold text-xl">
                {app.applicationName}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs">
                {app.tla}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-8 py-6 md:grid-cols-2">
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="border-b pb-2 font-bold text-primary text-xs uppercase tracking-widest">
                Core Info
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <LabelValue label="Asset ID" value={String(app.assetId)} />
                <LabelValue label="Status" value={app.lifeCycleStatus} />
                <LabelValue label="Tier" value={app.tier} />
                <LabelValue label="Service Tier" value={app.serviceTier} />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="border-b pb-2 font-bold text-primary text-xs uppercase tracking-widest">
                Technical Ownership
              </h4>
              <div className="space-y-3">
                <LabelValue
                  email={app.applicationOwnerEmail}
                  label="Application Owner"
                  subValue={app.applicationOwnerBand}
                  value={app.applicationOwnerName}
                />
                <LabelValue
                  email={app.applicationManagerEmail}
                  label="Application Manager"
                  subValue={app.applicationManagerBand}
                  value={app.applicationManagerName}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="border-b pb-2 font-bold text-primary text-xs uppercase tracking-widest">
                Leadership
              </h4>
              <div className="space-y-3">
                <LabelValue
                  email={app.directorEmail}
                  label="Director"
                  value={app.directorName}
                />
                <LabelValue email={app.vpEmail} label="VP" value={app.vpName} />
                <LabelValue
                  email={app.ownerSvpEmail}
                  label="SVP"
                  subValue={app.ownerSvpBand}
                  value={app.ownerSvpName}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dialog ───

export function EditApplicationDialog({
  app,
  open,
  onOpenChange,
  onSuccess,
}: {
  app: ApplicationRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { register, handleSubmit } = useForm<
    z.infer<typeof UpdateApplicationSchema>
  >({
    resolver: zodResolver(UpdateApplicationSchema),
    defaultValues: {
      id: app?.id,
      applicationName: app?.applicationName,
      tla: app?.tla,
      assetId: app?.assetId,
      lifeCycleStatus: app?.lifeCycleStatus || "",
      tier: app?.tier || "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof UpdateApplicationSchema>) =>
      updateApplication({ data: values }),
    onSuccess: () => {
      toast.success("Application updated successfully");
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to update application");
    },
  });

  const onSubmit = (values: z.infer<typeof UpdateApplicationSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
          <DialogDescription>
            Update the core identification for this application.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4 py-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="applicationName">Application Name</Label>
            <Input
              id="applicationName"
              {...register("applicationName", { required: true })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tla">TLA</Label>
              <Input
                id="tla"
                {...register("tla", { required: true })}
                className="uppercase"
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assetId">Asset ID</Label>
              <Input
                id="assetId"
                {...register("assetId", { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lifeCycleStatus">Lifecycle Status</Label>
              <Input
                id="lifeCycleStatus"
                {...register("lifeCycleStatus")}
                placeholder="e.g. Production"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier">Tier</Label>
              <Input id="tier" {...register("tier")} placeholder="e.g. 1" />
            </div>
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
              Update Application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Dialog ───

export function DeleteConfirmationDialog({
  app,
  open,
  onOpenChange,
  onSuccess,
}: {
  app: ApplicationRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const mutation = useMutation({
    mutationFn: () =>
      deleteApplication({ data: { id: app.id, teamId: app.teamId } }),
    onSuccess: () => {
      toast.success("Application removed from team");
      onSuccess();
    },
    onError: () => {
      toast.error("Failed to remove application");
    },
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader className="flex flex-col items-center space-y-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-xl">Remove Application?</DialogTitle>
            <DialogDescription>
              This will remove{" "}
              <span className="font-bold text-foreground">
                {app?.applicationName}
              </span>{" "}
              from your team view. No registry data will be deleted.
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            variant="destructive"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Confirm Removal"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
