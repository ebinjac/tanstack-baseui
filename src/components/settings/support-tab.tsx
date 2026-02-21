import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MessageSquare,
  Mail,
  ExternalLink,
  User,
  HelpCircle,
} from 'lucide-react'

interface SupportTabProps {
  team: any
}

export function SupportTab({ team }: SupportTabProps) {
  return (
    <div className="space-y-6">
      {/* Contact Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
          <CardDescription>
            Reach out to the team through these channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Lead */}
          {team.contactName && (
            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-semibold">{team.contactName}</p>
                <p className="text-xs text-muted-foreground">Team Lead</p>
              </div>
              {team.contactEmail && (
                <Button
                  variant="outline"
                  size="sm"
                  render={<a href={`mailto:${team.contactEmail}`} />}
                >
                  <Mail className="h-4 w-4" /> Email
                </Button>
              )}
            </div>
          )}

          {/* Communication Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-semibold">Slack Channel</p>
                <p className="text-xs text-muted-foreground">
                  Real-time chat and incident coordination.
                </p>
                <Button size="sm" variant="link" className="h-auto p-0 text-xs">
                  Open Channel <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-sm font-semibold">Email</p>
                <p className="text-xs text-muted-foreground">
                  Formal requests and documentation.
                </p>
                {team.contactEmail && (
                  <Button
                    size="sm"
                    variant="link"
                    className="h-auto p-0 text-xs"
                    render={<a href={`mailto:${team.contactEmail}`} />}
                  >
                    {team.contactEmail}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Banner */}
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
        <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground">
          Missing information? Contact platform administrators for assistance.
        </p>
      </div>
    </div>
  )
}
