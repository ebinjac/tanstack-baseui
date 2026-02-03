import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
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
    Activity,
    Loader2,
    Building2,
    X,
    FileSpreadsheet,
    RotateCcw,
} from "lucide-react";
import { getGlobalScorecardData } from "@/app/actions/scorecard";

// Import enterprise scorecard components
import {
    EnterpriseFilters,
    StatsSummary,
    TeamSection,
    EntryRows,
    MONTHS,
    CURRENT_YEAR,
    CURRENT_MONTH,
    type Team,
    type Application,
    type ScorecardEntry,
    type AvailabilityRecord,
    type VolumeRecord,
    type ScorecardStats,
} from "@/components/enterprise-scorecard";

export const Route = createFileRoute("/scorecard")({
    component: GlobalScorecardPage,
});

function GlobalScorecardPage() {
    const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
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

        const isCurrentYear = selectedYear === CURRENT_YEAR;
        const endMonth = isCurrentYear ? CURRENT_MONTH : 12;

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
    }, [drawerRange, selectedYear]);

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
    const stats: ScorecardStats = useMemo(() => {
        const teams = teamsWithApps.length;
        const apps = scorecardData?.applications?.length || 0;
        const entries = scorecardData?.entries?.length || 0;

        let availBreaches = 0;
        scorecardData?.entries?.forEach((entry: ScorecardEntry) => {
            const threshold = parseFloat(entry.availabilityThreshold);
            const entryAvail = availabilityByEntry[entry.id] || {};
            Object.values(entryAvail).forEach((av: AvailabilityRecord) => {
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
                let volRow = `"",,,"${entry.name} (Volume)",""`;
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

    const handleClearAllFilters = () => {
        setLeadershipType("all");
        setLeadershipSearch("");
        setTeamSearch("");
        setAppSearch("");
    };

    return (
        <div className="container mx-auto py-8 px-6 max-w-7xl space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">
                        Enterprise Scorecard
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">
                        Global performance metrics and compliance across <span className="text-foreground font-black">{teamsWithApps.length}</span> active teams.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 h-10 px-4 font-black uppercase tracking-widest text-[10px] border-primary/20 hover:bg-primary/5 hover:text-primary transition-all active:scale-95 shadow-sm"
                        onClick={handleClearAllFilters}
                        disabled={!isLoading && teamsWithApps.length === scorecardData?.teams?.length && leadershipType === 'all' && !leadershipSearch && !teamSearch && !appSearch}
                    >
                        <RotateCcw className="h-4 w-4" />
                        Reset All
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <StatsSummary stats={stats} />

            {/* Structured Search & Filters */}
            <div className="bg-background/60 p-1.5 rounded-2xl border border-border/50 shadow-sm backdrop-blur-md">
                <EnterpriseFilters
                    selectedYear={selectedYear}
                    leadershipType={leadershipType}
                    leadershipSearch={leadershipSearch}
                    teamSearch={teamSearch}
                    appSearch={appSearch}
                    onYearChange={setSelectedYear}
                    onLeadershipTypeChange={setLeadershipType}
                    onLeadershipSearchChange={setLeadershipSearch}
                    onTeamSearchChange={setTeamSearch}
                    onAppSearchChange={setAppSearch}
                    onClearAll={handleClearAllFilters}
                    teams={scorecardData?.teams || []}
                    applications={scorecardData?.applications || []}
                    leadershipOptions={scorecardData?.leadershipOptions}
                />
            </div>

            {/* Team Scorecards List */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Teams ({teamsWithApps.length})
                    </h2>
                </div>

                <div className="border rounded-lg divide-y">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : teamsWithApps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Activity className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <p className="text-sm font-medium text-muted-foreground">No teams match your filters</p>
                        </div>
                    ) : (
                        teamsWithApps.map((team: Team) => (
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
                        ))
                    )}
                </div>
            </div>

            {/* Team Scorecard Drawer */}
            <Drawer open={!!viewTeam} onOpenChange={(open) => !open && setViewTeam(null)} direction="right">
                <DrawerContent className="h-full w-screen !max-w-full p-0 flex flex-col focus:outline-none rounded-none border-none shadow-none">
                    {viewTeam && (
                        <div className="flex flex-col h-full bg-background rounded-l-3xl overflow-hidden">
                            <DrawerHeader className="p-6 border-b bg-muted/20 shrink-0">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                                            <Building2 className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <DrawerTitle className="text-3xl font-black tracking-tight flex items-center gap-3">
                                                {viewTeam.teamName}
                                            </DrawerTitle>
                                            <DrawerDescription className="text-sm font-medium text-muted-foreground mt-1">
                                                Enterprise Performance Report • <span className="text-foreground font-black">{selectedYear}</span>
                                            </DrawerDescription>
                                        </div>

                                        <div className="h-10 w-px bg-border mx-2 hidden md:block" />

                                        {/* Range Selector */}
                                        <div className="bg-background/60 p-1 rounded-xl border border-border/50 shadow-sm flex items-center gap-1">
                                            {[
                                                { id: 'full', label: 'Full Year' },
                                                { id: 'ytd', label: 'YTD' },
                                                { id: 'last3', label: 'Last 3M' },
                                                { id: 'last6', label: 'Last 6M' }
                                            ].map((r) => (
                                                <button
                                                    key={r.id}
                                                    onClick={() => setDrawerRange(r.id)}
                                                    className={cn(
                                                        "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
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

                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleExportCSV(viewTeam)}
                                            className="h-10 px-4 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-black uppercase tracking-widest text-[10px] rounded-xl shadow-sm"
                                        >
                                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                            CSV Export
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setViewTeam(null)}
                                            className="rounded-full h-10 w-10 hover:bg-muted transition-colors border border-transparent hover:border-border"
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </DrawerHeader>

                            <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-20 max-w-7xl mx-auto w-full">
                                {(appsByTeam[viewTeam.id] || []).map((app) => (
                                    <div key={app.id} className="space-y-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-4">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                                                    <Activity className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-2xl font-black tracking-tight">
                                                            {app.applicationName}
                                                        </h3>
                                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-background/50 border-primary/20 text-primary px-2 h-5">
                                                            {app.tla}
                                                        </Badge>
                                                        {app.tier && ["0", "1", "2"].includes(String(app.tier)) && (
                                                            <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] font-black uppercase tracking-widest h-5 px-2">
                                                                Tier {app.tier}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                                                        {getLeadershipDisplay(app).map((l, i) => (
                                                            <div key={i} className="flex items-center gap-1.5 grayscale opacity-70">
                                                                <span className="text-[10px] font-black uppercase tracking-widest">{l.role}:</span>
                                                                <span className="text-[11px] font-bold text-foreground">{l.name}</span>
                                                            </div>
                                                        ))}
                                                        <span className="text-muted-foreground/30 hidden md:block">•</span>
                                                        <div className="flex items-center gap-1.5 opacity-60">
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Asset ID:</span>
                                                            <span className="text-[11px] font-mono font-bold text-foreground">{app.assetId}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-border/50 shadow-xl overflow-hidden bg-card/30 backdrop-blur-md">
                                            <Table>
                                                <TableHeader className="bg-muted/50">
                                                    <TableRow className="hover:bg-transparent border-b-border/30">
                                                        <TableHead className="w-[240px] font-black text-[10px] uppercase tracking-[0.2em] py-4 pl-6">Metric Configuration</TableHead>
                                                        <TableHead className="w-[60px] font-black text-[10px] uppercase tracking-[0.2em] py-4">Core</TableHead>
                                                        {visibleMonths.map(vm => (
                                                            <TableHead key={`${vm.year}-${vm.month}`} className="text-center font-black text-[10px] uppercase tracking-[0.2em] py-4">
                                                                <div className="flex flex-col leading-none">
                                                                    <span>{MONTHS[vm.month - 1]}</span>
                                                                    {vm.year !== selectedYear && <span className="text-[8px] opacity-60 mt-1">{vm.year}</span>}
                                                                </div>
                                                            </TableHead>
                                                        ))}
                                                        <TableHead className="text-center font-black text-[10px] uppercase tracking-[0.2em] py-4 bg-primary/5 text-primary pr-6">Performance</TableHead>
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
                                                            <TableCell colSpan={visibleMonths.length + 3} className="h-32 text-center text-muted-foreground italic font-medium">
                                                                No active metrics registered for this application
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
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}
