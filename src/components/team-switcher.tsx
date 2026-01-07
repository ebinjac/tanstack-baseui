"use client"

import * as React from "react"
import {
    ChevronsUpDown,
    PlusCircle,
    Settings,
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
                <Button variant="outline" size="sm" className={cn("w-full md:w-[200px] justify-start h-9 transition-all hover:bg-muted/50", className)}>
                    <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-medium">Create Team</span>
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
                    "w-full md:w-[240px] justify-between px-3 h-10 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent/50 transition-all active:scale-[0.98]",
                    className
                )}
            >
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary ring-1 ring-primary/20 shadow-sm">
                        {activeTeam ? getInitials(activeTeam.teamName) : "T"}
                    </div>
                    <span className="truncate font-semibold text-sm tracking-tight">
                        {activeTeam ? activeTeam.teamName : "Select Team..."}
                    </span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40 transition-opacity" />
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 overflow-hidden border-border/50 shadow-2xl" align="end">
                <Command className="bg-popover">
                    <CommandInput placeholder="Search teams..." className="h-11 border-none focus:ring-0" />
                    <CommandList className="max-h-[300px] scrollbar-thin">
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">No matches found.</CommandEmpty>
                        <CommandGroup heading={<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-2">Workspaces</span>}>
                            {teams.map((team) => (
                                <CommandItem
                                    key={team.teamId}
                                    onSelect={() => {
                                        setOpen(false)
                                        localStorage.setItem(STORAGE_KEY, team.teamId)
                                        setSelectedTeamId(team.teamId)

                                        // Only navigate if we are already in a team context
                                        const isTeamRoute = matches.some(m => (m.params as any).teamId)

                                        if (isTeamRoute) {
                                            router.navigate({
                                                to: '/teams/$teamId/dashboard' as any,
                                                params: { teamId: team.teamId }
                                            } as any)
                                        }
                                    }}
                                    className="flex items-center justify-between py-2 px-3 mx-1 my-0.5 rounded-md cursor-pointer group hover:bg-accent/40 data-[selected=true]:bg-accent/60 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                        <div className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold transition-all shadow-sm",
                                            selectedTeamId === team.teamId
                                                ? "bg-primary/10 border-primary/30 text-primary ring-1 ring-primary/10"
                                                : "bg-muted/30 border-border/40 text-muted-foreground"
                                        )}>
                                            {getInitials(team.teamName)}
                                        </div>
                                        <div className="flex flex-col overflow-hidden space-y-0.5">
                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                <span className={cn(
                                                    "truncate text-sm font-semibold tracking-tight transition-colors",
                                                    selectedTeamId === team.teamId ? "text-primary" : "text-foreground"
                                                )}>
                                                    {team.teamName}
                                                </span>
                                                {selectedTeamId === team.teamId && (
                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                                )}
                                            </div>
                                            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                                                {team.role}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 ml-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary rounded-md"
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
                            ))}
                        </CommandGroup>
                    </CommandList>
                    <CommandSeparator className="opacity-50" />
                    <div className="p-2 bg-muted/20">
                        <CommandItem
                            onSelect={() => {
                                setOpen(false)
                                router.navigate({ to: '/teams/register' as any })
                            }}
                            className="flex items-center justify-center gap-2 p-2 rounded-md border border-dashed border-border/60 bg-background/50 hover:bg-background hover:border-primary/50 hover:text-primary transition-all cursor-pointer group"
                        >
                            <PlusCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-xs font-bold uppercase tracking-wider">Create WorkSpace</span>
                        </CommandItem>
                    </div>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
