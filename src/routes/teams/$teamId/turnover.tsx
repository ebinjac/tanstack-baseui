import {
  createFileRoute,
  Outlet,
  Link,
  useRouterState,
  useRouteContext,
  redirect,
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
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { ArrowRightLeft, Send, History, BarChart3, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TeamSwitcher } from '@/components/team-switcher'
import { SessionData } from '@/lib/auth/config'
import { ModeToggle } from '@/components/mode-toggle'

export const Route = createFileRoute('/teams/$teamId/turnover')({
  component: TurnoverLayoutComponent,
  beforeLoad: ({ params, location }) => {
    // Redirect base /turnover to /turnover/pass-the-baton
    if (location.pathname === `/teams/${params.teamId}/turnover`) {
      throw redirect({
        to: '/teams/$teamId/turnover/pass-the-baton',
        params: { teamId: params.teamId },
      })
    }
  },
})

function TurnoverLayoutComponent() {
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
  if (!currentPath.includes('/turnover')) return null

  // Helper to check active state
  const isActive = (path: string, exact = false) => {
    if (exact) {
      return currentPath === path || currentPath === `${path}/`
    }
    return currentPath.startsWith(path)
  }

  const items = [
    {
      title: 'Pass the Baton',
      url: `/teams/${teamId}/turnover/pass-the-baton`,
      icon: ArrowRightLeft,
      exact: true,
    },
    {
      title: 'Dispatch Turnover',
      url: `/teams/${teamId}/turnover/dispatch-turnover`,
      icon: Send,
    },
    {
      title: 'Transition History',
      url: `/teams/${teamId}/turnover/transition-history`,
      icon: History,
    },
    {
      title: 'Turnover Metrics',
      url: `/teams/${teamId}/turnover/turnover-metrics`,
      icon: BarChart3,
    },
  ]

  return (
    <div className="flex h-[calc(100vh)] w-full bg-background overflow-hidden relative">
      {/* Local Sidebar Provider for Turnover Module */}
      <SidebarProvider className="w-full h-full min-h-[calc(100vh)] bg-background">
        <Sidebar
          collapsible="icon"
          className="border-r bg-background"
          variant="inset"
        >
          <SidebarHeader className="h-auto flex flex-col gap-3 p-3 border-b border-border/40">
            <div className="flex items-center gap-2 px-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <ArrowRightLeft className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Turnover Portal</span>
                <span className="truncate text-xs text-muted-foreground">
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

        <SidebarInset className="relative flex-1 min-w-0 bg-background overflow-hidden flex flex-col items-center">
          <header className="sticky top-0 z-10 hidden sm:flex h-14 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur w-full px-4 border-none shadow-none">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background w-full">
            <div className="h-full">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
