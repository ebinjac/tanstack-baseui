import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { TurnoverLayout } from "@/components/turnover/turnover-layout";

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
  return (
    <TurnoverLayout>
      <Outlet />
    </TurnoverLayout>
  );
}
