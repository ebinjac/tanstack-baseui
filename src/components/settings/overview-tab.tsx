import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Boxes,
  Activity,
  ShieldAlert,
  Fingerprint,
  ShieldCheck,
  Pencil,
  Terminal,
  Users2,
  Globe,
  Calendar,
  Contact2,
  User,
  Mail,
  MessageSquare,
} from 'lucide-react'
import { StatsCard, InfoItem } from './shared'

interface TeamStats {
  total: number
  active: number
  tiers: { critical: number; other: number }
}

interface OverviewTabProps {
  team: any
  stats: TeamStats
  isAdmin: boolean
  onEditTeam: () => void
}

export function OverviewTab({
  team,
  stats,
  isAdmin,
  onEditTeam,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          icon={<Boxes className="h-5 w-5 text-blue-500" />}
          label="Total Apps"
          value={stats.total}
          subLabel="Managed assets"
        />
        <StatsCard
          icon={<Activity className="h-5 w-5 text-green-500" />}
          label="Production"
          value={stats.active}
          subLabel="Live services"
        />
        <StatsCard
          icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
          label="Critical (T0-T2)"
          value={stats.tiers.critical}
          subLabel="High availability"
        />
        <StatsCard
          icon={<Fingerprint className="h-5 w-5 text-purple-500" />}
          label="Status"
          value={team.isActive ? 'Active' : 'Inactive'}
          subLabel="Team state"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Governance & Access Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Governance & Access
              </CardTitle>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onEditTeam}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <CardDescription>
              Security groups and administrative boundaries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoItem
                icon={<Terminal className="h-4 w-4" />}
                label="Admin Group"
                value={team.adminGroup}
                desc="Full administrative privileges"
              />
              <InfoItem
                icon={<Users2 className="h-4 w-4" />}
                label="Member Group"
                value={team.userGroup}
                desc="Standard portal access"
              />
              <InfoItem
                icon={<Globe className="h-4 w-4" />}
                label="Workspace ID"
                value={team.id}
                desc="Unique internal reference"
              />
              <InfoItem
                icon={<Calendar className="h-4 w-4" />}
                label="Lifecycle"
                value={team.isActive ? 'Active' : 'Archived'}
                desc="Team account status"
              />
            </div>
          </CardContent>
        </Card>

        {/* Primary Contact Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Contact2 className="h-4 w-4 text-primary" />
              Primary Contact
            </CardTitle>
            <CardDescription>
              Team escalation lead and point of contact.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">
                  {team.contactName || 'Not assigned'}
                </p>
                {team.contactEmail && (
                  <a
                    href={`mailto:${team.contactEmail}`}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{team.contactEmail}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                render={<a href={`mailto:${team.contactEmail}`} />}
              >
                <Mail className="h-4 w-4" /> Email
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <MessageSquare className="h-4 w-4" /> Slack
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
