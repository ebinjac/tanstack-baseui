import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useRouteContext,
  useRouterState,
} from "@tanstack/react-router";
import { ArrowRightLeft, BarChart3, History, Home, Send } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

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
  const router = useRouterState();
  const currentPath = router.location.pathname;

  // Get session context
  const context = useRouteContext({ from: "__root__" });
  const teams = context.session?.permissions || [];

  // Fix: Prevent layout flickering/overlap when navigating away
  if (!currentPath.includes("/turnover")) {
    return null;
  }

  // Helper to check active state
  const isActive = (path: string, exact = false) => {
    if (exact) {
      return currentPath === path || currentPath === `${path}/`;
    }
    return currentPath.startsWith(path);
  };

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
  ];

  return (
    <div className="relative flex h-[calc(100vh)] w-full overflow-hidden bg-background">
      {/* Local Sidebar Provider for Turnover Module */}
      <SidebarProvider className="h-full min-h-[calc(100vh)] w-full bg-background">
        <Sidebar
          className="border-r bg-background"
          collapsible="icon"
          variant="inset"
        >
          <SidebarHeader className="flex h-auto flex-col gap-3 border-border/40 border-b p-3">
            <div className="flex items-center gap-2 px-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ArrowRightLeft className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">TO - HUB</span>
                <span className="truncate text-muted-foreground text-xs">
                  Shift Handover
                </span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Turnover Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={isActive(item.url, item.exact)}
                        render={
                          <Link
                            className={cn(
                              "flex w-full items-center gap-2",
                              isActive(item.url, item.exact) && "font-medium"
                            )}
                            to={item.url}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.title}</span>
                          </Link>
                        }
                        tooltip={item.title}
                      />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="gap-2 border-border/40 border-t p-2">
            <TeamSwitcher
              className="w-full justify-between border-none bg-transparent px-2 shadow-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:w-full"
              teams={teams}
            />

            <div className="flex items-center justify-between gap-2 px-1">
              <Link
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-sidebar-accent hover:text-foreground"
                to="/"
              >
                <Home className="h-4 w-4" />
                <span className="font-medium">Home</span>
              </Link>
              <div className="flex-shrink-0">
                <ModeToggle />
              </div>
            </div>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="relative flex min-w-0 flex-1 flex-col items-center overflow-hidden bg-background">
          <header className="sticky top-0 z-10 hidden h-14 w-full shrink-0 items-center justify-between border-b border-none bg-background/95 px-4 shadow-none backdrop-blur sm:flex">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
          </header>
          <main className="w-full flex-1 overflow-auto bg-background">
            <div className="h-full">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
