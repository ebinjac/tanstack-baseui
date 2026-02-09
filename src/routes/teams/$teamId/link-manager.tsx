import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/teams/$teamId/link-manager")({
    component: LinkManagerLayout,
});

function LinkManagerLayout() {
    return <Outlet />;
}
