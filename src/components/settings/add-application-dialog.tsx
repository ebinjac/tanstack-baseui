import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreateApplicationSchema } from '@/lib/zod/application.schema'
import { createApplication, checkTeamTLA } from '@/app/actions/applications'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Boxes,
    BookUser,
    Plus,
    Search,
    Loader2,
    Info,
    ChevronRight,
    ChevronLeft,
    ShieldCheck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { StepTimeline } from '@/components/ui/step-timeline'

interface AddApplicationDialogProps {
    teamId: string
    onSuccess: () => void
}

export function AddApplicationDialog({ teamId, onSuccess }: AddApplicationDialogProps) {
    const [open, setOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [isSearching, setIsSearching] = useState(false)
    const [assetIdSearch, setAssetIdSearch] = useState('')
    const [tlaError, setTlaError] = useState<string | null>(null)
    const [isCheckingTla, setIsCheckingTla] = useState(false)

    // Form Setup
    const form = useForm<z.infer<typeof CreateApplicationSchema>>({
        resolver: zodResolver(CreateApplicationSchema),
        defaultValues: {
            teamId: teamId,
            assetId: 0,
            applicationName: '',
            tla: '',
            snowGroup: '',
            slackChannel: '',
            description: '',
            escalationEmail: '',
            contactEmail: '',
            teamEmail: '',
        }
    })

    const { register, handleSubmit, setValue, formState: { errors }, reset, watch, trigger, getValues } = form
    const tlaValue = watch('tla')

    // Debounced TLA Check
    useEffect(() => {
        if (currentStep !== 2 || !tlaValue || tlaValue.length < 2) {
            setTlaError(null)
            return
        }

        const timer = setTimeout(async () => {
            setIsCheckingTla(true)
            try {
                const { exists } = await checkTeamTLA({ data: { teamId, tla: tlaValue } })
                if (exists) {
                    setTlaError(`TNA "${tlaValue.toUpperCase()}" is already taken by another app in this team.`)
                } else {
                    setTlaError(null)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setIsCheckingTla(false)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [tlaValue, teamId, currentStep])

    const searchAsset = async () => {
        if (!assetIdSearch) return
        setIsSearching(true)
        try {
            const response = await fetch(`http://localhost:8008/api/central?assetId=${assetIdSearch}`)
            if (!response.ok) throw new Error("Failed to fetch asset details")
            const data = await response.json()

            if (data?.data?.application) {
                const app = data.data.application
                setValue('assetId', app.assetId)
                setValue('applicationName', app.name)
                setValue('lifeCycleStatus', app.lifeCycleStatus)
                setValue('tier', (app.tier || app.risk?.bia) ? String(app.tier || app.risk?.bia) : "NOT CORE")

                // Map Ownership
                if (app.ownershipInfo) {
                    const oi = app.ownershipInfo
                    setValue('applicationOwnerName', oi.applicationowner?.fullName)
                    setValue('applicationOwnerEmail', oi.applicationowner?.email)
                    setValue('applicationOwnerBand', oi.applicationowner?.band)
                    setValue('directorName', oi.applicationowner?.fullName)
                    setValue('directorEmail', oi.applicationowner?.email)
                    setValue('vpName', oi.businessOwnerLeader1?.fullName)
                    setValue('vpEmail', oi.businessOwnerLeader1?.email)
                    setValue('applicationManagerName', oi.applicationManager?.fullName)
                    setValue('applicationManagerEmail', oi.applicationManager?.email)
                    setValue('applicationManagerBand', oi.applicationManager?.band)
                    setValue('ownerSvpName', oi.ownerSVP?.fullName)
                    setValue('ownerSvpEmail', oi.ownerSVP?.email)
                    setValue('ownerSvpBand', oi.ownerSVP?.band)
                    setValue('businessOwnerName', oi.businessOwner?.fullName)
                    setValue('businessOwnerEmail', oi.businessOwner?.email)
                    setValue('businessOwnerBand', oi.businessOwner?.band)
                    setValue('productionSupportOwnerName', oi.productionSupportOwner?.fullName)
                    setValue('productionSupportOwnerEmail', oi.productionSupportOwner?.email)
                    setValue('productionSupportOwnerBand', oi.productionSupportOwner?.band)
                    setValue('pmoName', oi.pmo?.fullName)
                    setValue('pmoEmail', oi.pmo?.email)
                    setValue('pmoBand', oi.pmo?.band)
                    setValue('unitCioName', oi.unitCIO?.fullName)
                    setValue('unitCioEmail', oi.unitCIO?.email)
                    setValue('applicationOwnerLeader1Name', oi.applicationOwnerLeader1?.fullName)
                    setValue('applicationOwnerLeader1Email', oi.applicationOwnerLeader1?.email)
                    setValue('applicationOwnerLeader1Band', oi.applicationOwnerLeader1?.band)
                    setValue('businessOwnerLeader1Name', oi.businessOwnerLeader1?.fullName)
                    setValue('businessOwnerLeader1Email', oi.businessOwnerLeader1?.email)
                    setValue('businessOwnerLeader1Band', oi.businessOwnerLeader1?.band)
                }

                setCurrentStep(2)
            } else {
                toast.error("Application not found for this Asset ID")
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to search for application")
        } finally {
            setIsSearching(false)
        }
    }

    const createMutation = useMutation({
        mutationFn: (values: z.infer<typeof CreateApplicationSchema>) => createApplication({ data: values }),
        onSuccess: () => {
            toast.success("Application created successfully")
            setOpen(false)
            onSuccess()
            reset()
            setCurrentStep(1)
            setAssetIdSearch('')
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to create application")
            console.error(err)
        }
    })

    const onSubmit = (values: z.infer<typeof CreateApplicationSchema>) => {
        if (currentStep < 4) {
            nextStep();
            return;
        }

        if (tlaError) return;

        createMutation.mutate(values);
    }

    const nextStep = async (e?: React.MouseEvent) => {
        if (e) e.preventDefault();
        if (currentStep >= 4) return;

        let isValid = false;
        if (currentStep === 2) {
            isValid = await trigger(['tla', 'applicationName', 'assetId']);
            if (isValid && tlaError) isValid = false;
        } else if (currentStep === 3) {
            isValid = await trigger(['slackChannel', 'contactEmail', 'teamEmail', 'escalationEmail']);
        } else {
            isValid = true;
        }

        if (isValid) {
            setCurrentStep(prev => prev + 1);
        }
    }

    const prevStep = () => setCurrentStep(prev => prev - 1)

    const steps = [
        { id: 1, title: 'Identity', description: 'Asset Registry', icon: Search },
        { id: 2, title: 'Profile', description: 'Core Details', icon: Boxes },
        { id: 3, title: 'Operations', description: 'Contact Info', icon: BookUser },
        { id: 4, title: 'Confirm', description: 'Review & Save', icon: ShieldCheck },
    ]

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) {
                reset()
                setCurrentStep(1)
                setAssetIdSearch('')
            }
        }}>
            <DialogTrigger render={
                <Button className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Application
                </Button>
            } />
            <DialogContent className="sm:max-w-[900px] p-0 gap-0 overflow-hidden flex flex-col md:flex-row h-[600px]">
                {/* Sidebar */}
                <div className="w-full md:w-[280px] bg-muted/30 border-r p-6 flex flex-col gap-8 shrink-0">
                    <div className="space-y-2">
                        <DialogTitle className="text-xl">New Application</DialogTitle>
                        <DialogDescription className="text-xs">Register a new system in the team workspace.</DialogDescription>
                    </div>

                    <StepTimeline steps={steps} currentStep={currentStep} className="flex-1" />

                    <div className="text-[10px] text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/50">
                        <span className="font-bold block mb-1">Note:</span>
                        Ensure the asset exists in the Central Registry before proceeding.
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-background">
                    {/* Header with Progress */}
                    <div className="px-6 pt-6 pb-4 space-y-4 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold tracking-tight">{steps[currentStep - 1].title}</h3>
                                <p className="text-xs text-muted-foreground">{steps[currentStep - 1].description}</p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">Step</span>
                                <span className="text-base font-bold text-primary">{currentStep}</span>
                                <span className="text-[10px] text-muted-foreground/50">/ {steps.length}</span>
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: "0%" }}
                                animate={{ width: `${(currentStep / steps.length) * 100}%` }}
                                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <form id="add-app-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <AnimatePresence mode="wait">
                                {currentStep === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-4">
                                            <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl space-y-3">
                                                <Label className="text-sm font-bold flex items-center gap-2">
                                                    <Search className="h-4 w-4 text-primary" /> Central Asset Registry Search
                                                </Label>
                                                <p className="text-xs text-muted-foreground">Enter the unique Asset ID to begin synchronization.</p>
                                                <div className="flex gap-2 pt-2">
                                                    <Input
                                                        placeholder="Search Asset ID (e.g. 200004789)"
                                                        className="h-10 shadow-sm"
                                                        value={assetIdSearch}
                                                        onChange={(e) => setAssetIdSearch(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchAsset())}
                                                    />
                                                    <Button type="button" onClick={searchAsset} className="px-4" disabled={isSearching || !assetIdSearch}>
                                                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">
                                                Don't have an Asset ID? Register in the <a href="#" className="text-primary hover:underline">Central Registry</a> first.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {currentStep === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-5"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">Asset ID</Label>
                                                <Input {...register('assetId', { valueAsNumber: true })} disabled className="h-8 bg-muted/50 text-xs" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">App Name</Label>
                                                <Input {...register('applicationName')} disabled className="h-8 bg-muted/50 text-xs font-semibold" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold flex items-center justify-between">
                                                    <span>TNA <span className="text-red-500">*</span></span>
                                                    {isCheckingTla && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                                </Label>
                                                <Input
                                                    {...register('tla')}
                                                    placeholder="e.g. TKS"
                                                    className={cn("h-8 uppercase font-bold tracking-widest text-xs", tlaError ? "border-destructive focus-visible:ring-destructive" : "")}
                                                />
                                                {tlaError && <p className="text-[10px] font-bold text-destructive">{tlaError}</p>}
                                                {errors.tla && <p className="text-[10px] text-destructive">{errors.tla.message}</p>}
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">Lifecycle</Label>
                                                <Input {...register('lifeCycleStatus')} disabled className="h-8 bg-muted/50 uppercase text-[10px] font-bold" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {currentStep === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-5"
                                    >
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">ServiceNow Group</Label>
                                                <Input {...register('snowGroup')} placeholder="e.g. SNOW-GROUP-1" className="h-8 text-xs" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">Slack Channel</Label>
                                                <Input {...register('slackChannel')} placeholder="#ops-app-name" className="h-8 text-xs text-blue-600 dark:text-blue-400 font-medium" />
                                            </div>
                                            <div className="space-y-1.5 col-span-2 border-t pt-3">
                                                <Label className="text-xs font-bold">Contact Email</Label>
                                                <Input {...register('contactEmail')} placeholder="eng-leads@team.com" className="h-8 text-xs" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">Team Email</Label>
                                                <Input {...register('teamEmail')} placeholder="app-team@team.com" className="h-8 text-xs" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">Escalation Email</Label>
                                                <Input {...register('escalationEmail')} placeholder="manager-escalations@team.com" className="h-8 text-xs" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {currentStep === 4 && (
                                    <motion.div
                                        key="step4"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-5"
                                    >
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold">Description</Label>
                                            <Textarea {...register('description')} placeholder="Operational context..." className="min-h-[80px] text-xs resize-none" />
                                        </div>

                                        <div className="bg-muted/40 p-4 rounded-lg border space-y-3">
                                            <div className="flex items-center gap-2 pb-2 border-b">
                                                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Leadership Sync</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">App Owner</p>
                                                    <p className="text-xs font-semibold">{getValues('applicationOwnerName') || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Business Owner</p>
                                                    <p className="text-xs font-semibold">{getValues('businessOwnerName') || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">App Manager</p>
                                                    <p className="text-xs font-semibold">{getValues('applicationManagerName') || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">VP / Director</p>
                                                    <p className="text-xs font-semibold">{getValues('vpName') || getValues('directorName') || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t bg-muted/10 flex justify-between items-center mt-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={prevStep}
                            disabled={currentStep === 1 || createMutation.isPending}
                            className={cn("text-muted-foreground", currentStep === 1 && "invisible")}
                        >
                            <ChevronLeft className="mr-1 h-3 w-3" /> Back
                        </Button>

                        <Button
                            onClick={currentStep < 4 ? (e) => nextStep(e) : handleSubmit(onSubmit)}
                            disabled={isCheckingTla || createMutation.isPending || (currentStep === 1 && !getValues('assetId'))}
                            className="bg-primary hover:bg-primary/90 min-w-[100px]"
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                </>
                            ) : currentStep < 4 ? (
                                <>
                                    Continue <ChevronRight className="ml-1 h-3 w-3" />
                                </>
                            ) : (
                                "Create Application"
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
