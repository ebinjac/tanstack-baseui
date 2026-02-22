import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  ChevronRight,
  ClipboardList,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Team Requests",
    url: "/admin/requests",
    icon: ClipboardList,
  },
  {
    title: "Teams",
    url: "/admin/teams",
    icon: Users,
  },
  {
    title: "System Health",
    url: "/admin/health",
    icon: Activity,
  },
];

const bottomItems = [
  {
    title: "Help & Support",
    url: "/admin",
    icon: HelpCircle,
  },
  {
    title: "Feedback",
    url: "/admin",
    icon: MessageSquare,
  },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" side="left" variant="inset">
      <SidebarHeader className="border-sidebar-border/50 border-b">
        <div className="flex items-center gap-2 overflow-hidden px-2 py-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldCheck className="h-5 w-5 shrink-0" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5 overflow-hidden leading-none transition-all duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <span className="whitespace-nowrap font-bold text-sm tracking-tight">
              ENSEMBLE
            </span>
            <span className="whitespace-nowrap font-medium text-[10px] text-sidebar-foreground/60 uppercase tracking-widest">
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
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className={`transition-all duration-200 ${isActive ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-sidebar-accent"}
                                            `}
                      isActive={isActive}
                      render={<Link to={item.url} />}
                      tooltip={item.title}
                    >
                      <item.icon
                        className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : "text-sidebar-foreground/70"}`}
                      />
                      <span className="font-medium">{item.title}</span>
                      {isActive && (
                        <ChevronRight className="ml-auto h-3.5 w-3.5" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border/50 border-t">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    className="text-sidebar-foreground/70 transition-all duration-200 hover:bg-sidebar-accent"
                    render={<Link to={item.url} />}
                    tooltip={item.title}
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
        <div className="flex items-center gap-2 overflow-hidden px-2 py-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary font-bold text-primary-foreground text-xs shadow-md">
            A
          </div>
          <div className="flex min-w-0 flex-col gap-0.5 overflow-hidden leading-none transition-all duration-200 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <span className="truncate font-semibold text-sm">Admin User</span>
            <span className="truncate text-[10px] text-sidebar-foreground/60">
              admin@ensemble.app
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
