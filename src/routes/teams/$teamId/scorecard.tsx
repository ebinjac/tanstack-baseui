import { createFileRoute, Link } from "@tanstack/react-router";
import { Route as RootRoute } from "../../__root";
import { getScorecardData } from "@/app/actions/scorecard";
import { getTeamById } from "@/app/actions/teams";
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  BarChart3,
  Activity,
  TrendingUp,
  Info,
  Loader2,
  Settings2,
  Hash,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Calendar,
  Filter,
  LayoutDashboard,
} from "lucide-react";
import {
  createScorecardEntry,
  updateScorecardEntry,
  deleteScorecardEntry,
  upsertAvailability,
  upsertVolume,
} from "@/app/actions/scorecard";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateScorecardEntrySchema,
  UpdateScorecardEntrySchema,
} from "@/lib/zod/scorecard.schema";
import { z } from "zod";

export const Route = createFileRoute("/teams/$teamId/scorecard")({
  loader: async ({ params }) => {
    const team = await getTeamById({ data: { teamId: params.teamId } });
    if (!team) {
      throw new Error("Team not found");
    }
    return { team };
  },
  component: ScorecardPage,
});

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Get current date info
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1; // 1-12

// View mode type
type ViewMode = "period" | "year";

// Time period options
type TimePeriod = "1m" | "3m" | "6m" | "12m" | "ytd";

const TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string; description: string }[] = [
  { value: "1m", label: "Last Month", description: "Current month only" },
  { value: "3m", label: "Last 3 Months", description: "Rolling 3 months" },
  { value: "6m", label: "Last 6 Months", description: "Rolling 6 months" },
  { value: "12m", label: "Last 12 Months", description: "Rolling 12 months" },
  { value: "ytd", label: "Year to Date", description: `Jan - ${MONTHS[currentMonth - 1]} ${currentYear}` },
];

// Available years (last 5 years)
const AVAILABLE_YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

// Helper: Get months for a time period
interface MonthInfo {
  year: number;
  month: number;
  label: string;
  isFuture: boolean;
}

function getMonthsForPeriod(period: TimePeriod): MonthInfo[] {
  const months: MonthInfo[] = [];

  switch (period) {
    case "1m": {
      // Current month only
      months.push({
        year: currentYear,
        month: currentMonth,
        label: `${MONTHS[currentMonth - 1]} ${currentYear}`,
        isFuture: false,
      });
      break;
    }
    case "3m": {
      // Last 3 months including current
      for (let i = 2; i >= 0; i--) {
        let m = currentMonth - i;
        let y = currentYear;
        if (m <= 0) {
          m += 12;
          y -= 1;
        }
        months.push({
          year: y,
          month: m,
          label: `${MONTHS[m - 1]} ${y}`,
          isFuture: false,
        });
      }
      break;
    }
    case "6m": {
      // Last 6 months including current
      for (let i = 5; i >= 0; i--) {
        let m = currentMonth - i;
        let y = currentYear;
        if (m <= 0) {
          m += 12;
          y -= 1;
        }
        months.push({
          year: y,
          month: m,
          label: `${MONTHS[m - 1]} ${y}`,
          isFuture: false,
        });
      }
      break;
    }
    case "12m": {
      // Last 12 months including current
      for (let i = 11; i >= 0; i--) {
        let m = currentMonth - i;
        let y = currentYear;
        if (m <= 0) {
          m += 12;
          y -= 1;
        }
        months.push({
          year: y,
          month: m,
          label: `${MONTHS[m - 1]} ${y}`,
          isFuture: false,
        });
      }
      break;
    }
    case "ytd": {
      // Year to date (Jan to current month)
      for (let m = 1; m <= 12; m++) {
        months.push({
          year: currentYear,
          month: m,
          label: MONTHS[m - 1],
          isFuture: m > currentMonth,
        });
      }
      break;
    }
  }

  return months;
}

// Helper: Get months for a specific year
function getMonthsForYear(year: number): MonthInfo[] {
  const months: MonthInfo[] = [];
  for (let m = 1; m <= 12; m++) {
    const isFuture = year > currentYear || (year === currentYear && m > currentMonth);
    months.push({
      year,
      month: m,
      label: MONTHS[m - 1],
      isFuture,
    });
  }
  return months;
}

// Type definitions
interface ScorecardEntry {
  id: string;
  applicationId: string;
  scorecardIdentifier: string;
  name: string;
  availabilityThreshold: string;
  volumeChangeThreshold: string;
}

interface Application {
  id: string;
  applicationName: string;
  tla: string;
  tier: string | null;
  assetId: number;
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

function ScorecardPage() {
  const { team } = Route.useLoaderData();
  const { teamId } = Route.useParams();
  const { session } = (RootRoute as any).useLoaderData();
  const queryClient = useQueryClient();

  const isAdmin = session?.permissions?.some(
    (p: { teamId: string; role: string }) => p.teamId === teamId && p.role === "ADMIN"
  );

  const [viewMode, setViewMode] = useState<ViewMode>("period");
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("ytd");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const [addEntryAppId, setAddEntryAppId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<ScorecardEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<ScorecardEntry | null>(null);

  const toggleAllApps = () => {
    const allAppIds = scorecardData?.applications?.map((app: Application) => app.id) || [];
    if (expandedApps.size > 0 && expandedApps.size === allAppIds.length) {
      setExpandedApps(new Set());
    } else {
      setExpandedApps(new Set(allAppIds));
    }
  };

  // Get the months to display based on view mode
  const displayMonths = useMemo(() => {
    if (viewMode === "year") {
      return getMonthsForYear(selectedYear);
    }
    return getMonthsForPeriod(selectedPeriod);
  }, [viewMode, selectedPeriod, selectedYear]);

  // Determine which years we need to fetch data for
  const yearsToFetch = useMemo(() => {
    const years = new Set<number>();
    displayMonths.forEach(m => years.add(m.year));
    return Array.from(years);
  }, [displayMonths]);

  // Fetch scorecard data for current year
  const { data: currentYearData, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ["scorecard", teamId, currentYear],
    queryFn: () => getScorecardData({ data: { teamId, year: currentYear } }),
  });

  // Fetch scorecard data for previous year (if needed)
  const { data: prevYearData, isLoading: isLoadingPrev } = useQuery({
    queryKey: ["scorecard", teamId, currentYear - 1],
    queryFn: () => getScorecardData({ data: { teamId, year: currentYear - 1 } }),
    enabled: yearsToFetch.includes(currentYear - 1),
  });

  const isLoading = isLoadingCurrent || (yearsToFetch.includes(currentYear - 1) && isLoadingPrev);

  // Merge data from both years
  const scorecardData = useMemo(() => {
    const apps = currentYearData?.applications || [];
    const entries = currentYearData?.entries || [];

    // Combine availability from both years
    const availability = [
      ...(currentYearData?.availability || []),
      ...(prevYearData?.availability || []),
    ];

    // Combine volume from both years
    const volume = [
      ...(currentYearData?.volume || []),
      ...(prevYearData?.volume || []),
    ];

    return { applications: apps, entries, availability, volume };
  }, [currentYearData, prevYearData]);

  // Build lookup maps with year-month composite key
  const { entriesByApp, availabilityByEntry, volumeByEntry } = useMemo(() => {
    const entriesByApp: Record<string, ScorecardEntry[]> = {};
    const availabilityByEntry: Record<string, Record<string, AvailabilityRecord>> = {};
    const volumeByEntry: Record<string, Record<string, VolumeRecord>> = {};

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
      const key = `${av.year}-${av.month}`;
      availabilityByEntry[av.scorecardEntryId][key] = av;
    });

    scorecardData?.volume?.forEach((vol: VolumeRecord) => {
      if (!volumeByEntry[vol.scorecardEntryId]) {
        volumeByEntry[vol.scorecardEntryId] = {};
      }
      const key = `${vol.year}-${vol.month}`;
      volumeByEntry[vol.scorecardEntryId][key] = vol;
    });

    return { entriesByApp, availabilityByEntry, volumeByEntry };
  }, [scorecardData]);

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

  // Stats - calculated based on visible months only
  const stats = useMemo(() => {
    const apps = scorecardData?.applications?.length || 0;
    const entries = scorecardData?.entries?.length || 0;

    // Count records and breaches only for visible months
    let availRecords = 0;
    let volRecords = 0;
    let availBreaches = 0;

    scorecardData?.entries?.forEach((entry: ScorecardEntry) => {
      const threshold = parseFloat(entry.availabilityThreshold);
      const entryAvailability = availabilityByEntry[entry.id] || {};
      const entryVolume = volumeByEntry[entry.id] || {};

      displayMonths.forEach(({ year, month, isFuture }) => {
        if (isFuture) return;
        const key = `${year}-${month}`;
        if (entryAvailability[key]) {
          availRecords++;
          if (parseFloat(entryAvailability[key].availability) < threshold) {
            availBreaches++;
          }
        }
        if (entryVolume[key]) {
          volRecords++;
        }
      });
    });

    return { apps, entries, availRecords, volRecords, availBreaches };
  }, [scorecardData, availabilityByEntry, volumeByEntry, displayMonths]);

  // Get the period/year description
  const filterLabel = viewMode === "year"
    ? `Year ${selectedYear}`
    : TIME_PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.label || "";

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Scorecard
          </h1>
          <p className="text-muted-foreground mt-1">
            Track availability and volume metrics for {team.teamName}
          </p>
        </div>

        <Link to="/scorecard">
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <LayoutDashboard className="h-4 w-4" />
            Enterprise Scorecard
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatsCard
          icon={<Activity className="h-4 w-4 text-blue-500" />}
          label="Applications"
          value={stats.apps}
        />
        <StatsCard
          icon={<Hash className="h-4 w-4 text-indigo-500" />}
          label="Tracked Entries"
          value={stats.entries}
        />
        <StatsCard
          icon={<Percent className="h-4 w-4 text-green-500" />}
          label="Availability Records"
          value={stats.availRecords}
          sublabel={filterLabel}
        />
        <StatsCard
          icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
          label="Volume Records"
          value={stats.volRecords}
          sublabel={filterLabel}
        />
        <StatsCard
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          label="Breaches"
          value={stats.availBreaches}
          highlight={stats.availBreaches > 0}
          sublabel={filterLabel}
        />
      </div>

      {/* Main Content */}
      <Card className="shadow-sm border-muted/60">
        <CardHeader className="py-3 px-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Application Metrics
              </CardTitle>
              <CardDescription>
                View and edit availability and volume data. Future months are locked.
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
              </div>

              {/* View Mode Toggle */}
              <div className="flex rounded-md border border-border overflow-hidden">
                <button
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    viewMode === "period"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                  onClick={() => setViewMode("period")}
                >
                  Period
                </button>
                <button
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors border-l",
                    viewMode === "year"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                  onClick={() => setViewMode("year")}
                >
                  Year
                </button>
              </div>

              <div className="h-6 w-px bg-muted mx-1" />

              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs gap-1.5 hover:bg-background border border-transparent hover:border-border transition-all"
                onClick={toggleAllApps}
              >
                <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                {expandedApps.size > 0 && expandedApps.size === (scorecardData?.applications?.length || 0)
                  ? "Collapse All"
                  : "Expand All"}
              </Button>

              <div className="h-6 w-px bg-muted mx-1" />

              {/* Period Selector (when in period mode) */}
              {viewMode === "period" && (
                <Select
                  value={selectedPeriod}
                  onValueChange={(val) => setSelectedPeriod(val as TimePeriod)}
                >
                  <SelectTrigger className="w-[160px] bg-background border-none shadow-none h-8 font-medium">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_PERIOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Year Selector (when in year mode) */}
              {viewMode === "year" && (
                <Select
                  value={String(selectedYear)}
                  onValueChange={(val) => setSelectedYear(Number(val))}
                >
                  <SelectTrigger className="w-[120px] bg-background border-none shadow-none h-8 font-medium">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_YEARS.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !scorecardData?.applications?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No Applications Found</h3>
              <p className="text-muted-foreground text-sm max-w-md mt-2">
                Add applications in Team Settings to start tracking metrics.
              </p>
              <Link to="/teams/$teamId/settings" params={{ teamId }}>
                <Button className="mt-4">Go to Settings</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {scorecardData.applications.map((app: Application) => (
                <ApplicationSection
                  key={app.id}
                  app={app}
                  isAdmin={isAdmin}
                  isExpanded={expandedApps.has(app.id)}
                  onToggle={() => toggleApp(app.id)}
                  entries={entriesByApp[app.id] || []}
                  availabilityByEntry={availabilityByEntry}
                  volumeByEntry={volumeByEntry}
                  displayMonths={displayMonths}
                  onAddEntry={() => setAddEntryAppId(app.id)}
                  onEditEntry={(entry) => setEditingEntry(entry)}
                  onDeleteEntry={(entry) => setDeletingEntry(entry)}
                  teamId={teamId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Entry Dialog */}
      {
        addEntryAppId && (
          <AddEntryDialog
            applicationId={addEntryAppId}
            open={!!addEntryAppId}
            onOpenChange={(open) => !open && setAddEntryAppId(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ["scorecard", teamId],
              });
              setAddEntryAppId(null);
            }}
          />
        )
      }

      {/* Edit Entry Dialog */}
      {
        editingEntry && (
          <EditEntryDialog
            entry={editingEntry}
            open={!!editingEntry}
            onOpenChange={(open) => !open && setEditingEntry(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ["scorecard", teamId],
              });
              setEditingEntry(null);
            }}
          />
        )
      }

      {/* Delete Confirmation Dialog */}
      {
        deletingEntry && (
          <DeleteEntryDialog
            entry={deletingEntry}
            open={!!deletingEntry}
            onOpenChange={(open) => !open && setDeletingEntry(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ["scorecard", teamId],
              });
              setDeletingEntry(null);
            }}
          />
        )
      }
    </div >
  );
}

// Stats Card Component
function StatsCard({
  icon,
  label,
  value,
  highlight = false,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  highlight?: boolean;
  sublabel?: string;
}) {
  return (
    <Card
      className={cn(
        "shadow-sm border-muted/60 bg-muted/5",
        highlight && "border-red-500/30 bg-red-500/5"
      )}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
            highlight ? "bg-red-500/10" : "bg-background border shadow-sm text-muted-foreground"
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold leading-tight">{value}</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider truncate">
            {label}
          </p>
          {sublabel && (
            <p className="text-[9px] text-muted-foreground/60 leading-tight truncate">{sublabel}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Application Section Component
function ApplicationSection({
  app,
  isAdmin,
  isExpanded,
  onToggle,
  entries,
  availabilityByEntry,
  volumeByEntry,
  displayMonths,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  teamId,
}: {
  app: Application;
  isAdmin: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  entries: ScorecardEntry[];
  availabilityByEntry: Record<string, Record<string, AvailabilityRecord>>;
  volumeByEntry: Record<string, Record<string, VolumeRecord>>;
  displayMonths: MonthInfo[];
  onAddEntry: () => void;
  onEditEntry: (entry: ScorecardEntry) => void;
  onDeleteEntry: (entry: ScorecardEntry) => void;
  teamId: string;
}) {
  const appStats = useMemo(() => {
    let totalAvail = 0;
    let availCount = 0;
    let totalVol = 0;

    entries.forEach((entry) => {
      const entryAvailability = availabilityByEntry[entry.id] || {};
      const entryVolume = volumeByEntry[entry.id] || {};

      displayMonths.forEach(({ year, month, isFuture }) => {
        if (isFuture) return;
        const key = `${year}-${month}`;

        if (entryAvailability[key]) {
          totalAvail += parseFloat(entryAvailability[key].availability);
          availCount++;
        }

        if (entryVolume[key]) {
          totalVol += entryVolume[key].volume;
        }
      });
    });

    return {
      avgAvailability: availCount > 0 ? totalAvail / availCount : null,
      totalVolume: totalVol,
    };
  }, [entries, availabilityByEntry, volumeByEntry, displayMonths]);

  return (
    <div>
      {/* Header - clickable to expand/collapse */}
      <div
        className="flex items-center justify-between p-4 hover:bg-muted/20 cursor-pointer transition-all group border-l-4 border-l-transparent aria-expanded:border-l-primary"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        {/* Left Side: App Identity */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-primary" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">
                {app.applicationName}
              </span>
              <Badge variant="outline" className="text-[10px] font-bold bg-background px-2 h-5 border-muted-foreground/20">
                {app.tla}
              </Badge>
              {app.tier && ["0", "1", "2"].includes(String(app.tier)) && (
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-red-500/10 text-red-600 border-red-500/20 font-bold px-2 h-5"
                >
                  T{app.tier}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Hash className="h-3 w-3 opacity-50" />
                {app.assetId}
              </span>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-[11px] text-muted-foreground font-medium">
                {entries.length} tracked {entries.length === 1 ? "entry" : "entries"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Summary Metrics & Actions */}
        <div className="flex items-center gap-10">
          <div className="hidden xl:flex items-center gap-10 border-r border-muted/50 pr-10">
            {appStats.avgAvailability !== null && (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">
                  Accumulated Availability
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <Activity className={cn(
                    "h-4 w-4",
                    appStats.avgAvailability < 98 ? "text-red-500" : "text-green-500"
                  )} />
                  <span className={cn(
                    "text-xl font-black tabular-nums tracking-tighter",
                    appStats.avgAvailability < 98 ? "text-red-600" : "text-green-600"
                  )}>
                    {appStats.avgAvailability.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">
                Total Annual Volume
              </span>
              <div className="flex items-center gap-2 mt-1 text-indigo-600">
                <BarChart3 className="h-4 w-4" />
                <span className="text-xl font-black tabular-nums tracking-tighter">
                  {appStats.totalVolume.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-2 shadow-sm border-muted-foreground/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all font-bold px-4"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddEntry();
                }}
              >
                <Plus className="h-4 w-4" />
                Add Sub-App
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No sub-applications tracked yet.</p>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 gap-2"
                  onClick={onAddEntry}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add First Entry
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[180px] font-bold text-xs uppercase tracking-wider sticky left-0 bg-background z-10">
                      Entry
                    </TableHead>
                    <TableHead className="w-[50px] font-bold text-xs uppercase tracking-wider">
                      Type
                    </TableHead>
                    {displayMonths.map((m) => (
                      <TableHead
                        key={`${m.year}-${m.month}`}
                        className={cn(
                          "w-[70px] text-center font-bold text-xs uppercase tracking-wider",
                          m.isFuture && "text-muted-foreground/50"
                        )}
                      >
                        {m.label}
                        {m.isFuture && <Lock className="h-2.5 w-2.5 inline ml-1 opacity-50" />}
                      </TableHead>
                    ))}
                    {/* Avg/Total Column */}
                    <TableHead className="w-[80px] text-center font-bold text-xs uppercase tracking-wider bg-primary/5">
                      Avg/Total
                    </TableHead>
                    {isAdmin && (
                      <TableHead className="w-[80px] text-right font-bold text-xs uppercase tracking-wider">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <EntryRows
                      key={entry.id}
                      entry={entry}
                      isAdmin={isAdmin}
                      availability={availabilityByEntry[entry.id] || {}}
                      volume={volumeByEntry[entry.id] || {}}
                      displayMonths={displayMonths}
                      onEdit={() => onEditEntry(entry)}
                      onDelete={() => onDeleteEntry(entry)}
                      teamId={teamId}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Entry Rows Component (Availability + Volume rows for one entry)
function EntryRows({
  entry,
  isAdmin,
  availability,
  volume,
  displayMonths,
  onEdit,
  onDelete,
  teamId,
}: {
  entry: ScorecardEntry;
  isAdmin: boolean;
  availability: Record<string, AvailabilityRecord>;
  volume: Record<string, VolumeRecord>;
  displayMonths: MonthInfo[];
  onEdit: () => void;
  onDelete: () => void;
  teamId: string;
}) {
  const queryClient = useQueryClient();
  const availThreshold = parseFloat(entry.availabilityThreshold);
  const volThreshold = parseFloat(entry.volumeChangeThreshold);

  const availMutation = useMutation({
    mutationFn: upsertAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["scorecard", teamId],
      });
    },
  });

  const volMutation = useMutation({
    mutationFn: upsertVolume,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["scorecard", teamId],
      });
    },
  });

  // Calculate volume change for each month (compared to previous in display)
  const getVolumeChange = (monthInfo: MonthInfo, index: number): number | null => {
    if (index === 0) return null;
    const prevMonthInfo = displayMonths[index - 1];
    const currentKey = `${monthInfo.year}-${monthInfo.month}`;
    const prevKey = `${prevMonthInfo.year}-${prevMonthInfo.month}`;
    const currentVol = volume[currentKey]?.volume;
    const prevVol = volume[prevKey]?.volume;
    if (currentVol === undefined || prevVol === undefined) return null;
    if (prevVol === 0) return currentVol > 0 ? 100 : 0;
    return ((currentVol - prevVol) / prevVol) * 100;
  };

  // Calculate average availability (only filled, non-future months)
  const avgAvailability = useMemo(() => {
    const values: number[] = [];
    displayMonths.forEach(({ year, month, isFuture }) => {
      if (isFuture) return;
      const key = `${year}-${month}`;
      if (availability[key]) {
        values.push(parseFloat(availability[key].availability));
      }
    });
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [availability, displayMonths]);

  // Calculate total volume (only filled, non-future months)
  const totalVolume = useMemo(() => {
    let total = 0;
    let hasData = false;
    displayMonths.forEach(({ year, month, isFuture }) => {
      if (isFuture) return;
      const key = `${year}-${month}`;
      if (volume[key]) {
        total += volume[key].volume;
        hasData = true;
      }
    });
    return hasData ? total : null;
  }, [volume, displayMonths]);

  const avgAvailBreach = avgAvailability !== null && avgAvailability < availThreshold;

  return (
    <>
      {/* Availability Row */}
      <TableRow className="hover:bg-muted/20">
        <TableCell rowSpan={2} className="align-top border-r sticky left-0 bg-background z-10">
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{entry.name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {entry.scorecardIdentifier}
            </span>
            <div className="flex gap-1 mt-1">
              <Badge variant="outline" className="text-[9px] px-1.5 py-0" title={`Availability Threshold: ${availThreshold}%`}>
                A: {availThreshold}%
              </Badge>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0" title={`Volume Change Threshold: ${volThreshold}%`}>
                V: {volThreshold}%
              </Badge>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-[10px] font-bold text-green-600 uppercase">
          Avail
        </TableCell>
        {displayMonths.map((monthInfo) => {
          const key = `${monthInfo.year}-${monthInfo.month}`;
          const av = availability[key];
          const value = av?.availability;
          const isBreach = value !== undefined && parseFloat(value) < availThreshold;

          return (
            <TableCell key={key} className="p-1 text-center">
              <DataCell
                value={value ? `${parseFloat(value).toFixed(1)}%` : "—"}
                isBreach={isBreach}
                reason={av?.reason || undefined}
                editable={isAdmin && !monthInfo.isFuture}
                disabled={monthInfo.isFuture}
                onSave={(newValue, reason) => {
                  const numValue = parseFloat(newValue.replace("%", ""));
                  if (isNaN(numValue)) return;
                  availMutation.mutate({
                    data: {
                      scorecardEntryId: entry.id,
                      year: monthInfo.year,
                      month: monthInfo.month,
                      availability: numValue,
                      reason: reason || null,
                    },
                  });
                }}
                threshold={availThreshold}
                type="availability"
              />
            </TableCell>
          );
        })}
        {/* Avg Cell */}
        <TableCell className={cn(
          "p-1 text-center font-semibold bg-primary/5",
          avgAvailBreach && "bg-red-500/10 text-red-600"
        )}>
          {avgAvailability !== null ? (
            <span className="text-xs">
              {avgAvailability.toFixed(1)}%
              {avgAvailBreach && <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
        {isAdmin && (
          <TableCell rowSpan={2} className="align-middle text-right">
            <div className="flex justify-end gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={onEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-red-500 hover:text-red-600"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </TableCell>
        )}
      </TableRow>

      {/* Volume Row */}
      <TableRow className="hover:bg-muted/20 border-b-2">
        <TableCell className="text-[10px] font-bold text-purple-600 uppercase">
          Vol
        </TableCell>
        {displayMonths.map((monthInfo, index) => {
          const key = `${monthInfo.year}-${monthInfo.month}`;
          const vol = volume[key];
          const value = vol?.volume;
          const change = getVolumeChange(monthInfo, index);
          const isBreach = change !== null && Math.abs(change) > volThreshold;

          return (
            <TableCell key={key} className="p-1 text-center">
              <DataCell
                value={value !== undefined ? formatVolume(value) : "—"}
                isBreach={isBreach}
                reason={vol?.reason || undefined}
                editable={isAdmin && !monthInfo.isFuture}
                disabled={monthInfo.isFuture}
                onSave={(newValue, reason) => {
                  const numValue = parseVolumeInput(newValue);
                  if (numValue === null) return;
                  volMutation.mutate({
                    data: {
                      scorecardEntryId: entry.id,
                      year: monthInfo.year,
                      month: monthInfo.month,
                      volume: numValue,
                      reason: reason || null,
                    },
                  });
                }}
                threshold={volThreshold}
                type="volume"
                changeValue={change}
              />
            </TableCell>
          );
        })}
        {/* Total Cell */}
        <TableCell className="p-1 text-center font-semibold bg-primary/5">
          {totalVolume !== null ? (
            <span className="text-xs">{formatVolume(totalVolume)}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
      </TableRow>
    </>
  );
}

// Data Cell with inline editing
function DataCell({
  value,
  isBreach,
  reason,
  editable,
  disabled = false,
  onSave,
  threshold,
  type,
  changeValue,
}: {
  value: string;
  isBreach: boolean;
  reason?: string;
  editable: boolean;
  disabled?: boolean;
  onSave: (value: string, reason?: string) => void;
  threshold: number;
  type: "availability" | "volume";
  changeValue?: number | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value === "—" ? "" : value);
  const [editReason, setEditReason] = useState(reason || "");

  const handleSave = () => {
    if (!editValue) {
      setIsEditing(false);
      return;
    }

    // Check if breach requires reason
    let willBreach = false;
    if (type === "availability") {
      const numVal = parseFloat(editValue.replace("%", ""));
      willBreach = !isNaN(numVal) && numVal < threshold;
    }

    if (willBreach && !editReason.trim()) {
      toast.error("Please provide a reason for the threshold breach");
      return;
    }

    onSave(editValue, editReason || undefined);
    setIsEditing(false);
  };

  // Display for disabled/locked cells
  if (disabled) {
    return (
      <div
        className={cn(
          "text-xs px-2 py-1 rounded opacity-40 cursor-not-allowed",
          "bg-muted/30 text-muted-foreground"
        )}
        title="Cannot edit future months"
      >
        <Lock className="h-3 w-3 inline mr-1" />
        —
      </div>
    );
  }

  if (!editable) {
    return (
      <div
        className={cn(
          "text-xs px-2 py-1 rounded",
          isBreach && "bg-red-500/10 text-red-600 font-semibold"
        )}
        title={reason || undefined}
      >
        {value}
        {isBreach && (
          <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />
        )}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-1">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-7 text-xs text-center w-full"
          placeholder={type === "availability" ? "99.5%" : "10000"}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setIsEditing(false);
          }}
          autoFocus
        />
        <Textarea
          value={editReason}
          onChange={(e) => setEditReason(e.target.value)}
          className="h-12 text-xs resize-none"
          placeholder="Reason (optional)"
        />
        <div className="flex gap-1">
          <Button size="sm" className="h-6 text-xs flex-1" onClick={handleSave}>
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      className={cn(
        "text-xs px-2 py-1 rounded w-full transition-colors",
        "hover:bg-primary/10 cursor-pointer",
        isBreach && "bg-red-500/10 text-red-600 font-semibold"
      )}
      onClick={() => setIsEditing(true)}
      title={reason || undefined}
    >
      {value}
      {isBreach && (
        <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />
      )}
      {type === "volume" && changeValue != null && (
        <span
          className={cn(
            "ml-1 text-[9px]",
            changeValue > 0 ? "text-green-600" : "text-red-600"
          )}
        >
          {changeValue > 0 ? (
            <ArrowUpRight className="h-3 w-3 inline" />
          ) : (
            <ArrowDownRight className="h-3 w-3 inline" />
          )}
        </span>
      )}
    </button>
  );
}

// Add Entry Dialog
function AddEntryDialog({
  applicationId,
  open,
  onOpenChange,
  onSuccess,
}: {
  applicationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof CreateScorecardEntrySchema>>({
    resolver: zodResolver(CreateScorecardEntrySchema),
    defaultValues: {
      applicationId,
      scorecardIdentifier: "",
      name: "",
      availabilityThreshold: 98,
      volumeChangeThreshold: 20,
    },
  });

  const createMutation = useMutation({
    mutationFn: createScorecardEntry,
    onSuccess: () => {
      toast.success("Sub-application added successfully");
      reset();
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add sub-application");
    },
  });

  const onSubmit = (values: z.infer<typeof CreateScorecardEntrySchema>) => {
    createMutation.mutate({ data: values });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Sub-Application
          </DialogTitle>
          <DialogDescription>
            Create a new scorecard entry to track metrics for a sub-application.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., KMS-IDEAL"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scorecardIdentifier">
              Scorecard Identifier
              <span className="text-xs text-muted-foreground ml-2">
                (unique, for automation)
              </span>
            </Label>
            <Input
              id="scorecardIdentifier"
              {...register("scorecardIdentifier")}
              placeholder="e.g., kms-ideal-01"
              className="font-mono"
            />
            {errors.scorecardIdentifier && (
              <p className="text-sm text-destructive">
                {errors.scorecardIdentifier.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="availabilityThreshold">
                Availability Threshold (%)
              </Label>
              <Input
                id="availabilityThreshold"
                type="number"
                step="0.1"
                {...register("availabilityThreshold", { valueAsNumber: true })}
              />
              {errors.availabilityThreshold && (
                <p className="text-sm text-destructive">
                  {errors.availabilityThreshold.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="volumeChangeThreshold">
                Volume Change Threshold (%)
              </Label>
              <Input
                id="volumeChangeThreshold"
                type="number"
                step="0.1"
                {...register("volumeChangeThreshold", { valueAsNumber: true })}
              />
              {errors.volumeChangeThreshold && (
                <p className="text-sm text-destructive">
                  {errors.volumeChangeThreshold.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Entry Dialog
function EditEntryDialog({
  entry,
  open,
  onOpenChange,
  onSuccess,
}: {
  entry: ScorecardEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof UpdateScorecardEntrySchema>>({
    resolver: zodResolver(UpdateScorecardEntrySchema),
    defaultValues: {
      id: entry.id,
      name: entry.name,
      scorecardIdentifier: entry.scorecardIdentifier,
      availabilityThreshold: parseFloat(entry.availabilityThreshold),
      volumeChangeThreshold: parseFloat(entry.volumeChangeThreshold),
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateScorecardEntry,
    onSuccess: () => {
      toast.success("Entry updated successfully");
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update entry");
    },
  });

  const onSubmit = (values: z.infer<typeof UpdateScorecardEntrySchema>) => {
    updateMutation.mutate({ data: values });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Edit Entry
          </DialogTitle>
          <DialogDescription>
            Update the entry name and threshold settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Display Name</Label>
            <Input id="edit-name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-scorecardIdentifier">
              Scorecard Identifier
            </Label>
            <Input
              id="edit-scorecardIdentifier"
              {...register("scorecardIdentifier")}
              className="font-mono"
            />
            {errors.scorecardIdentifier && (
              <p className="text-sm text-destructive">
                {errors.scorecardIdentifier.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-availabilityThreshold">
                Availability Threshold (%)
              </Label>
              <Input
                id="edit-availabilityThreshold"
                type="number"
                step="0.1"
                {...register("availabilityThreshold", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-volumeChangeThreshold">
                Volume Change Threshold (%)
              </Label>
              <Input
                id="edit-volumeChangeThreshold"
                type="number"
                step="0.1"
                {...register("volumeChangeThreshold", { valueAsNumber: true })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Delete Entry Dialog
function DeleteEntryDialog({
  entry,
  open,
  onOpenChange,
  onSuccess,
}: {
  entry: ScorecardEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const deleteMutation = useMutation({
    mutationFn: deleteScorecardEntry,
    onSuccess: () => {
      toast.success("Entry deleted successfully");
      onSuccess();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete entry");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Entry
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold">{entry.name}</span>? This will also
            delete all associated availability and volume data. This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              deleteMutation.mutate({ data: { entryId: entry.id } })
            }
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Utility functions
function formatVolume(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

function parseVolumeInput(input: string): number | null {
  const cleaned = input.trim().toUpperCase();
  const match = cleaned.match(/^([\d.]+)([KMB])?$/);
  if (!match) return null;

  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;

  const multiplier = match[2];
  if (multiplier === "K") return Math.round(num * 1e3);
  if (multiplier === "M") return Math.round(num * 1e6);
  if (multiplier === "B") return Math.round(num * 1e9);
  return Math.round(num);
}
