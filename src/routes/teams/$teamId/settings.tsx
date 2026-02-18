import { createFileRoute, useRouter } from '@tanstack/react-router'
import { getTeamById } from '@/app/actions/teams'
import { getTeamApplications, updateApplication } from '@/app/actions/applications'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  Boxes,
  LifeBuoy,
  Wrench,
  Users2,
} from 'lucide-react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  SettingsNav,
  OverviewTab,
  ApplicationsTab,
  MembersTab,
  ResourcesTab,
  SupportTab,
  NavItem,
  EditTeamDialog,
  AddApplicationDialog,
  ViewApplicationDialog,
  EditApplicationDialog,
  DeleteConfirmationDialog
} from '@/components/settings'

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
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')

  // Action States
  const [viewingApp, setViewingApp] = useState<any>(null)
  const [editingApp, setEditingApp] = useState<any>(null)
  const [deletingApp, setDeletingApp] = useState<any>(null)
  const [isEditingTeam, setIsEditingTeam] = useState(false)

  // Fetch Applications
  const { data: applications, isLoading: isLoadingApps } = useQuery({
    queryKey: ['applications', teamId],
    queryFn: () => getTeamApplications({ data: { teamId } }),
  })

  // Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async (app: any) => {
      // Mock Sync Implementation
      const syncData: any = {
        id: app.id,
        teamId: app.teamId,
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

  const navItems: NavItem[] = [
    { value: 'overview', label: 'Overview', icon: LayoutDashboard },
    { value: 'applications', label: 'Applications', icon: Boxes, count: stats.total },
    { value: 'members', label: 'Members', icon: Users2 },
    { value: 'resources', label: 'Resources', icon: Wrench },
    { value: 'support', label: 'Support', icon: LifeBuoy },
  ]

  // Mock Admin Check
  const isAdmin = true

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your team settings and preferences for <span className="font-semibold text-foreground">{team.teamName}</span>.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <SettingsNav
          items={navItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="flex-1 min-w-0">
          {activeTab === 'overview' && (
            <OverviewTab
              team={team}
              stats={stats}
              isAdmin={isAdmin}
              onEditTeam={() => setIsEditingTeam(true)}
            />
          )}

          {activeTab === 'applications' && (
            <ApplicationsTab
              team={team}
              applications={applications}
              isLoadingApps={isLoadingApps}
              isAdmin={isAdmin}
              syncMutation={syncMutation}
              onViewApp={setViewingApp}
              onEditApp={setEditingApp}
              onDeleteApp={setDeletingApp}
              onAddSuccess={() => queryClient.invalidateQueries({ queryKey: ['applications', teamId] })}
              teamId={teamId}
              AddApplicationDialog={AddApplicationDialog}
            />
          )}

          {activeTab === 'members' && (
            <MembersTab
              adminGroup={team.adminGroup}
              userGroup={team.userGroup}
            />
          )}

          {activeTab === 'resources' && (
            <ResourcesTab
              stats={stats}
            />
          )}

          {activeTab === 'support' && (
            <SupportTab
              team={team}
            />
          )}
        </div>
      </div>

      {viewingApp && (
        <ViewApplicationDialog
          app={viewingApp}
          open={!!viewingApp}
          onOpenChange={(open) => !open && setViewingApp(null)}
        />
      )}

      {editingApp && (
        <EditApplicationDialog
          app={editingApp}
          open={!!editingApp}
          onOpenChange={(open) => !open && setEditingApp(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['applications', teamId] })
            setEditingApp(null)
          }}
        />
      )}

      {deletingApp && (
        <DeleteConfirmationDialog
          app={deletingApp}
          open={!!deletingApp}
          onOpenChange={(open) => !open && setDeletingApp(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['applications', teamId] })
            setDeletingApp(null)
          }}
        />
      )}

      {isEditingTeam && (
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
      )}
    </div>
  )
}
