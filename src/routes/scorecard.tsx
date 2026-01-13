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
    FileText,
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
        <div className="container mx-auto py-6 px-4 max-w-7xl space-y-4">
            {/* Stats Summary Header */}
            <StatsSummary stats={stats} />

            {/* Advanced Filters */}
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
                    )}
                </DrawerContent>
            </Drawer>
        </div>
    );
}
