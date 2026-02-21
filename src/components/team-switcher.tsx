'use client'

import * as React from 'react'
import {
  ChevronsUpDown,
  PlusCircle,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react'
import { Link, useRouter, useRouterState } from '@tanstack/react-router'
import type { SessionData } from '@/lib/auth/config'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { EmptyState } from '@/components/shared/empty-state'

type Team = SessionData['permissions'][number]

interface TeamSwitcherProps {
  className?: string
  teams: Array<Team>
}

const STORAGE_KEY = 'ensemble-last-team-id'

// Extracted outside component to avoid re-creation on every render
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export function TeamSwitcher({ className, teams }: TeamSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  // Optimized: extract only the teamId (primitive) to avoid re-renders on unrelated router changes
  const activeTeamIdFromUrl = useRouterState({
    select: (s) => {
      const match = s.matches.find((d) => (d.params as any).teamId)
      return (match?.params as any)?.teamId as string | undefined
    },
  })

  const [selectedTeamId, setSelectedTeamId] = React.useState<string | null>(
    null,
  )

  // Sync selectedTeamId with URL or storage
  React.useEffect(() => {
    if (activeTeamIdFromUrl) {
      setSelectedTeamId(activeTeamIdFromUrl)
      localStorage.setItem(STORAGE_KEY, activeTeamIdFromUrl)
    } else {
      const savedTeamId = localStorage.getItem(STORAGE_KEY)
      if (savedTeamId && teams.find((t) => t.teamId === savedTeamId)) {
        setSelectedTeamId(savedTeamId)
      } else if (teams.length > 0) {
        setSelectedTeamId(teams[0].teamId)
      }
    }
  }, [activeTeamIdFromUrl, teams])

  const activeTeam = React.useMemo(
    () => teams.find((team) => team.teamId === selectedTeamId),
    [teams, selectedTeamId],
  )

  if (teams.length === 0) {
    return (
      <Link to={'/teams/register' as any}>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'w-full md:w-[200px] justify-start h-10 transition-all',
            'bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20',
            'hover:from-primary/10 hover:to-primary/20 hover:border-primary/30',
            'group',
            className,
          )}
        >
          <PlusCircle className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-primary">Create Team</span>
        </Button>
      </Link>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'w-full md:w-[260px] justify-between px-3 h-11',
          'border-border/40 bg-background/80 backdrop-blur-md',
          'hover:bg-accent/50 hover:border-border/60',
          'transition-colors duration-200',
          'shadow-sm hover:shadow-md',
          className,
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
              'text-[11px] font-bold',
              'transition-all duration-200',
              'bg-primary/10 text-primary border border-primary/20',
            )}
          >
            {activeTeam ? getInitials(activeTeam.teamName) : 'T'}
          </div>
          <div className="flex flex-col items-start overflow-hidden">
            <span className="truncate font-semibold text-sm tracking-tight">
              {activeTeam ? activeTeam.teamName : 'Select Team...'}
            </span>
            {activeTeam && (
              <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                {activeTeam.role}
              </span>
            )}
          </div>
        </div>
        <ChevronsUpDown
          className={cn(
            'ml-2 h-4 w-4 shrink-0 text-muted-foreground/50',
            'transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-[320px] p-0 overflow-hidden relative',
          'border-border/50 shadow-lg',
          'bg-popover/95 backdrop-blur-xl rounded-2xl',
          'data-closed:animate-none',
        )}
        align="end"
      >
        {/* Texture Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url('/patterns/amex-3.avif')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <Command className="bg-transparent relative z-10 p-0">
          {/* Header */}
          <div className="relative bg-muted/30 border-b border-border/50 p-3">
            <div className="absolute inset-0 opacity-10 bg-[url('/patterns/amex-3.avif')] bg-cover pointer-events-none mix-blend-overlay" />
            <div className="flex items-center gap-2 relative z-10 px-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
                Select Organization
              </span>
            </div>
          </div>

          <div className="p-2">
            <CommandInput
              placeholder="Search workspaces..."
              className="h-9 border border-border/50 rounded-lg bg-background/50 focus:ring-0 focus:border-primary/50 transition-all text-xs"
            />
          </div>

          <CommandList className="max-h-[280px] scrollbar-thin px-2 pb-2">
            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
              No workspaces found.
            </CommandEmpty>
            <CommandGroup>
              {teams.map((team) => {
                const isActive = selectedTeamId === team.teamId

                return (
                  <CommandItem
                    key={team.teamId}
                    value={team.teamName}
                    onSelect={() => {
                      setOpen(false)
                      localStorage.setItem(STORAGE_KEY, team.teamId)
                      setSelectedTeamId(team.teamId)

                      // Read matches fresh at selection time instead of subscribing to it
                      const currentMatches = router.state.matches
                      const teamMatch = [...currentMatches]
                        .reverse()
                        .find((m: any) => (m.params).teamId)
                      const leafMatch =
                        currentMatches[currentMatches.length - 1]

                      if (teamMatch && leafMatch) {
                        router.navigate({
                          to: leafMatch.routeId as any,
                          params: {
                            ...(leafMatch.params as any),
                            teamId: team.teamId,
                          },
                          search: (prev: any) => prev,
                        } as any)
                      }
                    }}
                    className={cn(
                      'flex items-center justify-between py-3 px-3 mb-1 rounded-xl cursor-pointer group transition-all duration-200',
                      isActive
                        ? 'bg-primary/5 border border-primary/10 shadow-sm'
                        : 'hover:bg-muted/50 border border-transparent hover:border-border/30',
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm transition-all duration-200',
                          'text-[10px] font-bold border',
                          isActive
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border/50 group-hover:border-primary/30 group-hover:text-foreground',
                        )}
                      >
                        {getInitials(team.teamName)}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span
                            className={cn(
                              'truncate text-sm font-semibold tracking-tight transition-colors',
                              isActive ? 'text-primary' : 'text-foreground',
                            )}
                          >
                            {team.teamName}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider truncate">
                          {team.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isActive && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse mr-2" />
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-7 w-7 rounded-md transition-all',
                          'opacity-0 group-hover:opacity-100',
                          'hover:bg-background hover:shadow-sm hover:text-primary',
                          'text-muted-foreground',
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpen(false)
                          router.navigate({
                            to: `/teams/${team.teamId}/settings`,
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

          <div className="p-3 bg-muted/20 border-t border-border/50">
            <CommandItem
              onSelect={() => {
                setOpen(false)
                router.navigate({ to: '/teams/register' as any })
              }}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer group transition-all relative overflow-hidden',
                'bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 hover:to-primary/5',
                'border border-primary/10 hover:border-primary/20 hover:shadow-sm',
              )}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-[url('/patterns/amex-3.avif')] bg-cover transition-opacity duration-500 pointer-events-none" />
              <div className="h-5 w-5 rounded-md bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                <PlusCircle className="h-3 w-3 text-primary" />
              </div>
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors relative z-10">
                Create New Workspace
              </span>
            </CommandItem>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
