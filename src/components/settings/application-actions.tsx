import {
  Eye,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ApplicationActionsProps {
  isAdmin: boolean
  isSyncing?: boolean
  onView: () => void
  onEdit: () => void
  onSync: () => void
  onDelete: () => void
}

export function ApplicationActions({
  isAdmin,
  isSyncing,
  onView,
  onEdit,
  onSync,
  onDelete,
}: ApplicationActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'h-8 w-8 p-0',
        )}
      >
        <span className="sr-only">Open menu</span>
        {isSyncing ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <MoreHorizontal className="h-4 w-4" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={onView}>
            <Eye className="mr-2 h-4 w-4" /> View Details
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Application
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <DropdownMenuItem onClick={onSync} disabled={isSyncing}>
              <RefreshCw
                className={cn('mr-2 h-4 w-4', isSyncing && 'animate-spin')}
              />{' '}
              {isSyncing ? 'Syncing...' : 'Sync Registry'}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        {isAdmin && <DropdownMenuSeparator />}
        {isAdmin && (
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
