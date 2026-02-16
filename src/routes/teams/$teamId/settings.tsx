import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Route as RootRoute } from '../../__root'
import { getTeamById, updateTeam } from '@/app/actions/teams'
import { createApplication, getTeamApplications, updateApplication, deleteApplication, checkTeamTLA } from '@/app/actions/applications'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateApplicationSchema, UpdateApplicationSchema } from '@/lib/zod/application.schema'
import { UpdateTeamSchema } from '@/lib/zod/team.schema'
import { z } from 'zod'
import { cn } from "@/lib/utils"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Loader2,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Mail,
  User,
  Activity,
  Hash,
  MessageSquare,
  AlertTriangle,
  Users2,
  ShieldCheck,
  Calendar,
  Contact2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Info,
  LayoutDashboard,
  Boxes,
  LifeBuoy,
  Wrench,
  ExternalLink,
  BarChart3,
  Fingerprint,
  ArrowUpRight,
  Globe,
  Terminal,
  ShieldAlert,
  HelpCircle,
  Link2,
  RefreshCw,
  Server
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/teams/$teamId/settings')({
  loader: async ({ params }) => {
    const team = await getTeamById({ data: { teamId: params.teamId } })
    if (!team) {
      throw new Error("Team not found")
    }
    return { team }
  },
  component: TeamSettingsPage
})

function TeamSettingsPage() {
  const { team } = Route.useLoaderData()
  const { teamId } = Route.useParams()
  const queryClient = useQueryClient()
  const router = useRouter()

  // Get session from root route to check permissions
  const { session } = (RootRoute as any).useLoaderData()
  const isAdmin = session?.permissions?.some((p: any) => p.teamId === teamId && p.role === 'ADMIN')

  // Action States
  const [viewingApp, setViewingApp] = useState<any>(null)
  const [editingApp, setEditingApp] = useState<any>(null)
  const [deletingApp, setDeletingApp] = useState<any>(null)
  const [isEditingTeam, setIsEditingTeam] = useState(false)
  // State for search filter in apps
  const [appSearch, setAppSearch] = useState('')
  // State for active tab to enable animations
  const [activeTab, setActiveTab] = useState('overview')


  // Applications Query
  const { data: applications, isLoading: isLoadingApps } = useQuery({
    queryKey: ['applications', teamId],
    queryFn: () => getTeamApplications({ data: { teamId } })
  })

  const filteredApps = applications?.filter(app =>
    app.applicationName.toLowerCase().includes(appSearch.toLowerCase()) ||
    app.tla.toLowerCase().includes(appSearch.toLowerCase()) ||
    String(app.assetId).includes(appSearch)
  )

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async (app: any) => {
      const response = await fetch(`https://mocki.io/v1/67ffbf6c-e04e-4ad5-98e6-f1e28b2d62bd?assetId=${app.assetId}`)
      if (!response.ok) throw new Error("Failed to fetch latest registry data")
      const result = await response.json()
      const centralApp = result?.data?.application
      if (!centralApp) throw new Error("Application not found in central registry")

      const oi = centralApp.ownershipInfo || {}
      const syncData = {
        id: app.id,
        applicationName: centralApp.name,
        lifeCycleStatus: centralApp.lifeCycleStatus,
        tier: (centralApp.tier || centralApp.risk?.bia) ? String(centralApp.tier || centralApp.risk?.bia) : "NOT CORE",
        applicationOwnerName: oi.applicationowner?.fullName,
        applicationOwnerEmail: oi.applicationowner?.email,
        applicationOwnerBand: oi.applicationowner?.band,
        directorName: oi.applicationowner?.fullName,
        directorEmail: oi.applicationowner?.email,
        vpName: oi.businessOwnerLeader1?.fullName,
        vpEmail: oi.businessOwnerLeader1?.email,
        applicationManagerName: oi.applicationManager?.fullName,
        applicationManagerEmail: oi.applicationManager?.email,
        applicationManagerBand: oi.applicationManager?.band,
        ownerSvpName: oi.ownerSVP?.fullName,
        ownerSvpEmail: oi.ownerSVP?.email,
        ownerSvpBand: oi.ownerSVP?.band,
        businessOwnerName: oi.businessOwner?.fullName,
        businessOwnerEmail: oi.businessOwner?.email,
        businessOwnerBand: oi.businessOwner?.band,
        productionSupportOwnerName: oi.productionSupportOwner?.fullName,
        productionSupportOwnerEmail: oi.productionSupportOwner?.email,
        productionSupportOwnerBand: oi.productionSupportOwner?.band,
        pmoName: oi.pmo?.fullName,
        pmoEmail: oi.pmo?.email,
        pmoBand: oi.pmo?.band,
        unitCioName: oi.unitCIO?.fullName,
        unitCioEmail: oi.unitCIO?.email,
        applicationOwnerLeader1Name: oi.applicationOwnerLeader1?.fullName,
        applicationOwnerLeader1Email: oi.applicationOwnerLeader1?.email,
        applicationOwnerLeader1Band: oi.applicationOwnerLeader1?.band,
        businessOwnerLeader1Name: oi.businessOwnerLeader1?.fullName,
        businessOwnerLeader1Email: oi.businessOwnerLeader1?.email,
        businessOwnerLeader1Band: oi.businessOwnerLeader1?.band,
      }

      return updateApplication({ data: syncData })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', teamId] })
      toast.success("Application synced with Central Registry")
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to sync application")
    }
  })

  const stats = {
    total: applications?.length || 0,
    active: applications?.filter(a => a.lifeCycleStatus?.toLowerCase() === 'production' || a.lifeCycleStatus?.toLowerCase() === 'active').length || 0,
    tiers: {
      critical: applications?.filter(a => ['0', '1', '2'].includes(String(a.tier))).length || 0,
      other: applications?.filter(a => !['0', '1', '2'].includes(String(a.tier))).length || 0,
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 px-1">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <Badge variant="outline" className="rounded-full px-3 py-0 h-6 bg-primary/5 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider leading-none">
              Team Workspace
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Team Settings
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl font-medium leading-relaxed">
            Configure your team's core identity, manage the application inventory, and access shared operational resources for <span className="text-foreground font-bold px-1.5 py-0.5 bg-muted rounded-md">{team.teamName}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-sm">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
            <div className="h-8 w-8 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shadow-sm">
              +{isAdmin ? "4" : "2"}
            </div>
          </div>
          {isAdmin && (
            <Button variant="outline" size="sm" className="h-9 rounded-xl font-bold text-xs gap-2 border-muted-foreground/20 hover:bg-muted" onClick={() => setIsEditingTeam(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit Details
            </Button>
          )}
        </div>
      </div>


      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-xl border-b border-border/40 mb-6">
          <TabsList className="bg-muted/60 p-1.5 rounded-xl border border-border/40 w-auto inline-flex h-auto gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'applications', label: 'Applications', icon: Boxes, count: stats.total },
              { id: 'members', label: 'Members', icon: Users2 },
              { id: 'resources', label: 'Resources', icon: Wrench },
              { id: 'support', label: 'Support', icon: LifeBuoy },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "relative z-10 flex flex-row items-center gap-2 px-5 py-2.5 h-10 rounded-[10px] transition-all duration-300 font-medium text-sm border-none shadow-none bg-transparent hover:text-foreground",
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground/60"
                )}
              >
                <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-primary" : "text-current")} />


                <span>{tab.label}</span>

                {tab.count !== undefined && (
                  <span className={cn(
                    "ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md font-bold border transition-colors",
                    activeTab === tab.id ? "bg-primary/10 text-primary border-primary/20" : "bg-background/50 text-muted-foreground border-transparent"
                  )}>
                    {tab.count}
                  </span>
                )}

                {activeTab === tab.id && (
                  <motion.div
                    layoutId="active-tab-background"
                    className="absolute inset-0 bg-background shadow-sm border border-border/60 rounded-[10px] -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>



        <TabsContent value="overview" className="mt-6 space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard icon={<Boxes className="text-blue-500" />} label="Total Apps" value={stats.total} subLabel="Managed assets" />
            <StatsCard icon={<Activity className="text-green-500" />} label="Production" value={stats.active} subLabel="Live services" />
            <StatsCard icon={<ShieldAlert className="text-red-500" />} label="Critical (T0-T2)" value={stats.tiers.critical} subLabel="High availability" />
            <StatsCard icon={<Fingerprint className="text-purple-500" />} label="Status" value={team.isActive ? "Active" : "Inactive"} subLabel="Team state" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm border-muted/60 overflow-hidden">
              <CardHeader className=" border-b pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Governance & Access</CardTitle>
                    </div>
                    <CardDescription>Security groups and administrative boundaries.</CardDescription>
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setIsEditingTeam(true)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InfoItem icon={<Terminal className="h-4 w-4" />} label="Admin Group" value={team.adminGroup} desc="Full administrative privileges" />
                  <InfoItem icon={<Users2 className="h-4 w-4" />} label="Member Group" value={team.userGroup} desc="Standard portal access" />
                  <InfoItem icon={<Globe className="h-4 w-4" />} label="Workspace ID" value={team.id} desc="Unique internal reference" />
                  <InfoItem icon={<Calendar className="h-4 w-4" />} label="Lifecycle" value={team.isActive ? 'Active' : 'Archived'} desc="Team account status" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-muted/60 bg-primary/5 border-primary/10">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Contact2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Primary Contact</CardTitle>
                </div>
                <CardDescription>Escalation lead for this team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-background/60 border border-primary/10 shadow-sm transition-all hover:shadow-md">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Point of Contact</p>
                      <p className="text-base font-bold truncate leading-none pt-1">{team.contactName}</p>
                      <div className="flex items-center gap-1.5 pt-1 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <a href={`mailto:${team.contactEmail}`} className="text-xs hover:text-primary hover:underline truncate">{team.contactEmail}</a>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1">Quick Links</p>
                    <div className="grid gap-2">
                      <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-xs font-semibold" render={<a href={`mailto:${team.contactEmail}`} />}>
                        <Mail className="h-3.5 w-3.5" /> Email Direct
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start gap-2 h-9 text-xs font-semibold">
                        <MessageSquare className="h-3.5 w-3.5" /> Slack Message
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="applications" className="mt-6 animate-in fade-in duration-500">
          <Card className="shadow-sm overflow-hidden border-muted/60">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b  pb-4 gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-primary" /> Managed Applications
                </CardTitle>
                <CardDescription>A comprehensive inventory of systems registered to {team.teamName}.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search apps..."
                    className="pl-9 w-64 h-9 text-sm bg-background border-muted/60 focus-visible:ring-primary/20"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                  />
                </div>
                {isAdmin && (
                  <AddApplicationDialog teamId={teamId} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['applications', teamId] })} />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[300px] font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 px-6">Application Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">TNA</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4">Asset ID</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-center">Lifecycle</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-center">Tier</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground py-4 text-right px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingApps ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground animate-pulse">Fetching inventory...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredApps?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                        No applications found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApps?.map((app) => (
                      <TableRow key={app.id} className="group hover:bg-muted/40 transition-colors border-muted/40">
                        <TableCell className="font-semibold py-4 px-6">
                          <div className="flex flex-col">
                            <span>{app.applicationName}</span>
                            <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-tight">{app.id.split('-')[0]}</span>
                          </div>
                        </TableCell>
                        <TableCell className=" font-bold text-primary">{app.tla}</TableCell>
                        <TableCell className=" text-xs">{app.assetId}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "uppercase text-[9px] px-2 py-0 h-5 font-bold border",
                              app.lifeCycleStatus?.toLowerCase() === 'production' ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                app.lifeCycleStatus?.toLowerCase() === 'development' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-muted text-muted-foreground"
                            )}
                          >
                            {app.lifeCycleStatus || 'Undeclared'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={cn(
                            "inline-flex items-center justify-center px-2 py-1 rounded-lg font-bold text-[10px]",
                            app.tier === '0' || app.tier === '1' || app.tier === '2' || app.tier?.toLowerCase() === 'critical' ? "bg-red-500/10 text-red-600" :
                              app.tier === 'not core' || app.tier?.toLowerCase() === 'not core' ? "bg-muted text-muted-foreground border uppercase" :
                                "bg-muted text-muted-foreground"
                          )}>
                            {app.tier || 'Not Core'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4 px-6">
                          <ApplicationActions
                            isAdmin={isAdmin}
                            isSyncing={syncMutation.isPending && syncMutation.variables?.id === app.id}
                            onView={() => setViewingApp(app)}
                            onEdit={() => setEditingApp(app)}
                            onSync={() => syncMutation.mutate(app)}
                            onDelete={() => setDeletingApp(app)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <div className="bg-muted/10 p-4 border-t flex items-center justify-between text-[11px] text-muted-foreground uppercase font-bold tracking-widest px-6">
              <span>Showing {filteredApps?.length || 0} of {applications?.length || 0} Results</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-500" /> T1 Critical</div>
                <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500" /> Production</div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-6 animate-in fade-in duration-500">
          <MembersTab adminGroup={team.adminGroup} userGroup={team.userGroup} />
        </TabsContent>

        <TabsContent value="resources" className="mt-6 space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm border-muted/60">
              <CardHeader className="pb-3 border-b ">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Inventory Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                      <span>Tier Distribution</span>
                      <span className="text-muted-foreground">{Math.round((stats.tiers.critical / (stats.total || 1)) * 100)}% Highly Critical</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                      <div className="h-full bg-red-500" style={{ width: `${(stats.tiers.critical / (stats.total || 1)) * 100}%` }} />
                      <div className="h-full bg-muted-foreground/20 flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                      <span>Production Ratio</span>
                      <span className="text-muted-foreground">{Math.round((stats.active / (stats.total || 1)) * 100)}% Compliance</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${(stats.active / (stats.total || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t space-y-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Team Capabilities</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[9px] px-2 py-0 h-5 font-bold">Standard Support</Badge>
                    <Badge variant="outline" className="text-[9px] px-2 py-0 h-5 font-bold">SNOW Integration</Badge>
                    <Badge variant="outline" className="text-[9px] px-2 py-0 h-5 font-bold">Slack Automated</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-sm border-muted/60">
              <CardHeader className="pb-3 border-b ">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">Operational Tooling</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y border-b">
                  <ToolItem icon={<BarChart3 className="h-4 w-4" />} title="Scorecard" desc="Quality and compliance metrics for application health." link="#" />
                  <ToolItem icon={<Server className="h-4 w-4" />} title="envMatrix" desc="Comprehensive server and environment management in a single view." link="#" />
                  <ToolItem icon={<Link2 className="h-4 w-4" />} title="Link Manager" desc="Centralized directory for team internal resources." link="#" />
                  <ToolItem icon={<RefreshCw className="h-4 w-4" />} title="Turnover" desc="Shift handover and operational transition management." link="#" />
                </div>
                <div className="p-4 bg-muted/5 flex justify-center">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold gap-2">
                    Request Access to More Tools <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="support" className="mt-6 space-y-6 animate-in fade-in duration-500">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight lowercase first-letter:uppercase">Team Support Hub</h2>
              <p className="text-muted-foreground text-sm">Need assistance? Here are the primary touchpoints for {team.teamName}.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-md border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group p-8 flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">Slack Communality</h3>
                  <p className="text-xs text-muted-foreground max-w-[200px]">Real-time chat and incident coordination for the whole team.</p>
                </div>
                <Button className="w-full gap-2 font-bold shadow-lg shadow-primary/20">
                  Open Slack Channel <ExternalLink className="h-4 w-4" />
                </Button>
              </Card>

              <Card className="shadow-md border-muted/60 hover:border-muted-foreground/40 transition-colors p-8 flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center border border-muted-foreground/10 group-hover:scale-110 transition-transform">
                  <Mail className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">Official Reach Out</h3>
                  <p className="text-xs text-muted-foreground max-w-[200px]">Send a formal request or query to our technical leads.</p>
                </div>
                <Button variant="outline" className="w-full gap-2 font-bold" render={<a href={`mailto:${team.contactEmail}`} />}>
                  Email Technical Lead <Mail className="h-4 w-4" />
                </Button>
              </Card>
            </div>


            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <HelpCircle className="h-4 w-4" />
              <span className="text-xs font-semibold">Missing information? Contact our platform administrators.</span>
            </div>
          </div>
        </TabsContent>
      </Tabs >

      {
        viewingApp && (
          <ViewApplicationDialog app={viewingApp} open={!!viewingApp} onOpenChange={(open) => !open && setViewingApp(null)} />
        )
      }

      {
        editingApp && (
          <EditApplicationDialog
            app={editingApp}
            open={!!editingApp}
            onOpenChange={(open) => !open && setEditingApp(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['applications', teamId] })
              setEditingApp(null)
            }}
          />
        )
      }

      {
        deletingApp && (
          <DeleteConfirmationDialog
            app={deletingApp}
            open={!!deletingApp}
            onOpenChange={(open) => !open && setDeletingApp(null)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['applications', teamId] })
              setDeletingApp(null)
            }}
          />
        )
      }

      {
        isEditingTeam && (
          <EditTeamDialog
            team={team}
            open={isEditingTeam}
            onOpenChange={setIsEditingTeam}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['team', teamId] })
              setIsEditingTeam(false)
              router.invalidate()
            }}
          />
        )
      }
    </div >
  )
}

function EditTeamDialog({ team, open, onOpenChange, onSuccess }: { team: any, open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof UpdateTeamSchema>>({
    resolver: zodResolver(UpdateTeamSchema),
    defaultValues: {
      id: team.id,
      teamName: team.teamName,
      userGroup: team.userGroup,
      adminGroup: team.adminGroup,
      contactName: team.contactName,
      contactEmail: team.contactEmail,
      isActive: team.isActive,
    }
  })

  const updateMutation = useMutation({
    mutationFn: updateTeam,
    onSuccess: () => {
      toast.success("Team details updated successfully")
      onSuccess()
    },
    onError: () => toast.error("Failed to update team details")
  })

  const onSubmit = (values: z.infer<typeof UpdateTeamSchema>) => {
    updateMutation.mutate({ data: values })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Team Details</DialogTitle>
          <DialogDescription>Update your team's core configuration and contact information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2 font-semibold">
                Team Name
              </Label>
              <Input {...register('teamName')} placeholder="e.g. Finance Technology Operations" />
              <p className="text-[11px] text-muted-foreground">The primary name for your team visible across the portal.</p>
              {errors.teamName && <p className="text-sm text-destructive">{errors.teamName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold">
                Contact Name
              </Label>
              <Input {...register('contactName')} placeholder="e.g. John Doe" />
              <p className="text-[11px] text-muted-foreground">Full name of the designated team representative.</p>
              {errors.contactName && <p className="text-sm text-destructive">{errors.contactName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold">
                Personal Contact Email
              </Label>
              <Input {...register('contactEmail')} placeholder="john.doe@example.com" />
              <p className="text-[11px] text-muted-foreground">Required for critical system notifications.</p>
              {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold">
                User Group (ADS)
              </Label>
              <Input {...register('userGroup')} className=" " />
              <p className="text-[11px] text-muted-foreground">The ADS security group used for normal platform access.</p>
              {errors.userGroup && <p className="text-sm text-destructive">{errors.userGroup.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold">
                Admin Group (ADS)
              </Label>
              <Input {...register('adminGroup')} className=" " />
              <p className="text-[11px] text-muted-foreground">Groups that grant administrative management over this team.</p>
              {errors.adminGroup && <p className="text-sm text-destructive">{errors.adminGroup.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddApplicationDialog({ teamId, onSuccess }: { teamId: string, onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSearching, setIsSearching] = useState(false)
  const [assetIdSearch, setAssetIdSearch] = useState('')
  const [tlaError, setTlaError] = useState<string | null>(null)
  const [isCheckingTla, setIsCheckingTla] = useState(false)

  // Form Setup
  const form = useForm<z.infer<typeof CreateApplicationSchema>>({
    resolver: zodResolver(CreateApplicationSchema),
    defaultValues: {
      teamId: teamId,
      assetId: 0,
      applicationName: '',
      tla: '',
      snowGroup: '',
      slackChannel: '',
      description: '',
      escalationEmail: '',
      contactEmail: '',
      teamEmail: '',
    }
  })

  const { register, handleSubmit, setValue, formState: { errors }, reset, watch, trigger, getValues } = form
  const tlaValue = watch('tla')

  // Debounced TLA Check
  useEffect(() => {
    if (currentStep !== 2 || !tlaValue || tlaValue.length < 2) {
      setTlaError(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsCheckingTla(true)
      try {
        const { exists } = await checkTeamTLA({ data: { teamId, tla: tlaValue } })
        if (exists) {
          setTlaError(`TNA "${tlaValue.toUpperCase()}" is already taken by another app in this team.`)
        } else {
          setTlaError(null)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsCheckingTla(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [tlaValue, teamId, currentStep])

  const searchAsset = async () => {
    if (!assetIdSearch) return
    setIsSearching(true)
    try {
      const response = await fetch(`https://mocki.io/v1/67ffbf6c-e04e-4ad5-98e6-f1e28b2d62bd?assetId=${assetIdSearch}`)
      if (!response.ok) throw new Error("Failed to fetch asset details")
      const data = await response.json()

      if (data?.data?.application) {
        const app = data.data.application
        setValue('assetId', app.assetId)
        setValue('applicationName', app.name)
        setValue('lifeCycleStatus', app.lifeCycleStatus)
        setValue('tier', (app.tier || app.risk?.bia) ? String(app.tier || app.risk?.bia) : "NOT CORE")

        // Map Ownership
        if (app.ownershipInfo) {
          const oi = app.ownershipInfo
          setValue('applicationOwnerName', oi.applicationowner?.fullName)
          setValue('applicationOwnerEmail', oi.applicationowner?.email)
          setValue('applicationOwnerBand', oi.applicationowner?.band)
          setValue('directorName', oi.applicationowner?.fullName)
          setValue('directorEmail', oi.applicationowner?.email)
          setValue('vpName', oi.businessOwnerLeader1?.fullName)
          setValue('vpEmail', oi.businessOwnerLeader1?.email)
          setValue('applicationManagerName', oi.applicationManager?.fullName)
          setValue('applicationManagerEmail', oi.applicationManager?.email)
          setValue('applicationManagerBand', oi.applicationManager?.band)
          setValue('ownerSvpName', oi.ownerSVP?.fullName)
          setValue('ownerSvpEmail', oi.ownerSVP?.email)
          setValue('ownerSvpBand', oi.ownerSVP?.band)
          setValue('businessOwnerName', oi.businessOwner?.fullName)
          setValue('businessOwnerEmail', oi.businessOwner?.email)
          setValue('businessOwnerBand', oi.businessOwner?.band)
          setValue('productionSupportOwnerName', oi.productionSupportOwner?.fullName)
          setValue('productionSupportOwnerEmail', oi.productionSupportOwner?.email)
          setValue('productionSupportOwnerBand', oi.productionSupportOwner?.band)
          setValue('pmoName', oi.pmo?.fullName)
          setValue('pmoEmail', oi.pmo?.email)
          setValue('pmoBand', oi.pmo?.band)
          setValue('unitCioName', oi.unitCIO?.fullName)
          setValue('unitCioEmail', oi.unitCIO?.email)
          setValue('applicationOwnerLeader1Name', oi.applicationOwnerLeader1?.fullName)
          setValue('applicationOwnerLeader1Email', oi.applicationOwnerLeader1?.email)
          setValue('applicationOwnerLeader1Band', oi.applicationOwnerLeader1?.band)
          setValue('businessOwnerLeader1Name', oi.businessOwnerLeader1?.fullName)
          setValue('businessOwnerLeader1Email', oi.businessOwnerLeader1?.email)
          setValue('businessOwnerLeader1Band', oi.businessOwnerLeader1?.band)
        }

        setCurrentStep(2)
      } else {
        toast.error("Application not found for this Asset ID")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to search for application")
    } finally {
      setIsSearching(false)
    }
  }

  const createMutation = useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      toast.success("Application created successfully")
      setOpen(false)
      onSuccess()
      reset()
      setCurrentStep(1)
      setAssetIdSearch('')
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create application")
      console.error(err)
    }
  })

  const onSubmit = (values: z.infer<typeof CreateApplicationSchema>) => {
    console.log("Form onSubmit triggered. Current Step:", currentStep);

    // Strict Step Guard: prevent submission unless on the final step (Step 4)
    if (currentStep < 4) {
      console.log("Not on final step, calling nextStep instead.");
      nextStep();
      return;
    }

    if (tlaError) {
      console.log("TNA error present, blocking submit.");
      return;
    }

    console.log("On final step, submitting mutation...");
    createMutation.mutate({ data: values });
  }

  const nextStep = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (currentStep >= 4) return;

    let isValid = false;
    if (currentStep === 2) {
      isValid = await trigger(['tla', 'applicationName', 'assetId']);
      if (isValid && tlaError) isValid = false;
    } else if (currentStep === 3) {
      isValid = await trigger(['slackChannel', 'contactEmail', 'teamEmail', 'escalationEmail']);
    } else {
      isValid = true;
    }

    if (isValid) {
      console.log("Step valid, moving from", currentStep, "to", currentStep + 1);
      setCurrentStep(prev => prev + 1);
    }
  }

  const prevStep = () => setCurrentStep(prev => prev - 1)

  const steps = [
    { id: 1, title: 'Identity', description: 'Asset Registry' },
    { id: 2, title: 'Profile', description: 'Core Details' },
    { id: 3, title: 'Operations', description: 'Contact Info' },
    { id: 4, title: 'Confirm', description: 'Review & Save' },
  ]

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) {
        reset()
        setCurrentStep(1)
        setAssetIdSearch('')
      }
    }}>
      <DialogTrigger render={
        <Button className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Application
        </Button>
      } />
      <DialogContent className="sm:max-w-[750px] overflow-hidden p-0 gap-0">
        <div className="border-b  p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <DialogTitle className="text-2xl">New Application</DialogTitle>
              <DialogDescription>Register a new system in the team workspace.</DialogDescription>
            </div>
            <div className="flex items-center gap-1.5 bg-background border px-3 py-1.5 rounded-full shadow-sm text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Step {currentStep} of 4
            </div>
          </div>

          <div className="relative flex justify-between">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
            {steps.map((s) => {
              const isActive = currentStep === s.id
              const isCompleted = currentStep > s.id
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isActive ? "bg-primary border-primary text-primary-foreground scale-110 shadow-md" :
                      isCompleted ? "bg-primary/20 border-primary text-primary" : "bg-background border-muted text-muted-foreground"
                  )}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-xs font-bold">{s.id}</span>}
                  </div>
                  <div className="hidden sm:block text-center">
                    <p className={cn("text-[10px] font-bold uppercase tracking-widest", isActive ? "text-primary" : "text-muted-foreground")}>{s.title}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-8 min-h-[400px]">
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl space-y-3">
                      <Label className="text-base font-bold flex items-center gap-2">
                        <Search className="h-4 w-4 text-primary" /> Central Asset Registry Search
                      </Label>
                      <p className="text-sm text-muted-foreground">Every application must exist in the Central Registry. Enter the unique Asset ID to begin synchronization.</p>
                      <div className="flex gap-2 pt-2">
                        <Input
                          placeholder="Search Asset ID (e.g. 200004789)"
                          className="text-lg py-6 shadow-sm"
                          value={assetIdSearch}
                          onChange={(e) => setAssetIdSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchAsset())}
                        />
                        <Button type="button" onClick={searchAsset} className="h-auto px-6 h-[50px]" disabled={isSearching || !assetIdSearch}>
                          {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="pt-10 flex items-center justify-center text-center">
                    <div className="max-w-xs space-y-2">
                      <div className="bg-muted h-10 w-10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-semibold">Missing an Asset ID?</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">Please ensure the application is registered in the Central Registry before onboarding it to this team portal.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold">Asset ID</Label>
                      <Input {...register('assetId', { valueAsNumber: true })} disabled className="bg-muted/50 " />
                      <p className="text-[10px] text-muted-foreground">The unique identifier from the Central Registry (Read-only).</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Application Name</Label>
                      <Input {...register('applicationName')} disabled className="bg-muted/50 font-semibold" />
                      <p className="text-[10px] text-muted-foreground">Public application title synced from registry.</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold flex items-center justify-between">
                        <span>Short Identifier (TNA) <span className="text-red-500">*</span></span>
                        {isCheckingTla && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                      </Label>
                      <Input
                        {...register('tla')}
                        placeholder="e.g. TKS"
                        className={cn("uppercase font-bold tracking-widest", tlaError ? "border-destructive focus-visible:ring-destructive" : "")}
                      />
                      <p className="text-[10px] text-muted-foreground leading-tight">A 3-12 character TNA used for internal referencing. Must be unique within the team.</p>
                      {tlaError && <p className="text-[11px] font-bold text-destructive mt-1">{tlaError}</p>}
                      {errors.tla && <p className="text-xs text-destructive mt-1">{errors.tla.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Lifecycle Status</Label>
                      <Input {...register('lifeCycleStatus')} disabled className="bg-muted/50 uppercase text-[10px] font-bold" />
                      <p className="text-[10px] text-muted-foreground">Current deployment stage synced from registry.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="font-bold">ServiceNow Support Group</Label>
                      <Input {...register('snowGroup')} placeholder="e.g. SNOW-GROUP-1" className=" text-sm" />
                      <p className="text-[10px] text-muted-foreground">The designated SNOW assignment group for automated ticketing.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold">Slack Operations Channel</Label>
                      <Input {...register('slackChannel')} placeholder="#ops-app-name" className="text-blue-600 dark:text-blue-400 font-medium" />
                      <p className="text-[10px] text-muted-foreground">Preferred channel for incident alerts and team chatter (must start with #).</p>
                    </div>
                    <div className="space-y-1.5 border-t pt-4">
                      <Label className="font-bold">Primary Incident Contact</Label>
                      <Input {...register('contactEmail')} placeholder="eng-leads@team.com" />
                      <p className="text-[10px] text-muted-foreground">Direct email or DL for high-priority operational issues.</p>
                    </div>
                    <div className="space-y-1.5 border-t pt-4">
                      <Label className="font-bold">Technical Team DL</Label>
                      <Input {...register('teamEmail')} placeholder="app-team@team.com" />
                      <p className="text-[10px] text-muted-foreground">Standard distribution list for team-wide announcements.</p>
                    </div>
                    <div className="space-y-1.5 md:col-span-2 border-t pt-4">
                      <Label className="font-bold">Escalation Email</Label>
                      <Input {...register('escalationEmail')} placeholder="manager-escalations@team.com" />
                      <p className="text-[10px] text-muted-foreground">Point of contact for urgent escalations (e.g. Director or specialized DL).</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Operational Context (Description)</Label>
                      <Textarea {...register('description')} placeholder="Please provide specific operational context for this application..." className="min-h-[120px] resize-none" />
                      <p className="text-[10px] text-muted-foreground">Briefly explain the application's purpose and its critical dependencies within your team.</p>
                    </div>

                    <div className="bg-muted/40 p-5 rounded-xl border space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold uppercase tracking-wider">Leadership Sync Status</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">App Owner</p>
                          <p className="text-xs font-semibold">{getValues('applicationOwnerName') || 'N/A'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Business Owner</p>
                          <p className="text-xs font-semibold">{getValues('businessOwnerName') || 'N/A'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Application Manager</p>
                          <p className="text-xs font-semibold">{getValues('applicationManagerName') || 'N/A'}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">VP / Director</p>
                          <p className="text-xs font-semibold">{getValues('vpName') || getValues('directorName') || 'N/A'}</p>
                        </div>
                      </div>
                      <p className="text-[10px] italic text-muted-foreground pt-2">Values above are synchronized from the central registry and cannot be modified here.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t flex justify-between items-center px-4">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button type="button" variant="ghost" onClick={prevStep} disabled={createMutation.isPending} className="hover:bg-muted font-bold text-xs uppercase tracking-widest">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {currentStep < 4 ? (
                  <Button type="button" onClick={(e) => nextStep(e)} className="px-8 shadow-sm font-bold text-xs uppercase tracking-widest">
                    Continue <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={createMutation.isPending || !!tlaError} className="px-10 shadow-md font-bold text-xs uppercase tracking-widest bg-primary hover:bg-primary/90">
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Complete Setup
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ApplicationActions({ isAdmin, isSyncing, onView, onEdit, onSync, onDelete }: { isAdmin: boolean, isSyncing?: boolean, onView: () => void, onEdit: () => void, onSync: () => void, onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 p-0")}>
        <span className="sr-only">Open menu</span>
        {isSyncing ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <MoreHorizontal className="h-4 w-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Application
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <DropdownMenuItem onClick={onSync} disabled={isSyncing}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")} /> {isSyncing ? "Syncing..." : "Sync Registry"}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {isAdmin && <DropdownMenuSeparator />}
        {isAdmin && (
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ViewApplicationDialog({ app, open, onOpenChange }: { app: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  if (!app) return null

  const LabelValue = ({ label, value, subValue, email }: { label: string, value: string | null | undefined, subValue?: string | null, email?: string | null }) => (
    <div className="space-y-1">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div>
        <p className="text-sm font-semibold">{value || 'N/A'}</p>
        {subValue && <p className="text-[11px] text-muted-foreground">{subValue}</p>}
        {email && (
          <a href={`mailto:${email}`} className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
            <Mail className="h-3 w-3" />
            {email}
          </a>
        )}
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between pr-8">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold">{app.applicationName}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Hash className="h-3 w-3" /> {app.assetId}
                <span className="text-muted-foreground/30">|</span>
                <span className=" text-xs bg-muted px-1.5 py-0.5 rounded">{app.tla}</span>
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={app.status === 'active' ? 'default' : 'secondary'} className="capitalize">{app.status}</Badge>
              <Badge variant="outline" className="capitalize">{app.lifeCycleStatus || 'N/A'}</Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-10">
          {/* Top Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
                <Activity className="h-3 w-3" /> Operational Info
              </h4>
              <div className="grid col-span-1 gap-4">
                <LabelValue label="Asset ID" value={String(app.assetId)} />
                <LabelValue label="TNA Identifier" value={app.tla} />
                <LabelValue label="Tier / Criticality" value={app.tier} />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
                <MessageSquare className="h-3 w-3" /> Tooling & Comms
              </h4>
              <div className="grid col-span-1 gap-4">
                <LabelValue label="ServiceNow Group" value={app.snowGroup} />
                <LabelValue label="Slack Channel" value={app.slackChannel} />
                <LabelValue label="Team Email" value={app.teamEmail} email={app.teamEmail} />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
                <AlertTriangle className="h-3 w-3" /> Support Contacts
              </h4>
              <div className="grid col-span-1 gap-4">
                <LabelValue label="Primary Contact" value={app.contactEmail} email={app.contactEmail} />
                <LabelValue label="Escalation Email" value={app.escalationEmail} email={app.escalationEmail} />
              </div>
            </div>
          </div>

          {/* Ownership Grid */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">
              <User className="h-3 w-3" /> Ownership & Leadership (Central Registry)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
              <LabelValue label="Application Owner" value={app.applicationOwnerName} email={app.applicationOwnerEmail} subValue={app.applicationOwnerBand} />
              <LabelValue label="Business Owner" value={app.businessOwnerName} email={app.businessOwnerEmail} subValue={app.businessOwnerBand} />
              <LabelValue label="Application Manager" value={app.applicationManagerName} email={app.applicationManagerEmail} subValue={app.applicationManagerBand} />
              <LabelValue label="SVP" value={app.ownerSvpName} email={app.ownerSvpEmail} subValue={app.ownerSvpBand} />
              <LabelValue label="Unit CIO" value={app.unitCioName} email={app.unitCioEmail} subValue={app.unitCioBand} />
              <LabelValue label="VP" value={app.vpName} email={app.vpEmail} />
              <LabelValue label="Director" value={app.directorName} email={app.directorEmail} />
              <LabelValue label="Prod Support Owner" value={app.productionSupportOwnerName} email={app.productionSupportOwnerEmail} subValue={app.productionSupportOwnerBand} />
              <LabelValue label="PMO" value={app.pmoName} email={app.pmoEmail} subValue={app.pmoBand} />
            </div>
          </div>

          {/* Description */}
          {app.description && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">Description</h4>
              <div className=" p-4 rounded-lg text-sm leading-relaxed text-foreground/80 border">
                {app.description}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 sm:justify-between items-center text-muted-foreground">
          <p className="text-[10px] italic">Record ID: {app.id} | Last Sync: {app.updatedBy}</p>
          <Button onClick={() => onOpenChange(false)} variant="secondary" className="px-10">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditApplicationDialog({ app, open, onOpenChange, onSuccess }: { app: any, open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof UpdateApplicationSchema>>({
    resolver: zodResolver(UpdateApplicationSchema),
    defaultValues: {
      id: app?.id,
      applicationName: app?.applicationName,
      tla: app?.tla,
      snowGroup: app?.snowGroup || '',
      slackChannel: app?.slackChannel || '',
      description: app?.description || '',
      escalationEmail: app?.escalationEmail || '',
      contactEmail: app?.contactEmail || '',
      teamEmail: app?.teamEmail || '',
    }
  })

  const updateMutation = useMutation({
    mutationFn: updateApplication,
    onSuccess: () => {
      toast.success("Application updated successfully")
      onSuccess()
    },
    onError: () => toast.error("Failed to update application")
  })

  const onSubmit = (values: z.infer<typeof UpdateApplicationSchema>) => {
    updateMutation.mutate({ data: values })
  }

  if (!app) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Application</DialogTitle>
          <DialogDescription>Update mutable details for {app.applicationName}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Application Name</Label>
              <Input {...register('applicationName')} />
              {errors.applicationName && <p className="text-sm text-red-500">{errors.applicationName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>TNA</Label>
              <Input {...register('tla')} />
              {errors.tla && <p className="text-sm text-red-500">{errors.tla.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>ServiceNow Group</Label>
              <Input {...register('snowGroup')} />
            </div>
            <div className="space-y-2">
              <Label>Slack Channel</Label>
              <Input {...register('slackChannel')} />
              {errors.slackChannel && <p className="text-sm text-red-500">{errors.slackChannel.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input {...register('contactEmail')} />
              {errors.contactEmail && <p className="text-sm text-red-500">{errors.contactEmail.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Team Email</Label>
              <Input {...register('teamEmail')} />
              {errors.teamEmail && <p className="text-sm text-red-500">{errors.teamEmail.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Escalation Email</Label>
              <Input {...register('escalationEmail')} />
              {errors.escalationEmail && <p className="text-sm text-red-500">{errors.escalationEmail.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register('description')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirmationDialog({ app, open, onOpenChange, onSuccess }: { app: any, open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const deleteMutation = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      toast.success("Application deleted successfully")
      onSuccess()
    },
    onError: () => toast.error("Failed to delete application")
  })

  if (!app) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Application?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{app.applicationName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate({ data: { applicationId: app.id } })}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatsCard({ icon, label, value, subLabel }: { icon: React.ReactNode, label: string, value: string | number, subLabelText?: string, subLabel: string }) {
  return (
    <Card className="shadow-sm border-muted/60 bg-background transition-all hover:bg-muted/[0.05]">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-xl font-bold truncate leading-tight">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{subLabel}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoItem({ icon, label, value, desc }: { icon: React.ReactNode, label: string, value: string, desc: string }) {
  return (
    <div className="space-y-1 group">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
        {icon} {label}
      </div>
      <p className="text-sm font-bold pl-0 truncate select-all">{value || 'Not Configured'}</p>
      <p className="text-[11px] text-muted-foreground">{desc}</p>
    </div>
  )
}

function ToolItem({ icon, title, desc, link }: { icon: React.ReactNode, title: string, desc: string, link: string }) {
  return (
    <a href={link} className="flex items-center justify-between p-4 hover:bg-muted/40 group transition-colors">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 rounded-lg bg-background border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-bold">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 group-hover:translate-x-1" />
    </a>
  )
}

// Types for LDAP response
interface LdapResponse {
  names: string[];
}

function MembersTab({ adminGroup, userGroup }: { adminGroup: string; userGroup: string }) {
  // Fetch admin members
  const { data: adminData, isLoading: isLoadingAdmins, error: adminError, refetch: refetchAdmins } = useQuery<LdapResponse>({
    queryKey: ['ldap-members', adminGroup],
    queryFn: async () => {
      if (!adminGroup) return { names: [] };
      const response = await fetch(`http://localhost:8008/api/ldap?group=${encodeURIComponent(adminGroup)}`);
      if (!response.ok) throw new Error('Failed to fetch admin members');
      return response.json();
    },
    enabled: !!adminGroup,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user members
  const { data: userData, isLoading: isLoadingUsers, error: userError, refetch: refetchUsers } = useQuery<LdapResponse>({
    queryKey: ['ldap-members', userGroup],
    queryFn: async () => {
      if (!userGroup) return { names: [] };
      const response = await fetch(`http://localhost:8008/api/ldap?group=${encodeURIComponent(userGroup)}`);
      if (!response.ok) throw new Error('Failed to fetch user members');
      return response.json();
    },
    enabled: !!userGroup,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const adminMembers = adminData?.names || [];
  const userMembers = userData?.names || [];

  const handleRefresh = () => {
    refetchAdmins();
    refetchUsers();
    toast.success('Refreshing member list...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users2 className="h-5 w-5 text-primary" />
            Team Members
          </h2>
          <p className="text-sm text-muted-foreground">
            Members are fetched in real-time from Active Directory groups.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleRefresh}
          disabled={isLoadingAdmins || isLoadingUsers}
        >
          <RefreshCw className={cn("h-4 w-4", (isLoadingAdmins || isLoadingUsers) && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Administrators Section */}
        <Card className="shadow-sm border-muted/60">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold">Administrators</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono h-5">
                {adminGroup || 'Not configured'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Full administrative access to team settings and configurations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingAdmins ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : adminError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <AlertTriangle className="h-8 w-8 text-destructive/60 mb-2" />
                <p className="text-sm text-muted-foreground">Failed to load administrators</p>
              </div>
            ) : adminMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Users2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No administrators found</p>
              </div>
            ) : (
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {adminMembers.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{name}</p>
                    </div>
                    <Badge className="h-5 text-[9px] bg-primary/10 text-primary border-primary/20">
                      Admin
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="p-3 bg-muted/10 border-t text-[11px] text-muted-foreground font-medium">
              {adminMembers.length} administrator{adminMembers.length !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        {/* Members Section */}
        <Card className="shadow-sm border-muted/60">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users2 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-bold">Members</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono h-5">
                {userGroup || 'Not configured'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Standard portal access for team collaboration.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : userError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <AlertTriangle className="h-8 w-8 text-destructive/60 mb-2" />
                <p className="text-sm text-muted-foreground">Failed to load members</p>
              </div>
            ) : userMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Users2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No members found</p>
              </div>
            ) : (
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {userMembers.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center border shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-3 bg-muted/10 border-t text-[11px] text-muted-foreground font-medium">
              {userMembers.length} member{userMembers.length !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Real-time Sync</p>
          <p className="text-xs text-muted-foreground">
            Member data is fetched directly from Active Directory groups. Changes to group membership
            will be reflected automatically upon page refresh.
          </p>
        </div>
      </div>
    </div>
  );
}
