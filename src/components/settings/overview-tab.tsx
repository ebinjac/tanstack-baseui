import {
  Activity,
  Boxes,
  Calendar,
  Contact2,
  Fingerprint,
  Globe,
  Mail,
  MessageSquare,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  User,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoItem, StatsCard } from "./shared";

interface TeamStats {
  active: number;
  tiers: { critical: number; other: number };
  total: number;
}

interface TeamRecord {
  adminGroup: string;
  contactEmail?: string | null;
  contactName?: string | null;
  id: string;
  isActive: boolean;
  userGroup: string;
}

interface OverviewTabProps {
  isAdmin: boolean;
  onEditTeam: () => void;
  stats: TeamStats;
  team: TeamRecord;
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatsCard
          icon={<Boxes className="h-5 w-5 text-blue-500" />}
          label="Total Apps"
          subLabel="Managed assets"
          value={stats.total}
        />
        <StatsCard
          icon={<Activity className="h-5 w-5 text-green-500" />}
          label="Production"
          subLabel="Live services"
          value={stats.active}
        />
        <StatsCard
          icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
          label="Critical (T0-T2)"
          subLabel="High availability"
          value={stats.tiers.critical}
        />
        <StatsCard
          icon={<Fingerprint className="h-5 w-5 text-purple-500" />}
          label="Status"
          subLabel="Team state"
          value={team.isActive ? "Active" : "Inactive"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Governance & Access Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Governance & Access
              </CardTitle>
              {isAdmin && (
                <Button
                  className="h-8 w-8"
                  onClick={onEditTeam}
                  size="icon"
                  variant="ghost"
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
                desc="Full administrative privileges"
                icon={<Terminal className="h-4 w-4" />}
                label="Admin Group"
                value={team.adminGroup}
              />
              <InfoItem
                desc="Standard portal access"
                icon={<Users2 className="h-4 w-4" />}
                label="Member Group"
                value={team.userGroup}
              />
              <InfoItem
                desc="Unique internal reference"
                icon={<Globe className="h-4 w-4" />}
                label="Workspace ID"
                value={team.id}
              />
              <InfoItem
                desc="Team account status"
                icon={<Calendar className="h-4 w-4" />}
                label="Lifecycle"
                value={team.isActive ? "Active" : "Archived"}
              />
            </div>
          </CardContent>
        </Card>

        {/* Primary Contact Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Contact2 className="h-4 w-4 text-primary" />
              Primary Contact
            </CardTitle>
            <CardDescription>
              Team escalation lead and point of contact.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-sm">
                  {team.contactName || "Not assigned"}
                </p>
                {team.contactEmail && (
                  <a
                    className="flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-primary"
                    href={`mailto:${team.contactEmail}`}
                  >
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{team.contactEmail}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button className="justify-start" size="sm" variant="outline">
                <a href={`mailto:${team.contactEmail}`}>
                  <Mail className="h-4 w-4" /> Email
                </a>
              </Button>
              <Button className="justify-start" size="sm" variant="outline">
                <MessageSquare className="h-4 w-4" /> Slack
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
