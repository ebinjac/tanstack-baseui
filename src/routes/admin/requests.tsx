import { createFileRoute } from '@tanstack/react-router'
import { getRegistrationRequests, updateRequestStatus } from '@/app/actions/team-registration'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  ExternalLink,
  Search,
  Filter,
  ClipboardList,
} from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDistanceToNow } from 'date-fns'
import { TeamRegistrationRequest } from '@/db/schema/teams'

export const Route = createFileRoute('/admin/requests')({
  component: AdminRequests,
})

function AdminRequests() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<TeamRegistrationRequest | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null)
  const [comments, setComments] = useState('')

  const { data: requests, isLoading } = useQuery({
    queryKey: ['registration-requests'],
    queryFn: () => getRegistrationRequests(),
  })

  const updateStatusMutation = useMutation({
    mutationFn: updateRequestStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-requests'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success(`Request ${actionType === 'approved' ? 'approved' : 'rejected'} successfully`)
      resetState()
    },
    onError: (error: Error) => {
      toast.error('Failed to update request', {
        description: error.message
      })
    }
  })

  const resetState = () => {
    setSelectedRequest(null)
    setActionType(null)
    setComments('')
    setIsDetailsOpen(false)
  }

  const handleAction = () => {
    if (!selectedRequest || !actionType) return
    updateStatusMutation.mutate({
      data: {
        requestId: selectedRequest.id,
        status: actionType,
        comments: comments.trim() || undefined
      }
    })
  }

  const filteredRequests = requests?.filter(req => {
    const matchesSearch = req.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter(r => r.status === 'pending').length || 0,
    approved: requests?.filter(r => r.status === 'approved').length || 0,
    rejected: requests?.filter(r => r.status === 'rejected').length || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Team Requests</h1>
        <p className="text-muted-foreground">Manage and review incoming team registration applications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MiniStatCard title="Total" value={stats.total} icon={ClipboardList} color="blue" />
        <MiniStatCard title="Pending" value={stats.pending} icon={Clock} color="amber" />
        <MiniStatCard title="Approved" value={stats.approved} icon={CheckCircle2} color="emerald" />
        <MiniStatCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" />
      </div>

      <Card className="border-none shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by team, contact or email..."
                  className="pl-10 h-10 bg-muted/50 border-none ring-1 ring-border"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <TooltipProvider>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger render={
                      <DropdownMenuTrigger render={
                        <Button variant="outline" size="icon" className="h-10 w-10">
                          <Filter className="h-4 w-4" />
                        </Button>
                      } />
                    } />
                    <TooltipContent>Filter by status</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Status Filter</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setStatusFilter('all')} className="flex items-center justify-between">
                        All {statusFilter === 'all' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('pending')} className="flex items-center justify-between">
                        Pending {statusFilter === 'pending' && <CheckCircle2 className="h-4 w-4 text-amber-500" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('approved')} className="flex items-center justify-between">
                        Approved {statusFilter === 'approved' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter('rejected')} className="flex items-center justify-between">
                        Rejected {statusFilter === 'rejected' && <CheckCircle2 className="h-4 w-4 text-red-500" />}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border shadow-sm overflow-hidden bg-background">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[300px] font-semibold">Team Details</TableHead>
                  <TableHead className="font-semibold">Contact Person</TableHead>
                  <TableHead className="font-semibold">Requested</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold pr-6">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-muted-foreground text-sm">Fetching requests...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (filteredRequests?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="rounded-full bg-muted p-4">
                          <Search className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <span className="text-muted-foreground font-medium">No requests found</span>
                        <Button variant="link" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>Clear filters</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests?.map((req) => (
                    <TableRow key={req.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-base">{req.teamName}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] h-4 font-normal bg-accent/50">U: {req.userGroup}</Badge>
                            <Badge variant="outline" className="text-[10px] h-4 font-normal bg-accent/50">A: {req.adminGroup}</Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 ring-1 ring-border shadow-sm">
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                              {req.contactName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium leading-none">{req.contactName}</span>
                            <span className="text-xs text-muted-foreground mt-1">{req.contactEmail}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{new Date(req.requestedAt).toLocaleDateString()}</span>
                          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(req.requestedAt), { addSuffix: true })}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={req.status} />
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {req.status === 'pending' ? (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger render={
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-9 w-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                      onClick={() => { setSelectedRequest(req); setActionType('approved'); }}
                                      disabled={updateStatusMutation.isPending}
                                    >
                                      <CheckCircle2 className="h-5 w-5" />
                                    </Button>
                                  } />
                                  <TooltipContent>Approve Request</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger render={
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={() => { setSelectedRequest(req); setActionType('rejected'); }}
                                      disabled={updateStatusMutation.isPending}
                                    >
                                      <XCircle className="h-5 w-5" />
                                    </Button>
                                  } />
                                  <TooltipContent>Reject Request</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          ) : (
                            <div className="h-9 px-3 flex items-center text-xs text-muted-foreground gap-1.5 italic">
                              Reviewed by {req.reviewedBy?.split('@')[0] || 'admin'}
                            </div>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" size="icon" className="h-9 w-9">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            } />
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem className="gap-2" onClick={() => { setSelectedRequest(req); setIsDetailsOpen(true); }}>
                                <ExternalLink className="h-4 w-4" /> View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Request Details</DialogTitle>
                <DialogDescription>Full application information and history.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Name</span>
                  <p className="text-sm font-bold">{selectedRequest.teamName}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
                  <StatusBadge status={selectedRequest.status} />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">User Group (ADS)</span>
                  <p className="text-sm font-mono bg-muted/50 px-2 py-0.5 rounded border border-border w-fit">{selectedRequest.userGroup}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Group (ADS)</span>
                  <p className="text-sm font-mono bg-muted/50 px-2 py-0.5 rounded border border-border w-fit">{selectedRequest.adminGroup}</p>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Information</span>
                <div className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-1">
                  <span className="text-sm font-bold">{selectedRequest.contactName}</span>
                  <span className="text-xs text-muted-foreground">{selectedRequest.contactEmail}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Requested By</span>
                  <p className="text-sm font-medium">{selectedRequest.requestedBy}</p>
                  <p className="text-[10px] text-muted-foreground italic">{new Date(selectedRequest.requestedAt).toLocaleString()}</p>
                </div>
                {selectedRequest.status !== 'pending' && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reviewed By</span>
                    <p className="text-sm font-medium">{selectedRequest.reviewedBy}</p>
                    <p className="text-[10px] text-muted-foreground italic">{selectedRequest.reviewedAt ? new Date(selectedRequest.reviewedAt).toLocaleString() : 'N/A'}</p>
                  </div>
                )}
              </div>
              {selectedRequest.comments && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reviewer Comments</span>
                  <p className="text-sm italic p-3 rounded-lg bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200/50 dark:border-orange-800/50">
                    "{selectedRequest.comments}"
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            <div className="flex items-center gap-2">
              {selectedRequest?.status === 'pending' && (
                <>
                  <Button variant="outline" className="text-emerald-600 border-emerald-200" onClick={() => { setIsDetailsOpen(false); setActionType('approved'); }}>Approve</Button>
                  <Button variant="outline" className="text-red-600 border-red-200" onClick={() => { setIsDetailsOpen(false); setActionType('rejected'); }}>Reject</Button>
                </>
              )}
            </div>
            <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={!!actionType} onOpenChange={(open) => !open && resetState()}>
        <AlertDialogContent className="sm:max-w-[450px]">
          <AlertDialogHeader>
            <div className={`p-2 rounded-full w-fit mb-2 ${actionType === 'approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40' : 'bg-red-100 text-red-600 dark:bg-red-900/40'}`}>
              {actionType === 'approved' ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
            </div>
            <AlertDialogTitle className="text-xl">
              Confirm {actionType === 'approved' ? 'Approval' : 'Rejection'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionType} the team registration for <strong>{selectedRequest?.teamName}</strong>?
              {actionType === 'approved' && " This will automatically create the team in the system."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Internal Comments (Optional)</label>
              <Textarea
                placeholder="Reason for this action..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="min-h-[100px] resize-none focus-visible:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground">These comments will be visible in the request history details.</p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatusMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={actionType === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
              onClick={(e) => { e.preventDefault(); handleAction(); }}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Processing...' : `Confirm ${actionType ? (actionType.charAt(0).toUpperCase() + actionType.slice(1)) : ''}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MiniStatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: 'blue' | 'amber' | 'emerald' | 'red' }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
    emerald: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/20',
  }

  return (
    <Card className="border-none shadow-sm ring-1 ring-border group overflow-hidden bg-background">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 duration-300 ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50 gap-1.5 flex w-fit items-center"><Clock className="h-3 w-3" /> Pending</Badge>
    case 'approved':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50 gap-1.5 flex w-fit items-center"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>
    case 'rejected':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200/50 dark:border-red-800/50 gap-1.5 flex w-fit items-center"><XCircle className="h-3 w-3" /> Rejected</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}
