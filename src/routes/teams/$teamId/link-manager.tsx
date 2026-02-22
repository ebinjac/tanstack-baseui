import {
  createFileRoute,
  Link,
  Outlet,
  useRouteContext,
  useRouterState,
} from "@tanstack/react-router";
import {
  BarChart3,
  Home,
  Layers,
  Link as LinkIcon,
  Upload,
} from "lucide-react";
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

  // Helper to check active state
  const isActive = (path: string, exact = false) => {
    if (exact) {
      return currentPath === path || currentPath === `${path}/`;
    }
    return currentPath.startsWith(path);
  };

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
    <div className="flex h-full w-full bg-background">
      {/* Local Sidebar Provider for Link Manager Module */}
      <SidebarProvider className="h-full min-h-[calc(100vh)] w-full">
        <Sidebar
          className="border-r bg-background"
          collapsible="icon"
          variant="inset"
        >
          <SidebarHeader className="flex h-auto flex-col gap-3 border-border/40 border-b p-3">
            <div className="flex items-center gap-2 px-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LinkIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Link Manager</span>
                <span className="truncate text-muted-foreground text-xs">
                  Knowledge Hub
                </span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Link Manager</SidebarGroupLabel>
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

        <SidebarInset className="flex h-full flex-col overflow-hidden bg-background">
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 lg:h-[60px]">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <div className="mx-2 h-4 w-px bg-border/60" />
              <span className="font-semibold text-foreground/80 text-sm">
                {items.find((i) => isActive(i.url, i.exact))?.title ||
                  "Link Manager"}
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-0">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
