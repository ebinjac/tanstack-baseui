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
import { Mail, Loader2, AlertTriangle, Hash } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UpdateApplicationSchema } from '@/lib/zod/application.schema'
import { updateApplication, deleteApplication } from '@/app/actions/applications'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

// ─── View Dialog ───

export function ViewApplicationDialog({ app, open, onOpenChange }: { app: any, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!app) return null

    const LabelValue = ({ label, value, subValue, email }: { label: string, value: string | null | undefined, subValue?: string | null, email?: string | null }) => (
        <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
            <div className="flex flex-col">
                <p className="text-sm font-semibold">{value || 'N/A'}</p>
                {subValue && <p className="text-[10px] text-muted-foreground">{subValue}</p>}
                {email && (
                    <a href={`mailto:${email}`} className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-0.5">
                        <Mail className="h-2.5 w-2.5" /> {email}
                    </a>
                )}
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Hash className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                            <DialogTitle className="text-xl font-bold">{app.applicationName}</DialogTitle>
                            <DialogDescription className="font-mono text-xs">{app.tla}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase text-primary tracking-widest border-b pb-2">Core Info</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <LabelValue label="Asset ID" value={String(app.assetId)} />
                                <LabelValue label="Status" value={app.lifeCycleStatus} />
                                <LabelValue label="Tier" value={app.tier} />
                                <LabelValue label="Service Tier" value={app.serviceTier} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase text-primary tracking-widest border-b pb-2">Technical Ownership</h4>
                            <div className="space-y-3">
                                <LabelValue label="Application Owner" value={app.applicationOwnerName} subValue={app.applicationOwnerBand} email={app.applicationOwnerEmail} />
                                <LabelValue label="Application Manager" value={app.applicationManagerName} subValue={app.applicationManagerBand} email={app.applicationManagerEmail} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase text-primary tracking-widest border-b pb-2">Leadership</h4>
                            <div className="space-y-3">
                                <LabelValue label="Director" value={app.directorName} email={app.directorEmail} />
                                <LabelValue label="VP" value={app.vpName} email={app.vpEmail} />
                                <LabelValue label="SVP" value={app.ownerSvpName} subValue={app.ownerSvpBand} email={app.ownerSvpEmail} />
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Edit Dialog ───

export function EditApplicationDialog({ app, open, onOpenChange, onSuccess }: { app: any, open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const { register, handleSubmit, formState: { } } = useForm<z.infer<typeof UpdateApplicationSchema>>({
        resolver: zodResolver(UpdateApplicationSchema),
        defaultValues: {
            id: app?.id,
            applicationName: app?.applicationName,
            tla: app?.tla,
            assetId: app?.assetId,
            lifeCycleStatus: app?.lifeCycleStatus || '',
            tier: app?.tier || '',
        }
    })

    const mutation = useMutation({
        mutationFn: (values: z.infer<typeof UpdateApplicationSchema>) => updateApplication({ data: values }),
        onSuccess: () => {
            toast.success('Application updated successfully')
            onSuccess()
        },
        onError: () => {
            toast.error('Failed to update application')
        }
    })

    const onSubmit = (values: z.infer<typeof UpdateApplicationSchema>) => {
        mutation.mutate(values)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Application</DialogTitle>
                    <DialogDescription>Update the core identification for this application.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="applicationName">Application Name</Label>
                        <Input id="applicationName" {...register('applicationName', { required: true })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tla">TLA</Label>
                            <Input id="tla" {...register('tla', { required: true })} maxLength={3} className="uppercase" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assetId">Asset ID</Label>
                            <Input id="assetId" {...register('assetId', { valueAsNumber: true })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="lifeCycleStatus">Lifecycle Status</Label>
                            <Input id="lifeCycleStatus" {...register('lifeCycleStatus')} placeholder="e.g. Production" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tier">Tier</Label>
                            <Input id="tier" {...register('tier')} placeholder="e.g. 1" />
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Application
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Delete Dialog ───

export function DeleteConfirmationDialog({ app, open, onOpenChange, onSuccess }: { app: any, open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const mutation = useMutation({
        mutationFn: () => deleteApplication({ data: { id: app.id, teamId: app.teamId } }),
        onSuccess: () => {
            toast.success('Application removed from team')
            onSuccess()
        },
        onError: () => {
            toast.error('Failed to remove application')
        }
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader className="flex flex-col items-center text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="space-y-1">
                        <DialogTitle className="text-xl">Remove Application?</DialogTitle>
                        <DialogDescription>
                            This will remove <span className="font-bold text-foreground">{app?.applicationName}</span> from your team view.
                            No registry data will be deleted.
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <DialogFooter className="grid grid-cols-2 gap-2 mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Removal"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
