import { useRouteContext } from "@tanstack/react-router";
import { Activity, BarChart, FileSpreadsheet, Globe } from "lucide-react";
import type * as React from "react";
import { AppSidebar } from "@/components/shared/app-sidebar";

const navItems = [
  {
    title: "Enterprise Directory",
    url: "/scorecard/directory",
    icon: Globe,
  },
  {
    title: "Overview",
    url: "/scorecard",
    icon: BarChart,
    exact: true,
  },
  {
    title: "My Teams",
    url: "/scorecard/my-teams",
    icon: Activity,
  },
];

export function ScorecardSidebar({ children }: { children: React.ReactNode }) {
  const context = useRouteContext({ from: "__root__" });
  const teams = context.session?.permissions || [];

  return (
    <AppSidebar
      headerIcon={FileSpreadsheet}
      headerLabel="Scorecard"
      headerTitle="Enterprise"
      items={navItems}
      moduleLabel="Navigation"
      teams={teams}
    >
      {children}
    </AppSidebar>
  );
}
