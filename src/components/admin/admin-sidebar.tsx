import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ChevronRight,
  ShieldCheck,
  Activity,
  LogOut,
  HelpCircle,
  MessageSquare,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Link, useLocation } from '@tanstack/react-router'

const items = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Team Requests',
    url: '/admin/requests',
    icon: ClipboardList,
  },
  {
    title: 'Teams',
    url: '/admin/teams',
    icon: Users,
  },
  {
    title: 'System Health',
    url: '/admin/health',
    icon: Activity,
  },
]

const bottomItems = [
  {
    title: 'Help & Support',
    url: '/admin',
    icon: HelpCircle,
  },
  {
    title: 'Feedback',
    url: '/admin',
    icon: MessageSquare,
  },
]

export function AdminSidebar() {
  const location = useLocation()

  return (
    <Sidebar variant="inset" side="left" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/50">
        <div className="flex items-center gap-2 px-2 py-1 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldCheck className="h-5 w-5 shrink-0" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none min-w-0 overflow-hidden transition-all duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <span className="font-bold text-sm tracking-tight whitespace-nowrap">
              ENSEMBLE
            </span>
            <span className="text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-widest whitespace-nowrap">
              Admin Portal
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      render={<Link to={item.url} />}
                      tooltip={item.title}
                      className={`
                                                transition-all duration-200
                                                ${isActive ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'hover:bg-sidebar-accent'}
                                            `}
                    >
                      <item.icon
                        className={`h-5 w-5 shrink-0 ${isActive ? 'text-primary' : 'text-sidebar-foreground/70'}`}
                      />
                      <span className="font-medium">{item.title}</span>
                      {isActive && (
                        <ChevronRight className="ml-auto h-3.5 w-3.5" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link to={item.url} />}
                    tooltip={item.title}
                    className="transition-all duration-200 hover:bg-sidebar-accent text-sidebar-foreground/70"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <div className="flex items-center gap-2 px-2 py-1 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xs font-bold shadow-md">
            A
          </div>
          <div className="flex flex-col gap-0.5 leading-none min-w-0 overflow-hidden transition-all duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <span className="font-semibold text-sm truncate">Admin User</span>
            <span className="text-[10px] text-sidebar-foreground/60 truncate">
              admin@ensemble.app
            </span>
          </div>
          <button
            className="ml-auto shrink-0 p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors duration-200 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
