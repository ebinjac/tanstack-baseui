import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
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
    ComboboxEmpty,
} from "@/components/ui/combobox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    ChevronRight,
    BarChart3,
    Activity,
    AlertTriangle,
    Loader2,
    Hash,
    Calendar,
    Filter,
    Users,
    Building2,
    Lock,
    Eye,
    Layers,
    X,
    Download,
    FileSpreadsheet,
    FileText,
} from "lucide-react";
import { getGlobalScorecardData } from "@/app/actions/scorecard";

export const Route = createFileRoute("/scorecard")({
    component: GlobalScorecardPage,
});

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Get current date info
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

// Available years
const AVAILABLE_YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

// Leadership filter types
const LEADERSHIP_TYPES = [
    { value: "all", label: "All Leadership" },
    { value: "svp", label: "SVP" },
    { value: "vp", label: "VP" },
    { value: "director", label: "Director" },
    { value: "app_owner", label: "Application Owner" },
    { value: "app_manager", label: "Application Manager" },
    { value: "unit_cio", label: "Unit CIO" },
];

// Type definitions
interface Team {
    id: string;
    teamName: string;
}

interface Application {
    id: string;
    teamId: string;
    applicationName: string;
    tla: string;
    tier: string | null;
    assetId: number;
    ownerSvpName: string | null;
    vpName: string | null;
    directorName: string | null;
    applicationOwnerName: string | null;
    applicationManagerName: string | null;
    unitCioName: string | null;
}

interface ScorecardEntry {
    id: string;
    applicationId: string;
    scorecardIdentifier: string;
    name: string;
    availabilityThreshold: string;
    volumeChangeThreshold: string;
}

interface AvailabilityRecord {
    id: string;
    scorecardEntryId: string;
    year: number;
    month: number;
    availability: string;
    reason: string | null;
}

interface VolumeRecord {
    id: string;
    scorecardEntryId: string;
    year: number;
    month: number;
    volume: number;
    reason: string | null;
}

function GlobalScorecardPage() {
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [leadershipType, setLeadershipType] = useState<string>("all");
    const [leadershipSearch, setLeadershipSearch] = useState<string>("");
    const [teamSearch, setTeamSearch] = useState<string>("");
    const [appSearch, setAppSearch] = useState<string>("");
    const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
    const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
    const [viewTeam, setViewTeam] = useState<Team | null>(null);
    const [drawerRange, setDrawerRange] = useState<string>("full");

    // Calculate visible months for the drawer/detail view
    const visibleMonths = useMemo(() => {
        if (drawerRange === "full") {
            return MONTHS.map((_, i) => ({ month: i + 1, year: selectedYear }));
        }

        const isCurrentYear = selectedYear === currentYear;
        const endMonth = isCurrentYear ? currentMonth : 12;

        if (drawerRange === "ytd") {
            return Array.from({ length: endMonth }, (_, i) => ({ month: i + 1, year: selectedYear }));
        }

        let count = 3;
        if (drawerRange === "last6") count = 6;
        if (drawerRange === "last12") count = 12;

        const result: { month: number; year: number }[] = [];
        let currM = endMonth;
        let currY = selectedYear;

        for (let i = 0; i < count; i++) {
            result.unshift({ month: currM, year: currY });
            currM--;
            if (currM < 1) {
                currM = 12;
                currY--;
            }
        }
        return result;
    }, [drawerRange, selectedYear, currentMonth]);

    const handleExportCSV = (team: Team) => {
        const apps = appsByTeam[team.id] || [];
        let csv = "Ensemble Scorecard Report\n";
        csv += `Team: ${team.teamName}\n`;
        csv += `Year: ${selectedYear}\n`;
        csv += `Range: ${drawerRange.toUpperCase()}\n\n`;

        csv += "Application,Asset ID,Metric,Identifier,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,Average/Total\n";

        apps.forEach(app => {
            const entries = entriesByApp[app.id] || [];
            entries.forEach(entry => {
                // Availability row
                let availRow = `"${app.applicationName}",${app.assetId},"${entry.name} (Availability)","${entry.scorecardIdentifier}"`;
                let sumAvail = 0;
                let countAvail = 0;
                for (let m = 1; m <= 12; m++) {
                    const key = `${selectedYear}-${m}`;
                    const val = availabilityByEntry[entry.id]?.[key]?.availability;
                    availRow += `,${val ? parseFloat(val).toFixed(2) : ""}`;
                    if (val) {
                        sumAvail += parseFloat(val);
                        countAvail++;
                    }
                }
                csv += availRow + `,${countAvail > 0 ? (sumAvail / countAvail).toFixed(2) : ""}\n`;

                // Volume row
                let volRow = `"",,"${entry.name} (Volume)",""`;
                let totalVol = 0;
                for (let m = 1; m <= 12; m++) {
                    const key = `${selectedYear}-${m}`;
                    const val = volumeByEntry[entry.id]?.[key]?.volume;
                    volRow += `,${val || ""}`;
                    if (val) totalVol += val;
                }
                csv += volRow + `,${totalVol}\n`;
            });
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${team.teamName.replace(/\s+/g, "_")}_Scorecard_${selectedYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Fetch global scorecard data
    const { data: scorecardData, isLoading } = useQuery({
        queryKey: ["global-scorecard", selectedYear, leadershipType, leadershipSearch],
        queryFn: () => getGlobalScorecardData({
            data: {
                year: selectedYear,
                leadershipFilter: leadershipSearch || undefined,
                leadershipType: leadershipType !== "all" ? leadershipType : undefined,
            },
        }),
    });

    // Build lookup maps and apply client-side team/app filtering
    const { appsByTeam, entriesByApp, availabilityByEntry, volumeByEntry } = useMemo(() => {
        const appsByTeam: Record<string, Application[]> = {};
        const entriesByApp: Record<string, ScorecardEntry[]> = {};
        const availabilityByEntry: Record<string, Record<string, AvailabilityRecord>> = {};
        const volumeByEntry: Record<string, Record<string, VolumeRecord>> = {};

        // Filter apps by name if search is active
        const filteredApps = (scorecardData?.applications || []).filter((app: Application) => {
            const matchesApp = !appSearch || app.applicationName.toLowerCase().includes(appSearch.toLowerCase());
            const team = (scorecardData?.teams || []).find((t: Team) => t.id === app.teamId);
            const matchesTeam = !teamSearch || team?.teamName.toLowerCase().includes(teamSearch.toLowerCase());
            return matchesApp && matchesTeam;
        });

        filteredApps.forEach((app: Application) => {
            if (!appsByTeam[app.teamId]) {
                appsByTeam[app.teamId] = [];
            }
            appsByTeam[app.teamId].push(app);
        });

        scorecardData?.entries?.forEach((entry: ScorecardEntry) => {
            if (!entriesByApp[entry.applicationId]) {
                entriesByApp[entry.applicationId] = [];
            }
            entriesByApp[entry.applicationId].push(entry);
        });

        scorecardData?.availability?.forEach((av: AvailabilityRecord) => {
            if (!availabilityByEntry[av.scorecardEntryId]) {
                availabilityByEntry[av.scorecardEntryId] = {};
            }
            availabilityByEntry[av.scorecardEntryId][`${av.year}-${av.month}`] = av;
        });

        scorecardData?.volume?.forEach((vol: VolumeRecord) => {
            if (!volumeByEntry[vol.scorecardEntryId]) {
                volumeByEntry[vol.scorecardEntryId] = {};
            }
            volumeByEntry[vol.scorecardEntryId][`${vol.year}-${vol.month}`] = vol;
        });

        return { appsByTeam, entriesByApp, availabilityByEntry, volumeByEntry };
    }, [scorecardData, teamSearch, appSearch]);

    // Teams with data after filtering
    const teamsWithApps = useMemo(() => {
        return (scorecardData?.teams || []).filter(
            (team: Team) => appsByTeam[team.id]?.length > 0
        ).sort((a: Team, b: Team) => a.teamName.localeCompare(b.teamName));
    }, [scorecardData, appsByTeam]);

    // Auto-expand all teams when data loads
    useEffect(() => {
        if (teamsWithApps.length > 0) {
            setExpandedTeams(new Set(teamsWithApps.map((t: Team) => t.id)));
        }
    }, [teamsWithApps]);

    // Stats
    const stats = useMemo(() => {
        const teams = teamsWithApps.length;
        const apps = scorecardData?.applications?.length || 0;
        const entries = scorecardData?.entries?.length || 0;

        let availBreaches = 0;
        scorecardData?.entries?.forEach((entry: ScorecardEntry) => {
            const threshold = parseFloat(entry.availabilityThreshold);
            const entryAvail = availabilityByEntry[entry.id] || {};
            Object.values(entryAvail).forEach((av: any) => {
                if (parseFloat(av.availability) < threshold) {
                    availBreaches++;
                }
            });
        });

        return { teams, apps, entries, availBreaches };
    }, [teamsWithApps, scorecardData, availabilityByEntry]);

    const toggleTeam = (teamId: string) => {
        setExpandedTeams((prev) => {
            const next = new Set(prev);
            if (next.has(teamId)) {
                next.delete(teamId);
            } else {
                next.add(teamId);
            }
            return next;
        });
    };

    const toggleApp = (appId: string) => {
        setExpandedApps((prev) => {
            const next = new Set(prev);
            if (next.has(appId)) {
                next.delete(appId);
            } else {
                next.add(appId);
            }
            return next;
        });
    };

    // Get leadership display for an application
    const getLeadershipDisplay = (app: Application) => {
        const leaders: { role: string; name: string }[] = [];
        if (app.ownerSvpName) leaders.push({ role: "SVP", name: app.ownerSvpName });
        if (app.vpName) leaders.push({ role: "VP", name: app.vpName });
        if (app.directorName) leaders.push({ role: "Dir", name: app.directorName });
        if (app.applicationOwnerName) leaders.push({ role: "Owner", name: app.applicationOwnerName });
        return leaders.slice(0, 3);
    };

    return (
        <div className="container mx-auto py-6 px-4 max-w-7xl space-y-4">
            {/* Compact Header & Stats Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-muted/60 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Enterprise Scorecard</h1>
                        <p className="text-xs text-muted-foreground">Availability & volume across teams</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg border border-transparent hover:border-muted-foreground/20 transition-all">
                        <Layers className="h-4 w-4 text-blue-500" />
                        <div>
                            <p className="text-xs text-muted-foreground leading-none">Teams</p>
                            <p className="text-sm font-bold">{stats.teams}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg border border-transparent hover:border-muted-foreground/20 transition-all">
                        <Activity className="h-4 w-4 text-indigo-500" />
                        <div>
                            <p className="text-xs text-muted-foreground leading-none">Apps</p>
                            <p className="text-sm font-bold">{stats.apps}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-lg border border-transparent hover:border-muted-foreground/20 transition-all">
                        <Hash className="h-4 w-4 text-green-500" />
                        <div>
                            <p className="text-xs text-muted-foreground leading-none">Entries</p>
                            <p className="text-sm font-bold">{stats.entries}</p>
                        </div>
                    </div>
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                        stats.availBreaches > 0
                            ? "bg-red-500/5 border-red-500/20 text-red-600"
                            : "bg-muted/40 border-transparent text-foreground"
                    )}>
                        <AlertTriangle className={cn("h-4 w-4", stats.availBreaches > 0 ? "text-red-500" : "text-muted-foreground")} />
                        <div>
                            <p className="text-xs opacity-70 leading-none">Breaches</p>
                            <p className="text-sm font-bold">{stats.availBreaches}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Filters Card */}
            {/* Filters Card */}
            <Card className="shadow-md border-muted/50 overflow-visible bg-muted/5">
                <CardContent className="p-5">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between border-b pb-4 border-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <Filter className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Advanced Filters</h2>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Refine your enterprise results</p>
                                </div>
                            </div>

                            {(leadershipSearch || leadershipType !== "all" || teamSearch || appSearch) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setLeadershipType("all");
                                        setLeadershipSearch("");
                                        setTeamSearch("");
                                        setAppSearch("");
                                    }}
                                    className="h-8 text-[11px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    Clear All Filters
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                            {/* Year Filter */}
                            <div className="flex flex-col gap-2">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Fiscal Year</Label>
                                <Select
                                    value={selectedYear.toString()}
                                    onValueChange={(val) => val && setSelectedYear(parseInt(val))}
                                >
                                    <SelectTrigger className="h-10 w-full bg-background border-muted/40 shadow-sm transition-all focus:border-primary/50">
                                        <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
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

                            {/* Team Name Filter */}
                            <div className="flex flex-col gap-2 lg:col-span-1">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Team Name</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                    <Input
                                        placeholder="Filter by team..."
                                        value={teamSearch}
                                        onChange={(e) => setTeamSearch(e.target.value)}
                                        className="h-10 pl-9 bg-background border-muted/40 shadow-sm transition-all focus:border-primary/50"
                                    />
                                </div>
                            </div>

                            {/* Application Filter */}
                            <div className="flex flex-col gap-2 lg:col-span-1">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Application</Label>
                                <div className="relative">
                                    <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                    <Input
                                        placeholder="Search apps..."
                                        value={appSearch}
                                        onChange={(e) => setAppSearch(e.target.value)}
                                        className="h-10 pl-9 bg-background border-muted/40 shadow-sm transition-all focus:border-primary/50"
                                    />
                                </div>
                            </div>

                            {/* Leadership Role Filter */}
                            <div className="flex flex-col gap-2 lg:col-span-1">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Leadership Role</Label>
                                <Select
                                    value={leadershipType}
                                    onValueChange={(val) => val && setLeadershipType(val)}
                                >
                                    <SelectTrigger className="h-10 w-full bg-background border-muted/40 shadow-sm transition-all focus:border-primary/50">
                                        <Users className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                        <SelectValue>
                                            <span className="uppercase text-[11px] font-bold tracking-wider">{LEADERSHIP_TYPES.find(t => t.value === leadershipType)?.label}</span>
                                        </SelectValue>
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

                            {/* Leadership Name Search */}
                            <div className="flex flex-col gap-2 lg:col-span-2">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Search Leader</Label>
                                <Combobox
                                    value={leadershipSearch}
                                    onValueChange={(val) => setLeadershipSearch(val || "")}
                                >
                                    <ComboboxInput
                                        placeholder="Type to find SVP, VP..."
                                        showClear={!!leadershipSearch}
                                        className="h-10 bg-background border-muted/40 shadow-sm transition-all focus:border-primary/50"
                                    />
                                    <ComboboxContent>
                                        <ComboboxList>
                                            <ComboboxEmpty>No leaders matched</ComboboxEmpty>
                                            {leadershipType === "all" || leadershipType === "svp" ? (
                                                <ComboboxGroup>
                                                    <ComboboxLabel>SVP</ComboboxLabel>
                                                    {(scorecardData?.leadershipOptions?.svp || []).filter((n): n is string => Boolean(n)).map((name) => (
                                                        <ComboboxItem key={`svp-${name}`} value={name}>
                                                            {name}
                                                        </ComboboxItem>
                                                    ))}
                                                </ComboboxGroup>
                                            ) : null}
                                            {leadershipType === "all" || leadershipType === "vp" ? (
                                                <ComboboxGroup>
                                                    <ComboboxLabel>VP</ComboboxLabel>
                                                    {(scorecardData?.leadershipOptions?.vp || []).filter((n): n is string => Boolean(n)).map((name) => (
                                                        <ComboboxItem key={`vp-${name}`} value={name}>
                                                            {name}
                                                        </ComboboxItem>
                                                    ))}
                                                </ComboboxGroup>
                                            ) : null}
                                            {leadershipType === "all" || leadershipType === "director" ? (
                                                <ComboboxGroup>
                                                    <ComboboxLabel>Director</ComboboxLabel>
                                                    {(scorecardData?.leadershipOptions?.director || []).filter((n): n is string => Boolean(n)).map((name) => (
                                                        <ComboboxItem key={`dir-${name}`} value={name}>
                                                            {name}
                                                        </ComboboxItem>
                                                    ))}
                                                </ComboboxGroup>
                                            ) : null}
                                            {leadershipType === "all" || leadershipType === "app_owner" ? (
                                                <ComboboxGroup>
                                                    <ComboboxLabel>Application Owner</ComboboxLabel>
                                                    {(scorecardData?.leadershipOptions?.appOwner || []).filter((n): n is string => Boolean(n)).map((name) => (
                                                        <ComboboxItem key={`owner-${name}`} value={name}>
                                                            {name}
                                                        </ComboboxItem>
                                                    ))}
                                                </ComboboxGroup>
                                            ) : null}
                                            {leadershipType === "all" || leadershipType === "unit_cio" ? (
                                                <ComboboxGroup>
                                                    <ComboboxLabel>Unit CIO</ComboboxLabel>
                                                    {(scorecardData?.leadershipOptions?.unitCio || []).filter((n): n is string => Boolean(n)).map((name) => (
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
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <Card className="shadow-sm border-muted/60">
                <CardHeader className="py-3 px-4 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                Team Scorecards
                            </CardTitle>
                            <CardDescription className="text-xs">
                                All teams are expanded by default to show applications for {selectedYear}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : teamsWithApps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold">No Data Found</h3>
                            <p className="text-muted-foreground text-sm max-w-md mt-2">
                                {leadershipSearch || leadershipType !== "all"
                                    ? "No applications match the current filters. Try adjusting your search criteria."
                                    : "No teams have applications with scorecard data yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {teamsWithApps.map((team: Team) => (
                                <TeamSection
                                    key={team.id}
                                    team={team}
                                    isExpanded={expandedTeams.has(team.id)}
                                    onToggle={() => toggleTeam(team.id)}
                                    applications={appsByTeam[team.id] || []}
                                    entriesByApp={entriesByApp}
                                    availabilityByEntry={availabilityByEntry}
                                    volumeByEntry={volumeByEntry}
                                    expandedApps={expandedApps}
                                    onToggleApp={toggleApp}
                                    selectedYear={selectedYear}
                                    getLeadershipDisplay={getLeadershipDisplay}
                                    onViewFull={() => setViewTeam(team)}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Team Scorecard Drawer */}
            <Drawer open={!!viewTeam} onOpenChange={(open) => !open && setViewTeam(null)} direction="right">
                <DrawerContent className="h-full w-screen !max-w-full p-0 flex flex-col focus:outline-none rounded-none border-none shadow-none">
                    {viewTeam && (
                        <div className="flex flex-col h-full bg-background rounded-l-2xl overflow-hidden">
                            <DrawerHeader className="p-4 border-b bg-muted/20 shrink-0">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-6">
                                        <div className="flex-shrink-0">
                                            <DrawerTitle className="text-xl font-bold flex items-center gap-2 tracking-tight">
                                                <Building2 className="h-5 w-5 text-primary" />
                                                {viewTeam.teamName}
                                            </DrawerTitle>
                                            <DrawerDescription className="text-xs font-medium text-muted-foreground/80">
                                                Enterprise Scorecard • {selectedYear}
                                            </DrawerDescription>
                                        </div>

                                        <div className="h-8 w-px bg-muted-foreground/20 hidden md:block" />

                                        {/* Range Filter */}
                                        <div className="flex items-center gap-2 bg-background/50 p-1 rounded-lg border border-muted/50 hidden md:flex">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Range</span>
                                            {[
                                                { id: 'full', label: 'Full Year' },
                                                { id: 'ytd', label: 'YTD' },
                                                { id: 'last3', label: 'Last 3M' },
                                                { id: 'last6', label: 'Last 6M' },
                                                { id: 'last12', label: 'Last 12M' }
                                            ].map((r) => (
                                                <button
                                                    key={r.id}
                                                    onClick={() => setDrawerRange(r.id)}
                                                    className={cn(
                                                        "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all uppercase tracking-wider",
                                                        drawerRange === r.id
                                                            ? "bg-primary text-primary-foreground shadow-sm"
                                                            : "text-muted-foreground hover:bg-muted"
                                                    )}
                                                >
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleExportCSV(viewTeam)}
                                            className="h-9 px-3 gap-2 bg-background/80 border-muted/50 hover:border-primary/50 transition-all font-bold text-[11px] uppercase tracking-wider"
                                        >
                                            <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />
                                            CSV
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.print()}
                                            className="h-9 px-3 gap-2 bg-background/80 border-muted/50 hover:border-primary/50 transition-all font-bold text-[11px] uppercase tracking-wider"
                                        >
                                            <FileText className="h-3.5 w-3.5 text-red-600" />
                                            PDF
                                        </Button>

                                        <div className="h-8 w-px bg-muted-foreground/20 mx-1" />

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setViewTeam(null)}
                                            className="rounded-full h-8 w-8 hover:bg-muted transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </DrawerHeader>

                            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-8 pb-10">
                                {(appsByTeam[viewTeam.id] || []).map((app) => (
                                    <div key={app.id} className="space-y-4">
                                        <div className="flex items-center justify-between bg-muted/10 p-4 rounded-xl border border-muted/30">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                    <Activity className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-bold tracking-tight">
                                                            {app.applicationName}
                                                        </h3>
                                                        <Badge variant="outline" className="text-[10px] font-bold px-1.5 h-4 bg-background">
                                                            {app.tla}
                                                        </Badge>
                                                        {app.tier && ["0", "1", "2"].includes(String(app.tier)) && (
                                                            <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] font-bold px-1.5 h-4">
                                                                T{app.tier}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-muted-foreground font-medium">
                                                        {getLeadershipDisplay(app).map((l, i) => (
                                                            <span key={i} className="flex items-center">
                                                                <span className="text-foreground/60 mr-1">{l.role}:</span>
                                                                <span className="text-foreground font-bold">{l.name}</span>
                                                                {i < getLeadershipDisplay(app).length - 1 && <span className="ml-3 text-muted-foreground/30">|</span>}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden lg:flex items-center gap-8 pr-2">
                                                <div className="text-right">
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Asset ID</p>
                                                    <p className="font-mono text-sm font-bold tracking-tight">{app.assetId}</p>
                                                </div>
                                                <div className="h-8 w-px bg-muted-foreground/20" />
                                                <div className="text-right">
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Status</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        <p className="font-bold text-[11px] text-green-600">ACTIVE</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-muted/30 shadow-md overflow-hidden bg-muted/5 backdrop-blur-sm">
                                            <Table>
                                                <TableHeader className="bg-muted/30">
                                                    <TableRow className="hover:bg-transparent border-b-muted/30">
                                                        <TableHead className="w-[200px] font-bold text-[10px] uppercase tracking-widest py-2.5 pl-4">SUB-APP</TableHead>
                                                        <TableHead className="w-[60px] font-bold text-[10px] uppercase tracking-widest py-2.5">METRIC</TableHead>
                                                        {visibleMonths.map(vm => (
                                                            <TableHead key={`${vm.year}-${vm.month}`} className="text-center font-bold text-[10px] uppercase tracking-widest py-2.5">
                                                                <div className="flex flex-col leading-none">
                                                                    <span>{MONTHS[vm.month - 1]}</span>
                                                                    {vm.year !== selectedYear && <span className="text-[7px] opacity-60 mt-0.5">{vm.year}</span>}
                                                                </div>
                                                            </TableHead>
                                                        ))}
                                                        <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest py-2.5 bg-primary/5 text-primary pr-4">YEAR</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {(entriesByApp[app.id] || []).map(entry => (
                                                        <EntryRows
                                                            key={entry.id}
                                                            entry={entry}
                                                            availability={availabilityByEntry[entry.id] || {}}
                                                            volume={volumeByEntry[entry.id] || {}}
                                                            selectedYear={selectedYear}
                                                            visibleMonths={visibleMonths}
                                                        />
                                                    ))}
                                                    {(!entriesByApp[app.id] || entriesByApp[app.id].length === 0) && (
                                                        <TableRow>
                                                            <TableCell colSpan={15} className="h-20 text-center text-muted-foreground italic text-sm">
                                                                No active metrics configured
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                    }
                </DrawerContent >
            </Drawer >
        </div >
    );
}

// Team Section Component
function TeamSection({
    team,
    isExpanded,
    onToggle,
    applications,
    entriesByApp,
    availabilityByEntry,
    volumeByEntry,
    expandedApps,
    onToggleApp,
    selectedYear,
    getLeadershipDisplay,
    onViewFull,
    visibleMonths,
}: {
    team: Team;
    isExpanded: boolean;
    onToggle: () => void;
    applications: Application[];
    entriesByApp: Record<string, ScorecardEntry[]>;
    availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
    volumeByEntry: Record<string, Record<string, VolumeRecord>>;
    expandedApps: Set<string>;
    onToggleApp: (appId: string) => void;
    selectedYear: number;
    getLeadershipDisplay: (app: Application) => { role: string; name: string }[];
    onViewFull: () => void;
    visibleMonths?: { month: number; year: number }[];
}) {
    const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, year: selectedYear }));
    const monthsToShow = visibleMonths || ALL_MONTHS;

    // Calculate team-level stats
    const teamStats = useMemo(() => {
        let totalEntries = 0;
        let breaches = 0;

        applications.forEach((app) => {
            const entries = entriesByApp[app.id] || [];
            totalEntries += entries.length;

            entries.forEach((entry) => {
                const threshold = parseFloat(entry.availabilityThreshold);
                const entryAvail = availabilityByEntry[entry.id] || {};
                monthsToShow.forEach(({ month, year }) => {
                    const av = entryAvail[`${year}-${month}`];
                    if (av && parseFloat(av.availability) < threshold) {
                        breaches++;
                    }
                });
            });
        });

        return { apps: applications.length, entries: totalEntries, breaches };
    }, [applications, entriesByApp, availabilityByEntry, monthsToShow]);

    return (
        <div className="border-b last:border-b-0">
            {/* Team Header */}
            <div
                className="flex items-center justify-between py-2.5 px-4 hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-lg">{team.teamName}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{teamStats.apps} applications</span>
                            <span>{teamStats.entries} tracked entries</span>
                            {teamStats.breaches > 0 && (
                                <Badge variant="destructive" className="text-[10px]">
                                    {teamStats.breaches} breaches
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewFull();
                    }}
                >
                    <Eye className="h-3.5 w-3.5" />
                    View Full
                </Button>
            </div>

            {/* Team Content */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-2">
                    {applications.map((app) => (
                        <ApplicationCard
                            key={app.id}
                            app={app}
                            isExpanded={expandedApps.has(app.id)}
                            onToggle={() => onToggleApp(app.id)}
                            entries={entriesByApp[app.id] || []}
                            availabilityByEntry={availabilityByEntry}
                            volumeByEntry={volumeByEntry}
                            selectedYear={selectedYear}
                            leadership={getLeadershipDisplay(app)}
                            visibleMonths={monthsToShow}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Application Card Component
function ApplicationCard({
    app,
    isExpanded,
    onToggle,
    entries,
    availabilityByEntry,
    volumeByEntry,
    selectedYear,
    leadership,
    visibleMonths,
}: {
    app: Application;
    isExpanded: boolean;
    onToggle: () => void;
    entries: ScorecardEntry[];
    availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
    volumeByEntry: Record<string, Record<string, VolumeRecord>>;
    selectedYear: number;
    leadership: { role: string; name: string }[];
    visibleMonths?: { month: number; year: number }[];
}) {
    const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, year: selectedYear }));
    const monthsToShow = visibleMonths || ALL_MONTHS;

    // Calculate app-level average availability
    const avgAvailability = useMemo(() => {
        let total = 0;
        let count = 0;

        entries.forEach((entry) => {
            const entryAvail = availabilityByEntry[entry.id] || {};
            monthsToShow.forEach(({ month, year }) => {
                const av = entryAvail[`${year}-${month}`];
                if (av) {
                    total += parseFloat(av.availability);
                    count++;
                }
            });
        });

        return count > 0 ? total / count : null;
    }, [entries, availabilityByEntry, monthsToShow]);

    // Calculate app-level total volume
    const totalVolume = useMemo(() => {
        let total = 0;
        let hasData = false;

        entries.forEach((entry) => {
            const entryVol = volumeByEntry[entry.id] || {};
            monthsToShow.forEach(({ month, year }) => {
                const vol = entryVol[`${year}-${month}`];
                if (vol) {
                    total += vol.volume;
                    hasData = true;
                }
            });
        });

        return hasData ? total : null;
    }, [entries, volumeByEntry, monthsToShow]);

    // Count breaches
    const breachCount = useMemo(() => {
        let breaches = 0;
        entries.forEach((entry) => {
            const threshold = parseFloat(entry.availabilityThreshold);
            const entryAvail = availabilityByEntry[entry.id] || {};
            monthsToShow.forEach(({ month, year }) => {
                const av = entryAvail[`${year}-${month}`];
                if (av && parseFloat(av.availability) < threshold) {
                    breaches++;
                }
            });
        });
        return breaches;
    }, [entries, availabilityByEntry, monthsToShow]);

    return (
        <Card className={cn(
            "shadow-sm",
            breachCount > 0 && "border-red-500/30"
        )}>
            <div
                className="flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-2.5 flex-1">
                    {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{app.applicationName}</span>
                            <Badge variant="outline" className="text-[9px] h-4 px-1">{app.tla}</Badge>
                            {app.tier && ['0', '1', '2'].includes(String(app.tier)) && (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-red-500/10 text-red-600">
                                    T{app.tier}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            {leadership.map((l, i) => (
                                <span key={i} className="text-[9px] text-muted-foreground">
                                    <span className="font-medium">{l.role}:</span> {l.name}
                                    {i < leadership.length - 1 && " •"}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6 pr-2">
                    {avgAvailability !== null && (
                        <div className={cn(
                            "text-right min-w-[60px]",
                            avgAvailability < 98 ? "text-red-600" : "text-green-600"
                        )}>
                            <p className="text-sm font-black leading-none tabular-nums tracking-tighter">
                                {avgAvailability.toFixed(1)}%
                            </p>
                            <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Avail</p>
                        </div>
                    )}
                    {totalVolume !== null && (
                        <div className="text-right min-w-[80px] text-blue-600">
                            <p className="text-sm font-black leading-none tabular-nums tracking-tighter">
                                {totalVolume > 1000000 ? `${(totalVolume / 1000000).toFixed(1)}M` : totalVolume.toLocaleString()}
                            </p>
                            <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">Volume</p>
                        </div>
                    )}
                    {breachCount > 0 && (
                        <Badge variant="destructive" className="text-[10px] h-5 px-1.5 font-bold">
                            <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                            {breachCount}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Expanded Content - Metrics Table */}
            {isExpanded && entries.length > 0 && (
                <div className="border-t px-3 pb-3 pt-2 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-xs font-bold uppercase w-[160px]">Entry</TableHead>
                                <TableHead className="text-xs font-bold uppercase w-[50px]">Type</TableHead>
                                {monthsToShow.map((vm) => {
                                    const m = MONTHS[vm.month - 1];
                                    const isFuture = vm.year === currentYear && vm.month > currentMonth;
                                    return (
                                        <TableHead
                                            key={`${vm.year}-${vm.month}`}
                                            className={cn(
                                                "text-xs font-bold uppercase text-center w-[55px]",
                                                isFuture && "text-muted-foreground/40"
                                            )}
                                        >
                                            <div className="flex flex-col leading-none">
                                                <span>{m}</span>
                                                {vm.year !== selectedYear && <span className="text-[7px] opacity-40 mt-0.5">{vm.year}</span>}
                                            </div>
                                            {isFuture && <Lock className="h-2 w-2 inline ml-0.5" />}
                                        </TableHead>
                                    );
                                })}
                                <TableHead className="text-xs font-bold uppercase text-center w-[60px] bg-muted/30">Avg</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.map((entry) => (
                                <EntryRows
                                    key={entry.id}
                                    entry={entry}
                                    availability={availabilityByEntry[entry.id] || {}}
                                    volume={volumeByEntry[entry.id] || {}}
                                    selectedYear={selectedYear}
                                    visibleMonths={monthsToShow}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {isExpanded && entries.length === 0 && (
                <div className="border-t px-3 py-4 text-center text-muted-foreground text-sm">
                    No scorecard entries for this application
                </div>
            )}
        </Card>
    );
}

// Entry Rows Component (read-only view)
function EntryRows({
    entry,
    availability,
    volume,
    selectedYear,
    visibleMonths,
}: {
    entry: ScorecardEntry;
    availability: Record<string, AvailabilityRecord>;
    volume: Record<string, VolumeRecord>;
    selectedYear: number;
    visibleMonths?: { month: number; year: number }[];
}) {
    const ALL_MONTHS = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, year: selectedYear }));
    const monthsToShow = visibleMonths || ALL_MONTHS;
    const availThreshold = parseFloat(entry.availabilityThreshold);

    // Calculate average availability
    const avgAvail = useMemo(() => {
        const values: number[] = [];
        monthsToShow.forEach(({ month, year }) => {
            const isFuture = year === currentYear && month > currentMonth;
            const key = `${year}-${month}`;
            if (!isFuture && availability[key]) {
                values.push(parseFloat(availability[key].availability));
            }
        });
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
    }, [availability, selectedYear, monthsToShow]);

    // Calculate total volume
    const totalVol = useMemo(() => {
        let total = 0;
        let hasData = false;
        monthsToShow.forEach(({ month, year }) => {
            const isFuture = year === currentYear && month > currentMonth;
            const key = `${year}-${month}`;
            if (!isFuture && volume[key]) {
                total += volume[key].volume;
                hasData = true;
            }
        });
        return hasData ? total : null;
    }, [volume, selectedYear, monthsToShow]);

    const avgBreach = avgAvail !== null && avgAvail < availThreshold;

    return (
        <>
            {/* Availability Row */}
            <TableRow className="hover:bg-muted/10">
                <TableCell rowSpan={2} className="align-top border-r py-1">
                    <div className="text-xs font-medium">{entry.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{entry.scorecardIdentifier}</div>
                </TableCell>
                <TableCell className="text-[10px] font-bold text-green-600 py-1">A%</TableCell>
                {monthsToShow.map((vm) => {
                    const key = `${vm.year}-${vm.month}`;
                    const av = availability[key];
                    const isFuture = vm.year === currentYear && vm.month > currentMonth;
                    const value = av?.availability;
                    const isBreach = value !== undefined && parseFloat(value) < availThreshold;

                    return (
                        <TableCell key={key} className={cn(
                            "text-center py-1 text-xs",
                            isFuture && "text-muted-foreground/30",
                            isBreach && "text-red-600 font-semibold bg-red-500/5"
                        )}>
                            {isFuture ? "—" : value ? parseFloat(value).toFixed(1) : "—"}
                        </TableCell>
                    );
                })}
                <TableCell className={cn(
                    "text-center py-1 text-xs font-semibold bg-muted/30",
                    avgBreach && "text-red-600"
                )}>
                    {avgAvail !== null ? avgAvail.toFixed(1) : "—"}
                </TableCell>
            </TableRow>
            {/* Volume Row */}
            <TableRow className="hover:bg-muted/10 border-b">
                <TableCell className="text-[10px] font-bold text-purple-600 py-1">Vol</TableCell>
                {monthsToShow.map((vm) => {
                    const key = `${vm.year}-${vm.month}`;
                    const vol = volume[key];
                    const isFuture = vm.year === currentYear && vm.month > currentMonth;

                    return (
                        <TableCell key={key} className={cn(
                            "text-center py-1 text-xs",
                            isFuture && "text-muted-foreground/30"
                        )}>
                            {isFuture ? "—" : vol ? formatVolume(vol.volume) : "—"}
                        </TableCell>
                    );
                })}
                <TableCell className="text-center py-1 text-xs font-semibold bg-muted/30">
                    {totalVol !== null ? formatVolume(totalVol) : "—"}
                </TableCell>
            </TableRow>
        </>
    );
}

// Utility function
function formatVolume(value: number): string {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return String(value);
}
