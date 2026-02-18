import { cn } from '@/lib/utils'
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Users2, ShieldCheck, User, Loader2, AlertTriangle, RefreshCw, Info,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/empty-state'

interface LdapResponse {
    names: string[]
}

interface MembersTabProps {
    adminGroup: string
    userGroup: string
}

export function MembersTab({ adminGroup, userGroup }: MembersTabProps) {
    const { data: adminData, isLoading: isLoadingAdmins, error: adminError, refetch: refetchAdmins } = useQuery<LdapResponse>({
        queryKey: ['ldap-members', adminGroup],
        queryFn: async () => {
            if (!adminGroup) return { names: [] };
            const response = await fetch(`http://localhost:8008/api/ldap?group=${encodeURIComponent(adminGroup)}`);
            if (!response.ok) throw new Error('Failed to fetch admin members');
            return response.json();
        },
        enabled: !!adminGroup,
        staleTime: 5 * 60 * 1000,
    });

    const { data: userData, isLoading: isLoadingUsers, error: userError, refetch: refetchUsers } = useQuery<LdapResponse>({
        queryKey: ['ldap-members', userGroup],
        queryFn: async () => {
            if (!userGroup) return { names: [] };
            const response = await fetch(`http://localhost:8008/api/ldap?group=${encodeURIComponent(userGroup)}`);
            if (!response.ok) throw new Error('Failed to fetch user members');
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
        toast.success('Refreshing member list...');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-base font-bold flex items-center gap-2">
                        <Users2 className="h-4 w-4 text-primary" />
                        Team Members
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Members fetched from Active Directory groups.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoadingAdmins || isLoadingUsers}
                >
                    <RefreshCw className={cn("h-4 w-4", (isLoadingAdmins || isLoadingUsers) && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Administrators */}
                <MemberGroup
                    title="Administrators"
                    icon={<ShieldCheck className="h-4 w-4 text-primary" />}
                    groupName={adminGroup}
                    description="Full administrative access to team settings."
                    isLoading={isLoadingAdmins}
                    error={adminError}
                    members={adminMembers}
                    variant="admin"
                />

                {/* Members */}
                <MemberGroup
                    title="Members"
                    icon={<Users2 className="h-4 w-4 text-muted-foreground" />}
                    groupName={userGroup}
                    description="Standard portal access for collaboration."
                    isLoading={isLoadingUsers}
                    error={userError}
                    members={userMembers}
                    variant="member"
                />
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                    <p className="text-sm font-medium">Real-time Sync</p>
                    <p className="text-xs text-muted-foreground">
                        Member data is fetched from Active Directory groups. Changes are reflected upon page refresh.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-component: MemberGroup ───

interface MemberGroupProps {
    title: string
    icon: React.ReactNode
    groupName: string
    description: string
    isLoading: boolean
    error: Error | null
    members: string[]
    variant: 'admin' | 'member'
}

function MemberGroup({ title, icon, groupName, description, isLoading, error, members, variant }: MemberGroupProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        {icon}
                        {title}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono h-5">
                        {groupName || 'Not configured'}
                    </Badge>
                </div>
                <CardDescription className="text-xs">{description}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <AlertTriangle className="h-6 w-6 text-destructive/60 mb-2" />
                        <p className="text-sm text-muted-foreground">Failed to load {title.toLowerCase()}</p>
                    </div>
                ) : members.length === 0 ? (
                    <EmptyState
                        icon={Users2}
                        title={`No ${title.toLowerCase()} found`}
                        description={`No ${title.toLowerCase()} are configured for this team.`}
                        size="sm"
                    />
                ) : (
                    <div className="divide-y max-h-[400px] overflow-y-auto">
                        {members.map((name, idx) => (
                            <div key={idx} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                    variant === 'admin' ? "bg-primary/10" : "bg-muted"
                                )}>
                                    <User className={cn(
                                        "h-3.5 w-3.5",
                                        variant === 'admin' ? "text-primary" : "text-muted-foreground"
                                    )} />
                                </div>
                                <p className="text-sm font-medium truncate flex-1">{name}</p>
                                {variant === 'admin' && (
                                    <Badge variant="secondary" className="h-5 text-[9px]">Admin</Badge>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                <div className="px-4 py-2.5 border-t text-xs text-muted-foreground">
                    {members.length} {title.toLowerCase()}{members.length !== 1 && title === 'Members' ? '' : title === 'Administrators' ? (members.length !== 1 ? '' : '') : ''}
                </div>
            </CardContent>
        </Card>
    )
}
