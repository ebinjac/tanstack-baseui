"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Combobox,
    ComboboxInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxGroup,
    ComboboxLabel,
} from "@/components/ui/combobox";
import {
    Calendar,
    Users,
    Building2,
    Activity,
    X,
    RotateCcw,
} from "lucide-react";
import { AVAILABLE_YEARS, LEADERSHIP_TYPES } from "./constants";
import type { Team, Application, LeadershipOptions } from "./types";

interface EnterpriseFiltersProps {
    selectedYear: number;
    leadershipType: string;
    leadershipSearch: string;
    teamSearch: string;
    appSearch: string;
    onYearChange: (year: number) => void;
    onLeadershipTypeChange: (type: string) => void;
    onLeadershipSearchChange: (search: string) => void;
    onTeamSearchChange: (search: string) => void;
    onAppSearchChange: (search: string) => void;
    onClearAll: () => void;
    teams: Team[];
    applications: Application[];
    leadershipOptions?: LeadershipOptions;
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
    onClearAll,
    teams,
    applications,
    leadershipOptions,
}: EnterpriseFiltersProps) {
    const hasActiveFilters = teamSearch || appSearch || leadershipSearch || leadershipType !== "all";

    return (
        <div className="w-full border-b border-border/50 pb-6 mb-6">
            {/* Clean Inline Filter Row */}
            <div className="flex flex-wrap items-end gap-4">
                {/* Year */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Year
                    </label>
                    <Select
                        value={selectedYear.toString()}
                        onValueChange={(val) => val && onYearChange(parseInt(val))}
                    >
                        <SelectTrigger className="h-9 w-[90px] text-sm font-medium">
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

                {/* Divider */}
                <div className="h-9 w-px bg-border/60 hidden sm:block" />

                {/* Team */}
                <div className="flex flex-col gap-1.5 min-w-[180px] flex-1 max-w-[260px]">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Building2 className="h-3 w-3" /> Team
                    </label>
                    <Combobox
                        value={teamSearch}
                        onValueChange={(val) => onTeamSearchChange(val || "")}
                    >
                        <ComboboxInput
                            placeholder="All teams"
                            showClear={!!teamSearch}
                            className="h-9 text-sm"
                        />
                        <ComboboxContent className="min-w-[280px]">
                            <ComboboxList>
                                {teams.sort((a, b) => a.teamName.localeCompare(b.teamName)).map((team) => (
                                    <ComboboxItem key={team.id} value={team.teamName}>
                                        {team.teamName}
                                    </ComboboxItem>
                                ))}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </div>

                {/* Application */}
                <div className="flex flex-col gap-1.5 min-w-[180px] flex-1 max-w-[280px]">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Activity className="h-3 w-3" /> Application
                    </label>
                    <Combobox
                        value={appSearch}
                        onValueChange={(val) => onAppSearchChange(val || "")}
                    >
                        <ComboboxInput
                            placeholder="All applications"
                            showClear={!!appSearch}
                            className="h-9 text-sm"
                        />
                        <ComboboxContent className="min-w-[320px]">
                            <ComboboxList>
                                {applications
                                    .sort((a, b) => a.applicationName.localeCompare(b.applicationName))
                                    .slice(0, 100)
                                    .map((app) => (
                                        <ComboboxItem key={app.id} value={app.applicationName}>
                                            <span className="flex-1 truncate">{app.applicationName}</span>
                                            <span className="text-[10px] text-muted-foreground font-mono ml-2">{app.tla}</span>
                                        </ComboboxItem>
                                    ))}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </div>

                {/* Divider */}
                <div className="h-9 w-px bg-border/60 hidden lg:block" />

                {/* Leadership Role */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Users className="h-3 w-3" /> Role
                    </label>
                    <Select
                        value={leadershipType}
                        onValueChange={(val) => val && onLeadershipTypeChange(val)}
                    >
                        <SelectTrigger className="h-9 w-[120px] text-sm font-medium">
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
                <div className="flex flex-col gap-1.5 min-w-[160px] flex-1 max-w-[220px]">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Personnel
                    </label>
                    <Combobox
                        value={leadershipSearch}
                        onValueChange={(val) => onLeadershipSearchChange(val || "")}
                    >
                        <ComboboxInput
                            placeholder="Search by name..."
                            showClear={!!leadershipSearch}
                            className="h-9 text-sm"
                        />
                        <ComboboxContent className="min-w-[260px]">
                            <ComboboxList>
                                {(leadershipType === "all" || leadershipType === "svp") && leadershipOptions?.svp?.length ? (
                                    <ComboboxGroup>
                                        <ComboboxLabel>SVP / Executive</ComboboxLabel>
                                        {leadershipOptions.svp.filter((n): n is string => Boolean(n)).map((name) => (
                                            <ComboboxItem key={`svp-${name}`} value={name}>
                                                {name}
                                            </ComboboxItem>
                                        ))}
                                    </ComboboxGroup>
                                ) : null}
                                {(leadershipType === "all" || leadershipType === "vp") && leadershipOptions?.vp?.length ? (
                                    <ComboboxGroup>
                                        <ComboboxLabel>Vice Presidents</ComboboxLabel>
                                        {leadershipOptions.vp.filter((n): n is string => Boolean(n)).map((name) => (
                                            <ComboboxItem key={`vp-${name}`} value={name}>
                                                {name}
                                            </ComboboxItem>
                                        ))}
                                    </ComboboxGroup>
                                ) : null}
                                {(leadershipType === "all" || leadershipType === "director") && leadershipOptions?.director?.length ? (
                                    <ComboboxGroup>
                                        <ComboboxLabel>Directors</ComboboxLabel>
                                        {leadershipOptions.director.filter((n): n is string => Boolean(n)).map((name) => (
                                            <ComboboxItem key={`dir-${name}`} value={name}>
                                                {name}
                                            </ComboboxItem>
                                        ))}
                                    </ComboboxGroup>
                                ) : null}
                                {(leadershipType === "all" || leadershipType === "app_owner") && leadershipOptions?.appOwner?.length ? (
                                    <ComboboxGroup>
                                        <ComboboxLabel>App Owners</ComboboxLabel>
                                        {leadershipOptions.appOwner.filter((n): n is string => Boolean(n)).map((name) => (
                                            <ComboboxItem key={`owner-${name}`} value={name}>
                                                {name}
                                            </ComboboxItem>
                                        ))}
                                    </ComboboxGroup>
                                ) : null}
                                {(leadershipType === "all" || leadershipType === "unit_cio") && leadershipOptions?.unitCio?.length ? (
                                    <ComboboxGroup>
                                        <ComboboxLabel>Unit CIOs</ComboboxLabel>
                                        {leadershipOptions.unitCio.filter((n): n is string => Boolean(n)).map((name) => (
                                            <ComboboxItem key={`cio-${name}`} value={name}>
                                                {name}
                                            </ComboboxItem>
                                        ))}
                                    </ComboboxGroup>
                                ) : null}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </div>

                {/* Reset Button */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearAll}
                        className="h-9 px-3 text-xs font-medium text-muted-foreground hover:text-foreground gap-1.5"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                    </Button>
                )}
            </div>

            {/* Active Filters - Simple inline chips */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/30">
                    <span className="text-xs text-muted-foreground mr-1">Showing:</span>
                    {teamSearch && (
                        <Badge variant="secondary" className="h-6 text-xs font-normal gap-1 pr-1">
                            {teamSearch}
                            <X
                                className="h-3 w-3 ml-1 cursor-pointer opacity-60 hover:opacity-100"
                                onClick={() => onTeamSearchChange("")}
                            />
                        </Badge>
                    )}
                    {appSearch && (
                        <Badge variant="secondary" className="h-6 text-xs font-normal gap-1 pr-1">
                            {appSearch.length > 25 ? appSearch.slice(0, 25) + "..." : appSearch}
                            <X
                                className="h-3 w-3 ml-1 cursor-pointer opacity-60 hover:opacity-100"
                                onClick={() => onAppSearchChange("")}
                            />
                        </Badge>
                    )}
                    {leadershipSearch && (
                        <Badge variant="secondary" className="h-6 text-xs font-normal gap-1 pr-1">
                            {leadershipSearch}
                            <X
                                className="h-3 w-3 ml-1 cursor-pointer opacity-60 hover:opacity-100"
                                onClick={() => onLeadershipSearchChange("")}
                            />
                        </Badge>
                    )}
                    {leadershipType !== "all" && (
                        <Badge variant="outline" className="h-6 text-xs font-normal gap-1 pr-1">
                            {LEADERSHIP_TYPES.find(t => t.value === leadershipType)?.label}
                            <X
                                className="h-3 w-3 ml-1 cursor-pointer opacity-60 hover:opacity-100"
                                onClick={() => onLeadershipTypeChange("all")}
                            />
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}
