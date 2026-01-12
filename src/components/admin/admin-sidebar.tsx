import {
    LayoutDashboard,
    Users,
    ClipboardList,
    Settings,
    ChevronRight,
    ShieldCheck,
} from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "@tanstack/react-router"

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
]

export function AdminSidebar() {
    const location = useLocation()

    return (
        <Sidebar variant="inset" side="left" collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border/50 pb-4">
                <div className="flex items-center gap-2 px-2 py-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                        <span className="font-bold text-sm tracking-tight">ENSEMBLE</span>
                        <span className="text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-widest">Admin Portal</span>
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
                                            <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-sidebar-foreground/70'}`} />
                                            <span className="font-medium">{item.title}</span>
                                            {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5" />}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border/50 pt-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip="Settings"
                            className="hover:bg-sidebar-accent"
                        >
                            <Settings className="h-5 w-5 text-sidebar-foreground/70" />
                            <span className="font-medium">Settings</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
