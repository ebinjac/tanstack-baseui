import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Step {
  id: number
  title: string
  description: string
  icon: React.ElementType
}

interface StepTimelineProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function StepTimeline({
  steps,
  currentStep,
  className,
}: StepTimelineProps) {
  return (
    <nav className={cn('relative flex flex-col gap-4 pl-2', className)}>
      {/* Stepper Vertical Line - Connecting the dots */}
      <div className="absolute left-[34px] top-[28px] bottom-[28px] w-0.5 bg-muted-foreground/20 rounded-full -z-10" />

      {steps.map((step) => {
        const isCurrent = currentStep === step.id
        const isCompleted = currentStep > step.id
        const Icon = step.icon

        return (
          <div
            key={step.id}
            className={cn(
              'relative flex items-start p-3 gap-4 rounded-xl transition-all duration-300 border border-transparent group',
              isCurrent
                ? 'bg-background border-border/50 shadow-sm scale-[1.02]'
                : 'hover:bg-muted/10',
            )}
          >
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 shadow-sm',
                isCurrent
                  ? 'border-primary bg-primary text-primary-foreground ring-4 ring-background scale-110'
                  : isCompleted
                    ? 'border-primary bg-primary text-primary-foreground scale-100 ring-4 ring-background'
                    : 'border-muted bg-muted text-muted-foreground ring-4 ring-background',
              )}
            >
              {isCompleted ? (
                <Check className="h-4 w-4 stroke-[3]" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0 pt-0.5 flex-1">
              <div className="flex items-center justify-between">
                <p
                  className={cn(
                    'text-sm font-bold tracking-tight transition-colors duration-300',
                    isCurrent
                      ? 'text-foreground'
                      : isCompleted
                        ? 'opacity-90'
                        : 'opacity-50',
                  )}
                >
                  {step.title}
                </p>
              </div>
              <p
                className={cn(
                  'text-xs mt-1 leading-relaxed transition-all duration-300',
                  isCurrent
                    ? 'text-muted-foreground font-medium'
                    : 'opacity-40',
                )}
              >
                {step.description}
              </p>
            </div>

            {/* Current Indicator (Right Arrow) - Optional polish */}
            {isCurrent && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/50" />
            )}
          </div>
        )
      })}
    </nav>
  )
}
