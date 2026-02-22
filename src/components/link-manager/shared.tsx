import type { LucideIcon } from "lucide-react";
import { Loader2, Search } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState as SharedEmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ============================================================================
// Standard Page Wrapper
// ============================================================================
export function LinkManagerPage({
  children,
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto min-h-screen w-full max-w-[1600px] flex-1 space-y-6 bg-background p-8 pt-6",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Content Loading State
// ============================================================================
interface ContentLoadingProps {
  message?: string;
}

export function ContentLoading({
  message = "Loading...",
}: ContentLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-20">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="font-bold text-[10px] text-muted-foreground">{message}</p>
    </div>
  );
}

// ============================================================================
// Empty State - Re-export from shared with backwards compatibility
// ============================================================================
interface EmptyStateProps {
  action?: ReactNode;
  description: string;
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  title: string;
}

export function EmptyState({
  icon,
  title,
  description,
  size = "md",
}: EmptyStateProps) {
  return (
    <SharedEmptyState
      description={description}
      icon={icon}
      size={size}
      title={title}
    />
  );
}

// ============================================================================
// Search Input with Icon
// ============================================================================
interface SearchInputProps {
  className?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("group relative max-w-md flex-1", className)}>
      <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
      <Input
        className="h-12 rounded-2xl border-none bg-muted/30 pl-12 font-bold text-sm transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

// ============================================================================
// Stats Summary Card
// ============================================================================
interface StatsSummaryItemProps {
  color?: "primary" | "blue" | "amber" | "indigo";
  icon: LucideIcon;
  label: string;
  value: string | number;
}

const colorVariants = {
  primary: { icon: "text-primary bg-primary/10" },
  blue: {
    icon: "text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/20",
  },
  amber: {
    icon: "text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20",
  },
  indigo: {
    icon: "text-indigo-600 bg-indigo-500/10 dark:text-indigo-400 dark:bg-indigo-500/20",
  },
};

export function StatsSummaryItem({
  label,
  value,
  icon: Icon,
  color = "primary",
}: StatsSummaryItemProps) {
  const style = colorVariants[color];

  return (
    <div className="flex flex-col justify-center px-1 py-2">
      <div className="mb-3 flex items-center gap-2.5">
        <div
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
            style.icon
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <p className="truncate font-bold text-[11px] text-muted-foreground uppercase tracking-widest">
          {label}
        </p>
      </div>
      <p className="font-black text-4xl text-foreground tabular-nums leading-none tracking-tighter md:text-5xl">
        {value}
      </p>
    </div>
  );
}

// ============================================================================
// Full Page Loading State
// ============================================================================
interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = "Loading..." }: PageLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-bold text-xs">{message}</p>
      </div>
    </div>
  );
}
