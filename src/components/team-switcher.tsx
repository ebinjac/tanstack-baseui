"use client"

import * as React from "react"
import {
    ChevronsUpDown,
    PlusCircle,
    Settings,
    Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { SessionData } from "@/lib/auth/config"
import { useRouter, useRouterState, Link } from "@tanstack/react-router"

type Team = SessionData["permissions"][number]

interface TeamSwitcherProps {
    className?: string
    teams: Team[]
}

const STORAGE_KEY = "ensemble-last-team-id"

export function TeamSwitcher({ className, teams }: TeamSwitcherProps) {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)

    // Get active team from URL
    const matches = useRouterState({ select: (s) => s.matches })
    const activeTeamIdFromUrl = (matches.find((d) => (d.params as any).teamId)?.params as any)?.teamId

    const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(null)

    // Sync selectedTeamId with URL or storage
    React.useEffect(() => {
        if (activeTeamIdFromUrl) {
            setSelectedTeamId(activeTeamIdFromUrl)
            localStorage.setItem(STORAGE_KEY, activeTeamIdFromUrl)
        } else {
            const savedTeamId = localStorage.getItem(STORAGE_KEY)
            if (savedTeamId && teams.find(t => t.teamId === savedTeamId)) {
                setSelectedTeamId(savedTeamId)
            } else if (teams.length > 0) {
                setSelectedTeamId(teams[0].teamId)
            }
        }
    }, [activeTeamIdFromUrl, teams])

    const activeTeam = teams.find((team) => team.teamId === selectedTeamId)

    if (teams.length === 0) {
        return (
            <Link to={"/teams/register" as any}>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "w-full md:w-[200px] justify-start h-10 transition-all",
                        "bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20",
                        "hover:from-primary/10 hover:to-primary/20 hover:border-primary/30",
                        "group",
                        className
                    )}
                >
                    <PlusCircle className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-primary">Create Team</span>
                </Button>
            </Link>
        )
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full md:w-[260px] justify-between px-3 h-11",
                    "border-border/40 bg-background/80 backdrop-blur-md",
                    "hover:bg-accent/50 hover:border-border/60",
                    "transition-all duration-200 active:scale-[0.98]",
                    "shadow-sm hover:shadow-md",
                    className
                )}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                        "text-[11px] font-bold",
                        "transition-all duration-200",
                        "bg-primary/10 text-primary border border-primary/20"
                    )}>
                        {activeTeam ? getInitials(activeTeam.teamName) : "T"}
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                        <span className="truncate font-semibold text-sm tracking-tight">
                            {activeTeam ? activeTeam.teamName : "Select Team..."}
                        </span>
                        {activeTeam && (
                            <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                                {activeTeam.role}
                            </span>
                        )}
                    </div>
                </div>
                <ChevronsUpDown className={cn(
                    "ml-2 h-4 w-4 shrink-0 text-muted-foreground/50",
                    "transition-transform duration-200",
                    open && "rotate-180"
                )} />
            </PopoverTrigger>
            <PopoverContent
                className={cn(
                    "w-[320px] p-0 overflow-hidden",
                    "border-border/50 shadow-2xl",
                    "bg-popover/95 backdrop-blur-xl"
                )}
                align="end"
            >
                <Command className="bg-transparent">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-border/50">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-bold text-foreground">Switch Workspace</span>
                        </div>
                    </div>

                    <CommandInput
                        placeholder="Search workspaces..."
                        className="h-11 border-none focus:ring-0 bg-transparent"
                    />
                    <CommandList className="max-h-[280px] scrollbar-thin">
                        <CommandEmpty className="py-8 text-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                                    <ChevronsUpDown className="h-5 w-5 text-muted-foreground/50" />
                                </div>
                                <span className="text-sm text-muted-foreground">No workspaces found</span>
                            </div>
                        </CommandEmpty>
                        <CommandGroup className="p-2">
                            {teams.map((team) => {
                                const isActive = selectedTeamId === team.teamId

                                return (
                                    <CommandItem
                                        key={team.teamId}
                                        onSelect={() => {
                                            setOpen(false)
                                            localStorage.setItem(STORAGE_KEY, team.teamId)
                                            setSelectedTeamId(team.teamId)

                                            // Detect if we are in a team context by looking for teamId param in any match
                                            const teamMatch = [...matches].reverse().find(m => (m.params as any).teamId)
                                            const leafMatch = matches[matches.length - 1]

                                            if (teamMatch && leafMatch) {
                                                router.navigate({
                                                    to: leafMatch.routeId as any,
                                                    params: { ...(leafMatch.params as any), teamId: team.teamId },
                                                    // Keep search params if any
                                                    search: (prev: any) => prev,
                                                } as any)
                                            }
                                        }}
                                        className={cn(
                                            "flex items-center justify-between py-2.5 px-3 my-0.5 rounded-xl cursor-pointer group transition-all duration-200",
                                            isActive
                                                ? "bg-primary/8 border border-primary/20"
                                                : "hover:bg-accent/60 border border-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                            <div className={cn(
                                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                                "text-[11px] font-bold transition-all duration-200",
                                                "border",
                                                isActive
                                                    ? "bg-primary/10 text-primary border-primary/30"
                                                    : "bg-muted/40 border-border/50 text-muted-foreground group-hover:bg-muted/60"
                                            )}>
                                                {getInitials(team.teamName)}
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className={cn(
                                                        "truncate text-sm font-semibold tracking-tight transition-colors",
                                                        isActive ? "text-primary" : "text-foreground"
                                                    )}>
                                                        {team.teamName}
                                                    </span>
                                                    {isActive && (
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                                            <span className="text-[9px] font-bold text-primary uppercase">Active</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                                                    {team.role}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "h-8 w-8 rounded-lg transition-all",
                                                    "opacity-0 group-hover:opacity-100",
                                                    "hover:bg-primary/10 hover:text-primary"
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setOpen(false)
                                                    router.navigate({
                                                        to: '/teams/$teamId/settings' as any,
                                                        params: { teamId: team.teamId }
                                                    } as any)
                                                }}
                                            >
                                                <Settings className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    </CommandList>
                    <CommandSeparator className="opacity-30" />
                    <div className="p-2 bg-muted/10">
                        <CommandItem
                            onSelect={() => {
                                setOpen(false)
                                router.navigate({ to: '/teams/register' as any })
                            }}
                            className={cn(
                                "flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer group transition-all",
                                "border border-dashed border-border/50",
                                "bg-background/50 hover:bg-primary/5",
                                "hover:border-primary/40 hover:text-primary"
                            )}
                        >
                            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <PlusCircle className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Create New Workspace</span>
                        </CommandItem>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
