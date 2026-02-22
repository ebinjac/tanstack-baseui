import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookUser,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { checkTeamTLA, createApplication } from "@/app/actions/applications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepTimeline } from "@/components/ui/step-timeline";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CreateApplicationSchema } from "@/lib/zod/application.schema";

interface AddApplicationDialogProps {
  onSuccess: () => void;
  teamId: string;
}

type SetValueFn = (name: string, value: unknown) => void;

function mapOwnershipFields(
  oi: Record<string, Record<string, string> | undefined>,
  setValue: SetValueFn
) {
  setValue("applicationOwnerName", oi.applicationowner?.fullName);
  setValue("applicationOwnerEmail", oi.applicationowner?.email);
  setValue("applicationOwnerBand", oi.applicationowner?.band);
  setValue("directorName", oi.applicationowner?.fullName);
  setValue("directorEmail", oi.applicationowner?.email);
  setValue("vpName", oi.businessOwnerLeader1?.fullName);
  setValue("vpEmail", oi.businessOwnerLeader1?.email);
  setValue("applicationManagerName", oi.applicationManager?.fullName);
  setValue("applicationManagerEmail", oi.applicationManager?.email);
  setValue("applicationManagerBand", oi.applicationManager?.band);
  setValue("ownerSvpName", oi.ownerSVP?.fullName);
  setValue("ownerSvpEmail", oi.ownerSVP?.email);
  setValue("ownerSvpBand", oi.ownerSVP?.band);
  setValue("businessOwnerName", oi.businessOwner?.fullName);
  setValue("businessOwnerEmail", oi.businessOwner?.email);
  setValue("businessOwnerBand", oi.businessOwner?.band);
  setValue("productionSupportOwnerName", oi.productionSupportOwner?.fullName);
  setValue("productionSupportOwnerEmail", oi.productionSupportOwner?.email);
  setValue("productionSupportOwnerBand", oi.productionSupportOwner?.band);
  setValue("pmoName", oi.pmo?.fullName);
  setValue("pmoEmail", oi.pmo?.email);
  setValue("pmoBand", oi.pmo?.band);
  setValue("unitCioName", oi.unitCIO?.fullName);
  setValue("unitCioEmail", oi.unitCIO?.email);
  setValue("applicationOwnerLeader1Name", oi.applicationOwnerLeader1?.fullName);
  setValue("applicationOwnerLeader1Email", oi.applicationOwnerLeader1?.email);
  setValue("applicationOwnerLeader1Band", oi.applicationOwnerLeader1?.band);
  setValue("businessOwnerLeader1Name", oi.businessOwnerLeader1?.fullName);
  setValue("businessOwnerLeader1Email", oi.businessOwnerLeader1?.email);
  setValue("businessOwnerLeader1Band", oi.businessOwnerLeader1?.band);
}

async function fetchAssetData(assetId: string) {
  const response = await fetch(
    `http://localhost:8008/api/central?assetId=${assetId}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch asset details");
  }
  const data = await response.json();
  return data?.data?.application ?? null;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: multi-step wizard dialog with form validation
export function AddApplicationDialog({
  teamId,
  onSuccess,
}: AddApplicationDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [assetIdSearch, setAssetIdSearch] = useState("");
  const [tlaError, setTlaError] = useState<string | null>(null);
  const [isCheckingTla, setIsCheckingTla] = useState(false);

  // Form Setup
  const form = useForm<z.infer<typeof CreateApplicationSchema>>({
    resolver: zodResolver(CreateApplicationSchema),
    defaultValues: {
      teamId,
      assetId: 0,
      applicationName: "",
      tla: "",
      snowGroup: "",
      slackChannel: "",
      description: "",
      escalationEmail: "",
      contactEmail: "",
      teamEmail: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
    trigger,
    getValues,
  } = form;
  const tlaValue = watch("tla");

  // Debounced TLA Check
  useEffect(() => {
    if (currentStep !== 2 || !tlaValue || tlaValue.length < 2) {
      setTlaError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingTla(true);
      try {
        const { exists } = await checkTeamTLA({
          data: { teamId, tla: tlaValue },
        });
        setTlaError(
          exists
            ? `TNA "${tlaValue.toUpperCase()}" is already taken by another app in this team.`
            : null
        );
      } catch (err) {
        console.error(err);
      } finally {
        setIsCheckingTla(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [tlaValue, teamId, currentStep]);

  const searchAsset = async () => {
    if (!assetIdSearch) {
      return;
    }
    setIsSearching(true);
    try {
      const app = await fetchAssetData(assetIdSearch);

      if (!app) {
        toast.error("Application not found for this Asset ID");
        return;
      }

      setValue("assetId", app.assetId);
      setValue("applicationName", app.name);
      setValue("lifeCycleStatus", app.lifeCycleStatus);
      setValue(
        "tier",
        app.tier || app.risk?.bia
          ? String(app.tier || app.risk?.bia)
          : "NOT CORE"
      );

      if (app.ownershipInfo) {
        mapOwnershipFields(app.ownershipInfo, setValue as SetValueFn);
      }

      setCurrentStep(2);
    } catch (error) {
      console.error(error);
      toast.error("Failed to search for application");
    } finally {
      setIsSearching(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: (values: z.infer<typeof CreateApplicationSchema>) =>
      createApplication({ data: values }),
    onSuccess: () => {
      toast.success("Application created successfully");
      setOpen(false);
      onSuccess();
      reset();
      setCurrentStep(1);
      setAssetIdSearch("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create application");
      console.error(err);
    },
  });

  const onSubmit = (values: z.infer<typeof CreateApplicationSchema>) => {
    if (currentStep < 4) {
      nextStep();
      return;
    }

    if (tlaError) {
      return;
    }

    createMutation.mutate(values);
  };

  const validateStep = async (step: number): Promise<boolean> => {
    if (step === 2) {
      const valid = await trigger(["tla", "applicationName", "assetId"]);
      return valid && !tlaError;
    }
    if (step === 3) {
      return trigger([
        "slackChannel",
        "contactEmail",
        "teamEmail",
        "escalationEmail",
      ]);
    }
    return true;
  };

  const nextStep = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (currentStep >= 4) {
      return;
    }

    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const steps = [
    { id: 1, title: "Identity", description: "Asset Registry", icon: Search },
    { id: 2, title: "Profile", description: "Core Details", icon: Boxes },
    { id: 3, title: "Operations", description: "Contact Info", icon: BookUser },
    {
      id: 4,
      title: "Confirm",
      description: "Review & Save",
      icon: ShieldCheck,
    },
  ];

  return (
    <Dialog
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) {
          reset();
          setCurrentStep(1);
          setAssetIdSearch("");
        }
      }}
      open={open}
    >
      <DialogTrigger
        render={
          <Button className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Add Application
          </Button>
        }
      />
      <DialogContent className="flex h-[600px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[900px] md:flex-row">
        {/* Sidebar */}
        <div className="flex w-full shrink-0 flex-col gap-8 border-r bg-muted/30 p-6 md:w-[280px]">
          <div className="space-y-2">
            <DialogTitle className="text-xl">New Application</DialogTitle>
            <DialogDescription className="text-xs">
              Register a new system in the team workspace.
            </DialogDescription>
          </div>

          <StepTimeline
            className="flex-1"
            currentStep={currentStep}
            steps={steps}
          />

          <div className="rounded-lg border border-border/50 bg-muted/50 p-3 text-[10px] text-muted-foreground">
            <span className="mb-1 block font-bold">Note:</span>
            Ensure the asset exists in the Central Registry before proceeding.
          </div>
        </div>

        {/* Main Content */}
        <div className="flex min-w-0 flex-1 flex-col bg-background">
          {/* Header with Progress */}
          <div className="space-y-4 border-b px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg tracking-tight">
                  {steps[currentStep - 1].title}
                </h3>
                <p className="text-muted-foreground text-xs">
                  {steps[currentStep - 1].description}
                </p>
              </div>
              <div className="flex items-center gap-2 text-right">
                <span className="font-medium text-muted-foreground text-xs">
                  Step
                </span>
                <span className="font-bold text-base text-primary">
                  {currentStep}
                </span>
                <span className="text-[10px] text-muted-foreground/50">
                  / {steps.length}
                </span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                animate={{ width: `${(currentStep / steps.length) * 100}%` }}
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                transition={{ type: "spring", stiffness: 80, damping: 15 }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <form
              className="space-y-6"
              id="add-app-form"
              onSubmit={handleSubmit(onSubmit)}
            >
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                    exit={{ opacity: 0, x: -10 }}
                    initial={{ opacity: 0, x: 10 }}
                    key="step1"
                    transition={{ duration: 0.2 }}
                  >
                    <div className="space-y-4">
                      <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-5">
                        <Label className="flex items-center gap-2 font-bold text-sm">
                          <Search className="h-4 w-4 text-primary" /> Central
                          Asset Registry Search
                        </Label>
                        <p className="text-muted-foreground text-xs">
                          Enter the unique Asset ID to begin synchronization.
                        </p>
                        <div className="flex gap-2 pt-2">
                          <Input
                            className="h-10 shadow-sm"
                            onChange={(e) => setAssetIdSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                searchAsset();
                              }
                            }}
                            placeholder="Search Asset ID (e.g. 200004789)"
                            value={assetIdSearch}
                          />
                          <Button
                            className="px-4"
                            disabled={isSearching || !assetIdSearch}
                            onClick={searchAsset}
                            type="button"
                          >
                            {isSearching ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs">
                        Don't have an Asset ID? Register in the{" "}
                        <a
                          className="text-primary hover:underline"
                          href="https://central-registry.example.com"
                        >
                          Central Registry
                        </a>{" "}
                        first.
                      </p>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                    exit={{ opacity: 0, x: -10 }}
                    initial={{ opacity: 0, x: 10 }}
                    key="step2"
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-bold text-xs">Asset ID</Label>
                        <Input
                          {...register("assetId", { valueAsNumber: true })}
                          className="h-8 bg-muted/50 text-xs"
                          disabled
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-bold text-xs">App Name</Label>
                        <Input
                          {...register("applicationName")}
                          className="h-8 bg-muted/50 font-semibold text-xs"
                          disabled
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="flex items-center justify-between font-bold text-xs">
                          <span>
                            TNA <span className="text-red-500">*</span>
                          </span>
                          {isCheckingTla && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </Label>
                        <Input
                          {...register("tla")}
                          className={cn(
                            "h-8 font-bold text-xs uppercase tracking-widest",
                            tlaError
                              ? "border-destructive focus-visible:ring-destructive"
                              : ""
                          )}
                          placeholder="e.g. TKS"
                        />
                        {tlaError && (
                          <p className="font-bold text-[10px] text-destructive">
                            {tlaError}
                          </p>
                        )}
                        {errors.tla && (
                          <p className="text-[10px] text-destructive">
                            {errors.tla.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-bold text-xs">Lifecycle</Label>
                        <Input
                          {...register("lifeCycleStatus")}
                          className="h-8 bg-muted/50 font-bold text-[10px] uppercase"
                          disabled
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                    exit={{ opacity: 0, x: -10 }}
                    initial={{ opacity: 0, x: 10 }}
                    key="step3"
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="font-bold text-xs">
                          ServiceNow Group
                        </Label>
                        <Input
                          {...register("snowGroup")}
                          className="h-8 text-xs"
                          placeholder="e.g. SNOW-GROUP-1"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-bold text-xs">
                          Slack Channel
                        </Label>
                        <Input
                          {...register("slackChannel")}
                          className="h-8 font-medium text-blue-600 text-xs dark:text-blue-400"
                          placeholder="#ops-app-name"
                        />
                      </div>
                      <div className="col-span-2 space-y-1.5 border-t pt-3">
                        <Label className="font-bold text-xs">
                          Contact Email
                        </Label>
                        <Input
                          {...register("contactEmail")}
                          className="h-8 text-xs"
                          placeholder="eng-leads@team.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-bold text-xs">Team Email</Label>
                        <Input
                          {...register("teamEmail")}
                          className="h-8 text-xs"
                          placeholder="app-team@team.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-bold text-xs">
                          Escalation Email
                        </Label>
                        <Input
                          {...register("escalationEmail")}
                          className="h-8 text-xs"
                          placeholder="manager-escalations@team.com"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-5"
                    exit={{ opacity: 0, x: -10 }}
                    initial={{ opacity: 0, x: 10 }}
                    key="step4"
                    transition={{ duration: 0.2 }}
                  >
                    <div className="space-y-3">
                      <Label className="font-bold text-xs">Description</Label>
                      <Textarea
                        {...register("description")}
                        className="min-h-[80px] resize-none text-xs"
                        placeholder="Operational context..."
                      />
                    </div>

                    <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                      <div className="flex items-center gap-2 border-b pb-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        <span className="font-bold text-xs uppercase tracking-wider">
                          Leadership Sync
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        <div className="space-y-0.5">
                          <p className="font-bold text-[10px] text-muted-foreground uppercase">
                            App Owner
                          </p>
                          <p className="font-semibold text-xs">
                            {getValues("applicationOwnerName") || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-[10px] text-muted-foreground uppercase">
                            Business Owner
                          </p>
                          <p className="font-semibold text-xs">
                            {getValues("businessOwnerName") || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-[10px] text-muted-foreground uppercase">
                            App Manager
                          </p>
                          <p className="font-semibold text-xs">
                            {getValues("applicationManagerName") || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-[10px] text-muted-foreground uppercase">
                            VP / Director
                          </p>
                          <p className="font-semibold text-xs">
                            {getValues("vpName") ||
                              getValues("directorName") ||
                              "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="mt-auto flex items-center justify-between border-t bg-muted/10 p-6">
            <Button
              className={cn(
                "text-muted-foreground",
                currentStep === 1 && "invisible"
              )}
              disabled={currentStep === 1 || createMutation.isPending}
              onClick={prevStep}
              size="sm"
              type="button"
              variant="ghost"
            >
              <ChevronLeft className="mr-1 h-3 w-3" /> Back
            </Button>

            <Button
              className="min-w-[100px] bg-primary hover:bg-primary/90"
              disabled={
                isCheckingTla ||
                createMutation.isPending ||
                (currentStep === 1 && !getValues("assetId"))
              }
              onClick={
                currentStep < 4 ? (e) => nextStep(e) : handleSubmit(onSubmit)
              }
            >
              {createMutation.isPending && (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              )}
              {!createMutation.isPending && currentStep < 4 && (
                <>
                  Continue <ChevronRight className="ml-1 h-3 w-3" />
                </>
              )}
              {!createMutation.isPending &&
                currentStep >= 4 &&
                "Create Application"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
