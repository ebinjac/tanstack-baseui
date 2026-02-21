import {
  Link,
  createFileRoute,
  redirect,
  useRouteContext,
  useRouter,
} from '@tanstack/react-router'
import {
  ArrowRight,
  Briefcase,
  Mail,
  RefreshCcw,
  Shield,
  User,
  Plus,
  ShieldCheck,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { loginUser } from '../app/ssr/auth'
import { useAuthBlueSSO } from '../components/use-authblue-sso'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({
        to: '/',
      })
    }
  },
  component: ProfilePage,
})

function ProfilePage() {
  const { session } = useRouteContext({ from: '__root__' })
  // Session is guaranteed to exist here due to beforeLoad redirect
  const { user, permissions } = session!
  const ssoUser = useAuthBlueSSO()
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (!ssoUser) {
      toast.error('SSO Identity not found')
      return
    }
    setIsRefreshing(true)
    try {
      // Re-authenticate to refresh permissions from DB
      await loginUser({ data: ssoUser })

      // Invalidate router to reload loader data
      await router.invalidate()

      toast.success('Permissions refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh session:', error)
      toast.error('Failed to refresh session')
    } finally {
      setIsRefreshing(false)
    }
  }

  const initials =
    `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()

  const isAdmin = permissions.some((p) => p.role === 'ADMIN')

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Cover Banner */}
      <div className="relative h-64 overflow-hidden bg-primary/10 border-b border-border/50">
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url('/patterns/amex-2.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
      </div>

      <div className="container mx-auto px-4 max-w-5xl -mt-18 relative z-10 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pb-6 border-b border-border/50">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
            <Avatar className="h-32 w-32 border-4 border-background shadow-2xl ring-1 ring-border/10 ring-offset-2 ring-offset-background flex-shrink-0">
              <AvatarImage src="" />
              <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-black">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-4 md:space-y-2 mb-2 w-full flex flex-col md:flex-row md:justify-between md:items-end">
              <div className="space-y-2 text-center md:text-left">
                <h1 className="text-4xl font-black tracking-tight flex flex-col md:flex-row items-center gap-3">
                  {user.firstName} {user.lastName}
                  {isAdmin && (
                    <Badge variant="default" className="bg-primary text-primary-foreground text-xs h-6 px-2 gap-1 uppercase tracking-widest font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Platform Admin
                    </Badge>
                  )}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground font-medium text-sm">
                  <div className="flex items-center gap-1.5 bg-background/50 backdrop-blur-sm border border-border/50 px-3 py-1.5 rounded-lg shadow-sm">
                    <Mail className="w-4 h-4 text-primary opacity-80" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-background/50 backdrop-blur-sm border border-border/50 px-3 py-1.5 rounded-lg shadow-sm">
                    <Shield className="w-4 h-4 text-primary opacity-80" />
                    <span>ADS ID: {user.adsId}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0">
                <Button
                  variant="outline"
                  className="w-full md:w-auto gap-2 bg-background/80 backdrop-blur-sm border-border hover:bg-background/100 font-semibold shadow-sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh Permissions
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Overview Card */}
            <Card className="shadow-lg shadow-black/5 border-border/50 overflow-hidden relative bg-card/50 backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Profile Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-background rounded-lg shadow-sm border border-border/50">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-semibold">Total Teams</span>
                  </div>
                  <span className="text-lg font-black">{permissions.length}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-background rounded-lg shadow-sm border border-border/50">
                      <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-semibold">Clearance</span>
                  </div>
                  <Badge variant={isAdmin ? "default" : "secondary"} className="shadow-sm">
                    {isAdmin ? 'Admin' : 'User'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-background rounded-lg shadow-sm border border-border/50">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-semibold">Joined Platform</span>
                  </div>
                  <span className="text-sm font-bold text-muted-foreground">Dec 2025</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="bg-primary/5 border-primary/20 shadow-lg shadow-primary/5 overflow-hidden relative">
              <div
                className="absolute inset-0 bg-cover bg-center pointer-events-none"
                style={{ backgroundImage: `url('/patterns/amex-2.jpg')`, opacity: 0.05 }}
              />
              <CardHeader className="pb-3 relative z-10">
                <CardTitle className="text-lg font-bold">Need a new workspace?</CardTitle>
                <CardDescription className="text-primary/70 font-medium">
                  Register a team and get access to Scorecard and TO-HUB immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <Link to="/teams/register" className="w-full">
                  <Button className="w-full gap-2 shadow-xl shadow-primary/20 font-bold">
                    <Plus className="w-4 h-4" />
                    Register New Team
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Teams List */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight">Active Workspaces <span className="text-muted-foreground font-semibold">({permissions.length})</span></h2>
            </div>

            {permissions.length === 0 ? (
              <Card className="border-dashed border-2 bg-transparent shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-5">
                  <div className="p-5 rounded-3xl bg-primary/10 relative">
                    <Briefcase className="w-10 h-10 text-primary relative z-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl tracking-tight">No Teams Found</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      You haven't been granted access to any Ensemble workspaces yet.
                    </p>
                  </div>
                  <Link to="/teams/register">
                    <Button className="gap-2 rounded-xl text-sm font-bold shadow-md">
                      <Plus className="w-4 h-4" />
                      Create your first team
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {permissions.map((perm) => (
                  <div key={perm.teamId} className="h-full">
                    <Link
                      to={`/teams/${perm.teamId}/settings` as any}
                      className="block h-full group"
                    >
                      <Card className="h-full bg-card/60 backdrop-blur-xl relative overflow-hidden flex flex-col border border-border/50 hover:border-border transition-colors">
                        <CardContent className="p-6 relative z-10 flex flex-col h-full gap-6">
                          <div className="flex items-start justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground border border-primary/20 transition-colors">
                              <Briefcase className="w-6 h-6" />
                            </div>
                            <Badge
                              variant={perm.role === 'ADMIN' ? 'default' : 'secondary'}
                              className={`text-[10px] font-bold uppercase tracking-widest ${perm.role === 'ADMIN' ? 'shadow-none border-0' : 'bg-muted border-border/50 text-muted-foreground'}`}
                            >
                              {perm.role}
                            </Badge>
                          </div>

                          <div className="space-y-2 flex-grow">
                            <h3 className="font-black text-xl tracking-tight text-foreground line-clamp-2">
                              {perm.teamName}
                            </h3>
                            <div className="text-[11px] font-mono font-bold text-muted-foreground/70 bg-muted/50 border border-border/50 w-fit px-2 py-1 rounded-md flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                              WKS-{perm.teamId.slice(0, 6).toUpperCase()}
                            </div>
                          </div>

                          <div className="pt-4 mt-auto border-t border-border/50 flex items-center text-sm font-bold text-muted-foreground">
                            Manage workspace
                            <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
