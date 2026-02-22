import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BookUser,
  Check,
  ChevronRight,
  Loader2,
  Shield,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import {
  checkTeamNameAvailability,
  registerTeam,
} from "@/app/actions/team-registration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepTimeline } from "@/components/ui/step-timeline";
import { Textarea } from "@/components/ui/textarea";
import { TeamRegistrationSchema } from "@/lib/zod/team-registration.schema";

type TeamRegistrationInput = z.infer<typeof TeamRegistrationSchema>;

export const Route = createFileRoute("/teams/register")({
  component: TeamRegistrationPage,
});

const STEPS = [
  {
    id: 1,
    title: "Team Details",
    description: "Basic information about your team",
    icon: Users,
  },
  {
    id: 2,
    title: "Access Control",
    description: "Configure permissions and groups",
    icon: Shield,
  },
  {
    id: 3,
    title: "Contact Information",
    description: "Primary contact for this team",
    icon: BookUser,
  },
  {
    id: 4,
    title: "Review & Submit",
    description: "Verify and complete registration",
    icon: Check,
  },
];

function TeamRegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const router = useRouter();

  const form = useForm<TeamRegistrationInput>({
    resolver: zodResolver(TeamRegistrationSchema),
    defaultValues: {
      teamName: "",
      userGroup: "",
      adminGroup: "",
      contactName: "",
      contactEmail: "",
      comments: "",
    },
    mode: "onChange",
  });

  const {
    formState: { errors },
    trigger,
    getValues,
    setError,
    watch,
    clearErrors,
  } = form;
  const teamName = watch("teamName");

  useEffect(() => {
    const checkName = async () => {
      if (teamName?.length >= 3) {
        setIsCheckingName(true);
        try {
          const result = await checkTeamNameAvailability({
            data: { name: teamName },
          });
          if (result.available) {
            clearErrors("teamName");
          } else {
            setError("teamName", {
              type: "manual",
              message: result.reason || "Team name is already taken",
            });
          }
        } catch (error) {
          console.error("Error checking team name availability:", error);
        } finally {
          setIsCheckingName(false);
        }
      }
    };

    const timer = setTimeout(checkName, 500);
    return () => clearTimeout(timer);
  }, [teamName, setError, clearErrors]);

  const [isSuccess, setIsSuccess] = useState(false);

  const registerMutation = useMutation({
    mutationFn: (data: TeamRegistrationInput) => registerTeam({ data }),
    onSuccess: () => {
      setIsSuccess(true);
      toast.success("Team registration submitted successfully!", {
        description: "Your request is now pending approval.",
      });
    },
    onError: (error: Error) => {
      toast.error("Registration failed", {
        description: error.message || "Please try again later.",
      });
    },
  });

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: multi-step validation logic
  const handleNext = useCallback(async () => {
    if (isCheckingName) {
      return;
    }

    let valid = false;
    if (currentStep === 1) {
      valid = await trigger(["teamName", "comments"]);
      if (valid) {
        setIsCheckingName(true);
        try {
          const result = await checkTeamNameAvailability({
            data: { name: getValues("teamName") },
          });
          if (!result.available) {
            setError("teamName", {
              type: "manual",
              message: result.reason || "Team name is already taken",
            });
            valid = false;
          }
        } catch (error) {
          console.error("Error checking team name availability:", error);
          valid = false;
        } finally {
          setIsCheckingName(false);
        }
      }
    } else if (currentStep === 2) {
      valid = await trigger(["userGroup", "adminGroup"]);
    } else if (currentStep === 3) {
      valid = await trigger(["contactName", "contactEmail"]);
    } else {
      valid = true;
    }

    if (valid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  }, [currentStep, isCheckingName, trigger, getValues, setError]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const onSubmit = useCallback(() => {
    registerMutation.mutate(getValues());
  }, [registerMutation, getValues]);

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background p-6 md:p-12">
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg"
          initial={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative space-y-6 overflow-hidden p-10 text-center">
            <div className="absolute inset-x-0 top-0 h-1 bg-success" />
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <Check className="h-10 w-10 text-success" />
            </div>
            <div className="space-y-3">
              <h2 className="font-bold text-3xl text-foreground tracking-tight">
                Registration Submitted
              </h2>
              <p className="text-lg text-muted-foreground">
                Your request has been sent for review.
              </p>
              <div className="mx-auto max-w-sm rounded-xl border border-border/50 bg-muted/40 p-4 text-sm">
                <p className="leading-relaxed">
                  A confirmation email has been sent to{" "}
                  <span className="font-semibold text-primary">
                    {getValues("contactEmail")}
                  </span>
                  . You will be notified once an administrator approves the
                  request.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Button
                className="w-full px-8 md:w-auto"
                onClick={() => router.navigate({ to: "/" })}
                size="lg"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary/20">
      {/* Subtle Page Background */}
      <div className="absolute inset-0 z-0 bg-muted/20" />
      <div className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/2 translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />

      <div className="container relative z-10 mx-auto flex max-w-6xl flex-1 flex-col px-4 py-8 md:py-16">
        <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Sidebar Design - Premium Section */}
          <div className="relative flex flex-col space-y-10 overflow-hidden rounded-3xl bg-primary p-8 shadow-2xl lg:w-[380px]">
            {/* Background for Sidebar */}
            <div className="absolute inset-0 z-0">
              {/* Pattern Overlay */}
              <div className="absolute inset-0 bg-[url('/patterns/amex-3.avif')] bg-center bg-cover opacity-20 mix-blend-overlay" />
              {/* Subtle Gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-black/20 mix-blend-multiply" />
            </div>

            <div className="relative z-10 flex h-full flex-col space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 font-bold text-[10px] text-white uppercase tracking-wider shadow-sm">
                  Team Registration
                </div>
                <h1 className="font-black text-4xl text-white tracking-tight drop-shadow-md">
                  Create <br />
                  Workspace
                </h1>
                <p className="font-light text-sm text-white/80 leading-relaxed">
                  Follow the steps to register your team and provision a new
                  digital workspace on the Ensemble platform.
                </p>
              </div>

              {/* Timeline adapted for dark sidebar */}
              <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-6">
                <StepTimeline
                  className="text-white"
                  currentStep={currentStep}
                  steps={STEPS}
                />
              </div>

              <div className="mt-auto pt-4">
                <div className="space-y-3 rounded-xl border border-white/20 bg-white/10 p-4 shadow-lg">
                  <div className="flex items-center gap-2 font-bold text-white text-xs">
                    <Shield className="h-3.5 w-3.5" />
                    Security Note
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Access is managed via Active Directory groups. Ensure the
                    groups are active before submitting.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form Area - Seamless Layout */}
          <div className="flex-1 py-4 pl-4 lg:pl-12">
            <div className="flex h-full min-h-[600px] flex-col">
              {/* Card Header with Progress Bar */}
              <div className="space-y-6 pt-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="mb-2 font-bold text-3xl text-foreground tracking-tight">
                      {STEPS[currentStep - 1].title}
                    </h3>
                    <p className="font-medium text-base text-muted-foreground">
                      {STEPS[currentStep - 1].description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-1.5 text-right">
                    <span className="font-bold text-muted-foreground text-xs uppercase opacity-70">
                      Step
                    </span>
                    <span className="font-black text-lg text-primary">
                      {currentStep}
                    </span>
                    <span className="text-muted-foreground/50 text-xs">
                      / {STEPS.length}
                    </span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    animate={{
                      width: `${(currentStep / STEPS.length) * 100}%`,
                    }}
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                  />
                </div>
              </div>

              <div className="flex-1 px-0 py-8">
                <form className="h-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      animate={{ opacity: 1, x: 0 }}
                      className="h-full space-y-6"
                      exit={{ opacity: 0, x: -10 }}
                      initial={{ opacity: 0, x: 10 }}
                      key={currentStep}
                      transition={{ duration: 0.3, ease: "circOut" }}
                    >
                      {/* Step 1: Team Identity */}
                      {currentStep === 1 && (
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <Label
                              className="font-semibold text-base"
                              htmlFor="teamName"
                            >
                              Team Name <span className="text-primary">*</span>
                            </Label>
                            <div className="group relative">
                              <Input
                                className={`h-12 border-input/60 bg-background px-4 text-base shadow-sm transition-all focus:border-primary group-hover:border-primary/50 ${errors.teamName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                id="teamName"
                                placeholder="e.g. Platform Operations"
                                {...form.register("teamName")}
                              />
                              <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                {isCheckingName ? (
                                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                ) : (
                                  teamName?.length >= 3 &&
                                  !errors.teamName && (
                                    <Check className="h-5 w-5 text-success" />
                                  )
                                )}
                              </div>
                            </div>
                            {errors.teamName && (
                              <p className="flex items-center gap-1 font-medium text-destructive text-xs">
                                {errors.teamName.message}
                              </p>
                            )}
                            <p className="pl-0.5 text-muted-foreground text-xs">
                              This name will identify your team workspace across
                              the platform.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label
                              className="font-semibold text-base"
                              htmlFor="comments"
                            >
                              Description & Notes
                            </Label>
                            <Textarea
                              className="min-h-[160px] resize-none border-input/60 bg-background p-4 text-sm shadow-sm focus:border-primary"
                              id="comments"
                              placeholder="Describe the team's primary function and scope..."
                              {...form.register("comments")}
                            />
                            <p className="text-muted-foreground text-xs">
                              Provide context to help administrators process
                              your request efficiently.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Step 2: Access & Groups */}
                      {currentStep === 2 && (
                        <div className="space-y-8">
                          <div className="grid gap-8">
                            <div className="space-y-2">
                              <Label
                                className="font-semibold text-base"
                                htmlFor="userGroup"
                              >
                                User Active Directory Group{" "}
                                <span className="text-primary">*</span>
                              </Label>
                              <div className="group relative">
                                <div className="absolute top-1/2 left-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
                                  <Users className="h-4 w-4" />
                                </div>
                                <Input
                                  className="h-12 border-input/60 bg-background pl-14 text-base shadow-sm focus:border-primary group-hover:border-primary/50"
                                  id="userGroup"
                                  placeholder="e.g. ENSEMBLE-PE-USERS"
                                  {...form.register("userGroup")}
                                />
                              </div>
                              {errors.userGroup && (
                                <p className="font-medium text-destructive text-xs">
                                  {errors.userGroup.message}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label
                                className="font-semibold text-base"
                                htmlFor="adminGroup"
                              >
                                Admin Active Directory Group{" "}
                                <span className="text-primary">*</span>
                              </Label>
                              <div className="group relative">
                                <div className="absolute top-1/2 left-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
                                  <Shield className="h-4 w-4" />
                                </div>
                                <Input
                                  className="h-12 border-input/60 bg-background pl-14 text-base shadow-sm focus:border-primary group-hover:border-primary/50"
                                  id="adminGroup"
                                  placeholder="e.g. ENSEMBLE-PE-ADMINS"
                                  {...form.register("adminGroup")}
                                />
                              </div>
                              {errors.adminGroup && (
                                <p className="font-medium text-destructive text-xs">
                                  {errors.adminGroup.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 rounded-xl border border-primary/10 bg-primary/5 p-5">
                            <div className="flex items-center gap-2 font-bold text-foreground text-sm">
                              <Activity className="h-4 w-4 text-primary" />
                              Group Verification
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              Access permissions are derived from these groups.
                              Ensure the group names are exact and currently
                              active in the corporate directory.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Step 3: Contact Info */}
                      {currentStep === 3 && (
                        <div className="space-y-8">
                          <div className="grid gap-8">
                            <div className="space-y-2">
                              <Label
                                className="font-semibold text-base"
                                htmlFor="contactName"
                              >
                                Primary Point of Contact{" "}
                                <span className="text-primary">*</span>
                              </Label>
                              <div className="group relative">
                                <div className="absolute top-1/2 left-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
                                  <User className="h-4 w-4" />
                                </div>
                                <Input
                                  className="h-12 border-input/60 bg-background pl-14 text-base shadow-sm focus:border-primary group-hover:border-primary/50"
                                  id="contactName"
                                  placeholder="Full Name"
                                  {...form.register("contactName")}
                                />
                              </div>
                              {errors.contactName && (
                                <p className="font-medium text-destructive text-xs">
                                  {errors.contactName.message}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label
                                className="font-semibold text-base"
                                htmlFor="contactEmail"
                              >
                                Contact Email Address{" "}
                                <span className="text-primary">*</span>
                              </Label>
                              <div className="group relative">
                                <div className="absolute top-1/2 left-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
                                  <BookUser className="h-4 w-4" />
                                </div>
                                <Input
                                  className="h-12 border-input/60 bg-background pl-14 text-base shadow-sm focus:border-primary group-hover:border-primary/50"
                                  id="contactEmail"
                                  placeholder="email@company.com"
                                  type="email"
                                  {...form.register("contactEmail")}
                                />
                              </div>
                              {errors.contactEmail && (
                                <p className="font-medium text-destructive text-xs">
                                  {errors.contactEmail.message}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 4: Review */}
                      {currentStep === 4 && (
                        <div className="space-y-8">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[
                              {
                                label: "Team Name",
                                value: getValues("teamName"),
                                icon: Users,
                              },
                              {
                                label: "User Access",
                                value: getValues("userGroup"),
                                icon: Users,
                              },
                              {
                                label: "Admin Access",
                                value: getValues("adminGroup"),
                                icon: Shield,
                              },
                              {
                                label: "Contact Name",
                                value: getValues("contactName"),
                                icon: User,
                              },
                              {
                                label: "Contact Email",
                                value: getValues("contactEmail"),
                                icon: BookUser,
                              },
                              {
                                label: "Additional Notes",
                                value:
                                  getValues("comments") ||
                                  "No additional notes provided",
                                icon: Activity,
                                full: true,
                              },
                            ].map((item) => (
                              <div
                                className={`space-y-1.5 rounded-xl border border-border/50 bg-muted/30 p-5 transition-colors hover:bg-muted/50 ${item.full ? "md:col-span-2" : ""}`}
                                key={item.label}
                              >
                                <div className="flex items-center gap-2 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                                  <item.icon className="h-3.5 w-3.5 text-primary" />
                                  {item.label}
                                </div>
                                <div className="truncate font-semibold text-foreground text-sm">
                                  {item.value}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-xl border border-primary/10 bg-primary/5 p-5">
                            <div className="mb-2 flex items-center gap-2 font-bold text-foreground text-sm">
                              <Shield className="h-4 w-4 text-primary" />
                              Final Validation
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              Please review the information above. By clicking
                              submit, you confirm the details are correct and
                              authorized.
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </form>
              </div>
              <div className="mt-auto flex flex-col-reverse items-center justify-between gap-4 py-8 sm:flex-row">
                <Button
                  className="font-medium text-muted-foreground hover:text-foreground"
                  disabled={
                    currentStep === 1 ||
                    registerMutation.isPending ||
                    isCheckingName
                  }
                  onClick={handleBack}
                  size="lg"
                  variant="ghost"
                >
                  Previous Step
                </Button>

                <div className="flex w-full items-center gap-3 sm:w-auto">
                  {currentStep < 4 ? (
                    <Button
                      className="w-full font-bold shadow-lg shadow-primary/20 sm:w-auto"
                      disabled={isCheckingName}
                      onClick={handleNext}
                      size="lg"
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
                      className="w-full bg-primary font-bold shadow-primary/25 shadow-xl hover:bg-primary/90 sm:w-auto"
                      disabled={registerMutation.isPending}
                      onClick={onSubmit}
                      size="lg"
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Submit Registration"
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
  );
}
