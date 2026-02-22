"use client";

import { Calendar, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Combobox,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_YEARS, LEADERSHIP_TYPES } from "./constants";
import type { Application, LeadershipOptions, Team } from "./types";

interface EnterpriseFiltersProps {
  applications: Application[];
  appSearch: string;
  leadershipOptions?: LeadershipOptions;
  leadershipSearch: string;
  leadershipType: string;
  onAppSearchChange: (search: string) => void;
  onClearAll: () => void;
  onLeadershipSearchChange: (search: string) => void;
  onLeadershipTypeChange: (type: string) => void;
  onTeamSearchChange: (search: string) => void;
  onYearChange: (year: number) => void;
  selectedYear: number;
  teamSearch: string;
  teams: Team[];
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
    teamSearch || appSearch || leadershipSearch || leadershipType !== "all";

  return (
    <div className="relative flex w-full flex-col gap-5 overflow-hidden rounded-2xl border border-border/50 bg-card p-4 shadow-sm md:p-5">
      {/* Subtle Pattern Background */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/amex-3.avif')] bg-cover opacity-[0.02] mix-blend-overlay" />

      <div className="relative z-10 flex flex-col items-start gap-6 xl:flex-row xl:items-end xl:gap-8">
        {/* Scope Group */}
        <div className="flex w-full flex-1 flex-wrap items-end gap-4">
          {/* Year Selector */}
          <div className="flex w-[120px] shrink-0 flex-col space-y-1.5">
            <label
              className="ml-1 font-bold text-[10px] text-muted-foreground/70 uppercase tracking-widest"
              htmlFor="period-select"
            >
              Period
            </label>
            <Select
              onValueChange={(val) =>
                val && onYearChange(Number.parseInt(val, 10))
              }
              value={selectedYear.toString()}
            >
              <SelectTrigger className="w-full" id="period-select">
                <Calendar className="mr-2 h-4 w-4 opacity-50" />
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
          <div className="flex min-w-[200px] max-w-[320px] flex-1 flex-col space-y-1.5">
            <label
              className="ml-1 font-bold text-[10px] text-muted-foreground/70 uppercase tracking-widest"
              htmlFor="team-search"
            >
              Organization
            </label>
            <Combobox
              onValueChange={(val) => onTeamSearchChange(val || "")}
              value={teamSearch}
            >
              <ComboboxInput
                id="team-search"
                placeholder="Filter by Team"
                showClear={!!teamSearch}
              />
              <ComboboxContent className="min-w-[260px]">
                <ComboboxList>
                  {teams
                    .sort((a, b) => a.teamName.localeCompare(b.teamName))
                    .map((team) => (
                      <ComboboxItem key={team.id} value={team.teamName}>
                        {team.teamName}
                      </ComboboxItem>
                    ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          {/* Application Search */}
          <div className="flex min-w-[220px] max-w-[360px] flex-1 flex-col space-y-1.5">
            <label
              className="ml-1 font-bold text-[10px] text-muted-foreground/70 uppercase tracking-widest"
              htmlFor="app-search"
            >
              Application
            </label>
            <Combobox
              onValueChange={(val) => onAppSearchChange(val || "")}
              value={appSearch}
            >
              <ComboboxInput
                id="app-search"
                placeholder="Filter by Application"
                showClear={!!appSearch}
              />
              <ComboboxContent className="min-w-[300px]">
                <ComboboxList>
                  {applications
                    .sort((a, b) =>
                      a.applicationName.localeCompare(b.applicationName)
                    )
                    .slice(0, 100)
                    .map((app) => (
                      <ComboboxItem key={app.id} value={app.applicationName}>
                        <div className="flex flex-col">
                          <span>{app.applicationName}</span>
                          <span className="font-bold text-[9px] text-muted-foreground uppercase tracking-widest">
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
        <div className="mb-1 hidden h-12 w-px shrink-0 self-end bg-border/60 xl:block" />
        <div className="mt-2 mb-[-12px] block h-px w-full shrink-0 bg-border/60 xl:hidden" />

        {/* Personnel Group */}
        <div className="flex w-full shrink-0 flex-wrap items-end gap-4 xl:w-auto">
          {/* Leadership Type */}
          <div className="flex w-[160px] shrink-0 flex-col space-y-1.5">
            <label
              className="ml-1 font-bold text-[10px] text-muted-foreground/70 uppercase tracking-widest"
              htmlFor="leadership-level"
            >
              Leadership Level
            </label>
            <Select
              onValueChange={(val) => val && onLeadershipTypeChange(val)}
              value={leadershipType}
            >
              <SelectTrigger className="w-full" id="leadership-level">
                <Users className="mr-2 h-4 w-4 opacity-50" />
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
          <div className="flex min-w-[200px] max-w-[320px] flex-1 flex-col space-y-1.5 xl:w-[260px]">
            <label
              className="ml-1 font-bold text-[10px] text-muted-foreground/70 uppercase tracking-widest"
              htmlFor="personnel-search"
            >
              Personnel
            </label>
            <Combobox
              onValueChange={(val) => onLeadershipSearchChange(val || "")}
              value={leadershipSearch}
            >
              <ComboboxInput
                id="personnel-search"
                placeholder="Leadership Search"
                showClear={!!leadershipSearch}
              />
              <ComboboxContent className="min-w-[260px]">
                <ComboboxList>
                  {leadershipOptions?.svp &&
                    (leadershipType === "all" || leadershipType === "svp") && (
                      <ComboboxGroup>
                        <ComboboxLabel className="px-2 py-1.5 font-bold text-[9px] uppercase tracking-widest opacity-60">
                          SVP / Executive
                        </ComboboxLabel>
                        {leadershipOptions.svp
                          .filter((n): n is string => Boolean(n))
                          .map((name) => (
                            <ComboboxItem
                              className="font-bold"
                              key={`svp-${name}`}
                              value={name}
                            >
                              {name}
                            </ComboboxItem>
                          ))}
                      </ComboboxGroup>
                    )}
                  {leadershipOptions?.vp &&
                    (leadershipType === "all" || leadershipType === "vp") && (
                      <ComboboxGroup>
                        <ComboboxLabel className="px-2 py-1.5 font-bold text-[9px] uppercase tracking-widest opacity-60">
                          Vice Presidents
                        </ComboboxLabel>
                        {leadershipOptions.vp
                          .filter((n): n is string => Boolean(n))
                          .map((name) => (
                            <ComboboxItem
                              className="font-bold"
                              key={`vp-${name}`}
                              value={name}
                            >
                              {name}
                            </ComboboxItem>
                          ))}
                      </ComboboxGroup>
                    )}
                  {leadershipOptions?.director &&
                    (leadershipType === "all" ||
                      leadershipType === "director") && (
                      <ComboboxGroup>
                        <ComboboxLabel className="px-2 py-1.5 font-bold text-[9px] uppercase tracking-widest opacity-60">
                          Directors
                        </ComboboxLabel>
                        {leadershipOptions.director
                          .filter((n): n is string => Boolean(n))
                          .map((name) => (
                            <ComboboxItem
                              className="font-bold"
                              key={`dir-${name}`}
                              value={name}
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
        <div className="flex flex-wrap items-center gap-2 border-border/30 border-t pt-2">
          <span className="mr-1 font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
            Active:
          </span>
          {teamSearch && (
            <Badge
              className="h-6 gap-1 rounded-lg pr-1 font-bold text-[10px]"
              variant="secondary"
            >
              {teamSearch}
              <button
                className="rounded-sm p-0.5 transition-colors hover:bg-muted-foreground/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onTeamSearchChange("");
                }}
                type="button"
              >
                <X className="h-3 w-3 opacity-60 hover:opacity-100" />
              </button>
            </Badge>
          )}
          {appSearch && (
            <Badge
              className="h-6 gap-1 rounded-lg pr-1 font-bold text-[10px]"
              variant="secondary"
            >
              {appSearch.length > 25
                ? `${appSearch.slice(0, 25)}...`
                : appSearch}
              <button
                className="rounded-sm p-0.5 transition-colors hover:bg-muted-foreground/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onAppSearchChange("");
                }}
                type="button"
              >
                <X className="h-3 w-3 opacity-60 hover:opacity-100" />
              </button>
            </Badge>
          )}
          {leadershipSearch && (
            <Badge
              className="h-6 gap-1 rounded-lg pr-1 font-bold text-[10px]"
              variant="secondary"
            >
              {leadershipSearch}
              <button
                className="rounded-sm p-0.5 transition-colors hover:bg-muted-foreground/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onLeadershipSearchChange("");
                }}
                type="button"
              >
                <X className="h-3 w-3 opacity-60 hover:opacity-100" />
              </button>
            </Badge>
          )}
          {leadershipType !== "all" && (
            <Badge
              className="h-6 gap-1 rounded-lg border-primary/30 pr-1 font-bold text-[10px] text-primary"
              variant="outline"
            >
              {LEADERSHIP_TYPES.find((t) => t.value === leadershipType)?.label}
              <button
                className="rounded-sm p-0.5 transition-colors hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onLeadershipTypeChange("all");
                }}
                type="button"
              >
                <X className="h-3 w-3 opacity-60 hover:opacity-100" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
