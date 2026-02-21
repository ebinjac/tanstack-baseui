import { createFileRoute, useRouter  } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Activity, BookUser, Check, ChevronRight, Loader2, Shield, User, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import type { z } from 'zod'
import { TeamRegistrationSchema } from '@/lib/zod/team-registration.schema'
import { checkTeamNameAvailability, registerTeam } from '@/app/actions/team-registration'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StepTimeline } from '@/components/ui/step-timeline'

type TeamRegistrationInput = z.infer<typeof TeamRegistrationSchema>

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

  const form = useForm<TeamRegistrationInput>({
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
    mutationFn: (data: TeamRegistrationInput) => registerTeam({ data }),
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

  const handleNext = useCallback(async () => {
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
  }, [currentStep, isCheckingName, trigger])

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }, [])

  const onSubmit = useCallback(() => {
    registerMutation.mutate(getValues())
  }, [registerMutation, getValues])

  if (isSuccess) {
    return (
      <div className="min-h-screen p-6 md:p-12 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <div className="text-center p-10 space-y-6 relative overflow-hidden">
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
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden selection:bg-primary/20">
      {/* Subtle Page Background */}
      <div className="absolute inset-0 z-0 bg-muted/20" />
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-8 md:py-16 max-w-6xl relative z-10 flex-1 flex flex-col">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 flex-1">

          {/* Sidebar Design - Premium Section */}
          <div className="lg:w-[380px] rounded-3xl relative overflow-hidden flex flex-col p-8 space-y-10 shadow-2xl bg-primary">
            {/* Background for Sidebar */}
            <div className="absolute inset-0 z-0">
              {/* Pattern Overlay */}
              <div
                className="absolute inset-0 bg-[url('/patterns/amex-1.png')] bg-cover bg-center opacity-20 mix-blend-overlay"
              />
              {/* Subtle Gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/20 mix-blend-multiply" />
            </div>

            <div className="relative z-10 space-y-8 h-full flex flex-col">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  Team Registration
                </div>
                <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-md">
                  Create <br />Workspace
                </h1>
                <p className="text-white/80 text-sm leading-relaxed font-light">
                  Follow the steps to register your team and provision a new digital workspace on the Ensemble platform.
                </p>
              </div>

              {/* Timeline adapted for dark sidebar */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 flex-1">
                <StepTimeline steps={STEPS} currentStep={currentStep} className="text-white" />
              </div>

              <div className="pt-4 mt-auto">
                <div className="p-4 rounded-xl bg-white/10 border border-white/20 space-y-3 shadow-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Shield className="w-3.5 h-3.5" />
                    Security Note
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Access is managed via Active Directory groups. Ensure the groups are active before submitting.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form Area - Seamless Layout */}
          <div className="flex-1 py-4 pl-4 lg:pl-12">
            <div className="flex flex-col min-h-[600px] h-full">
              {/* Card Header with Progress Bar */}
              <div className="pt-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold tracking-tight text-foreground mb-2">{STEPS[currentStep - 1].title}</h3>
                    <p className="text-base font-medium text-muted-foreground">{STEPS[currentStep - 1].description}</p>
                  </div>
                  <div className="text-right flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                    <span className="text-xs font-bold text-muted-foreground uppercase opacity-70">Step</span>
                    <span className="text-lg font-black text-primary">{currentStep}</span>
                    <span className="text-xs text-muted-foreground/50">/ {STEPS.length}</span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                  />
                </div>
              </div>

              <div className="flex-1 px-0 py-8">
                <form className="h-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.3, ease: "circOut" }}
                      className="space-y-6 h-full"
                    >

                      {/* Step 1: Team Identity */}
                      {currentStep === 1 && (
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <Label htmlFor="teamName" className="text-base font-semibold">
                              Team Name <span className="text-primary">*</span>
                            </Label>
                            <div className="relative group">
                              <Input
                                id="teamName"
                                placeholder="e.g. Platform Operations"
                                className={`h-12 text-base px-4 bg-background transition-all border-input/60 shadow-sm group-hover:border-primary/50 focus:border-primary ${errors.teamName ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                {...form.register('teamName')}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {isCheckingName ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                ) : teamName?.length >= 3 && !errors.teamName ? (
                                  <Check className="h-5 w-5 text-success" />
                                ) : null}
                              </div>
                            </div>
                            {errors.teamName && (
                              <p className="text-xs text-destructive font-medium flex items-center gap-1">
                                {errors.teamName.message}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground pl-0.5">
                              This name will identify your team workspace across the platform.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="comments" className="text-base font-semibold">
                              Description & Notes
                            </Label>
                            <Textarea
                              id="comments"
                              placeholder="Describe the team's primary function and scope..."
                              className="min-h-[160px] text-sm p-4 bg-background resize-none border-input/60 shadow-sm focus:border-primary"
                              {...form.register('comments')}
                            />
                            <p className="text-xs text-muted-foreground">
                              Provide context to help administrators process your request efficiently.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Access & Groups */}
                      {currentStep === 2 && (
                        <div className="space-y-8">
                          <div className="grid gap-8">
                            <div className="space-y-2">
                              <Label htmlFor="userGroup" className="text-base font-semibold">
                                User Active Directory Group <span className="text-primary">*</span>
                              </Label>
                              <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
                                  <Users className="w-4 h-4" />
                                </div>
                                <Input
                                  id="userGroup"
                                  placeholder="e.g. ENSEMBLE-PE-USERS"
                                  className="pl-14 h-12 text-base bg-background border-input/60 shadow-sm group-hover:border-primary/50 focus:border-primary"
                                  {...form.register('userGroup')}
                                />
                              </div>
                              {errors.userGroup && <p className="text-xs text-destructive font-medium">{errors.userGroup.message}</p>}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="adminGroup" className="text-base font-semibold">
                                Admin Active Directory Group <span className="text-primary">*</span>
                              </Label>
                              <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
                                  <Shield className="w-4 h-4" />
                                </div>
                                <Input
                                  id="adminGroup"
                                  placeholder="e.g. ENSEMBLE-PE-ADMINS"
                                  className="pl-14 h-12 text-base bg-background border-input/60 shadow-sm group-hover:border-primary/50 focus:border-primary"
                                  {...form.register('adminGroup')}
                                />
                              </div>
                              {errors.adminGroup && <p className="text-xs text-destructive font-medium">{errors.adminGroup.message}</p>}
                            </div>
                          </div>

                          <div className="bg-primary/5 p-5 rounded-xl border border-primary/10 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                              <Activity className="w-4 h-4 text-primary" />
                              Group Verification
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Access permissions are derived from these groups. Ensure the group names are exact and currently active in the corporate directory.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Contact Info */}
                      {currentStep === 3 && (
                        <div className="space-y-8">
                          <div className="grid gap-8">
                            <div className="space-y-2">
                              <Label htmlFor="contactName" className="text-base font-semibold">
                                Primary Point of Contact <span className="text-primary">*</span>
                              </Label>
                              <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
                                  <User className="w-4 h-4" />
                                </div>
                                <Input
                                  id="contactName"
                                  placeholder="Full Name"
                                  className="pl-14 h-12 text-base bg-background border-input/60 shadow-sm group-hover:border-primary/50 focus:border-primary"
                                  {...form.register('contactName')}
                                />
                              </div>
                              {errors.contactName && <p className="text-xs text-destructive font-medium">{errors.contactName.message}</p>}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="contactEmail" className="text-base font-semibold">
                                Contact Email Address <span className="text-primary">*</span>
                              </Label>
                              <div className="relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
                                  <BookUser className="w-4 h-4" />
                                </div>
                                <Input
                                  id="contactEmail"
                                  type="email"
                                  placeholder="email@company.com"
                                  className="pl-14 h-12 text-base bg-background border-input/60 shadow-sm group-hover:border-primary/50 focus:border-primary"
                                  {...form.register('contactEmail')}
                                />
                              </div>
                              {errors.contactEmail && <p className="text-xs text-destructive font-medium">{errors.contactEmail.message}</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 4: Review */}
                      {currentStep === 4 && (
                        <div className="space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                className={`p-5 rounded-xl bg-muted/30 border border-border/50 space-y-1.5 transition-colors hover:bg-muted/50 ${item.full ? 'md:col-span-2' : ''}`}
                              >
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  <item.icon className="w-3.5 h-3.5 text-primary" />
                                  {item.label}
                                </div>
                                <div className="text-sm font-semibold text-foreground truncate">
                                  {item.value}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="bg-primary/5 p-5 rounded-xl border border-primary/10">
                            <div className="flex items-center gap-2 mb-2 text-sm font-bold text-foreground">
                              <Shield className="w-4 h-4 text-primary" />
                              Final Validation
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Please review the information above. By clicking submit, you confirm the details are correct and authorized.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </form>
              </div>
              <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-auto">
                <Button
                  variant="ghost"
                  size="lg"
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
                      size="lg"
                      className="w-full sm:w-auto font-bold shadow-lg shadow-primary/20"
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
                      size="lg"
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90 font-bold shadow-xl shadow-primary/25"
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}