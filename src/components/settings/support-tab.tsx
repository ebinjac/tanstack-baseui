import {
  ExternalLink,
  HelpCircle,
  Mail,
  MessageSquare,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TeamRecord {
  contactEmail?: string | null;
  contactName?: string | null;
}

interface SupportTabProps {
  team: TeamRecord;
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
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-semibold text-sm">{team.contactName}</p>
                <p className="text-muted-foreground text-xs">Team Lead</p>
              </div>
              {team.contactEmail && (
                <Button size="sm" variant="outline">
                  <a href={`mailto:${team.contactEmail}`}>
                    <Mail className="h-4 w-4" /> Email
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Communication Channels */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-sm">Slack Channel</p>
                <p className="text-muted-foreground text-xs">
                  Real-time chat and incident coordination.
                </p>
                <Button className="h-auto p-0 text-xs" size="sm" variant="link">
                  Open Channel <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-sm">Email</p>
                <p className="text-muted-foreground text-xs">
                  Formal requests and documentation.
                </p>
                {team.contactEmail && (
                  <Button
                    className="h-auto p-0 text-xs"
                    size="sm"
                    variant="link"
                  >
                    <a href={`mailto:${team.contactEmail}`}>
                      {team.contactEmail}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Banner */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
        <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground text-xs">
          Missing information? Contact platform administrators for assistance.
        </p>
      </div>
    </div>
  );
}
