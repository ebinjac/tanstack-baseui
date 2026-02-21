import {
  createFileRoute,
  redirect,
  Link,
  useRouteContext,
} from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  User,
  Mail,
  Shield,
  Briefcase,
  ArrowRight,
  RefreshCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { loginUser } from '../app/ssr/auth'
import { useAuthBlueSSO } from '../components/use-authblue-sso'

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

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
            <AvatarImage src="" />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Shield className="w-4 h-4" />
              <span>ADS ID: {user.adsId}</span>
            </div>
          </div>
        </div>
        {/* Optional Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCcw
              className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Refresh Permissions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Stats or Additional Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">
                  Total Teams
                </span>
                <span className="font-bold">{permissions.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Role</span>
                <Badge variant="secondary">User</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Joined</span>
                <span className="font-medium text-sm">Dec 2025</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Need Access?</CardTitle>
              <CardDescription>
                Join a new team or request elevated permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/teams/register">
                <Button className="w-full">Register New Team</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Teams List (Spans 2 columns) */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">My Teams</h2>
          </div>

          {permissions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="p-4 rounded-full bg-muted">
                  <Briefcase className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">No Teams Found</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    You are not a member of any teams yet. Register a new team
                    to get started.
                  </p>
                </div>
                <Link to="/teams/register">
                  <Button variant="outline">Create Team</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {permissions.map((perm) => (
                <Link
                  key={perm.teamId}
                  to={`/teams/${perm.teamId}/dashboard` as any}
                  className="block group"
                >
                  <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/50">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Briefcase className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {perm.teamName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                perm.role === 'ADMIN' ? 'default' : 'secondary'
                              }
                              className="text-xs"
                            >
                              {perm.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              ID: {perm.teamId.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
