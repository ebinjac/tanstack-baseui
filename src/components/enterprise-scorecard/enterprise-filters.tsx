'use client'

import { Calendar, Users, X } from 'lucide-react'
import { AVAILABLE_YEARS, LEADERSHIP_TYPES } from './constants'
import type { Application, LeadershipOptions, Team } from './types'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Combobox,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from '@/components/ui/combobox'

interface EnterpriseFiltersProps {
  selectedYear: number
  leadershipType: string
  leadershipSearch: string
  teamSearch: string
  appSearch: string
  onYearChange: (year: number) => void
  onLeadershipTypeChange: (type: string) => void
  onLeadershipSearchChange: (search: string) => void
  onTeamSearchChange: (search: string) => void
  onAppSearchChange: (search: string) => void
  onClearAll: () => void
  teams: Array<Team>
  applications: Array<Application>
  leadershipOptions?: LeadershipOptions
}

export function EnterpriseFilters({
  selectedYear,
  leadershipType,
  leadershipSearch,
  teamSearch,
  appSearch,
  onYearChange,
  onLeadershipTypeChange,
  onLeadershipSearchChange,
  onTeamSearchChange,
  onAppSearchChange,
  teams,
  applications,
  leadershipOptions,
}: EnterpriseFiltersProps) {
  const hasActiveFilters =
    teamSearch || appSearch || leadershipSearch || leadershipType !== 'all'

  return (
    <div className="flex flex-col gap-5 w-full bg-card p-4 md:p-5 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden">
      {/* Subtle Pattern Background */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('/patterns/amex-3.avif')] bg-cover pointer-events-none mix-blend-overlay" />

      <div className="relative z-10 flex flex-col xl:flex-row gap-6 xl:gap-8 items-start xl:items-end">
        {/* Scope Group */}
        <div className="flex flex-wrap gap-4 items-end flex-1 w-full">
          {/* Year Selector */}
          <div className="space-y-1.5 flex flex-col w-[120px] shrink-0">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Period</label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(val) => val && onYearChange(parseInt(val))}
            >
              <SelectTrigger className="w-full">
                <Calendar className="h-4 w-4 mr-2 opacity-50" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Search */}
          <div className="space-y-1.5 flex flex-col flex-1 min-w-[200px] max-w-[320px]">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Organization</label>
            <Combobox
              value={teamSearch}
              onValueChange={(val) => onTeamSearchChange(val || '')}
            >
              <ComboboxInput
                placeholder="Filter by Team"
                showClear={!!teamSearch}
              />
              <ComboboxContent className="min-w-[260px]">
                <ComboboxList>
                  {teams
                    .sort((a, b) => a.teamName.localeCompare(b.teamName))
                    .map((team) => (
                      <ComboboxItem
                        key={team.id}
                        value={team.teamName}
                      >
                        {team.teamName}
                      </ComboboxItem>
                    ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          {/* Application Search */}
          <div className="space-y-1.5 flex flex-col flex-1 min-w-[220px] max-w-[360px]">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Application</label>
            <Combobox
              value={appSearch}
              onValueChange={(val) => onAppSearchChange(val || '')}
            >
              <ComboboxInput
                placeholder="Filter by Application"
                showClear={!!appSearch}
              />
              <ComboboxContent className="min-w-[300px]">
                <ComboboxList>
                  {applications
                    .sort((a, b) =>
                      a.applicationName.localeCompare(b.applicationName),
                    )
                    .slice(0, 100)
                    .map((app) => (
                      <ComboboxItem
                        key={app.id}
                        value={app.applicationName}
                      >
                        <div className="flex flex-col">
                          <span>{app.applicationName}</span>
                          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                            {app.tla} • {app.assetId}
                          </span>
                        </div>
                      </ComboboxItem>
                    ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden xl:block w-px h-12 bg-border/60 shrink-0 self-end mb-1" />
        <div className="block xl:hidden w-full h-px bg-border/60 mt-2 mb-[-12px] shrink-0" />

        {/* Personnel Group */}
        <div className="flex flex-wrap gap-4 items-end w-full xl:w-auto shrink-0">
          {/* Leadership Type */}
          <div className="space-y-1.5 flex flex-col w-[160px] shrink-0">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Leadership Level</label>
            <Select
              value={leadershipType}
              onValueChange={(val) => val && onLeadershipTypeChange(val)}
            >
              <SelectTrigger className="w-full">
                <Users className="h-4 w-4 mr-2 opacity-50" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEADERSHIP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Personnel Search */}
          <div className="space-y-1.5 flex flex-col flex-1 min-w-[200px] max-w-[320px] xl:w-[260px]">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">Personnel</label>
            <Combobox
              value={leadershipSearch}
              onValueChange={(val) => onLeadershipSearchChange(val || '')}
            >
              <ComboboxInput
                placeholder="Leadership Search"
                showClear={!!leadershipSearch}
              />
              <ComboboxContent className="min-w-[260px]">
                <ComboboxList>
                  {leadershipOptions?.svp &&
                    (leadershipType === 'all' || leadershipType === 'svp') && (
                      <ComboboxGroup>
                        <ComboboxLabel className="text-[9px] font-bold uppercase tracking-widest px-2 py-1.5 opacity-60">
                          SVP / Executive
                        </ComboboxLabel>
                        {leadershipOptions.svp
                          .filter((n): n is string => Boolean(n))
                          .map((name) => (
                            <ComboboxItem
                              key={`svp-${name}`}
                              value={name}
                              className="font-bold"
                            >
                              {name}
                            </ComboboxItem>
                          ))}
                      </ComboboxGroup>
                    )}
                  {leadershipOptions?.vp &&
                    (leadershipType === 'all' || leadershipType === 'vp') && (
                      <ComboboxGroup>
                        <ComboboxLabel className="text-[9px] font-bold uppercase tracking-widest px-2 py-1.5 opacity-60">
                          Vice Presidents
                        </ComboboxLabel>
                        {leadershipOptions.vp
                          .filter((n): n is string => Boolean(n))
                          .map((name) => (
                            <ComboboxItem
                              key={`vp-${name}`}
                              value={name}
                              className="font-bold"
                            >
                              {name}
                            </ComboboxItem>
                          ))}
                      </ComboboxGroup>
                    )}
                  {leadershipOptions?.director &&
                    (leadershipType === 'all' ||
                      leadershipType === 'director') && (
                      <ComboboxGroup>
                        <ComboboxLabel className="text-[9px] font-bold uppercase tracking-widest px-2 py-1.5 opacity-60">
                          Directors
                        </ComboboxLabel>
                        {leadershipOptions.director
                          .filter((n): n is string => Boolean(n))
                          .map((name) => (
                            <ComboboxItem
                              key={`dir-${name}`}
                              value={name}
                              className="font-bold"
                            >
                              {name}
                            </ComboboxItem>
                          ))}
                      </ComboboxGroup>
                    )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
      </div>

      {/* Active Filters - Simple inline chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/30">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-1">
            Active:
          </span>
          {teamSearch && (
            <Badge
              variant="secondary"
              className="h-6 text-[10px] font-bold gap-1 pr-1 rounded-lg"
            >
              {teamSearch}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTeamSearchChange('')
                }}
                className="hover:bg-muted-foreground/20 rounded-sm transition-colors p-0.5"
              >
                <X className="h-3 w-3 opacity-60 hover:opacity-100" />
              </button>
            </Badge>
          )}
          {appSearch && (
            <Badge
              variant="secondary"
              className="h-6 text-[10px] font-bold gap-1 pr-1 rounded-lg"
            >
              {appSearch.length > 25
                ? appSearch.slice(0, 25) + '...'
                : appSearch}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAppSearchChange('')
                }}
                className="hover:bg-muted-foreground/20 rounded-sm transition-colors p-0.5"
              >
                <X className="h-3 w-3 opacity-60 hover:opacity-100" />
              </button>
            </Badge>
          )}
          {leadershipSearch && (
            <Badge
              variant="secondary"
              className="h-6 text-[10px] font-bold gap-1 pr-1 rounded-lg"
            >
              {leadershipSearch}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLeadershipSearchChange('')
                }}
                className="hover:bg-muted-foreground/20 rounded-sm transition-colors p-0.5"
              >
                <X className="h-3 w-3 opacity-60 hover:opacity-100" />
              </button>
            </Badge>
          )}
          {leadershipType !== 'all' && (
            <Badge
              variant="outline"
              className="h-6 text-[10px] font-bold gap-1 pr-1 rounded-lg border-primary/30 text-primary"
            >
              {LEADERSHIP_TYPES.find((t) => t.value === leadershipType)?.label}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLeadershipTypeChange('all')
                }}
                className="hover:bg-primary/10 rounded-sm transition-colors p-0.5"
              >
                <X className="h-3 w-3 opacity-60 hover:opacity-100" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
