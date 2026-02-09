import { Link, useRouterState } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
    Menu,
    X,
    ChevronRight,
    Command,
    ShieldCheck,
    LifeBuoy,
    Sparkles,
    ExternalLink,
    type LucideIcon,
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

/* eslint-disable @typescript-eslint/no-explicit-any */

// ============================================================================
// Types & Config
// ============================================================================
interface Tool {
    title: string
    href: string
    description: string
    icon: LucideIcon
}

interface NavLink {
    href: string
    icon: LucideIcon
    label: string
}

const getTools = (teamId: string | null): Tool[] => [
    {
        title: "Scorecard",
        href: teamId ? `/teams/${teamId}/scorecard` : "/scorecard",
        description: "Real-time performance metrics and health monitoring.",
        icon: LayoutDashboard,
    },
    {
        title: "Turnover",
        href: teamId ? `/teams/${teamId}/turnover` : "/turnover",
        description: "Seamless shift handovers and transition tracking.",
        icon: RefreshCcw,
    },
    {
        title: "Link Manager",
        href: teamId ? `/teams/${teamId}/link-manager` : "/link-manager",
        description: "Centralized repository for all your documentation.",
        icon: Link2,
    },
    {
        title: "EnvMatrix",
        href: teamId ? `/teams/${teamId}/envmatrix` : "/envmatrix",
        description: "Track versions across environments effortlessly.",
        icon: Layers,
    },
]

const NAV_LINKS: NavLink[] = [
    { href: "/support", icon: HelpCircle, label: "Support" },
    { href: "/about", icon: Info, label: "About" },
    { href: "/know-more", icon: BookOpen, label: "Docs" },
]

// ============================================================================
// Main Header Component
// ============================================================================
export function Header({ session }: { session: SessionData | null }) {
    const user = useAuthBlueSSO()
    const router = useRouter()
    const teams = session?.permissions || []

    const isAdmin = teams.some(t => t.role === 'ADMIN')
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Scroll detection for header transformation
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

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
    const userInitials = `${user?.attributes.firstName?.[0] || ''}${user?.attributes.lastName?.[0] || ''}`

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-150 ease-out ${scrolled
                    ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm'
                    : 'bg-transparent'
                    }`}
            >
                {/* Subtle gradient line at top */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo Section */}
                        <div className="flex items-center gap-8">
                            <LogoLink />
                            <DesktopNav tools={tools} />
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center gap-2">
                            {/* Team Switcher */}
                            <div className="hidden sm:block">
                                <TeamSwitcher teams={teams} />
                            </div>

                            {/* Separator */}
                            <div className="hidden sm:block h-6 w-px bg-border/50" />

                            {/* Mode Toggle */}
                            <ModeToggle />

                            {/* User Menu */}
                            <UserDropdown
                                userInitials={userInitials}
                                userName={user?.attributes.fullName}
                                userEmail={user?.attributes.email}
                                isAdmin={isAdmin}
                                isRefreshing={isRefreshing}
                                onRefreshPermissions={handleRefreshPermissions}
                            />

                            {/* Mobile Menu Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden max-lg:flex h-9 w-9 rounded-full"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                style={{ display: 'var(--mobile-menu-display, none)' }}
                            >
                                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            <MobileMenu
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                tools={tools}
                teams={teams}
            />

            {/* Spacer for fixed header */}
            <div className="h-16" />
        </>
    )
}

// ============================================================================
// Logo Component
// ============================================================================
function LogoLink() {
    return (
        <Link to="/" className="flex items-center gap-3 group">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
                <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary to-primary p-[1px] shadow-lg shadow-primary/25 overflow-hidden">
                    <div className="h-full w-full rounded-[11px] bg-primary flex items-center justify-center">
                        <svg
                            viewBox="0 0 32 32"
                            className="w-6 h-6 text-primary-foreground"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="16" cy="16" r="3" fill="currentColor" stroke="none" />
                            <circle cx="16" cy="6" r="2" fill="currentColor" stroke="none" />
                            <circle cx="24.5" cy="11" r="2" fill="currentColor" stroke="none" />
                            <circle cx="24.5" cy="21" r="2" fill="currentColor" stroke="none" />
                            <circle cx="16" cy="26" r="2" fill="currentColor" stroke="none" />
                            <circle cx="7.5" cy="21" r="2" fill="currentColor" stroke="none" />
                            <circle cx="7.5" cy="11" r="2" fill="currentColor" stroke="none" />
                            <line x1="16" y1="13" x2="16" y2="8" />
                            <line x1="18.5" y1="14" x2="22.5" y2="12" />
                            <line x1="18.5" y1="18" x2="22.5" y2="20" />
                            <line x1="16" y1="19" x2="16" y2="24" />
                            <line x1="13.5" y1="18" x2="9.5" y2="20" />
                            <line x1="13.5" y1="14" x2="9.5" y2="12" />
                        </svg>
                    </div>
                </div>
                <div className="absolute inset-0 rounded-xl bg-primary/30 blur-lg opacity-0 group-hover:opacity-60 transition-opacity duration-300" />
            </motion.div>
            <div className="hidden sm:flex flex-col">
                <span className="text-lg font-bold tracking-tight text-foreground leading-none">Ensemble</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Platform</span>
            </div>
        </Link>
    )
}

// ============================================================================
// Desktop Navigation Component
// ============================================================================
function DesktopNav({ tools }: { tools: Tool[] }) {
    return (
        <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="gap-1">
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-9 px-4 rounded-full bg-transparent hover:bg-muted/50 data-[state=open]:bg-muted/50 transition-colors">
                        <Command className="w-4 h-4 mr-2 text-primary" />
                        <span>Tools</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="w-[550px] p-4 bg-background/95 backdrop-blur-2xl rounded-2xl border border-border/50 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Command className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Platform Suite
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 font-medium">
                                    <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px]">⌘</kbd>
                                    <span>+</span>
                                    <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px]">K</kbd>
                                </div>
                            </div>

                            {/* Tools Grid */}
                            <ul className="grid grid-cols-2 gap-2">
                                {tools.map((tool, index) => (
                                    <ToolMenuItem key={tool.title} tool={tool} index={index} />
                                ))}
                            </ul>

                            {/* Footer */}
                            <div className="mt-4 pt-3 border-t border-border/50">
                                <Link
                                    to={"/teams/register" as any}
                                    className="flex items-center justify-between p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        <span className="text-sm font-medium text-foreground">Create a new workspace</span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </Link>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>

                {NAV_LINKS.map((item) => (
                    <NavigationMenuItem key={item.label}>
                        <Link
                            to={item.href as any}
                            className="group inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                        >
                            <item.icon className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                            {item.label}
                        </Link>
                    </NavigationMenuItem>
                ))}
            </NavigationMenuList>
        </NavigationMenu>
    )
}

// ============================================================================
// Tool Menu Item Component
// ============================================================================
function ToolMenuItem({ tool, index }: { tool: Tool; index: number }) {
    return (
        <motion.li
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <NavigationMenuLink
                render={
                    <Link
                        to={tool.href as any}
                        className="group flex flex-col p-4 rounded-xl border border-transparent bg-transparent hover:bg-muted/50 hover:border-border/50 transition-all duration-300"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                                <tool.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {tool.title}
                                    </span>
                                    <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                    {tool.description}
                                </p>
                            </div>
                        </div>
                    </Link>
                }
            />
        </motion.li>
    )
}

// ============================================================================
// User Dropdown Component
// ============================================================================
interface UserDropdownProps {
    userInitials: string
    userName?: string
    userEmail?: string
    isAdmin: boolean
    isRefreshing: boolean
    onRefreshPermissions: () => void
}

function UserDropdown({ userInitials, userName, userEmail, isAdmin, isRefreshing, onRefreshPermissions }: UserDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-primary/20 transition-all">
                        <Avatar className="h-9 w-9 border-2 border-transparent hover:border-primary/20 transition-colors">
                            <AvatarImage src="" alt={userName} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        {/* Online indicator */}
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                    </Button>
                }
            />
            <DropdownMenuContent className="w-64 p-2" align="end" sideOffset={8}>
                {/* User Info Header */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-2">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {userInitials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                        <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                    </div>
                </div>

                <DropdownMenuGroup>
                    <DropdownMenuItem render={
                        <Link to="/profile" className="flex items-center w-full cursor-pointer rounded-lg">
                            <User className="mr-3 h-4 w-4 text-muted-foreground" />
                            <span>Profile</span>
                        </Link>
                    } />

                    <DropdownMenuItem
                        onClick={onRefreshPermissions}
                        disabled={isRefreshing}
                        className="cursor-pointer rounded-lg"
                    >
                        <RefreshCcw className={`mr-3 h-4 w-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>Refresh Permissions</span>
                    </DropdownMenuItem>

                    {isAdmin && (
                        <DropdownMenuItem render={
                            <Link to="/admin" className="flex items-center w-full cursor-pointer rounded-lg">
                                <ShieldCheck className="mr-3 h-4 w-4 text-primary" />
                                <span className="font-semibold text-primary">Admin Panel</span>
                            </Link>
                        } />
                    )}
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuGroup>
                    <DropdownMenuItem className="cursor-pointer rounded-lg">
                        <LifeBuoy className="mr-3 h-4 w-4 text-muted-foreground" />
                        <span>Help & Support</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer rounded-lg">
                        <Sparkles className="mr-3 h-4 w-4 text-muted-foreground" />
                        <span>What's New</span>
                        <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground/50" />
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg" variant="destructive">
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// ============================================================================
// Mobile Menu Component
// ============================================================================
interface MobileMenuProps {
    isOpen: boolean
    onClose: () => void
    tools: Tool[]
    teams: any[]
}

function MobileMenu({ isOpen, onClose, tools, teams }: MobileMenuProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-x-0 top-16 z-40 lg:hidden"
                >
                    <div className="bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-xl">
                        <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
                            {tools.map((tool) => (
                                <Link
                                    key={tool.title}
                                    to={tool.href as any}
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                                >
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <tool.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-foreground">{tool.title}</div>
                                        <div className="text-xs text-muted-foreground">{tool.description}</div>
                                    </div>
                                </Link>
                            ))}
                            <div className="pt-2 border-t border-border/50 mt-2">
                                <TeamSwitcher teams={teams} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
