import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ScorecardSidebar } from "@/components/enterprise-scorecard";

export const Route = createFileRoute("/scorecard")({
  component: ScorecardLayout,
});

function ScorecardLayout() {
  return (
    <ScorecardSidebar>
      <Outlet />
    </ScorecardSidebar>
  );
}
