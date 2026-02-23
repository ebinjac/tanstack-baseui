import {
  createFileRoute,
  Outlet,
  useRouteContext,
  useRouterState,
} from "@tanstack/react-router";
import { BarChart3, Layers, Link as LinkIcon, Upload } from "lucide-react";
import { AppSidebar } from "@/components/shared/app-sidebar";

export const Route = createFileRoute("/teams/$teamId/link-manager")({
  component: LinkManagerLayout,
});

function LinkManagerLayout() {
  const { teamId } = Route.useParams();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  // Get session context
  const context = useRouteContext({ from: "__root__" });
  const teams = context.session?.permissions || [];

  // Fix: Prevent layout flickering/overlap when navigating away
  // This check must be AFTER hooks to comply with React rules
  if (!currentPath.includes("/link-manager")) {
    return null;
  }

  const items = [
    {
      title: "All Resources",
      url: `/teams/${teamId}/link-manager`,
      icon: LinkIcon,
      exact: true,
    },
    {
      title: "Analytics & Reports",
      url: `/teams/${teamId}/link-manager/stats`,
      icon: BarChart3,
    },
    {
      title: "Manage Categories",
      url: `/teams/${teamId}/link-manager/categories`,
      icon: Layers,
    },
    {
      title: "Bulk Import",
      url: `/teams/${teamId}/link-manager/import`,
      icon: Upload,
    },
  ];

  return (
    <AppSidebar
      headerIcon={LinkIcon}
      headerLabel="Knowledge Hub"
      headerTitle="Link Manager"
      items={items}
      moduleLabel="Link Manager"
      teams={teams}
    >
      <Outlet />
    </AppSidebar>
  );
}
