/**
 * EmptyState Component
 *
 * A reusable empty state component built on top of shadcn's Empty component.
 * Used across scorecard, turnover, and link manager.
 *
 * @see src/components/ui/empty.tsx
 * @see skills/code-quality/rules/dry-no-copy-paste.md
 */

import type { LucideIcon } from "lucide-react";
import { FileX, FolderOpen, Inbox, Search } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

export type EmptyStateVariant = "default" | "search" | "error" | "folder";

export interface EmptyStateProps {
  /** Action button text */
  actionText?: string;
  /** Additional className */
  className?: string;
  /** Description text */
  description?: string;
  /** Icon to display (defaults based on variant) */
  icon?: LucideIcon;
  /** Action button click handler */
  onAction?: () => void;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Title text */
  title: string;
  /** Variant style */
  variant?: EmptyStateVariant;
}

const variantDefaults: Record<
  EmptyStateVariant,
  { icon: LucideIcon; title: string }
> = {
  default: { icon: Inbox, title: "No Data" },
  search: { icon: Search, title: "No Results Found" },
  error: { icon: FileX, title: "Something Went Wrong" },
  folder: { icon: FolderOpen, title: "Folder is Empty" },
};

const sizeClasses = {
  sm: "py-8",
  md: "py-16",
  lg: "py-24",
};

const iconSizes = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
};

/**
 * An empty state component for displaying when there's no data.
 * Uses the shadcn Empty component under the hood.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="No Applications Found"
 *   description="Add applications in Team Settings to start tracking metrics."
 *   actionText="Go to Settings"
 *   onAction={() => navigate('/settings')}
 * />
 * ```
 */
export const EmptyState = memo(function EmptyState({
  title,
  description,
  icon: Icon,
  variant = "default",
  actionText,
  onAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const defaults = variantDefaults[variant];
  const DisplayIcon = Icon || defaults.icon;
  const displayTitle = title || defaults.title;

  return (
    <Empty className={cn(sizeClasses[size], className)}>
      <EmptyHeader>
        <EmptyMedia
          className={cn(iconSizes[size], "bg-muted/50")}
          variant="icon"
        >
          <DisplayIcon className={iconSizes[size]} />
        </EmptyMedia>
        <EmptyTitle>{displayTitle}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {actionText && onAction && (
        <EmptyContent>
          <Button onClick={onAction}>{actionText}</Button>
        </EmptyContent>
      )}
    </Empty>
  );
});

/**
 * EmptyStateCard - Empty state with card-like styling
 */
export const EmptyStateCard = memo(function EmptyStateCard(
  props: EmptyStateProps
) {
  return (
    <EmptyState
      {...props}
      className={cn(
        "rounded-3xl border border-border/50 border-dashed bg-card/10 backdrop-blur-sm",
        props.className
      )}
    />
  );
});

/**
 * EmptyStateInline - Inline empty state for tables/lists
 */
export const EmptyStateInline = memo(function EmptyStateInline(
  props: EmptyStateProps
) {
  return <EmptyState {...props} size="sm" />;
});

// Re-export the shadcn Empty components for direct use
export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
