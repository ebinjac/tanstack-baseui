"use client";

import { Boxes, Layers } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { ApplicationGroup } from "@/db/schema/application-groups";
import type { Application } from "@/db/schema/teams";
import { cn } from "@/lib/utils";

type GroupWithApplications = ApplicationGroup & {
  applications: Application[];
};

// ============================================================================
// Types for the new tab system
// ============================================================================

export interface TabItem {
  applications: Application[]; // For groups: all apps in group. For single: just the one app
  color?: string;
  id: string;
  label: string;
  type: "group" | "application";
}

interface GroupedApplicationTabsProps {
  activeTabId: string | null;
  groups: GroupWithApplications[];
  onSelectTab: (tabId: string, tabItem: TabItem) => void;
  ungroupedApplications: Application[];
}

interface FlatApplicationTabsProps {
  activeApplicationId: string | null;
  applications: Application[];
  onSelectApplication: (appId: string) => void;
}

// ============================================================================
// Grouped View - Groups appear as single tabs
// ============================================================================

export function GroupedApplicationTabs({
  groups,
  ungroupedApplications,
  activeTabId,
  onSelectTab,
}: GroupedApplicationTabsProps) {
  // Build tab items: each group with 2+ apps becomes a single tab
  // Each ungrouped app becomes its own tab
  const tabItems: TabItem[] = [];

  // Add group tabs (only groups with 2+ applications)
  for (const group of groups) {
    if (group.applications.length >= 2) {
      tabItems.push({
        id: `group-${group.id}`,
        label: group.name, // e.g., "KMS/TKS"
        type: "group",
        color: group.color || "#6366f1",
        applications: group.applications,
      });
    } else {
      // Groups with 1 app should be treated as ungrouped
      for (const app of group.applications) {
        tabItems.push({
          id: app.id,
          label: app.tla,
          type: "application",
          applications: [app],
        });
      }
    }
  }

  // Add ungrouped apps as individual tabs
  for (const app of ungroupedApplications) {
    tabItems.push({
      id: app.id,
      label: app.tla,
      type: "application",
      applications: [app],
    });
  }

  if (tabItems.length === 0) {
    return (
      <EmptyState
        description="No applications are configured for this team. Please add applications to team to manage turnover entries."
        icon={Boxes}
        size="sm"
        title="No applications available"
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tabItems.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isGroup = tab.type === "group";

        return (
          <button
            className={cn(
              "relative flex min-w-[80px] items-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 transition-all duration-200 ease-out",
              isActive
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/10"
                : "border border-border/50 bg-card text-muted-foreground hover:border-muted-foreground/20 hover:bg-muted/60 hover:text-foreground"
            )}
            key={tab.id}
            onClick={() => onSelectTab(tab.id, tab)}
            style={
              isGroup && !isActive
                ? { borderLeftWidth: 3, borderLeftColor: tab.color }
                : undefined
            }
            type="button"
          >
            {/* Glow effect for active */}
            {isActive && (
              <div className="absolute top-0 right-0 -mt-2 -mr-2 h-10 w-10 rounded-full bg-white/10 blur-xl" />
            )}

            {/* Group indicator */}
            {isGroup && (
              <Layers
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isActive
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                )}
                style={isActive ? undefined : { color: tab.color }}
              />
            )}

            {/* Label */}
            <span
              className={cn(
                "font-bold text-sm leading-none tracking-tight transition-all",
                isActive ? "text-primary-foreground" : "text-foreground/80"
              )}
            >
              {tab.label}
            </span>

            {/* App count for groups */}
            {isGroup && (
              <span
                className={cn(
                  "ml-1 font-medium text-[10px]",
                  isActive
                    ? "text-primary-foreground/60"
                    : "text-muted-foreground/70"
                )}
              >
                ({tab.applications.length})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Flat View - Each app is its own tab (no grouping)
// ============================================================================

export function FlatApplicationTabs({
  applications,
  activeApplicationId,
  onSelectApplication,
}: FlatApplicationTabsProps) {
  if (!applications || applications.length === 0) {
    return (
      <EmptyState
        description="No applications are configured for this team. Please add applications to team to manage turnover entries."
        icon={Boxes}
        size="sm"
        title="No applications available"
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {applications.map((app) => {
        const isActive = app.id === activeApplicationId;

        return (
          <button
            className={cn(
              "group relative flex min-w-[100px] flex-col items-start overflow-hidden rounded-xl px-4 py-2.5 transition-all duration-200 ease-out",
              isActive
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/10"
                : "border border-border/50 bg-card text-muted-foreground hover:border-muted-foreground/20 hover:bg-muted/60 hover:text-foreground"
            )}
            key={app.id}
            onClick={() => onSelectApplication(app.id)}
            type="button"
          >
            {isActive && (
              <div className="absolute top-0 right-0 -mt-2 -mr-2 h-10 w-10 rounded-full bg-white/10 blur-xl" />
            )}
            <span
              className={cn(
                "mb-0.5 font-bold text-sm leading-none tracking-tight transition-all",
                isActive ? "text-primary-foreground" : "text-foreground/80"
              )}
            >
              {app.tla}
            </span>
            <span
              className={cn(
                "max-w-[100px] truncate text-left text-[9px] opacity-80",
                isActive
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
              )}
            >
              {app.applicationName}
            </span>
          </button>
        );
      })}
    </div>
  );
}
