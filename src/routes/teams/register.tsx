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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, ChevronRight, User, Users, Shield, BookUser, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'

export const Route = createFileRoute('/teams/register')({
  component: TeamRegistrationPage,
})

const STEPS = [
  { id: 1, title: 'Team Details', description: 'Basic information about your team', icon: Users },
  { id: 2, title: 'Access & Groups', description: 'Configure permissions and groups', icon: Shield },
  { id: 3, title: 'Contact Info', description: 'Primary contact for this team', icon: BookUser },
  { id: 4, title: 'Review', description: 'Verify and submit your request', icon: Check },
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
      <div className="min-h-screen p-6 md:p-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl"
        >
          <Card className="text-center p-8 space-y-6 shadow-2xl border-none ring-1 ring-gray-200 dark:ring-gray-800">
            <div className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
              <Check className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Request Submitted</h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Your team registration request has been received.
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                We have sent a confirmation email to <span className="font-semibold text-gray-900 dark:text-white">{getValues('contactEmail')}</span>.
                You will be notified once an administrator reviews and approves your request.
              </p>
            </div>

            <div className="pt-8">
              <Button
                size="lg"
                onClick={() => router.navigate({ to: '/' })}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
              >
                Return to Home
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen 0 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Register New Team</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Create a new team workspace and manage your applications.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sidebar Stepper */}
          <div className="lg:col-span-4 space-y-6">
            <nav aria-label="Progress" className="space-y-1">
              {STEPS.map((step) => {
                const isCurrent = currentStep === step.id
                const isCompleted = currentStep > step.id
                const Icon = step.icon

                return (
                  <div
                    key={step.id}
                    className={`
                                    relative flex items-center p-4 rounded-xl border transition-all duration-200
                                    ${isCurrent
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-500 shadow-sm'
                        : isCompleted
                          ? 'border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-950/10'
                          : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                                `}
                  >
                    <div className={`
                                    flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors
                                    ${isCurrent
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : isCompleted
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 text-gray-500 dark:border-gray-700'
                      }
                                `}>
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="ml-4 min-w-0">
                      <p className={`text-sm font-medium ${isCurrent ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-200'}`}>
                        {step.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{step.description}</p>
                    </div>
                  </div>
                )
              })}
            </nav>
          </div>

          {/* Main Form Area */}
          <div className="lg:col-span-8">
            <Card className="border-none shadow-xl ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  {STEPS[currentStep - 1].title}
                  <span className="text-sm font-normal text-gray-400 ml-auto">Step {currentStep} of {STEPS.length}</span>
                </CardTitle>
                <CardDescription>
                  {STEPS[currentStep - 1].description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 min-h-[400px]">
                <form className="space-y-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >

                      {/* Step 1: Team Details */}
                      {currentStep === 1 && (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="teamName" className="text-base font-semibold">Team Name <span className="text-red-500">*</span></Label>
                            <div className="relative">
                              <Input
                                id="teamName"
                                placeholder="e.g. Engineering Platform"
                                className="h-12 text-lg pr-12"
                                {...form.register('teamName')}
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                                {isCheckingName ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                ) : teamName?.length >= 3 && !errors.teamName ? (
                                  <Check className="h-5 w-5 text-green-500" />
                                ) : null}
                              </div>
                            </div>
                            {errors.teamName && <p className="text-sm text-red-500 font-medium">{errors.teamName.message}</p>}
                            <p className="text-sm text-gray-500">This will be the unique identifier for your team workspace.</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="comments" className="text-base font-semibold">Description / Comments</Label>
                            <Textarea
                              id="comments"
                              placeholder="Briefly describe the purpose of this team..."
                              className="min-h-[120px] resize-none text-base"
                              {...form.register('comments')}
                            />
                            <p className="text-sm text-gray-500">Help approvers understand the purpose of this team.</p>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Access & Groups */}
                      {currentStep === 2 && (
                        <div className="space-y-6">
                          <div className="grid gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="userGroup" className="text-base font-semibold">User Group (read-only) <span className="text-red-500">*</span></Label>
                              <div className="relative">
                                <Users className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                <Input
                                  id="userGroup"
                                  placeholder="e.g. ENSEMBLE-USERS-L"
                                  className="pl-10 h-12"
                                  {...form.register('userGroup')}
                                />
                              </div>
                              {errors.userGroup && <p className="text-sm text-red-500">{errors.userGroup.message}</p>}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="adminGroup" className="text-base font-semibold">Admin Group (full access) <span className="text-red-500">*</span></Label>
                              <div className="relative">
                                <Shield className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                <Input
                                  id="adminGroup"
                                  placeholder="e.g. ENSEMBLE-ADMINS-L"
                                  className="pl-10 h-12"
                                  {...form.register('adminGroup')}
                                />
                              </div>
                              {errors.adminGroup && <p className="text-sm text-red-500">{errors.adminGroup.message}</p>}
                            </div>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                            <p className="flex gap-2">
                              <Shield className="h-5 w-5 flex-shrink-0" />
                              Ensure these Active Directory groups exist before submission. Access is controlled via these groups.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Contact Info */}
                      {currentStep === 3 && (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label htmlFor="contactName" className="text-base font-semibold">Primary Contact Name <span className="text-red-500">*</span></Label>
                            <div className="relative">
                              <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                              <Input
                                id="contactName"
                                placeholder="e.g. Jane Doe"
                                className="pl-10 h-12"
                                {...form.register('contactName')}
                              />
                            </div>
                            {errors.contactName && <p className="text-sm text-red-500">{errors.contactName.message}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="contactEmail" className="text-base font-semibold">Contact Email <span className="text-red-500">*</span></Label>
                            <div className="relative">
                              <BookUser className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                              <Input
                                id="contactEmail"
                                type="email"
                                placeholder="e.g. jane.doe@company.com"
                                className="pl-10 h-12"
                                {...form.register('contactEmail')}
                              />
                            </div>
                            {errors.contactEmail && <p className="text-sm text-red-500">{errors.contactEmail.message}</p>}
                          </div>
                        </div>
                      )}

                      {/* Step 4: Review */}
                      {currentStep === 4 && (
                        <div className="space-y-6">
                          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
                              {[
                                { label: "Team Name", value: getValues('teamName') },
                                { label: "User Group", value: getValues('userGroup') },
                                { label: "Admin Group", value: getValues('adminGroup') },
                                { label: "Contact Name", value: getValues('contactName') },
                                { label: "Contact Email", value: getValues('contactEmail') },
                                { label: "Comments", value: getValues('comments') || "None" },
                              ].map((item, i) => (
                                <div key={i} className="grid grid-cols-3 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</dt>
                                  <dd className="col-span-2 text-sm text-gray-900 dark:text-white font-medium">{item.value}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg text-sm text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900">
                            Please verfiy all details are correct. Once submitted, this request will be sent for approval.
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </form>
              </CardContent>

              <CardFooter className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-6">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 1 || registerMutation.isPending || isCheckingName}
                  className="text-gray-500 hover:text-gray-900"
                >
                  Back
                </Button>

                {currentStep < 4 ? (
                  <Button
                    onClick={handleNext}
                    disabled={isCheckingName}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 min-w-[120px]"
                  >
                    {isCheckingName ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        Continue <ChevronRight className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={onSubmit}
                    disabled={registerMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 min-w-[150px]"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Confirm & Submit'
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
