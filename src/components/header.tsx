import { Link, useRouterState } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import {
    LayoutDashboard,
    RefreshCcw,
    Link2,
    Layers,
    HelpCircle,
    Info,
    BookOpen,
    User,
    LogOut,
} from "lucide-react"

import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { ModeToggle } from "@/components/mode-toggle"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuthBlueSSO } from "./use-authblue-sso"
import { SessionData } from "@/lib/auth/config"
import { TeamSwitcher } from "./team-switcher"
import { loginUser } from "@/app/ssr/auth"
import { useRouter } from "@tanstack/react-router"
import { toast } from "sonner"
import {
    ShieldCheck,
    LifeBuoy,
    Sparkles,
    ExternalLink
} from "lucide-react"

/* eslint-disable @typescript-eslint/no-explicit-any */

const getTools = (teamId: string | null) => [
    {
        title: "Scorecard",
        href: teamId ? `/teams/${teamId}/scorecard` : "/scorecard",
        description: "View performance metrics and team health scorecards.",
        icon: LayoutDashboard,
    },
    {
        title: "Turnover",
        href: teamId ? `/teams/${teamId}/turnover` : "/turnover",
        description: "Manage shift handovers and transition history.",
        icon: RefreshCcw,
    },
    {
        title: "Link Manager",
        href: teamId ? `/teams/${teamId}/link-manager` : "/link-manager",
        description: "Centralized repository for all your important links.",
        icon: Link2,
    },
    {
        title: "EnvMatrix",
        href: teamId ? `/teams/${teamId}/envmatrix` : "/envmatrix",
        description: "Track application versions across different environments.",
        icon: Layers,
    },
]

export function Header({ session }: { session: SessionData | null }) {
    const user = useAuthBlueSSO()
    const router = useRouter()
    const teams = session?.permissions || []

    const isAdmin = teams.some(t => t.role === 'ADMIN')
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Refresh permissions logic
    const handleRefreshPermissions = async () => {
        if (!user) {
            toast.error("SSO User not found. Please re-login.")
            return
        }

        setIsRefreshing(true)
        const toastId = toast.loading("Refreshing your permissions...")

        try {
            await loginUser({ data: user })
            await router.invalidate()
            toast.success("Permissions refreshed successfully", { id: toastId })
        } catch (error) {
            console.error(error)
            toast.error("Failed to refresh permissions", { id: toastId })
        } finally {
            setIsRefreshing(false)
        }
    }

    // Get active team from URL or storage
    const matches = useRouterState({ select: (s) => s.matches })
    const activeTeamIdFromUrl = (matches.find((d) => (d.params as any).teamId)?.params as any)?.teamId

    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

    useEffect(() => {
        if (activeTeamIdFromUrl) {
            setSelectedTeamId(activeTeamIdFromUrl)
        } else {
            const savedTeamId = localStorage.getItem("ensemble-last-team-id")
            if (savedTeamId && teams.find(t => t.teamId === savedTeamId)) {
                setSelectedTeamId(savedTeamId)
            } else if (teams.length > 0) {
                setSelectedTeamId(teams[0].teamId)
            }
        }
    }, [activeTeamIdFromUrl, teams])

    const tools = getTools(selectedTeamId)

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className=" mx-auto flex h-16 items-center px-8">
                <div className="mr-8 flex items-center space-x-2">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg shadow-lg shadow-primary/20">
                            <span className="text-primary-foreground font-bold italic">E</span>
                        </div>
                        <span className="hidden text-xl font-bold tracking-tight sm:inline-block">
                            Ensemble
                        </span>
                    </Link>
                </div>

                <NavigationMenu className="hidden md:flex">
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <div className="w-[400px] p-3 md:w-[500px] lg:w-[600px] bg-background/95 backdrop-blur-xl rounded-xl border shadow-xl overflow-hidden relative">
                                    <div className="mb-3 px-2 flex items-center justify-between">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Platform Suite
                                        </div>
                                        <div className="h-px flex-1 bg-border/40 ml-4" />
                                    </div>
                                    <ul className="grid grid-cols-2 gap-2 relative z-10">
                                        {tools.map((tool) => (
                                            <li key={tool.title}>
                                                <NavigationMenuLink
                                                    render={
                                                        <Link
                                                            to={tool.href as any}
                                                            className="group block h-full select-none rounded-lg border border-transparent p-3 leading-none transition-all duration-200 hover:bg-muted/50 dark:hover:bg-muted/80 hover:border-border/50 focus:outline-none text-left"
                                                        >
                                                            <div className="flex flex-col items-start gap-3">
                                                                <div className="flex items-center gap-3 w-full">
                                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                                                                        <tool.icon className="h-4 w-4" />
                                                                    </div>
                                                                    <div className="flex flex-col space-y-1">
                                                                        <div className="text-sm font-semibold text-foreground leading-none group-hover:text-primary transition-colors">
                                                                            {tool.title}
                                                                        </div>
                                                                        <div className="h-0.5 w-4 bg-primary/20 group-hover:w-8 group-hover:bg-primary/50 transition-all duration-300 rounded-full" />
                                                                    </div>
                                                                </div>
                                                                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/80 font-medium pl-0.5">
                                                                    {tool.description}
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    }
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <Link to={"/support" as any} className="group h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 inline-flex">
                                <HelpCircle className="mr-2 h-4 w-4" />
                                Support
                            </Link>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <Link to={"/about" as any} className="group h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 inline-flex">
                                <Info className="mr-2 h-4 w-4" />
                                About
                            </Link>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <Link to={"/know-more" as any} className="group h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 inline-flex">
                                <BookOpen className="mr-2 h-4 w-4" />
                                Know More
                            </Link>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>

                <div className="flex flex-1 items-center justify-end space-x-4">
                    <nav className="flex items-center space-x-2">
                        <TeamSwitcher teams={teams} />
                        <ModeToggle />

                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src="" alt={user?.attributes.fullName} />
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {user?.attributes.firstName?.[0]}{user?.attributes.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                }
                            />
                            <DropdownMenuContent className="w-56" align="end">
                                <DropdownMenuGroup>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">{user?.attributes.fullName}</p>
                                            <p className="text-muted-foreground text-xs leading-none">
                                                {user?.attributes.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem render={
                                        <Link to="/profile" className="flex items-center w-full cursor-pointer">
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </Link>
                                    } />

                                    <DropdownMenuItem
                                        onClick={handleRefreshPermissions}
                                        disabled={isRefreshing}
                                        className="cursor-pointer"
                                    >
                                        <RefreshCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        <span>Refresh Permissions</span>
                                    </DropdownMenuItem>

                                    {isAdmin && (
                                        <DropdownMenuItem render={
                                            <Link to="/admin" className="flex items-center w-full cursor-pointer text-primary">
                                                <ShieldCheck className="mr-2 h-4 w-4" />
                                                <span className="font-semibold">Admin Panel</span>
                                            </Link>
                                        } />
                                    )}
                                </DropdownMenuGroup>

                                <DropdownMenuSeparator />

                                <DropdownMenuGroup>
                                    <DropdownMenuItem className="cursor-pointer">
                                        <LifeBuoy className="mr-2 h-4 w-4" />
                                        <span>Help & Support</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer">
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        <span>What's New</span>
                                        <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" variant="destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>
                </div>
            </div>
        </header>
    )
}
