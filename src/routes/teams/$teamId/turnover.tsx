import {
  createFileRoute,
  Outlet,
  redirect,
  useRouteContext,
} from "@tanstack/react-router";
import {
  ArrowRightLeft,
  BarChart3,
  History,
  Send,
  Settings2,
} from "lucide-react";
import { AppSidebar } from "@/components/shared/app-sidebar";

export const Route = createFileRoute("/teams/$teamId/turnover")({
  component: TurnoverLayoutComponent,
  beforeLoad: ({ params, location }) => {
    // Redirect base /turnover to /turnover/pass-the-baton
    if (location.pathname === `/teams/${params.teamId}/turnover`) {
      throw redirect({
        to: "/teams/$teamId/turnover/pass-the-baton",
        params: { teamId: params.teamId },
      });
    }
  },
});

function TurnoverLayoutComponent() {
  const { teamId } = Route.useParams();
  // Get session context
  const context = useRouteContext({ from: "__root__" });
  const teams = context.session?.permissions || [];

  // Fix: Prevent layout flickering/overlap when navigating away
  if (!Route.useParams().teamId) {
    return null;
  }

  const items = [
    {
      title: "Pass the Baton",
      url: `/teams/${teamId}/turnover/pass-the-baton`,
      icon: ArrowRightLeft,
      exact: true,
    },
    {
      title: "Dispatch Turnover",
      url: `/teams/${teamId}/turnover/dispatch-turnover`,
      icon: Send,
    },
    {
      title: "Transition History",
      url: `/teams/${teamId}/turnover/transition-history`,
      icon: History,
    },
    {
      title: "Turnover Metrics",
      url: `/teams/${teamId}/turnover/turnover-metrics`,
      icon: BarChart3,
    },
    {
      title: "Turnover Settings",
      url: `/teams/${teamId}/turnover/settings`,
      icon: Settings2,
    },
  ];

  return (
    <AppSidebar
      headerIcon={ArrowRightLeft}
      headerLabel="Shift Handover"
      headerTitle="TO - HUB"
      items={items}
      moduleLabel="Turnover Tools"
      teams={teams}
    >
      <Outlet />
    </AppSidebar>
  );
}
