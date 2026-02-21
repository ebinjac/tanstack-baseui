import {
  createFileRoute,
  Outlet,
  Link,
  useRouterState,
  useRouteContext,
} from '@tanstack/react-router'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  SidebarInset,
} from '@/components/ui/sidebar'
import { Link as LinkIcon, BarChart3, Layers, Upload, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TeamSwitcher } from '@/components/team-switcher'
import { SessionData } from '@/lib/auth/config'
import { ModeToggle } from '@/components/mode-toggle'

export const Route = createFileRoute('/teams/$teamId/link-manager')({
  component: LinkManagerLayout,
})

function LinkManagerLayout() {
  const { teamId } = Route.useParams()
  const router = useRouterState()
  const currentPath = router.location.pathname

  // Get session context
  // @ts-ignore - Context inference can be tricky across files
  const context = useRouteContext({ from: '__root__' }) as {
    session: SessionData | null
  }
  const teams = context.session?.permissions || []

  // Fix: Prevent layout flickering/overlap when navigating away
  // This check must be AFTER hooks to comply with React rules
  if (!currentPath.includes('/link-manager')) return null

  // Helper to check active state
  const isActive = (path: string, exact = false) => {
    if (exact) {
      return currentPath === path || currentPath === `${path}/`
    }
    return currentPath.startsWith(path)
  }

  const items = [
    {
      title: 'All Resources',
      url: `/teams/${teamId}/link-manager`,
      icon: LinkIcon,
      exact: true,
    },
    {
      title: 'Analytics & Reports',
      url: `/teams/${teamId}/link-manager/stats`,
      icon: BarChart3,
    },
    {
      title: 'Manage Categories',
      url: `/teams/${teamId}/link-manager/categories`,
      icon: Layers,
    },
    {
      title: 'Bulk Import',
      url: `/teams/${teamId}/link-manager/import`,
      icon: Upload,
    },
  ]

  return (
    <div className="flex h-full w-full bg-background">
      {/* Local Sidebar Provider for Link Manager Module */}
      <SidebarProvider className="w-full h-full min-h-[calc(100vh)]">
        <Sidebar
          collapsible="icon"
          className="border-r bg-background"
          variant="inset"
        >
          <SidebarHeader className="h-auto flex flex-col gap-3 p-3 border-b border-border/40">
            <div className="flex items-center gap-2 px-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LinkIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Link Manager</span>
                <span className="truncate text-xs text-muted-foreground">
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
                        tooltip={item.title}
                        render={
                          <Link
                            to={item.url}
                            className={cn(
                              'flex items-center gap-2 w-full',
                              isActive(item.url, item.exact) && 'font-medium',
                            )}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.title}</span>
                          </Link>
                        }
                      />
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-border/40 p-2 gap-2">
            <TeamSwitcher
              teams={teams}
              className="w-full md:w-full justify-between px-2 bg-transparent shadow-none border-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            />

            <div className="flex items-center justify-between gap-2 px-1">
              <Link
                to="/"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-sidebar-accent w-full cursor-pointer"
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

        <SidebarInset className="h-full overflow-hidden flex flex-col bg-background">
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 lg:h-[60px]">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-border/60 mx-2" />
              <span className="font-semibold text-sm text-foreground/80">
                {items.find((i) => isActive(i.url, i.exact))?.title ||
                  'Link Manager'}
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-0">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
