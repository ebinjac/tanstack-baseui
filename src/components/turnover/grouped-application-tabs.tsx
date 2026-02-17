"use client";

import { cn } from "@/lib/utils";
import { Layers, Boxes } from "lucide-react";
import type { Application } from "@/db/schema/teams";
import type { ApplicationGroup } from "@/db/schema/application-groups";
import { EmptyState } from "@/components/shared/empty-state";

type GroupWithApplications = ApplicationGroup & { applications: Application[] };

// ============================================================================
// Types for the new tab system
// ============================================================================

export interface TabItem {
    id: string;
    label: string;
    type: "group" | "application";
    color?: string;
    applications: Application[]; // For groups: all apps in group. For single: just the one app
}

interface GroupedApplicationTabsProps {
    groups: GroupWithApplications[];
    ungroupedApplications: Application[];
    activeTabId: string | null;
    onSelectTab: (tabId: string, tabItem: TabItem) => void;
}

interface FlatApplicationTabsProps {
    applications: Application[];
    activeApplicationId: string | null;
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
    groups.forEach((group) => {
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
            group.applications.forEach((app) => {
                tabItems.push({
                    id: app.id,
                    label: app.tla,
                    type: "application",
                    applications: [app],
                });
            });
        }
    });

    // Add ungrouped apps as individual tabs
    ungroupedApplications.forEach((app) => {
        tabItems.push({
            id: app.id,
            label: app.tla,
            type: "application",
            applications: [app],
        });
    });

    if (tabItems.length === 0) {
        return (
            <EmptyState
                icon={Boxes}
                title="No applications available"
                description="No applications are configured for this team. Please add applications to team to manage turnover entries."
                size="sm"
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
                        key={tab.id}
                        onClick={() => onSelectTab(tab.id, tab)}
                        className={cn(
                            "relative flex items-center gap-2 min-w-[80px] px-4 py-2.5 rounded-xl transition-all duration-200 ease-out overflow-hidden",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/10"
                                : "bg-card hover:bg-muted/60 border border-border/50 hover:border-muted-foreground/20 text-muted-foreground hover:text-foreground"
                        )}
                        style={isGroup && !isActive ? { borderLeftWidth: 3, borderLeftColor: tab.color } : undefined}
                    >
                        {/* Glow effect for active */}
                        {isActive && (
                            <div className="absolute top-0 right-0 -mr-2 -mt-2 w-10 h-10 bg-white/10 rounded-full blur-xl" />
                        )}

                        {/* Group indicator */}
                        {isGroup && (
                            <Layers
                                className={cn(
                                    "h-3.5 w-3.5 shrink-0",
                                    isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}
                                style={!isActive ? { color: tab.color } : undefined}
                            />
                        )}

                        {/* Label */}
                        <span
                            className={cn(
                                "text-sm font-bold tracking-tight leading-none transition-all",
                                isActive ? "text-primary-foreground" : "text-foreground/80"
                            )}
                        >
                            {tab.label}
                        </span>

                        {/* App count for groups */}
                        {isGroup && (
                            <span
                                className={cn(
                                    "text-[10px] font-medium ml-1",
                                    isActive ? "text-primary-foreground/60" : "text-muted-foreground/70"
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
                icon={Boxes}
                title="No applications available"
                description="No applications are configured for this team. Please add applications to team to manage turnover entries."
                size="sm"
            />
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {applications.map((app) => {
                const isActive = app.id === activeApplicationId;

                return (
                    <button
                        key={app.id}
                        onClick={() => onSelectApplication(app.id)}
                        className={cn(
                            "relative flex flex-col items-start min-w-[100px] px-4 py-2.5 rounded-xl transition-all duration-200 ease-out group overflow-hidden",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-white/10"
                                : "bg-card hover:bg-muted/60 border border-border/50 hover:border-muted-foreground/20 text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {isActive && (
                            <div className="absolute top-0 right-0 -mr-2 -mt-2 w-10 h-10 bg-white/10 rounded-full blur-xl" />
                        )}
                        <span
                            className={cn(
                                "text-sm font-bold tracking-tight leading-none mb-0.5 transition-all",
                                isActive ? "text-primary-foreground" : "text-foreground/80"
                            )}
                        >
                            {app.tla}
                        </span>
                        <span
                            className={cn(
                                "text-[9px] truncate max-w-[100px] text-left opacity-80",
                                isActive ? "text-primary-foreground/70" : "text-muted-foreground"
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
