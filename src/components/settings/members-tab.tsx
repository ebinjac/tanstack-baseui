import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Info,
  Loader2,
  RefreshCw,
  ShieldCheck,
  User,
  Users2,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LdapResponse {
  names: string[];
}

interface MembersTabProps {
  adminGroup: string;
  userGroup: string;
}

export function MembersTab({ adminGroup, userGroup }: MembersTabProps) {
  const {
    data: adminData,
    isLoading: isLoadingAdmins,
    error: adminError,
    refetch: refetchAdmins,
  } = useQuery<LdapResponse>({
    queryKey: ["ldap-members", adminGroup],
    queryFn: async () => {
      if (!adminGroup) {
        return { names: [] };
      }
      const response = await fetch(
        `http://localhost:8008/api/ldap?group=${encodeURIComponent(adminGroup)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch admin members");
      }
      return response.json();
    },
    enabled: !!adminGroup,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: userData,
    isLoading: isLoadingUsers,
    error: userError,
    refetch: refetchUsers,
  } = useQuery<LdapResponse>({
    queryKey: ["ldap-members", userGroup],
    queryFn: async () => {
      if (!userGroup) {
        return { names: [] };
      }
      const response = await fetch(
        `http://localhost:8008/api/ldap?group=${encodeURIComponent(userGroup)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user members");
      }
      return response.json();
    },
    enabled: !!userGroup,
    staleTime: 5 * 60 * 1000,
  });

  const adminMembers = adminData?.names || [];
  const userMembers = userData?.names || [];

  const handleRefresh = () => {
    refetchAdmins();
    refetchUsers();
    toast.success("Refreshing member list...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 font-bold text-base">
            <Users2 className="h-4 w-4 text-primary" />
            Team Members
          </h2>
          <p className="text-muted-foreground text-sm">
            Members fetched from Active Directory groups.
          </p>
        </div>
        <Button
          disabled={isLoadingAdmins || isLoadingUsers}
          onClick={handleRefresh}
          size="sm"
          variant="outline"
        >
          <RefreshCw
            className={cn(
              "h-4 w-4",
              (isLoadingAdmins || isLoadingUsers) && "animate-spin"
            )}
          />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Administrators */}
        <MemberGroup
          description="Full administrative access to team settings."
          error={adminError}
          groupName={adminGroup}
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
          isLoading={isLoadingAdmins}
          members={adminMembers}
          title="Administrators"
          variant="admin"
        />

        {/* Members */}
        <MemberGroup
          description="Standard portal access for collaboration."
          error={userError}
          groupName={userGroup}
          icon={<Users2 className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoadingUsers}
          members={userMembers}
          title="Members"
          variant="member"
        />
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="space-y-0.5">
          <p className="font-medium text-sm">Real-time Sync</p>
          <p className="text-muted-foreground text-xs">
            Member data is fetched from Active Directory groups. Changes are
            reflected upon page refresh.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: MemberGroup ───

interface MemberGroupProps {
  description: string;
  error: Error | null;
  groupName: string;
  icon: React.ReactNode;
  isLoading: boolean;
  members: string[];
  title: string;
  variant: "admin" | "member";
}

function MemberGroup({
  title,
  icon,
  groupName,
  description,
  isLoading,
  error,
  members,
  variant,
}: MemberGroupProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            {icon}
            {title}
          </CardTitle>
          <Badge className="h-5 font-mono text-[10px]" variant="outline">
            {groupName || "Not configured"}
          </Badge>
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <AlertTriangle className="mb-2 h-6 w-6 text-destructive/60" />
            <p className="text-muted-foreground text-sm">
              Failed to load {title.toLowerCase()}
            </p>
          </div>
        )}
        {!(isLoading || error) && members.length === 0 && (
          <EmptyState
            description={`No ${title.toLowerCase()} are configured for this team.`}
            icon={Users2}
            size="sm"
            title={`No ${title.toLowerCase()} found`}
          />
        )}
        {!(isLoading || error) && members.length > 0 && (
          <div className="max-h-[400px] divide-y overflow-y-auto">
            {members.map((name) => (
              <div
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30"
                key={name}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    variant === "admin" ? "bg-primary/10" : "bg-muted"
                  )}
                >
                  <User
                    className={cn(
                      "h-3.5 w-3.5",
                      variant === "admin"
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                </div>
                <p className="flex-1 truncate font-medium text-sm">{name}</p>
                {variant === "admin" && (
                  <Badge className="h-5 text-[9px]" variant="secondary">
                    Admin
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="border-t px-4 py-2.5 text-muted-foreground text-xs">
          {members.length} {title.toLowerCase()}
        </div>
      </CardContent>
    </Card>
  );
}
