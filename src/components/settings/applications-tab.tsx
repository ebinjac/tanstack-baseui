import { useState } from 'react'
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Boxes, Search, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { ApplicationActions } from './application-actions'

interface ApplicationsTabProps {
    team: any
    applications: any[] | undefined
    isLoadingApps: boolean
    isAdmin: boolean
    syncMutation: any
    onViewApp: (app: any) => void
    onEditApp: (app: any) => void
    onDeleteApp: (app: any) => void
    onAddSuccess: () => void
    teamId: string
    AddApplicationDialog: React.ComponentType<{ teamId: string; onSuccess: () => void }>
}

export function ApplicationsTab({
    team,
    applications,
    isLoadingApps,
    isAdmin,
    syncMutation,
    onViewApp,
    onEditApp,
    onDeleteApp,
    onAddSuccess,
    teamId,
    AddApplicationDialog,
}: ApplicationsTabProps) {
    const [appSearch, setAppSearch] = useState('')

    const filteredApps = applications?.filter(app =>
        app.applicationName.toLowerCase().includes(appSearch.toLowerCase()) ||
        app.tla.toLowerCase().includes(appSearch.toLowerCase()) ||
        String(app.assetId).includes(appSearch)
    )

    return (
        <Card>
            <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Boxes className="h-4 w-4 text-primary" /> Managed Applications
                        </CardTitle>
                        <CardDescription>Systems registered to {team.teamName}.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search apps..."
                                className="pl-9 w-56 h-9 text-sm"
                                value={appSearch}
                                onChange={(e) => setAppSearch(e.target.value)}
                            />
                        </div>
                        {isAdmin && (
                            <AddApplicationDialog teamId={teamId} onSuccess={onAddSuccess} />
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[300px] text-xs font-bold uppercase tracking-wider py-3 px-6">Application</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider py-3">TNA</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider py-3">Asset ID</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider py-3 text-center">Lifecycle</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider py-3 text-center">Tier</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider py-3 text-right px-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoadingApps ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Loading applications...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredApps?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32">
                                    <EmptyState
                                        icon={Boxes}
                                        title="No applications found"
                                        description="No applications match your search."
                                        size="sm"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredApps?.map((app) => (
                                <TableRow key={app.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell className="py-3 px-6">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{app.applicationName}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{app.id.split('-')[0]}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold text-primary text-sm">{app.tla}</TableCell>
                                    <TableCell className="text-sm tabular-nums">{app.assetId}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "uppercase text-[9px] px-2 py-0 h-5 font-bold border",
                                                app.lifeCycleStatus?.toLowerCase() === 'production' ? "bg-green-500/10 text-green-600 border-green-500/20" :
                                                    app.lifeCycleStatus?.toLowerCase() === 'development' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : ""
                                            )}
                                        >
                                            {app.lifeCycleStatus || 'Undeclared'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={['0', '1', '2'].includes(String(app.tier)) ? "destructive" : "secondary"}
                                            className={cn(
                                                "text-[10px] font-bold",
                                                ['0', '1', '2'].includes(String(app.tier)) ? "bg-red-500/10 text-red-600 border-red-500/20" : ""
                                            )}
                                        >
                                            {app.tier || 'Not Core'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right py-3 px-6">
                                        <ApplicationActions
                                            isAdmin={isAdmin}
                                            isSyncing={syncMutation.isPending && syncMutation.variables?.id === app.id}
                                            onView={() => onViewApp(app)}
                                            onEdit={() => onEditApp(app)}
                                            onSync={() => syncMutation.mutate(app)}
                                            onDelete={() => onDeleteApp(app)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
            <div className="px-6 py-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>Showing {filteredApps?.length || 0} of {applications?.length || 0} applications</span>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-500" /> Critical</div>
                    <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500" /> Production</div>
                </div>
            </div>
        </Card>
    )
}
