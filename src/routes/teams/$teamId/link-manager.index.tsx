
import { createFileRoute, Link as RouterLink } from '@tanstack/react-router'
import { getLinks, getLinkCategories, bulkUpdateLinks } from '@/app/actions/links'
import { getTeamApplications } from '@/app/actions/applications'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Search, Grip, Table as TableIcon, LayoutList, Globe2, Lock, Layers, Upload, Box, X, Tag, CheckSquare, Square, Minus, BarChart3 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CreateLinkDialog } from '@/components/link-manager/create-link-dialog'
import { GridView, TableView, CompactView } from '@/components/link-manager/link-views'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Label } from '@/components/ui/label'

// Schema for search params
const linkSearchSchema = z.object({
  search: z.string().optional(),
  visibility: z.enum(['all', 'private', 'public']).default('all').optional(),
  applicationId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
})

export const Route = createFileRoute('/teams/$teamId/link-manager/')({
  component: LinkManagerPage,
  validateSearch: (search) => linkSearchSchema.parse(search),
  loaderDeps: ({ search: { search, visibility, applicationId, categoryId } }) => ({ search, visibility, applicationId, categoryId }),
  loader: async ({ params: { teamId }, deps: { search, visibility, applicationId, categoryId } }) => {
    // Preload data
    const [linksData, categories, applications] = await Promise.all([
      getLinks({ data: { teamId, search, visibility: visibility || 'all', applicationId, categoryId } }),
      getLinkCategories({ data: { teamId } }),
      getTeamApplications({ data: { teamId } }),
    ])
    return { linksData, categories, applications }
  }
})

function LinkManagerPage() {
  const { teamId } = Route.useParams()
  const { linksData: initialData, categories, applications } = Route.useLoaderData()
  const searchParams = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()

  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'compact'>('grid')
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set())
  const [bulkTagsInput, setBulkTagsInput] = useState('')

  // Client-side query to keep UI fresh on mutations
  const { data: links } = useQuery({
    queryKey: ['links', teamId, searchParams.search, searchParams.visibility, searchParams.applicationId, searchParams.categoryId],
    queryFn: () => getLinks({
      data: {
        teamId,
        search: searchParams.search,
        visibility: searchParams.visibility || 'all',
        applicationId: searchParams.applicationId,
        categoryId: searchParams.categoryId,
      }
    }),
    initialData
  })

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (data: { teamId: string, linkIds: string[], updates: any }) =>
      bulkUpdateLinks({ data }),
    onSuccess: (result) => {
      toast.success(`Successfully updated ${result.count} link${result.count !== 1 ? 's' : ''}`)
      queryClient.invalidateQueries({ queryKey: ['links', teamId] })
      setSelectedLinks(new Set())
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update links')
    }
  })

  // Selection handlers
  const toggleSelectLink = (linkId: string) => {
    setSelectedLinks(prev => {
      const next = new Set(prev)
      if (next.has(linkId)) {
        next.delete(linkId)
      } else {
        next.add(linkId)
      }
      return next
    })
  }

  const selectAllLinks = () => {
    if (selectedLinks.size === links.length) {
      setSelectedLinks(new Set())
    } else {
      setSelectedLinks(new Set(links.map((l: any) => l.id)))
    }
  }

  const clearSelection = () => {
    setSelectedLinks(new Set())
  }

  // Bulk action handlers
  const handleBulkVisibility = (visibility: 'public' | 'private') => {
    bulkUpdateMutation.mutate({
      teamId,
      linkIds: Array.from(selectedLinks),
      updates: { visibility }
    })
  }

  const handleBulkCategory = (categoryId: string | null) => {
    bulkUpdateMutation.mutate({
      teamId,
      linkIds: Array.from(selectedLinks),
      updates: { categoryId }
    })
  }

  const handleBulkApplication = (applicationId: string | null) => {
    bulkUpdateMutation.mutate({
      teamId,
      linkIds: Array.from(selectedLinks),
      updates: { applicationId }
    })
  }

  const handleBulkAddTags = () => {
    const tags = bulkTagsInput.split(',').map(t => t.trim()).filter(Boolean)
    if (tags.length === 0) {
      toast.error('Please enter at least one tag')
      return
    }
    bulkUpdateMutation.mutate({
      teamId,
      linkIds: Array.from(selectedLinks),
      updates: { tagsToAdd: tags, replaceTags: false }
    })
    setBulkTagsInput('')
  }

  // Handlers for filters
  const handleSearch = (term: string) => {
    navigate({
      search: (prev: any) => ({ ...prev, search: term || undefined })
    })
  }

  const handleVisibilityChange = (val: string | null) => {
    navigate({
      search: (prev: any) => ({ ...prev, visibility: val as any })
    })
  }

  const handleApplicationChange = (val: string | null) => {
    navigate({
      search: (prev: any) => ({ ...prev, applicationId: !val || val === 'all' ? undefined : val })
    })
  }

  const handleCategoryChange = (val: string | null) => {
    navigate({
      search: (prev: any) => ({ ...prev, categoryId: !val || val === 'all' ? undefined : val })
    })
  }

  const clearAllFilters = () => {
    navigate({
      search: { visibility: 'all' }
    })
  }

  // Count active filters
  const activeFilterCount = [
    searchParams.applicationId,
    searchParams.categoryId,
    searchParams.search,
    searchParams.visibility && searchParams.visibility !== 'all' ? searchParams.visibility : undefined,
  ].filter(Boolean).length

  // Get names for active filters
  const selectedApp = applications?.find(a => a.id === searchParams.applicationId)
  const selectedCategory = categories?.find(c => c.id === searchParams.categoryId)

  const isAllSelected = links.length > 0 && selectedLinks.size === links.length
  const isSomeSelected = selectedLinks.size > 0 && selectedLinks.size < links.length

  return (
    <div className="container mx-auto p-8 max-w-7xl space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Link Manager</h1>
          <p className="text-muted-foreground text-lg">
            Central repository for team bookmarks, dashboards, and operational tools.
          </p>
        </div>
        <div className="flex gap-2">

          <RouterLink to="/teams/$teamId/link-manager/stats" params={{ teamId }}>
            <Button variant="outline" className="gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary">
              <BarChart3 className="w-4 h-4" /> Performance
            </Button>
          </RouterLink>
          <RouterLink to="/teams/$teamId/link-manager/categories" params={{ teamId }}>
            <Button variant="outline" className="gap-2">
              <Layers className="w-4 h-4" /> Categories
            </Button>
          </RouterLink>

          <RouterLink to="/teams/$teamId/link-manager/import" params={{ teamId }}>
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" /> Import
            </Button>
          </RouterLink>
          <CreateLinkDialog teamId={teamId} />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedLinks.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-primary/5 border-2 border-primary/20 p-4 rounded-2xl shadow-lg shadow-primary/5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Selection Info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                      <span className="text-xl font-black">{selectedLinks.size}</span>
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-tight">Links Selected</p>
                      <p className="text-xs text-muted-foreground">Apply bulk actions below</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4 mr-1" /> Clear
                  </Button>
                </div>

                {/* Bulk Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Visibility Toggle */}
                  <div className="flex items-center gap-1 bg-background rounded-xl p-1 border shadow-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBulkVisibility('public')}
                      disabled={bulkUpdateMutation.isPending}
                      className="gap-2 px-3 h-9 text-xs font-bold rounded-lg"
                    >
                      <Globe2 className="w-3.5 h-3.5 text-blue-500" /> Make Public
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBulkVisibility('private')}
                      disabled={bulkUpdateMutation.isPending}
                      className="gap-2 px-3 h-9 text-xs font-bold rounded-lg"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-500" /> Make Private
                    </Button>
                  </div>

                  {/* Category Assignment */}
                  {categories && categories.length > 0 && (
                    <Select onValueChange={(val: string | null) => handleBulkCategory(val === 'none' || val === null ? null : val)}>
                      <SelectTrigger className="w-[180px] h-10 bg-background border rounded-xl shadow-sm">
                        <Layers className="w-4 h-4 mr-2 text-purple-500" />
                        <SelectValue>Assign Category</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none">Remove Category</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Application Assignment */}
                  {applications && applications.length > 0 && (
                    <Select onValueChange={(val: string | null) => handleBulkApplication(val === 'none' || val === null ? null : val)}>
                      <SelectTrigger className="w-[180px] h-10 bg-background border rounded-xl shadow-sm">
                        <Box className="w-4 h-4 mr-2 text-blue-500" />
                        <SelectValue>Assign Application</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none">Remove Application</SelectItem>
                        {applications.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.applicationName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Tags */}
                  <Popover>
                    <PopoverTrigger render={
                      <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl shadow-sm">
                        <Tag className="w-4 h-4 text-green-500" /> Add Tags
                      </Button>
                    } />
                    <PopoverContent className="w-80 p-4 rounded-2xl" align="end">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Add Tags to {selectedLinks.size} Links
                          </Label>
                          <Input
                            placeholder="tag1, tag2, tag3..."
                            value={bulkTagsInput}
                            onChange={(e) => setBulkTagsInput(e.target.value)}
                            className="rounded-xl"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleBulkAddTags()
                              }
                            }}
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Separate multiple tags with commas
                          </p>
                        </div>
                        <Button
                          onClick={handleBulkAddTags}
                          disabled={bulkUpdateMutation.isPending || !bulkTagsInput.trim()}
                          className="w-full rounded-xl"
                        >
                          Apply Tags
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="bg-card border border-border/50 p-4 rounded-2xl shadow-sm space-y-4">
        {/* Main Toolbar Row */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
            {/* Select All Checkbox */}
            {links.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={selectAllLinks}
                className="h-10 w-10 shrink-0"
                title={isAllSelected ? "Deselect all" : "Select all"}
              >
                {isAllSelected ? (
                  <CheckSquare className="w-5 h-5 text-primary" />
                ) : isSomeSelected ? (
                  <Minus className="w-5 h-5 text-primary" />
                ) : (
                  <Square className="w-5 h-5 text-muted-foreground" />
                )}
              </Button>
            )}

            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search links, tags, descriptions..."
                className="pl-9 bg-muted/30 border-transparent focus:bg-background transition-all"
                defaultValue={searchParams.search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            {/* Application Filter */}
            <Select value={searchParams.applicationId || 'all'} onValueChange={handleApplicationChange}>
              <SelectTrigger className="w-[180px] bg-muted/30 border-transparent">
                <Box className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue>
                  {selectedApp ? selectedApp.applicationName : 'All Apps'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applications</SelectItem>
                {applications?.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.applicationName} <span className="text-muted-foreground text-xs ml-1">({app.tla})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={searchParams.categoryId || 'all'} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[160px] bg-muted/30 border-transparent">
                <Layers className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue>
                  {selectedCategory ? selectedCategory.name : 'All Categories'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Visibility Tabs */}
            <Tabs value={searchParams.visibility || 'all'} onValueChange={handleVisibilityChange} className='w-auto'>
              <TabsList className="bg-muted/30 p-1">
                <TabsTrigger value="all" className="gap-2">All</TabsTrigger>
                <TabsTrigger value="public" className="gap-2"><Globe2 className="w-3 h-3" /> Public</TabsTrigger>
                <TabsTrigger value="private" className="gap-2"><Lock className="w-3 h-3" /> Private</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 border-l pl-4 border-border/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}
              title="Grid View"
            >
              <Grip className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('table')}
              className={viewMode === 'table' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('compact')}
              className={viewMode === 'compact' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}
              title="Compact View"
            >
              <LayoutList className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Active Filters Bar */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/30">
            <span className="text-xs text-muted-foreground font-medium">Active filters:</span>

            {searchParams.search && (
              <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                Search: "{searchParams.search}"
                <button
                  onClick={() => navigate({ search: (prev: any) => ({ ...prev, search: undefined }) })}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {selectedApp && (
              <Badge variant="secondary" className="gap-1 pr-1 text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                <Box className="w-3 h-3" /> {selectedApp.applicationName}
                <button
                  onClick={() => handleApplicationChange('all')}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {selectedCategory && (
              <Badge variant="secondary" className="gap-1 pr-1 text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
                <Layers className="w-3 h-3" /> {selectedCategory.name}
                <button
                  onClick={() => handleCategoryChange('all')}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {searchParams.visibility && searchParams.visibility !== 'all' && (
              <Badge variant="secondary" className="gap-1 pr-1 text-xs">
                {searchParams.visibility === 'public' ? <Globe2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {searchParams.visibility}
                <button
                  onClick={() => handleVisibilityChange('all')}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs h-6 text-muted-foreground hover:text-destructive">
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Quick Application Pills (for fast filtering) */}
      {applications && applications.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground font-medium mr-2">Quick filter by app:</span>
          {applications.slice(0, 8).map((app) => (
            <Button
              key={app.id}
              variant="outline"
              size="sm"
              onClick={() => handleApplicationChange(searchParams.applicationId === app.id ? 'all' : app.id)}
              className={cn(
                "h-7 px-3 text-xs rounded-full transition-all",
                searchParams.applicationId === app.id
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  : "hover:border-primary/50"
              )}
            >
              {app.tla}
            </Button>
          ))}
          {applications.length > 8 && (
            <span className="text-xs text-muted-foreground">+{applications.length - 8} more</span>
          )}
        </div>
      )}

      {/* Link Content Area */}
      {links.length === 0 ? (
        <div className="text-center py-32 bg-card/30 border border-dashed rounded-3xl">
          <p className="text-muted-foreground text-lg">No links found matching your criteria.</p>
          {activeFilterCount > 0 && (
            <Button variant="link" onClick={clearAllFilters} className="mt-2">
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <div className="transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-bold text-foreground">{links.length}</span> link{links.length !== 1 ? 's' : ''}
              {selectedLinks.size > 0 && (
                <span className="ml-2 text-primary font-semibold">
                  ({selectedLinks.size} selected)
                </span>
              )}
            </p>
          </div>
          {viewMode === 'grid' && <GridView links={links} teamId={teamId} selectedLinks={selectedLinks} onToggleSelect={toggleSelectLink} />}
          {viewMode === 'table' && <TableView links={links} teamId={teamId} selectedLinks={selectedLinks} onToggleSelect={toggleSelectLink} />}
          {viewMode === 'compact' && <CompactView links={links} teamId={teamId} selectedLinks={selectedLinks} onToggleSelect={toggleSelectLink} />}
        </div>
      )}

    </div>
  )
}
