import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteLink, trackLinkUsage } from '@/app/actions/links'
import { toast } from 'sonner'
import { useCallback } from 'react'
import type { LinkWithRelations } from '@/db/schema/links'

/**
 * Shared hook for link delete & track-usage mutations.
 * Eliminates duplication across LinkCard, TableView, and CompactView.
 */
export function useLinkMutations(teamId: string) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (vars: { data: { id: string; teamId: string } }) =>
      deleteLink(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['links', teamId] })
      toast.success('Link deleted')
    },
    onError: (err: Error) => {
      toast.error('Failed to delete link: ' + err.message)
    },
  })

  const trackUsageMutation = useMutation({
    mutationFn: (vars: { data: { id: string } }) => trackLinkUsage(vars),
    // Intentionally no query invalidation — avoids refetching the entire list
    // just to bump a counter by 1.
  })

  const handleOpen = useCallback(
    (link: LinkWithRelations) => {
      trackUsageMutation.mutate({ data: { id: link.id } })
      window.open(link.url, '_blank', 'noopener,noreferrer')
    },
    [trackUsageMutation],
  )

  return { deleteMutation, trackUsageMutation, handleOpen } as const
}
