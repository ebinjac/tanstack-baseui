import { createFileRoute, Link as RouterLink } from '@tanstack/react-router'
import { getLinks, getLinkCategories, bulkUpdateLinks } from '@/app/actions/links'
import { getTeamApplications } from '@/app/actions/applications'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Search, Grip, Table as TableIcon, LayoutList, Globe2, Lock, Layers, Upload, Box, X, Tag, BarChart3, Activity, RotateCcw, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, useCallback, useRef, memo, useEffect } from 'react'
import { CreateLinkDialog } from '@/components/link-manager/create-link-dialog'
import { GridView, TableView, CompactView } from '@/components/link-manager/link-views'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { StatsSummaryItem } from '@/components/link-manager/shared'

// Schema for search params
const linkSearchSchema = z.object({
  search: z.string().optional(),
  visibility: z.enum(['all', 'private', 'public']).default('all').optional(),
  applicationId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
})

const PAGE_SIZE = 30

export const Route = createFileRoute('/teams/$teamId/link-manager/')({
  component: LinkManagerPage,
  validateSearch: (search) => linkSearchSchema.parse(search),
  loaderDeps: ({ search: { search, visibility, applicationId, categoryId } }) => ({ search, visibility, applicationId, categoryId }),
  loader: async ({ params: { teamId }, deps: { search, visibility, applicationId, categoryId } }) => {
    const [linksData, categories, applications] = await Promise.all([
      getLinks({ data: { teamId, search, visibility: visibility || 'all', applicationId, categoryId, limit: PAGE_SIZE } }),
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
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Infinite query for paginated links
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['links', teamId, searchParams.search, searchParams.visibility, searchParams.applicationId, searchParams.categoryId],
    queryFn: ({ pageParam }) => getLinks({
      data: {
        teamId,
        search: searchParams.search,
        visibility: searchParams.visibility || 'all',
        applicationId: searchParams.applicationId,
        categoryId: searchParams.categoryId,
        limit: PAGE_SIZE,
        cursor: pageParam,
      }
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData: { pages: [initialData], pageParams: [undefined] },
  })

  // Flatten all loaded pages into a single array
  const links = useMemo(() => data?.pages.flatMap(p => p.items) ?? [], [data])
  const totalCount = data?.pages[0]?.totalCount ?? 0

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (data: { teamId: string, linkIds: string[], updates: any }) => bulkUpdateLinks({ data }),
    onSuccess: (result) => {
      toast.success(`Successfully updated ${result.count} link${result.count !== 1 ? 's' : ''}`)
      queryClient.invalidateQueries({ queryKey: ['links', teamId] })
      setSelectedLinks(new Set())
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update links')
  })

  // Selection handlers
  const toggleSelectLink = useCallback((linkId: string) => {
    setSelectedLinks(prev => {
      const next = new Set(prev)
      next.has(linkId) ? next.delete(linkId) : next.add(linkId)
      return next
    })
  }, [])

  const selectAllLinks = useCallback(() => {
    setSelectedLinks(prev => prev.size === links.length ? new Set() : new Set(links.map((l: any) => l.id)))
  }, [links])

  const clearSelection = useCallback(() => setSelectedLinks(new Set()), [])

  // Bulk action handlers
  const handleBulkVisibility = useCallback((visibility: 'public' | 'private') => {
    bulkUpdateMutation.mutate({ teamId, linkIds: Array.from(selectedLinks), updates: { visibility } })
  }, [bulkUpdateMutation, teamId, selectedLinks])

  const handleBulkCategory = useCallback((categoryId: string | null) => {
    bulkUpdateMutation.mutate({ teamId, linkIds: Array.from(selectedLinks), updates: { categoryId } })
  }, [bulkUpdateMutation, teamId, selectedLinks])

  // Filter handlers — debounced search (300ms)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearch = useCallback((term: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      navigate({ search: (prev: any) => ({ ...prev, search: term || undefined }) })
    }, 300)
  }, [navigate])

  const handleVisibilityChange = useCallback((val: string | null) => {
    navigate({ search: (prev: any) => ({ ...prev, visibility: val as any }) })
  }, [navigate])

  const handleApplicationChange = useCallback((val: string | null) => {
    navigate({ search: (prev: any) => ({ ...prev, applicationId: !val || val === 'all' ? undefined : val }) })
  }, [navigate])

  const handleCategoryChange = useCallback((val: string | null) => {
    navigate({ search: (prev: any) => ({ ...prev, categoryId: !val || val === 'all' ? undefined : val }) })
  }, [navigate])

  const clearAllFilters = useCallback(() => {
    navigate({ search: { visibility: 'all' } })
  }, [navigate])

  // Computed values — memoized to avoid recalc on every render
  const activeFilterCount = useMemo(() => [searchParams.applicationId, searchParams.categoryId, searchParams.search, searchParams.visibility && searchParams.visibility !== 'all' ? searchParams.visibility : undefined].filter(Boolean).length, [searchParams.applicationId, searchParams.categoryId, searchParams.search, searchParams.visibility])
  const selectedApp = useMemo(() => applications?.find(a => a.id === searchParams.applicationId), [applications, searchParams.applicationId])
  const selectedCategory = useMemo(() => categories?.find(c => c.id === searchParams.categoryId), [categories, searchParams.categoryId])

  const stats = useMemo(() => ({
    total: totalCount,
    public: links.filter((l: any) => l.visibility === 'public').length,
    private: links.filter((l: any) => l.visibility === 'private').length,
    usage: links.reduce((acc: number, l: any) => acc + (l.usageCount || 0), 0)
  }), [links, totalCount])

  return (
    <div className="flex-1 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="max-w-7xl mx-auto space-y-8 p-8 pt-6">
        {/* Header */}
        <PageHeader teamId={teamId} />

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsSummaryItem label="Total Resources" value={stats.total} icon={Grip} color="primary" />
          <StatsSummaryItem label="Public Access" value={stats.public} icon={Globe2} color="blue" />
          <StatsSummaryItem label="Team Restricted" value={stats.private} icon={Lock} color="amber" />
          <StatsSummaryItem label="Total Insights" value={stats.usage > 1000 ? `${(stats.usage / 1000).toFixed(1)}k` : stats.usage} icon={Activity} color="indigo" />
        </div>

        {/* Bulk Actions Layer */}
        <AnimatePresence>
          {selectedLinks.size > 0 && (
            <BulkActionsBar
              selectedCount={selectedLinks.size}
              categories={categories}
              onClearSelection={clearSelection}
              onSelectAll={selectAllLinks}
              onBulkVisibility={handleBulkVisibility}
              onBulkCategory={handleBulkCategory}
              isPending={bulkUpdateMutation.isPending}
            />
          )}
        </AnimatePresence>

        {/* Filter Cockpit */}
        <FilterCockpit
          searchParams={searchParams}
          viewMode={viewMode}
          applications={applications}
          categories={categories}
          selectedApp={selectedApp}
          selectedCategory={selectedCategory}
          activeFilterCount={activeFilterCount}
          onSearch={handleSearch}
          onVisibilityChange={handleVisibilityChange}
          onApplicationChange={handleApplicationChange}
          onCategoryChange={handleCategoryChange}
          onViewModeChange={setViewMode}
          onClearAllFilters={clearAllFilters}
        />

        {/* Main Content Area */}
        <div className="relative">
          {links.length === 0 ? (
            <EmptyLinksState onClearFilters={clearAllFilters} />
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <p className="text-[11px] font-bold text-muted-foreground">
                    Showing <span className="text-foreground">{links.length}</span> of <span className="text-foreground">{totalCount}</span> Verified Resources
                  </p>
                </div>
              </div>
              <div className="transition-all duration-300">
                {viewMode === 'grid' && <GridView links={links} teamId={teamId} selectedLinks={selectedLinks} onToggleSelect={toggleSelectLink} />}
                {viewMode === 'table' && <TableView links={links} teamId={teamId} selectedLinks={selectedLinks} onToggleSelect={toggleSelectLink} />}
                {viewMode === 'compact' && <CompactView links={links} teamId={teamId} selectedLinks={selectedLinks} onToggleSelect={toggleSelectLink} />}
              </div>

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-1" />
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-8 gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-xs font-bold text-muted-foreground">Loading more resources...</p>
                </div>
              )}
              {!hasNextPage && links.length > 0 && links.length >= PAGE_SIZE && (
                <p className="text-center text-[11px] font-bold text-muted-foreground/50 py-4">
                  All {totalCount} resources loaded
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Page Header Component
// ============================================================================
const PageHeader = memo(function PageHeader({ teamId }: { teamId: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div className="flex flex-col">
          <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Link Manager
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 border-primary/20 text-primary px-2 h-5">
              Knowledge Hub
            </Badge>
            <span className="text-muted-foreground/30">•</span>
            <p className="text-sm font-medium text-muted-foreground">
              Central team repository for bookmarks & tools
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RouterLink to="/teams/$teamId/link-manager/stats" params={{ teamId }}>
            <Button variant="outline" className="h-11 px-5 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-bold text-xs rounded-xl shadow-sm bg-background/50 backdrop-blur-sm">
              <BarChart3 className="h-4 w-4 text-primary" /> Reports
            </Button>
          </RouterLink>
          <RouterLink to="/teams/$teamId/link-manager/categories" params={{ teamId }}>
            <Button variant="outline" className="h-11 px-5 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-bold text-xs rounded-xl shadow-sm bg-background/50 backdrop-blur-sm">
              <Layers className="h-4 w-4 text-purple-600" /> Categories
            </Button>
          </RouterLink>
          <RouterLink to="/teams/$teamId/link-manager/import" params={{ teamId }}>
            <Button variant="outline" className="h-11 px-5 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-bold text-xs rounded-xl shadow-sm bg-background/50 backdrop-blur-sm">
              <Upload className="h-4 w-4 text-indigo-600" /> Bulk Import
            </Button>
          </RouterLink>
          <CreateLinkDialog teamId={teamId} />
        </div>
      </div>
    </div>
  )
})

// ============================================================================
// Bulk Actions Bar Component
// ============================================================================
interface BulkActionsBarProps {
  selectedCount: number
  categories: any[] | undefined
  onClearSelection: () => void
  onSelectAll: () => void
  onBulkVisibility: (visibility: 'public' | 'private') => void
  onBulkCategory: (categoryId: string | null) => void
  isPending: boolean
}

const BulkActionsBar = memo(function BulkActionsBar({ selectedCount, categories, onClearSelection, onSelectAll, onBulkVisibility, onBulkCategory, isPending }: BulkActionsBarProps) {
  const [bulkTagsInput, setBulkTagsInput] = useState('')

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}>
      <div className="bg-primary shadow-2xl shadow-primary/20 rounded-2xl p-4 border border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 opacity-10 bg-white rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 text-primary-foreground">
          <div className="flex items-center gap-5">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-lg">
              <span className="text-xl font-black">{selectedCount}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white/90">Multi-Selection Mode</p>
              <div className="flex items-center gap-2 mt-0.5">
                <button onClick={onClearSelection} className="text-xs font-bold hover:underline opacity-70 hover:opacity-100 flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear Selection
                </button>
                <span className="opacity-30">•</span>
                <button onClick={onSelectAll} className="text-xs font-bold hover:underline opacity-70 hover:opacity-100">
                  Select All Page
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/10">
              <Button onClick={() => onBulkVisibility('public')} variant="ghost" size="sm" className="h-9 rounded-lg hover:bg-white/20 text-white font-bold text-xs gap-2">
                <Globe2 className="h-3.5 w-3.5" /> Public
              </Button>
              <Button onClick={() => onBulkVisibility('private')} variant="ghost" size="sm" className="h-9 rounded-lg hover:bg-white/20 text-white font-bold text-xs gap-2">
                <Lock className="h-3.5 w-3.5" /> Private
              </Button>
            </div>

            <Select onValueChange={(val) => onBulkCategory(val === 'none' ? null : (val as string))}>
              <SelectTrigger className="h-11 w-[180px] bg-white/10 border-white/10 text-white text-xs font-bold rounded-xl">
                <Layers className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none" className="font-bold text-xs">Uncategorized</SelectItem>
                {categories?.map(c => <SelectItem key={c.id} value={c.id} className="font-bold text-xs">{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="h-8 w-px bg-white/20 mx-1 hidden lg:block" />

            <Popover>
              <PopoverTrigger>
                <Button className="h-11 bg-white text-primary hover:bg-white/90 font-bold text-xs rounded-xl px-5 gap-2 shadow-xl shadow-white/10">
                  <Tag className="h-4 w-4" /> Bulk Tags
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-6 rounded-3xl" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground mr-1">Comma Separated Tags</Label>
                    <Input placeholder="operations, secure, docs..." value={bulkTagsInput} onChange={(e) => setBulkTagsInput(e.target.value)} className="h-11 rounded-xl bg-muted/50 border-transparent focus:bg-background" />
                  </div>
                  <Button className="w-full h-11 rounded-xl font-bold text-xs" disabled={!bulkTagsInput.trim() || isPending}>
                    {isPending ? "Updating..." : "Add Tags"}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

// ============================================================================
// Filter Cockpit Component
// ============================================================================
interface FilterCockpitProps {
  searchParams: any
  viewMode: 'grid' | 'table' | 'compact'
  applications: any[] | undefined
  categories: any[] | undefined
  selectedApp: any | undefined
  selectedCategory: any | undefined
  activeFilterCount: number
  onSearch: (term: string) => void
  onVisibilityChange: (val: string | null) => void
  onApplicationChange: (val: string | null) => void
  onCategoryChange: (val: string | null) => void
  onViewModeChange: (mode: 'grid' | 'table' | 'compact') => void
  onClearAllFilters: () => void
}

const FilterCockpit = memo(function FilterCockpit({ searchParams, viewMode, applications, categories, selectedApp, selectedCategory, activeFilterCount, onSearch, onVisibilityChange, onApplicationChange, onCategoryChange, onViewModeChange, onClearAllFilters }: FilterCockpitProps) {
  return (
    <div className="bg-card/40 backdrop-blur-sm border border-border/50 p-1.5 rounded-2xl space-y-3 relative overflow-hidden">
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
        {/* Search Container */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-50" />
          <Input placeholder="Filter by title, tag, or description..." className="h-12 pl-12 bg-background/50 border-none rounded-xl font-bold text-sm focus:ring-primary/20 focus:bg-background transition-all w-full" defaultValue={searchParams.search} onChange={(e) => onSearch(e.target.value)} />
        </div>

        <div className="flex items-center gap-3 flex-wrap xl:flex-nowrap">
          {/* Visibility Pills */}
          <VisibilityPills value={searchParams.visibility || 'all'} onChange={onVisibilityChange} />

          <div className="h-8 w-px bg-border/50 mx-1 hidden xl:block" />

          {/* Application Filter */}
          <Select value={searchParams.applicationId || 'all'} onValueChange={onApplicationChange}>
            <SelectTrigger className="h-12 w-[180px] xl:w-[220px] bg-background/50 border-none font-bold text-xs rounded-xl focus:ring-primary/20 group shrink-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <Box className="h-4 w-4 text-blue-500 shrink-0" />
                <SelectValue placeholder="All Applications" className="truncate" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-[400px] min-w-[300px]">
              <SelectItem value="all" className="font-bold text-xs italic opacity-70">All Applications</SelectItem>
              {applications?.map(app => (
                <SelectItem key={app.id} value={app.id} className="font-bold text-xs">
                  <span className="flex items-center gap-2">
                    <span className="text-primary/60 shrink-0">{app.tla}</span>
                    <span className="text-muted-foreground/30 shrink-0">•</span>
                    <span className="truncate">{app.applicationName}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={searchParams.categoryId || 'all'} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-12 w-[160px] xl:w-[200px] bg-background/50 border-none font-bold text-xs rounded-xl focus:ring-primary/20 group shrink-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <Layers className="h-4 w-4 text-purple-600 shrink-0" />
                <SelectValue placeholder="All Categories" className="truncate" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl min-w-[200px]">
              <SelectItem value="all" className="font-bold text-xs italic opacity-70">All Categories</SelectItem>
              {categories?.map(cat => (<SelectItem key={cat.id} value={cat.id} className="font-bold text-xs">{cat.name}</SelectItem>))}
            </SelectContent>
          </Select>

          <div className="h-8 w-px bg-border/50 mx-1 hidden xl:block" />

          {/* View Mode Toggle */}
          <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
        </div>
      </div>

      {/* Active Filters Row */}
      {activeFilterCount > 0 && (
        <ActiveFiltersRow searchParams={searchParams} selectedApp={selectedApp} selectedCategory={selectedCategory} onSearch={onSearch} onApplicationChange={onApplicationChange} onCategoryChange={onCategoryChange} onVisibilityChange={onVisibilityChange} onClearAllFilters={onClearAllFilters} />
      )}
    </div>
  )
})

// ============================================================================
// Visibility Pills Component
// ============================================================================
const VisibilityPills = memo(function VisibilityPills({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const options = [
    { id: 'all', label: 'All', icon: Globe2 },
    { id: 'public', label: 'Public', icon: Globe2 },
    { id: 'private', label: 'Private', icon: Lock }
  ]

  return (
    <div className="bg-muted/40 p-1.5 rounded-xl flex items-center gap-1 border border-border/50 h-12 px-1.5 shrink-0 relative">
      {options.map((v) => {
        const isActive = value === v.id
        return (
          <button key={v.id} onClick={() => onChange(v.id)} className={cn("relative px-4 h-9 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-2 z-10", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            {v.id !== 'all' && <v.icon className={cn("h-3.5 w-3.5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />}
            {v.label}
            {isActive && <motion.div layoutId="active-vis-bg" className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/10 -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
          </button>
        )
      })}
    </div>
  )
})

// ============================================================================
// View Mode Toggle Component
// ============================================================================
const ViewModeToggle = memo(function ViewModeToggle({ value, onChange }: { value: 'grid' | 'table' | 'compact'; onChange: (mode: 'grid' | 'table' | 'compact') => void }) {
  const modes = [
    { id: 'grid' as const, icon: Grip },
    { id: 'table' as const, icon: TableIcon },
    { id: 'compact' as const, icon: LayoutList }
  ]

  return (
    <div className="bg-muted/40 p-1.5 rounded-xl flex items-center gap-1 border border-border/50 h-12 px-1.5 shrink-0 relative">
      {modes.map((mode) => {
        const isActive = value === mode.id
        return (
          <button key={mode.id} onClick={() => onChange(mode.id)} className={cn("relative h-9 w-9 rounded-lg flex items-center justify-center transition-colors z-10", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            <mode.icon className="h-4 w-4" />
            {isActive && <motion.div layoutId="active-view-bg" className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/10 -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
          </button>
        )
      })}
    </div>
  )
})

// ============================================================================
// Active Filters Row Component
// ============================================================================
const ActiveFiltersRow = memo(function ActiveFiltersRow({ searchParams, selectedApp, selectedCategory, onSearch, onApplicationChange, onCategoryChange, onVisibilityChange, onClearAllFilters }: any) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/30 px-2 mt-2">
      <span className="text-[11px] font-bold text-muted-foreground mr-1 opacity-60">Filters:</span>
      {searchParams.search && (
        <Badge variant="secondary" className="h-6 gap-1 pr-1 pl-2 rounded-lg text-[11px] font-bold bg-background/50 border border-primary/20 shadow-sm">
          "{searchParams.search}"
          <button onClick={() => onSearch("")} className="ml-1 hover:bg-primary/10 rounded-full p-0.5"><X className="h-3 w-3" /></button>
        </Badge>
      )}
      {selectedApp && (
        <Badge variant="secondary" className="h-6 gap-1 pr-1 pl-2 rounded-lg text-[11px] font-bold bg-blue-500/5 text-blue-600 border border-blue-500/20 shadow-sm">
          <Box className="h-3 w-3" /> {selectedApp.tla}
          <button onClick={() => onApplicationChange("all")} className="ml-1 hover:bg-blue-500/10 rounded-full p-0.5"><X className="h-3 w-3" /></button>
        </Badge>
      )}
      {selectedCategory && (
        <Badge variant="secondary" className="h-6 gap-1 pr-1 pl-2 rounded-lg text-[11px] font-bold bg-purple-500/5 text-purple-600 border border-purple-500/20 shadow-sm">
          <Layers className="h-3 w-3" /> {selectedCategory.name}
          <button onClick={() => onCategoryChange("all")} className="ml-1 hover:bg-purple-500/10 rounded-full p-0.5"><X className="h-3 w-3" /></button>
        </Badge>
      )}
      {searchParams.visibility && searchParams.visibility !== 'all' && (
        <Badge variant="secondary" className="h-6 gap-1 pr-1 pl-2 rounded-lg text-[11px] font-bold bg-background/50 border border-border/20 shadow-sm capitalize">
          {searchParams.visibility}
          <button onClick={() => onVisibilityChange("all")} className="ml-1 hover:bg-muted-foreground/10 rounded-full p-0.5"><X className="h-3 w-3" /></button>
        </Badge>
      )}
      <button onClick={onClearAllFilters} className="text-xs font-bold text-muted-foreground hover:text-destructive flex items-center gap-1 ml-auto">
        <RotateCcw className="h-3 w-3" /> Reset View
      </button>
    </div>
  )
})

// ============================================================================
// Empty Links State Component
// ============================================================================
const EmptyLinksState = memo(function EmptyLinksState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 bg-card/10 backdrop-blur-sm border border-dashed border-border/50 rounded-[2.5rem] text-center space-y-6">
      <div className="h-24 w-24 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground animate-pulse">
        <Search className="h-10 w-10 opacity-30" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black tracking-tight italic">No resources found</h3>
        <p className="text-muted-foreground max-w-sm font-medium">We couldn't find any links matching your current filters. Try adjusting your search criteria.</p>
      </div>
      <Button variant="outline" onClick={onClearFilters} className="h-11 px-8 rounded-2xl font-bold text-xs border-primary/20 hover:bg-primary/5">
        Clear Filters
      </Button>
    </div>
  )
})
