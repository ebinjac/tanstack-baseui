import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TeamRegistrationSchema } from '@/lib/zod/team-registration.schema'
import { registerTeam, checkTeamNameAvailability } from '@/app/actions/team-registration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Check, ChevronRight, User, Users, Shield, BookUser, Loader2, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { StepTimeline } from '@/components/ui/step-timeline'
import { AnimatePresence, motion } from 'framer-motion'

export const Route = createFileRoute('/teams/register')({
  component: TeamRegistrationPage,
})

const STEPS = [
  { id: 1, title: 'Team Details', description: 'Basic information about your team', icon: Users },
  { id: 2, title: 'Access Control', description: 'Configure permissions and groups', icon: Shield },
  { id: 3, title: 'Contact Information', description: 'Primary contact for this team', icon: BookUser },
  { id: 4, title: 'Review & Submit', description: 'Verify and complete registration', icon: Check },
]

function TeamRegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCheckingName, setIsCheckingName] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof TeamRegistrationSchema>>({
    resolver: zodResolver(TeamRegistrationSchema),
    defaultValues: {
      teamName: '',
      userGroup: '',
      adminGroup: '',
      contactName: '',
      contactEmail: '',
      comments: '',
    },
    mode: 'onChange',
  })

  const { formState: { errors }, trigger, getValues, setError, watch, clearErrors } = form
  const teamName = watch('teamName')

  useEffect(() => {
    const checkName = async () => {
      if (teamName?.length >= 3) {
        setIsCheckingName(true)
        try {
          const result = await checkTeamNameAvailability({ data: { name: teamName } })
          if (!result.available) {
            setError('teamName', { type: 'manual', message: result.reason || 'Team name is already taken' })
          } else {
            clearErrors('teamName')
          }
        } catch (error) {
          console.error('Error checking team name availability:', error)
        } finally {
          setIsCheckingName(false)
        }
      }
    }

    const timer = setTimeout(checkName, 500)
    return () => clearTimeout(timer)
  }, [teamName, setError, clearErrors])

  const [isSuccess, setIsSuccess] = useState(false)

  const registerMutation = useMutation({
    mutationFn: registerTeam,
    onSuccess: () => {
      setIsSuccess(true)
      toast.success('Team registration submitted successfully!', {
        description: 'Your request is now pending approval.',
      })
    },
    onError: (error: Error) => {
      toast.error('Registration failed', {
        description: error.message || 'Please try again later.',
      })
    },
  })

  const handleNext = async () => {
    if (isCheckingName) return

    let valid = false
    if (currentStep === 1) {
      valid = await trigger(['teamName', 'comments'])
    } else if (currentStep === 2) {
      valid = await trigger(['userGroup', 'adminGroup'])
    } else if (currentStep === 3) {
      valid = await trigger(['contactName', 'contactEmail'])
    } else {
      valid = true
    }

    if (valid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const onSubmit = () => {
    registerMutation.mutate({ data: getValues() })
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen p-6 md:p-12 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <Card className="text-center p-10 space-y-6 shadow-xl rounded-2xl border-border/50 bg-card/50 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-success" />
            <div className="mx-auto w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6">
              <Check className="h-10 w-10 text-success" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Registration Submitted</h2>
              <p className="text-muted-foreground text-lg">
                Your request has been sent for review.
              </p>
              <div className="max-w-sm mx-auto p-4 rounded-xl bg-muted/40 border border-border/50 text-sm">
                <p className="leading-relaxed">
                  A confirmation email has been sent to <span className="font-semibold text-primary">{getValues('contactEmail')}</span>.
                  You will be notified once an administrator approves the request.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Button
                size="lg"
                onClick={() => router.navigate({ to: '/' })}
                className="w-full md:w-auto px-8"
              >
                Return to Dashboard
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden selection:bg-primary/20">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-8 md:py-16 max-w-5xl relative z-10">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Sidebar Design */}
          <div className="lg:w-[320px] space-y-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                Team Registration
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Create Workspace
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                Follow the steps to register your team and provision a new digital workspace on the Ensemble platform.
              </p>
            </div>

            <StepTimeline steps={STEPS} currentStep={currentStep} />

            <div className="hidden lg:block pt-4">
              <div className="p-5 rounded-xl bg-muted/30 border border-border/50 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  Security Note
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Access is managed via Active Directory groups. Ensure the groups are active before submitting.
                </p>
              </div>
            </div>
          </div>

          {/* Main Form Area */}
          <div className="flex-1">
            <Card className="rounded-xl border-border/50 shadow-lg bg-card/60 backdrop-blur-xl flex flex-col min-h-[500px]">
              {/* Card Header with Progress Bar */}
              <div className="px-6 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">{STEPS[currentStep - 1].title}</h3>
                    <p className="text-sm text-muted-foreground">{STEPS[currentStep - 1].description}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Step</span>
                    <span className="text-xl font-bold text-primary">{currentStep}</span>
                    <span className="text-xs text-muted-foreground/50">/ {STEPS.length}</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                  />
                </div>
              </div>

              <CardContent className="flex-1 px-6 py-6 mt-2">
                <form className="h-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-6 h-full"
                    >

                      {/* Step 1: Team Identity */}
                      {currentStep === 1 && (
                        <div className="space-y-6">
                          <div className="space-y-1.5">
                            <Label htmlFor="teamName" className="text-sm font-semibold">
                              Team Name <span className="text-primary">*</span>
                            </Label>
                            <div className="relative">
                              <Input
                                id="teamName"
                                placeholder="e.g. Platform Operations"
                                className={`h-10 bg-background/50 transition-all ${errors.teamName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                {...form.register('teamName')}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {isCheckingName ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : teamName?.length >= 3 && !errors.teamName ? (
                                  <Check className="h-4 w-4 text-success" />
                                ) : null}
                              </div>
                            </div>
                            {errors.teamName && (
                              <p className="text-[11px] text-destructive font-medium flex items-center gap-1 mt-1">
                                {errors.teamName.message}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground pl-0.5">
                              This name will identify your team workspace across the platform.
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="comments" className="text-sm font-semibold">
                              Description & Notes
                            </Label>
                            <Textarea
                              id="comments"
                              placeholder="Describe the team's primary function and scope..."
                              className="min-h-[120px] bg-background/50 resize-none text-sm"
                              {...form.register('comments')}
                            />
                            <p className="text-[11px] text-muted-foreground">
                              Provide context to help administrators process your request efficiently.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Access & Groups */}
                      {currentStep === 2 && (
                        <div className="space-y-6">
                          <div className="grid gap-6">
                            <div className="space-y-1.5">
                              <Label htmlFor="userGroup" className="text-sm font-semibold">
                                User Active Directory Group <span className="text-primary">*</span>
                              </Label>
                              <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="userGroup"
                                  placeholder="e.g. ENSEMBLE-PE-USERS"
                                  className="pl-10 h-10 bg-background/50"
                                  {...form.register('userGroup')}
                                />
                              </div>
                              {errors.userGroup && <p className="text-[11px] text-destructive font-medium mt-1">{errors.userGroup.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="adminGroup" className="text-sm font-semibold">
                                Admin Active Directory Group <span className="text-primary">*</span>
                              </Label>
                              <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="adminGroup"
                                  placeholder="e.g. ENSEMBLE-PE-ADMINS"
                                  className="pl-10 h-10 bg-background/50"
                                  {...form.register('adminGroup')}
                                />
                              </div>
                              {errors.adminGroup && <p className="text-[11px] text-destructive font-medium mt-1">{errors.adminGroup.message}</p>}
                            </div>
                          </div>

                          <div className="bg-muted/40 p-4 rounded-lg border border-border/50 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <Activity className="w-3.5 h-3.5 text-primary" />
                              Group Verification
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Access permissions are derived from these groups. Ensure the group names are exact and currently active in the corporate directory.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Contact Info */}
                      {currentStep === 3 && (
                        <div className="space-y-6">
                          <div className="grid gap-6">
                            <div className="space-y-1.5">
                              <Label htmlFor="contactName" className="text-sm font-semibold">
                                Primary Point of Contact <span className="text-primary">*</span>
                              </Label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="contactName"
                                  placeholder="Full Name"
                                  className="pl-10 h-10 bg-background/50"
                                  {...form.register('contactName')}
                                />
                              </div>
                              {errors.contactName && <p className="text-[11px] text-destructive font-medium mt-1">{errors.contactName.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="contactEmail" className="text-sm font-semibold">
                                Contact Email Address <span className="text-primary">*</span>
                              </Label>
                              <div className="relative">
                                <BookUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  id="contactEmail"
                                  type="email"
                                  placeholder="email@company.com"
                                  className="pl-10 h-10 bg-background/50"
                                  {...form.register('contactEmail')}
                                />
                              </div>
                              {errors.contactEmail && <p className="text-[11px] text-destructive font-medium mt-1">{errors.contactEmail.message}</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 4: Review */}
                      {currentStep === 4 && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { label: "Team Name", value: getValues('teamName'), icon: Users },
                              { label: "User Access", value: getValues('userGroup'), icon: Users },
                              { label: "Admin Access", value: getValues('adminGroup'), icon: Shield },
                              { label: "Contact Name", value: getValues('contactName'), icon: User },
                              { label: "Contact Email", value: getValues('contactEmail'), icon: BookUser },
                              { label: "Additional Notes", value: getValues('comments') || "No additional notes provided", icon: Activity, full: true },
                            ].map((item, i) => (
                              <div
                                key={i}
                                className={`p-4 rounded-xl bg-muted/30 border border-border/50 space-y-1 transition-colors ${item.full ? 'md:col-span-2' : ''}`}
                              >
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  <item.icon className="w-3 h-3" />
                                  {item.label}
                                </div>
                                <div className="text-sm font-medium text-foreground truncate">
                                  {item.value}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="bg-warning/10 p-4 rounded-lg border border-warning/20 text-warning-foreground">
                            <div className="flex items-center gap-2 mb-1.5 text-xs font-bold">
                              <Shield className="w-3.5 h-3.5" />
                              Final Validation
                            </div>
                            <p className="text-[11px] leading-relaxed">
                              Please review the information above. By clicking submit, you confirm the details are correct and authorized.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </form>
              </CardContent>

              <CardFooter className="px-6 py-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-border/40 mt-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={currentStep === 1 || registerMutation.isPending || isCheckingName}
                  className="text-muted-foreground hover:text-foreground font-medium"
                >
                  Previous Step
                </Button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {currentStep < 4 ? (
                    <Button
                      onClick={handleNext}
                      disabled={isCheckingName}
                      className="w-full sm:w-auto"
                    >
                      {isCheckingName ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Continue <ChevronRight className="ml-1.5 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={onSubmit}
                      disabled={registerMutation.isPending}
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Submit Registration'
                      )}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}