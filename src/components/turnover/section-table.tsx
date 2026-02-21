import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  Plus,
  Loader2,
  Star,
  CheckCircle2,
  AlertCircle,
  Bell,
  Zap,
  MessageSquare,
  HelpCircle,
  FolderOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getTurnoverEntries } from '@/app/actions/turnover'
import { SECTION_CONFIG, type TurnoverSection } from '@/lib/zod/turnover.schema'
import { EntryCard } from './entry-card'
import { EntryDialog } from './entry-dialog'
import type { TurnoverEntryWithDetails } from '@/db/schema/turnover'
import type { Application } from '@/db/schema/teams'

const SECTION_ICONS: Record<TurnoverSection, any> = {
  RFC: CheckCircle2,
  INC: AlertCircle,
  ALERTS: Bell,
  MIM: Zap,
  COMMS: MessageSquare,
  FYI: HelpCircle,
}

interface SectionTableProps {
  teamId: string
  applicationId: string
  section: TurnoverSection
  // Group-related props - for showing application selector in entry dialog
  isGrouped?: boolean
  groupApplications?: Application[]
}

export function SectionTable({
  teamId,
  applicationId,
  section,
  isGrouped = false,
  groupApplications = [],
}: SectionTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<TurnoverEntryWithDetails | null>(
    null,
  )

  const sectionConfig = SECTION_CONFIG[section]
  const SectionIcon = SECTION_ICONS[section]

  // Fetch entries for all applications in the group or just the single app
  const applicationIds =
    isGrouped && groupApplications.length > 0
      ? groupApplications.map((a) => a.id)
      : [applicationId]

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'turnover-entries',
      teamId,
      applicationIds,
      section,
      'with-resolved',
    ],
    queryFn: async () => {
      // Fetch entries for all applications
      const entriesPromises = applicationIds.map((appId) =>
        getTurnoverEntries({
          data: {
            teamId,
            applicationId: appId,
            section,
            includeRecentlyResolved: true,
          },
        }),
      )
      const results = await Promise.all(entriesPromises)

      // Combine all entries and sort by createdAt
      const allEntries = results.flatMap((r) => r.entries)
      allEntries.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )

      return { entries: allEntries, total: allEntries.length }
    },
    staleTime: 30000,
  })

  const entries = data?.entries || []
  const importantCount = entries.filter(
    (e: TurnoverEntryWithDetails) => e.isImportant,
  ).length

  const handleEdit = (entry: TurnoverEntryWithDetails) => {
    setEditEntry(entry)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditEntry(null)
    setDialogOpen(true)
  }

  return (
    <>
      <div>
        <Card className="overflow-hidden p-0 gap-0">
          {/* Header */}
          <CardHeader
            className={cn(
              'flex flex-row items-center justify-between py-4',
              sectionConfig.bgClass,
              sectionConfig.borderClass,
              'border-b',
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center bg-background shadow-sm',
                )}
              >
                <SectionIcon
                  className={cn('w-5 h-5', sectionConfig.colorClass)}
                />
              </div>
              <div>
                <h3 className="font-bold text-base">{sectionConfig.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {sectionConfig.shortName}
                </p>
              </div>

              {/* Loading spinner */}
              {isFetching && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}

              {/* Entry count badge */}
              {!isLoading && (
                <Badge variant="secondary" className="ml-2">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </Badge>
              )}

              {/* Important count badge */}
              {importantCount > 0 && (
                <Badge
                  variant="secondary"
                  className="gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                >
                  <Star className="w-3 h-3 fill-current" />
                  {importantCount}
                </Badge>
              )}
            </div>

            <Button
              onClick={handleAdd}
              size="sm"
              className="bg-gradient-to-br from-primary via-primary to-primary/90 hover:to-primary text-primary-foreground shadow-[0_8px_16px_-6px_rgba(59,130,246,0.3)] hover:shadow-[0_12px_20px_-8px_rgba(59,130,246,0.4)] transition-all duration-300 active:scale-95 rounded-xl border-t border-white/10 gap-2 px-4 h-9 font-semibold"
            >
              <div className="bg-white/20 rounded-md p-0.5 group-hover:bg-white/30 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </div>
              Add Entry
            </Button>
          </CardHeader>

          {/* Content */}
          <CardContent className="p-4">
            {/* Loading State */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && entries.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="font-semibold text-lg mb-1">No entries yet</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by adding a new entry to this section.
                </p>
                <Button
                  onClick={handleAdd}
                  variant="outline"
                  className="border-dashed border-2 hover:border-solid hover:bg-muted/50 transition-all duration-300 rounded-xl px-8 h-11 font-semibold group"
                >
                  <Plus className="w-4 h-4 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                  Add First Entry
                </Button>
              </div>
            )}

            {/* Entries List */}
            {!isLoading && entries.length > 0 && (
              <div className="space-y-3">
                {entries.map((entry: TurnoverEntryWithDetails) => (
                  <div key={entry.id}>
                    <EntryCard
                      entry={entry}
                      teamId={teamId}
                      onEdit={handleEdit}
                      // Show app badge when grouped to identify which app the entry belongs to
                      showApplicationBadge={isGrouped}
                      groupApplications={groupApplications}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Entry Dialog */}
      <EntryDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditEntry(null)
        }}
        teamId={teamId}
        applicationId={applicationId}
        section={section}
        editEntry={editEntry}
        // Pass group info for application selector
        isGrouped={isGrouped}
        groupApplications={groupApplications}
      />
    </>
  )
}
