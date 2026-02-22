import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  description: string;
  icon: React.ElementType;
  id: number;
  title: string;
}

interface StepTimelineProps {
  className?: string;
  currentStep: number;
  steps: Array<Step>;
}

export function StepTimeline({
  steps,
  currentStep,
  className,
}: StepTimelineProps) {
  return (
    <nav className={cn("relative flex flex-col gap-4 pl-2", className)}>
      {/* Stepper Vertical Line - Connecting the dots */}
      <div className="absolute top-[28px] bottom-[28px] left-[34px] -z-10 w-0.5 rounded-full bg-muted-foreground/20" />

      {steps.map((step) => {
        const isCurrent = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const Icon = step.icon;

        return (
          <div
            className={cn(
              "group relative flex items-start gap-4 rounded-xl border border-transparent p-3 transition-all duration-300",
              isCurrent
                ? "scale-[1.02] border-border/50 bg-background shadow-sm"
                : "hover:bg-muted/10"
            )}
            key={step.id}
          >
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 shadow-sm transition-all duration-500",
                isCurrent
                  ? "scale-110 border-primary bg-primary text-primary-foreground ring-4 ring-background"
                  : isCompleted
                    ? "scale-100 border-primary bg-primary text-primary-foreground ring-4 ring-background"
                    : "border-muted bg-muted text-muted-foreground ring-4 ring-background"
              )}
            >
              {isCompleted ? (
                <Check className="h-4 w-4 stroke-[3]" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center justify-between">
                <p
                  className={cn(
                    "font-bold text-sm tracking-tight transition-colors duration-300",
                    isCurrent
                      ? "text-foreground"
                      : isCompleted
                        ? "opacity-90"
                        : "opacity-50"
                  )}
                >
                  {step.title}
                </p>
              </div>
              <p
                className={cn(
                  "mt-1 text-xs leading-relaxed transition-all duration-300",
                  isCurrent ? "font-medium text-muted-foreground" : "opacity-40"
                )}
              >
                {step.description}
              </p>
            </div>

            {/* Current Indicator (Right Arrow) - Optional polish */}
            {isCurrent && (
              <div className="absolute top-1/2 right-3 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary/50" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
