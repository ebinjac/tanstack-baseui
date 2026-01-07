import { createFileRoute } from '@tanstack/react-router'
import { getTeams } from '@/app/actions/teams'
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
  MoreHorizontal,
  ExternalLink,
  Search,
  Shield,
  Users
} from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const Route = createFileRoute('/admin/teams')({
  component: AdminTeams,
})

function AdminTeams() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => getTeams(),
  })

  const filteredTeams = teams?.filter(team => {
    return team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <Card className="border-none shadow-xl ring-1 ring-gray-200 dark:ring-gray-800">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Active Teams</CardTitle>
            <CardDescription>Manage all active teams in the system</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search teams..."
                className="pl-9 bg-gray-50/50 dark:bg-gray-950/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                    Loading teams...
                  </TableCell>
                </TableRow>
              ) : (filteredTeams?.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                    No teams found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeams?.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Shield className="h-4 w-4" />
                        </div>
                        {team.teamName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{team.contactName}</span>
                        <span className="text-xs text-gray-500">{team.contactEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/50">User: {team.userGroup}</Badge>
                        <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0 bg-purple-50/50 dark:bg-purple-900/10 border-purple-200/50">Admin: {team.adminGroup}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(team.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {team.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50 gap-1.5 flex w-fit items-center">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="gap-2">
                              <ExternalLink className="h-4 w-4" /> View Team Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Users className="h-4 w-4" /> View Members
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
