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
} from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

export const Route = createFileRoute('/admin/requests')({
  component: AdminRequests,
})

function AdminRequests() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: requests, isLoading } = useQuery({
    queryKey: ['registration-requests'],
    queryFn: () => getRegistrationRequests(),
  })

  const updateStatusMutation = useMutation({
    mutationFn: updateRequestStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration-requests'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] }) // Also invalidate teams as approval creates one
      toast.success('Request updated successfully')
    },
    onError: (error: Error) => {
      toast.error('Failed to update request', {
        description: error.message
      })
    }
  })

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ data: { requestId: id, status: 'approved' } })
  }

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ data: { requestId: id, status: 'rejected' } })
  }

  const filteredRequests = requests?.filter(req => {
    const matchesSearch = req.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Card className="border-none shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Registration Requests</CardTitle>
            <CardDescription>Review and manage new team registration requests</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search requests..."
                className="pl-9 bg-gray-50/50 dark:bg-gray-950/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
                <Filter className="h-4 w-4" />
                {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('approved')}>Approved</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('rejected')}>Rejected</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
              <TableRow>
                <TableHead className="font-semibold">Team Name</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Groups</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                    Loading requests...
                  </TableCell>
                </TableRow>
              ) : (filteredRequests?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                    No requests found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests?.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.teamName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{req.contactName}</span>
                        <span className="text-xs text-gray-500">{req.contactEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50">User: {req.userGroup}</Badge>
                        <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0 bg-purple-50/50 dark:bg-purple-900/10 border-purple-200/50">Admin: {req.adminGroup}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(req.requestedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={req.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {req.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleApprove(req.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle2 className="h-5 w-5" />
                              <span className="sr-only">Approve</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleReject(req.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="h-5 w-5" />
                              <span className="sr-only">Reject</span>
                            </Button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem className="gap-2">
                                <ExternalLink className="h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {req.status !== 'pending' && (
                                <DropdownMenuItem
                                  className="text-amber-600 gap-2"
                                  onClick={() => updateStatusMutation.mutate({ data: { requestId: req.id, status: 'pending' } })}
                                >
                                  <Clock className="h-4 w-4" /> Reset to Pending
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuGroup>
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
