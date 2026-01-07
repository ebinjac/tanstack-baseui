import { createFileRoute } from '@tanstack/react-router'
import { getRegistrationRequests } from '@/app/actions/team-registration'
import { getTeams } from '@/app/actions/teams'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, Clock, CheckCircle2, XCircle } from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const { data: requests } = useQuery({
    queryKey: ['registration-requests'],
    queryFn: () => getRegistrationRequests(),
  })

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => getTeams(),
  })

  // Calculate stats from requests
  const stats = {
    totalRequests: requests?.length || 0,
    pending: requests?.filter(r => r.status === 'pending').length || 0,
    approvedRequests: requests?.filter(r => r.status === 'approved').length || 0,
    rejected: requests?.filter(r => r.status === 'rejected').length || 0,
    activeTeams: teams?.length || 0,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of system activity and team status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={stats.totalRequests} icon={ClipboardList} color="blue" />
        <StatCard title="Pending Review" value={stats.pending} icon={Clock} color="amber" />
        <StatCard title="Active Teams" value={stats.activeTeams} icon={CheckCircle2} color="emerald" />
        <StatCard title="Rejected Requests" value={stats.rejected} icon={XCircle} color="red" />
      </div>

      {/* Add more dashboard widgets here later if needed */}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: 'blue' | 'amber' | 'emerald' | 'red' }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
    emerald: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/20',
  }

  return (
    <Card className="border-none shadow-sm ring-1 ring-gray-100 dark:ring-gray-800 hover:shadow-md transition-all duration-300 group overflow-hidden">
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 duration-300 ${colors[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="absolute -bottom-1 -right-1 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
          <Icon className="h-16 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}
