import { createFileRoute } from '@tanstack/react-router'
import { getTeams } from '@/app/actions/teams'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MoreHorizontal,
  ExternalLink,
  Search,
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  Filter,
  UserCheck,
  Building2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '@/components/shared'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/empty-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatDistanceToNow } from 'date-fns'
import { Team } from '@/db/schema/teams'

export const Route = createFileRoute('/admin/teams')({
  component: AdminTeams,
})

function AdminTeams() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => getTeams(),
  })

  const filteredTeams = teams?.filter((team) => {
    const matchesSearch =
      team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && team.isActive) ||
      (statusFilter === 'inactive' && !team.isActive)
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: teams?.length || 0,
    active: teams?.filter((t) => t.isActive).length || 0,
    inactive: teams?.filter((t) => !t.isActive).length || 0,
    withAdminGroup: teams?.filter((t) => t.adminGroup).length || 0,
  }

  return (
    <div className="space-y-6">
      {/* Premium Admin Header Banner */}
      <PageHeader
        title="Active Teams"
        description="Manage and overview all registered engineering teams in the system."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MiniStatCard
          title="Total Teams"
          value={stats.total}
          icon={Building2}
          color="blue"
        />
        <MiniStatCard
          title="Active"
          value={stats.active}
          icon={CheckCircle2}
          color="emerald"
        />
        <MiniStatCard
          title="Inactive"
          value={stats.inactive}
          icon={XCircle}
          color="red"
        />
        <MiniStatCard
          title="With Admins"
          value={stats.withAdminGroup}
          icon={UserCheck}
          color="amber"
        />
      </div>

      <Card className="border-none shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by team, contact or email..."
                  className="pl-10 h-10 bg-muted/50 border-none ring-1 ring-border"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <TooltipProvider>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10"
                            >
                              <Filter className="h-4 w-4" />
                            </Button>
                          }
                        />
                      }
                    />
                    <TooltipContent>Filter by status</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Status Filter</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setStatusFilter('all')}
                        className="flex items-center justify-between"
                      >
                        All{' '}
                        {statusFilter === 'all' && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setStatusFilter('active')}
                        className="flex items-center justify-between"
                      >
                        Active{' '}
                        {statusFilter === 'active' && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setStatusFilter('inactive')}
                        className="flex items-center justify-between"
                      >
                        Inactive{' '}
                        {statusFilter === 'inactive' && (
                          <CheckCircle2 className="h-4 w-4 text-red-500" />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border shadow-sm overflow-hidden bg-background">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px] font-semibold">
                    Team Details
                  </TableHead>
                  <TableHead className="font-semibold">
                    Contact Person
                  </TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold pr-6">
                    Management
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-muted-foreground text-sm">
                          Fetching teams...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (filteredTeams?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <EmptyState
                        icon={Search}
                        title="No teams found"
                        description="No teams match your current filters."
                        variant="search"
                        size="md"
                        actionText="Clear filters"
                        onAction={() => {
                          setSearchTerm('')
                          setStatusFilter('all')
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeams?.map((team) => (
                    <TableRow
                      key={team.id}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Shield className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-base">
                              {team.teamName}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 font-normal bg-accent/50"
                              >
                                U: {team.userGroup}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-[10px] h-4 font-normal bg-accent/50"
                              >
                                A: {team.adminGroup}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 ring-1 ring-border shadow-sm">
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                              {team.contactName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium leading-none">
                              {team.contactName}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1">
                              {team.contactEmail}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {new Date(team.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(team.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge active={team.isActive} />
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9 text-primary hover:text-primary hover:bg-primary/5"
                                    onClick={() => {
                                      setSelectedTeam(team)
                                      setIsDetailsOpen(true)
                                    }}
                                  >
                                    <ExternalLink className="h-5 w-5" />
                                  </Button>
                                }
                              />
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => {
                                  setSelectedTeam(team)
                                  setIsDetailsOpen(true)
                                }}
                              >
                                <ExternalLink className="h-4 w-4" /> View
                                Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2">
                                <Users className="h-4 w-4" /> View Members
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Team Profile</DialogTitle>
                <DialogDescription>
                  Overview and configuration for this team.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedTeam && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Team Name
                  </span>
                  <p className="text-sm font-bold">{selectedTeam.teamName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </span>
                  <StatusBadge active={selectedTeam.isActive} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ads User Group
                  </span>
                  <p className="text-sm font-mono bg-muted/50 px-2 py-0.5 rounded border border-border w-fit">
                    {selectedTeam.userGroup}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ads Admin Group
                  </span>
                  <p className="text-sm font-mono bg-muted/50 px-2 py-0.5 rounded border border-border w-fit">
                    {selectedTeam.adminGroup}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Primary Contact
                </span>
                <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1">
                  <span className="text-sm font-bold">
                    {selectedTeam.contactName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedTeam.contactEmail}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Created
                  </span>
                  <p className="text-sm font-medium">
                    {new Date(selectedTeam.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground italic">
                    {formatDistanceToNow(new Date(selectedTeam.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                {selectedTeam.updatedAt && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Last Updated
                    </span>
                    <p className="text-sm font-medium">
                      {new Date(selectedTeam.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground italic">
                      {formatDistanceToNow(new Date(selectedTeam.updatedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Internal Identifiers
                </span>
                <p className="text-[10px] font-mono text-muted-foreground break-all bg-muted/30 p-2 rounded">
                  ID: {selectedTeam.id}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MiniStatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  icon: any
  color: 'blue' | 'amber' | 'emerald' | 'red'
}) {
  const colors = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
    emerald: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/20',
  }

  return (
    <Card className="border-none shadow-sm ring-1 ring-border group overflow-hidden bg-background">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div
          className={`p-2 rounded-lg transition-transform group-hover:scale-110 duration-300 ${colors[color]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50 gap-1.5 flex w-fit items-center">
        <CheckCircle2 className="h-3 w-3" /> Active
      </Badge>
    )
  }
  return (
    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200/50 dark:border-red-800/50 gap-1.5 flex w-fit items-center">
      <XCircle className="h-3 w-3" /> Inactive
    </Badge>
  )
}
