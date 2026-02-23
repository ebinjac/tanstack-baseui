import { Link, useRouterState } from "@tanstack/react-router";
import { Home, type LucideIcon } from "lucide-react";
import type * as React from "react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import type { SessionData } from "@/lib/auth/config";
import { cn } from "@/lib/utils";

type Team = SessionData["permissions"][number];

interface NavItem {
  exact?: boolean;
  icon: LucideIcon;
  title: string;
  url: string;
}

interface AppSidebarProps {
  children: React.ReactNode;
  headerIcon: LucideIcon;
  headerLabel: string;
  headerTitle: string;
  items: NavItem[];
  moduleLabel: string;
  teams: Team[];
}

export function AppSidebar(props: AppSidebarProps) {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      <SidebarProvider className="h-full min-h-screen w-full bg-background">
        <AppSidebarContent {...props} />
      </SidebarProvider>
    </div>
  );
}

function AppSidebarContent({
  headerIcon: HeaderIcon,
  headerTitle,
  headerLabel,
  moduleLabel,
  items,
  teams,
  children,
}: AppSidebarProps) {
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return currentPath === path || currentPath === `${path}/`;
    }
    return currentPath.startsWith(path);
  };

  return (
    <>
      <Sidebar
        className="border-r bg-background"
        collapsible="icon"
        variant="inset"
      >
        <SidebarHeader className="flex h-14 flex-col justify-center border-border/40 border-b p-4 group-data-[collapsible=icon]:p-2">
          <div className="flex items-center gap-3 px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-data-[collapsible=icon]:size-8">
              <HeaderIcon className="size-5 group-data-[collapsible=icon]:size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold text-foreground">
                {headerTitle}
              </span>
              <span className="truncate font-medium text-muted-foreground text-xs opacity-80">
                {headerLabel}
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{moduleLabel}</SidebarGroupLabel>
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
                          <span className="group-data-[collapsible=icon]:hidden">
                            {item.title}
                          </span>
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

        <SidebarFooter className="border-border/40 border-t p-2">
          <SidebarMenu className="gap-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                className="h-12 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:h-10!"
                render={
                  <TeamSwitcher
                    className="w-full justify-between border-none bg-transparent px-0 shadow-none hover:bg-transparent"
                    teams={teams}
                  />
                }
                size="lg"
                tooltip="Switch Workspace"
              />
            </SidebarMenuItem>

            <div className="flex flex-row gap-1 group-data-[collapsible=icon]:flex-col">
              <SidebarMenuItem className="flex-1">
                <SidebarMenuButton
                  render={
                    <Link className="flex w-full items-center gap-2" to="/">
                      <Home className="h-4 w-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        Home
                      </span>
                    </Link>
                  }
                  tooltip="Home"
                />
              </SidebarMenuItem>

              <SidebarMenuItem className="flex-1 group-data-[collapsible=icon]:flex-none">
                <SidebarMenuButton
                  render={<ModeToggle showLabel={!isCollapsed} />}
                  tooltip="Toggle Theme"
                />
              </SidebarMenuItem>
            </div>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="relative flex min-w-0 flex-1 flex-col items-center overflow-hidden bg-background">
        <header className="sticky top-0 z-10 flex h-14 w-full shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:h-14">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="mx-2 h-4 w-px bg-border/60" />
            <span className="font-semibold text-foreground/80 text-sm">
              {items.find((i) => isActive(i.url, i.exact))?.title ||
                headerTitle}
            </span>
          </div>
        </header>
        <main className="w-full flex-1 overflow-auto bg-background p-0">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
