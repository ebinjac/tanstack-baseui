import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Building2,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react'
import type {Application, AvailabilityRecord, ScorecardEntry, ScorecardStats, Team, VolumeRecord} from '@/components/enterprise-scorecard';
import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { getGlobalScorecardData } from '@/app/actions/scorecard'
import { EmptyState } from '@/components/shared/empty-state'
import { scorecardKeys } from '@/lib/query-keys'

// Import enterprise scorecard components
import {
  
  
  CURRENT_MONTH,
  CURRENT_YEAR,
  EnterpriseFilters,
  EntryRows,
  MONTHS,
  
  
  StatsSummary,
  
  TeamSection
  
} from '@/components/enterprise-scorecard'

export const Route = createFileRoute('/scorecard')({
  component: GlobalScorecardPage,
})

function GlobalScorecardPage() {
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR)
  const [leadershipType, setLeadershipType] = useState<string>('all')
  const [leadershipSearch, setLeadershipSearch] = useState<string>('')
  const [teamSearch, setTeamSearch] = useState<string>('')
  const [appSearch, setAppSearch] = useState<string>('')
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set())
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set())
  const [viewTeam, setViewTeam] = useState<Team | null>(null)
  const [drawerRange, setDrawerRange] = useState<string>('full')

  // Calculate visible months for the drawer/detail view
  const visibleMonths = useMemo(() => {
    if (drawerRange === 'full') {
      return MONTHS.map((_, i) => ({ month: i + 1, year: selectedYear }))
    }

    const isCurrentYear = selectedYear === CURRENT_YEAR
    const endMonth = isCurrentYear ? CURRENT_MONTH : 12

    if (drawerRange === 'ytd') {
      return Array.from({ length: endMonth }, (_, i) => ({
        month: i + 1,
        year: selectedYear,
      }))
    }

    let count = 3
    if (drawerRange === 'last6') count = 6
    if (drawerRange === 'last12') count = 12

    const result: Array<{ month: number; year: number }> = []
    let currM = endMonth
    let currY = selectedYear

    for (let i = 0; i < count; i++) {
      result.unshift({ month: currM, year: currY })
      currM--
      if (currM < 1) {
        currM = 12
        currY--
      }
    }
    return result
  }, [drawerRange, selectedYear])

  // Fetch global scorecard data
  const { data: scorecardData, isLoading } = useQuery({
    queryKey: scorecardKeys.global.filtered({
      year: selectedYear,
      leadershipType: leadershipType !== 'all' ? leadershipType : undefined,
      leadershipSearch: leadershipSearch || undefined,
    }),
    queryFn: () =>
      getGlobalScorecardData({
        data: {
          year: selectedYear,
          leadershipFilter: leadershipSearch || undefined,
          leadershipType: leadershipType !== 'all' ? leadershipType : undefined,
        },
      }),
  })

  // Build lookup maps and apply client-side team/app filtering
  const { appsByTeam, entriesByApp, availabilityByEntry, volumeByEntry } =
    useMemo(() => {
      const appsByTeam: Record<string, Array<Application>> = {}
      const entriesByApp: Record<string, Array<ScorecardEntry>> = {}
      const availabilityByEntry: Record<
        string,
        Record<string, AvailabilityRecord>
      > = {}
      const volumeByEntry: Record<string, Record<string, VolumeRecord>> = {}

      // Filter apps by name if search is active
      const filteredApps = (scorecardData?.applications || []).filter(
        (app: Application) => {
          const matchesApp =
            !appSearch ||
            app.applicationName.toLowerCase().includes(appSearch.toLowerCase())
          const team = (scorecardData?.teams || []).find(
            (t: Team) => t.id === app.teamId,
          )
          const matchesTeam =
            !teamSearch ||
            team?.teamName.toLowerCase().includes(teamSearch.toLowerCase())
          return matchesApp && matchesTeam
        },
      )

      filteredApps.forEach((app: Application) => {
        if (!appsByTeam[app.teamId]) {
          appsByTeam[app.teamId] = []
        }
        appsByTeam[app.teamId].push(app)
      })

      scorecardData?.entries?.forEach((entry: ScorecardEntry) => {
        if (!entriesByApp[entry.applicationId]) {
          entriesByApp[entry.applicationId] = []
        }
        entriesByApp[entry.applicationId].push(entry)
      })

      scorecardData?.availability?.forEach((av: AvailabilityRecord) => {
        if (!availabilityByEntry[av.scorecardEntryId]) {
          availabilityByEntry[av.scorecardEntryId] = {}
        }
        availabilityByEntry[av.scorecardEntryId][`${av.year}-${av.month}`] = av
      })

      scorecardData?.volume?.forEach((vol: VolumeRecord) => {
        if (!volumeByEntry[vol.scorecardEntryId]) {
          volumeByEntry[vol.scorecardEntryId] = {}
        }
        volumeByEntry[vol.scorecardEntryId][`${vol.year}-${vol.month}`] = vol
      })

      return { appsByTeam, entriesByApp, availabilityByEntry, volumeByEntry }
    }, [scorecardData, teamSearch, appSearch])

  // Teams with data after filtering
  const teamsWithApps = useMemo(() => {
    return (scorecardData?.teams || [])
      .filter((team: Team) => appsByTeam[team.id]?.length > 0)
      .sort((a: Team, b: Team) => a.teamName.localeCompare(b.teamName))
  }, [scorecardData, appsByTeam])

  // Auto-expand all teams when data loads
  useEffect(() => {
    if (teamsWithApps.length > 0) {
      setExpandedTeams(new Set(teamsWithApps.map((t: Team) => t.id)))
    }
  }, [teamsWithApps])

  // Stats
  const stats: ScorecardStats = useMemo(() => {
    const teams = teamsWithApps.length
    const apps = scorecardData?.applications?.length || 0
    const entries = scorecardData?.entries?.length || 0

    let availBreaches = 0
    scorecardData?.entries?.forEach((entry: ScorecardEntry) => {
      const threshold = parseFloat(entry.availabilityThreshold)
      const entryAvail = availabilityByEntry[entry.id] || {}
      Object.values(entryAvail).forEach((av: AvailabilityRecord) => {
        if (parseFloat(av.availability) < threshold) {
          availBreaches++
        }
      })
    })

    return { teams, apps, entries, availBreaches }
  }, [teamsWithApps, scorecardData, availabilityByEntry])

  const toggleTeam = (teamId: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev)
      if (next.has(teamId)) {
        next.delete(teamId)
      } else {
        next.add(teamId)
      }
      return next
    })
  }

  const toggleApp = (appId: string) => {
    setExpandedApps((prev) => {
      const next = new Set(prev)
      if (next.has(appId)) {
        next.delete(appId)
      } else {
        next.add(appId)
      }
      return next
    })
  }

  // Get leadership display for an application
  const getLeadershipDisplay = (app: Application) => {
    const leaders: Array<{ role: string; name: string }> = []
    if (app.ownerSvpName) leaders.push({ role: 'SVP', name: app.ownerSvpName })
    if (app.vpName) leaders.push({ role: 'VP', name: app.vpName })
    if (app.directorName) leaders.push({ role: 'Dir', name: app.directorName })
    if (app.applicationOwnerName)
      leaders.push({ role: 'Owner', name: app.applicationOwnerName })
    return leaders.slice(0, 3)
  }

  const handleExportCSV = (team: Team) => {
    const apps = appsByTeam[team.id] || []
    let csv = 'Ensemble Scorecard Report\n'
    csv += `Team: ${team.teamName}\n`
    csv += `Year: ${selectedYear}\n`
    csv += `Range: ${drawerRange.toUpperCase()}\n\n`

    csv +=
      'Application,Asset ID,Metric,Identifier,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,Average/Total\n'

    apps.forEach((app) => {
      const entries = entriesByApp[app.id] || []
      entries.forEach((entry) => {
        // Availability row
        let availRow = `"${app.applicationName}",${app.assetId},"${entry.name} (Availability)","${entry.scorecardIdentifier}"`
        let sumAvail = 0
        let countAvail = 0
        for (let m = 1; m <= 12; m++) {
          const key = `${selectedYear}-${m}`
          const val = availabilityByEntry[entry.id]?.[key]?.availability
          availRow += `,${val ? parseFloat(val).toFixed(2) : ''}`
          if (val) {
            sumAvail += parseFloat(val)
            countAvail++
          }
        }
        csv +=
          availRow +
          `,${countAvail > 0 ? (sumAvail / countAvail).toFixed(2) : ''}\n`

        // Volume row
        let volRow = `"",,,"${entry.name} (Volume)",""`
        let totalVol = 0
        for (let m = 1; m <= 12; m++) {
          const key = `${selectedYear}-${m}`
          const val = volumeByEntry[entry.id]?.[key]?.volume
          volRow += `,${val || ''}`
          if (val) totalVol += val
        }
        csv += volRow + `,${totalVol}\n`
      })
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `${team.teamName.replace(/\s+/g, '_')}_Scorecard_${selectedYear}.csv`,
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleClearAllFilters = () => {
    setLeadershipType('all')
    setLeadershipSearch('')
    setTeamSearch('')
    setAppSearch('')
  }

  return (
    <div className="container mx-auto py-8 px-6 max-w-7xl space-y-8 animate-in fade-in duration-500">
      {/* Premium Admin Header Banner */}
      <PageHeader
        title="Enterprise Scorecard"
        description={
          <>
            Global performance metrics and compliance across{' '}
            <span className="text-white font-bold">{teamsWithApps.length}</span>{' '}
            active teams.
          </>
        }
      >
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
          onClick={handleClearAllFilters}
          disabled={
            !isLoading &&
            teamsWithApps.length === scorecardData?.teams?.length &&
            leadershipType === 'all' &&
            !leadershipSearch &&
            !teamSearch &&
            !appSearch
          }
        >
          <RotateCcw className="h-4 w-4" />
          Reset All
        </Button>
      </PageHeader>

      {/* Stats Overview */}
      <StatsSummary stats={stats} />

      {/* Structured Search & Filters */}
      <div>
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
            <EmptyState
              icon={Activity}
              title="No teams match your filters"
              description="Try adjusting your search criteria or clear filters."
              variant="search"
              size="md"
            />
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
      <Drawer
        open={!!viewTeam}
        onOpenChange={(open) => !open && setViewTeam(null)}
        direction="right"
      >
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
                      <DrawerTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        {viewTeam.teamName}
                      </DrawerTitle>
                      <DrawerDescription className="text-sm font-medium text-muted-foreground mt-1">
                        Enterprise Performance Report •{' '}
                        <span className="text-foreground font-bold">
                          {selectedYear}
                        </span>
                      </DrawerDescription>
                    </div>

                    <div className="h-10 w-px bg-border mx-2 hidden md:block" />

                    {/* Range Selector */}
                    <Tabs value={drawerRange} onValueChange={setDrawerRange}>
                      <TabsList>
                        <TabsTrigger value="full">Full Year</TabsTrigger>
                        <TabsTrigger value="ytd">YTD</TabsTrigger>
                        <TabsTrigger value="last3">Last 3M</TabsTrigger>
                        <TabsTrigger value="last6">Last 6M</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportCSV(viewTeam)}
                      className="gap-2"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      CSV Export
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewTeam(null)}
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
                            <h3 className="text-xl font-bold tracking-tight">
                              {app.applicationName}
                            </h3>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold uppercase tracking-widest px-2 h-5"
                            >
                              {app.tla}
                            </Badge>
                            {app.tier &&
                              ['0', '1', '2'].includes(String(app.tier)) && (
                                <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] font-bold h-5 px-2">
                                  Tier {app.tier}
                                </Badge>
                              )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                            {getLeadershipDisplay(app).map((l, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1.5 grayscale opacity-70"
                              >
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                                  {l.role}:
                                </span>
                                <span className="text-[11px] font-bold text-foreground">
                                  {l.name}
                                </span>
                              </div>
                            ))}
                            <span className="text-muted-foreground/30 hidden md:block">
                              •
                            </span>
                            <div className="flex items-center gap-1.5 opacity-60">
                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                                Asset ID:
                              </span>
                              <span className="text-[11px] font-mono font-bold text-foreground">
                                {app.assetId}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/50 shadow-xl overflow-hidden bg-card/30 backdrop-blur-md">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow className="hover:bg-transparent border-b-border/30">
                            <TableHead className="w-[240px] font-bold text-[10px] uppercase tracking-wider py-3 pl-6">
                              Metric Configuration
                            </TableHead>
                            <TableHead className="w-[60px] font-bold text-[10px] uppercase tracking-wider py-3">
                              Core
                            </TableHead>
                            {visibleMonths.map((vm) => {
                              const isFutureMonth =
                                vm.year === CURRENT_YEAR &&
                                vm.month > CURRENT_MONTH
                              return (
                                <TableHead
                                  key={`${vm.year}-${vm.month}`}
                                  className={cn(
                                    'text-center font-bold text-[10px] uppercase tracking-wider py-3',
                                    isFutureMonth && 'text-muted-foreground/40',
                                  )}
                                >
                                  <div className="flex flex-col leading-none">
                                    <span>{MONTHS[vm.month - 1]}</span>
                                    {vm.year !== selectedYear && (
                                      <span className="text-[8px] opacity-60 mt-1">
                                        {vm.year}
                                      </span>
                                    )}
                                  </div>
                                </TableHead>
                              )
                            })}
                            <TableHead className="text-center font-bold text-[10px] uppercase tracking-wider py-3 bg-primary/5 text-primary pr-6">
                              Performance
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(entriesByApp[app.id] || []).map((entry) => (
                            <EntryRows
                              key={entry.id}
                              entry={entry}
                              availability={availabilityByEntry[entry.id] || {}}
                              volume={volumeByEntry[entry.id] || {}}
                              selectedYear={selectedYear}
                              visibleMonths={visibleMonths}
                            />
                          ))}
                          {(!entriesByApp[app.id] ||
                            entriesByApp[app.id].length === 0) && (
                            <TableRow>
                              <TableCell
                                colSpan={visibleMonths.length + 3}
                                className="h-32 text-center text-muted-foreground italic font-medium"
                              >
                                No active metrics registered for this
                                application
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
  )
}
