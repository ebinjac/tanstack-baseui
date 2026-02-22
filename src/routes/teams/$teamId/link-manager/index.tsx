import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Box,
  Globe2,
  Grip,
  Layers,
  LayoutList,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
  Search,
  Table as TableIcon,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { getTeamApplications } from "@/app/actions/applications";
import {
  bulkUpdateLinks,
  getLinkCategories,
  getLinks,
} from "@/app/actions/links";
import { CreateLinkDialog } from "@/components/link-manager/create-link-dialog";
import {
  CompactView,
  GridView,
  TableView,
} from "@/components/link-manager/link-views";
import {
  LinkManagerPage as PageWrapper,
  StatsSummaryItem,
} from "@/components/link-manager/shared";
import { PageHeader } from "@/components/shared";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { linkKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

// Schema for search params
const linkSearchSchema = z.object({
  search: z.string().optional(),
  visibility: z.enum(["all", "private", "public"]).prefault("all").optional(),
  applicationId: z.uuid().optional(),
  categoryId: z.uuid().optional(),
});

const PAGE_SIZE = 30;

export const Route = createFileRoute("/teams/$teamId/link-manager/")({
  component: LinkManagerIndexPage,
  validateSearch: (search) => linkSearchSchema.parse(search),
  loaderDeps: ({
    search: { search, visibility, applicationId, categoryId },
  }) => ({ search, visibility, applicationId, categoryId }),
  loader: async ({
    params: { teamId },
    deps: { search, visibility, applicationId, categoryId },
  }) => {
    const [linksData, categories, applications] = await Promise.all([
      getLinks({
        data: {
          teamId,
          search,
          visibility: visibility || "all",
          applicationId,
          categoryId,
          limit: PAGE_SIZE,
        },
      }),
      getLinkCategories({ data: { teamId } }),
      getTeamApplications({ data: { teamId } }),
    ]);
    return { linksData, categories, applications };
  },
});

function LinkManagerIndexPage() {
  const { teamId } = Route.useParams();
  const {
    linksData: initialData,
    categories,
    applications,
  } = Route.useLoaderData();
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"grid" | "table" | "compact">(
    "grid"
  );
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite query for paginated links
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: linkKeys.list(teamId, {
        search: searchParams.search,
        visibility: searchParams.visibility,
        applicationId: searchParams.applicationId,
        categoryId: searchParams.categoryId,
      }),
      queryFn: ({ pageParam }) =>
        getLinks({
          data: {
            teamId,
            search: searchParams.search,
            visibility: searchParams.visibility || "all",
            applicationId: searchParams.applicationId,
            categoryId: searchParams.categoryId,
            limit: PAGE_SIZE,
            cursor: pageParam,
          },
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialData: { pages: [initialData], pageParams: [undefined] },
    });

  // Flatten all loaded pages into a single array
  const links = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data]
  );
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: (data: {
      teamId: string;
      linkIds: string[];
      updates: Record<string, unknown>;
    }) => bulkUpdateLinks({ data }),
    onSuccess: (res) => {
      toast.success(`Updated ${res.count} links`);
      queryClient.invalidateQueries({ queryKey: linkKeys.team(teamId) });
      setSelectedLinks(new Set());
    },
    onError: (err) => toast.error(`Failed to update links: ${err.message}`),
  });

  // Selection handlers
  const toggleSelectLink = useCallback((id: string) => {
    setSelectedLinks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllLinks = useCallback(() => {
    setSelectedLinks(new Set(links.map((l) => l.id)));
  }, [links]);

  const clearSelection = useCallback(() => setSelectedLinks(new Set()), []);

  // Bulk action handlers
  const handleBulkVisibility = useCallback(
    (visibility: "public" | "private") => {
      bulkUpdateMutation.mutate({
        teamId,
        linkIds: Array.from(selectedLinks),
        updates: { visibility },
      });
    },
    [bulkUpdateMutation, teamId, selectedLinks]
  );

  const handleBulkCategory = useCallback(
    (categoryId: string | null) => {
      bulkUpdateMutation.mutate({
        teamId,
        linkIds: Array.from(selectedLinks),
        updates: { categoryId },
      });
    },
    [bulkUpdateMutation, teamId, selectedLinks]
  );

  // Filter handlers — debounced search (300ms)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback(
    (term: string) => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      searchTimerRef.current = setTimeout(() => {
        navigate({
          search: (prev: Record<string, unknown>) => ({
            ...prev,
            search: term || undefined,
          }),
        });
      }, 300);
    },
    [navigate]
  );

  const handleVisibilityChange = useCallback(
    (val: string | null) => {
      navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          visibility: val as "all" | "private" | "public" | undefined,
        }),
      });
    },
    [navigate]
  );

  const handleApplicationChange = useCallback(
    (val: string | null) => {
      navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          applicationId: !val || val === "all" ? undefined : val,
        }),
      });
    },
    [navigate]
  );

  const handleCategoryChange = useCallback(
    (val: string | null) => {
      navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          categoryId: !val || val === "all" ? undefined : val,
        }),
      });
    },
    [navigate]
  );

  const clearAllFilters = useCallback(() => {
    navigate({ search: { visibility: "all" } });
  }, [navigate]);

  // Computed values
  const activeFilterCount = useMemo(
    () =>
      [
        searchParams.applicationId,
        searchParams.categoryId,
        searchParams.search,
        searchParams.visibility && searchParams.visibility !== "all"
          ? searchParams.visibility
          : undefined,
      ].filter(Boolean).length,
    [
      searchParams.applicationId,
      searchParams.categoryId,
      searchParams.search,
      searchParams.visibility,
    ]
  );
  const selectedApp = useMemo(
    () => applications?.find((a) => a.id === searchParams.applicationId),
    [applications, searchParams.applicationId]
  );
  const selectedCategory = useMemo(
    () => categories?.find((c) => c.id === searchParams.categoryId),
    [categories, searchParams.categoryId]
  );

  const stats = useMemo(
    () => ({
      total: totalCount,
      public: links.filter((l) => l.visibility === "public").length,
      private: links.filter((l) => l.visibility === "private").length,
      usage: links.reduce((acc: number, l) => acc + (l.usageCount || 0), 0),
    }),
    [links, totalCount]
  );

  return (
    <PageWrapper>
      <PageHeader
        description="Central team repository for bookmarks & tools"
        title="Link Manager"
      >
        <CreateLinkDialog
          teamId={teamId}
          trigger={
            <Button className="gap-2" variant="secondary">
              <Plus className="h-4 w-4" /> Add Link
            </Button>
          }
        />
      </PageHeader>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatsSummaryItem
          color="primary"
          icon={Grip}
          label="Total Resources"
          value={stats.total}
        />
        <StatsSummaryItem
          color="blue"
          icon={Globe2}
          label="Public Access"
          value={stats.public}
        />
        <StatsSummaryItem
          color="amber"
          icon={Lock}
          label="Team Restricted"
          value={stats.private}
        />
        <StatsSummaryItem
          color="indigo"
          icon={Activity}
          label="Total Insights"
          value={
            stats.usage > 1000
              ? `${(stats.usage / 1000).toFixed(1)}k`
              : stats.usage
          }
        />
      </div>

      {/* Bulk Actions Layer */}
      <AnimatePresence>
        {selectedLinks.size > 0 && (
          <BulkActionsBar
            categories={categories}
            isPending={bulkUpdateMutation.isPending}
            onBulkCategory={handleBulkCategory}
            onBulkVisibility={handleBulkVisibility}
            onClearSelection={clearSelection}
            onSelectAll={selectAllLinks}
            selectedCount={selectedLinks.size}
          />
        )}
      </AnimatePresence>

      {/* Filter Cockpit */}
      <FilterCockpit
        activeFilterCount={activeFilterCount}
        applications={applications}
        categories={categories}
        onApplicationChange={handleApplicationChange}
        onCategoryChange={handleCategoryChange}
        onClearAllFilters={clearAllFilters}
        onSearch={handleSearch}
        onViewModeChange={setViewMode}
        onVisibilityChange={handleVisibilityChange}
        searchParams={searchParams}
        selectedApp={selectedApp}
        selectedCategory={selectedCategory}
        viewMode={viewMode}
      />

      {/* Main Content Area */}
      <div className="relative">
        {links.length === 0 ? (
          <EmptyLinksState onClearFilters={clearAllFilters} />
        ) : (
          <div className="fade-in slide-in-from-bottom-4 animate-in space-y-6 duration-500">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                <p className="font-bold text-[11px] text-muted-foreground">
                  Showing{" "}
                  <span className="text-foreground">{links.length}</span> of{" "}
                  <span className="text-foreground">{totalCount}</span> Verified
                  Resources
                </p>
              </div>
            </div>
            <div className="transition-all duration-300">
              {viewMode === "grid" && (
                <GridView
                  links={links}
                  onToggleSelect={toggleSelectLink}
                  selectedLinks={selectedLinks}
                  teamId={teamId}
                />
              )}
              {viewMode === "table" && (
                <TableView
                  links={links}
                  onToggleSelect={toggleSelectLink}
                  selectedLinks={selectedLinks}
                  teamId={teamId}
                />
              )}
              {viewMode === "compact" && (
                <CompactView
                  links={links}
                  onToggleSelect={toggleSelectLink}
                  selectedLinks={selectedLinks}
                  teamId={teamId}
                />
              )}
            </div>

            {/* Infinite scroll sentinel */}
            <div className="h-1" ref={sentinelRef} />
            {isFetchingNextPage && (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="font-bold text-muted-foreground text-xs">
                  Loading more resources...
                </p>
              </div>
            )}
            {!hasNextPage && links.length > 0 && links.length >= PAGE_SIZE && (
              <p className="py-4 text-center font-bold text-[11px] text-muted-foreground/50">
                All {totalCount} resources loaded
              </p>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

// ============================================================================
// Bulk Actions Bar Component
// ============================================================================
interface BulkActionsBarProps {
  categories: { id: string; name: string }[] | undefined;
  isPending: boolean;
  onBulkCategory: (categoryId: string | null) => void;
  onBulkVisibility: (visibility: "public" | "private") => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  selectedCount: number;
}

const BulkActionsBar = memo(function BulkActionsBar({
  selectedCount,
  categories,
  onClearSelection,
  onSelectAll,
  onBulkVisibility,
  onBulkCategory,
  isPending,
}: BulkActionsBarProps) {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary p-4 shadow-2xl shadow-primary/20">
        <div className="pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-6 text-primary-foreground lg:flex-row lg:items-center">
          <div className="flex items-center gap-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/20 shadow-lg backdrop-blur-xl">
              <span className="font-black text-xl">{selectedCount}</span>
            </div>
            <div>
              <p className="font-bold text-sm text-white/90">
                Multi-Selection Mode
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <button
                  className="flex items-center gap-1 font-bold text-xs opacity-70 hover:underline hover:opacity-100"
                  onClick={onClearSelection}
                  type="button"
                >
                  <X className="h-3 w-3" /> Clear Selection
                </button>
                <span className="opacity-30">•</span>
                <button
                  className="font-bold text-xs opacity-70 hover:underline hover:opacity-100"
                  onClick={onSelectAll}
                  type="button"
                >
                  Select All Page
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-white/10 bg-white/10 p-1 backdrop-blur-md">
              <Button
                className="h-8 text-white hover:bg-white/20 hover:text-white"
                onClick={() => onBulkVisibility("public")}
                size="sm"
                variant="ghost"
              >
                <Globe2 className="mr-2 h-3.5 w-3.5" /> Make Public
              </Button>
              <Button
                className="h-8 text-white hover:bg-white/20 hover:text-white"
                onClick={() => onBulkVisibility("private")}
                size="sm"
                variant="ghost"
              >
                <Lock className="mr-2 h-3.5 w-3.5" /> Make Private
              </Button>
            </div>

            <Select
              onValueChange={(val: string | null) =>
                onBulkCategory(val === "none" ? null : val)
              }
            >
              <SelectTrigger className="h-10 w-[180px] border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 focus:ring-white/30">
                <SelectValue placeholder="Assign Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Category</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isPending && (
              <Loader2 className="h-5 w-5 animate-spin text-white/80" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ============================================================================
// Filter Cockpit Component
// ============================================================================
interface FilterCockpitProps {
  activeFilterCount: number;
  applications:
    | { id: string; tla: string; applicationName: string }[]
    | undefined;
  categories: { id: string; name: string }[] | undefined;
  onApplicationChange: (val: string | null) => void;
  onCategoryChange: (val: string | null) => void;
  onClearAllFilters: () => void;
  onSearch: (term: string) => void;
  onViewModeChange: (mode: "grid" | "table" | "compact") => void;
  onVisibilityChange: (val: string | null) => void;
  searchParams: {
    search?: string;
    visibility?: string;
    applicationId?: string;
    categoryId?: string;
  };
  selectedApp: { id: string; applicationName: string; tla: string } | undefined;
  selectedCategory: { id: string; name: string } | undefined;
  viewMode: "grid" | "table" | "compact";
}

const FilterCockpit = memo(function FilterCockpit({
  searchParams,
  viewMode,
  applications,
  categories,
  selectedApp,
  selectedCategory,
  activeFilterCount,
  onSearch,
  onVisibilityChange,
  onApplicationChange,
  onCategoryChange,
  onViewModeChange,
  onClearAllFilters,
}: FilterCockpitProps) {
  return (
    <div className="space-y-3">
      <div className="relative flex flex-col items-stretch gap-2 overflow-hidden rounded-xl border bg-card p-1 shadow-sm xl:flex-row xl:items-center">
        {/* Search Container */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 w-full border-0 bg-transparent pl-9 font-medium text-sm shadow-none focus-visible:ring-0"
            defaultValue={searchParams.search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Filter by title, tag, or description..."
          />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 pr-1 xl:flex-nowrap">
          {/* Visibility Pills */}
          <VisibilityPills
            onChange={onVisibilityChange}
            value={searchParams.visibility || "all"}
          />

          <div className="mx-1 hidden h-6 w-px bg-border xl:block" />

          {/* Application Filter */}
          <Select
            onValueChange={onApplicationChange}
            value={searchParams.applicationId || "all"}
          >
            <SelectTrigger className="group h-10 w-[180px] shrink-0 border-0 bg-transparent font-medium text-sm shadow-none focus:ring-0 xl:w-[200px]">
              <div className="flex items-center gap-2 overflow-hidden">
                <Box className="h-4 w-4 shrink-0 text-blue-500" />
                <SelectValue
                  className="truncate"
                  placeholder="All Applications"
                />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                className="font-medium text-sm italic opacity-70"
                value="all"
              >
                All Applications
              </SelectItem>
              {applications?.map((app) => (
                <SelectItem
                  className="font-medium text-sm"
                  key={app.id}
                  value={app.id}
                >
                  <span className="flex items-center gap-2">
                    <span className="shrink-0 text-primary/60">{app.tla}</span>
                    <span className="shrink-0 text-muted-foreground/30">•</span>
                    <span className="truncate">{app.applicationName}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select
            onValueChange={onCategoryChange}
            value={searchParams.categoryId || "all"}
          >
            <SelectTrigger className="group h-10 w-[160px] shrink-0 border-0 bg-transparent font-medium text-sm shadow-none focus:ring-0 xl:w-[180px]">
              <div className="flex items-center gap-2 overflow-hidden">
                <Layers className="h-4 w-4 shrink-0 text-purple-600" />
                <SelectValue
                  className="truncate"
                  placeholder="All Categories"
                />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                className="font-medium text-sm italic opacity-70"
                value="all"
              >
                All Categories
              </SelectItem>
              {categories?.map((cat) => (
                <SelectItem
                  className="font-medium text-sm"
                  key={cat.id}
                  value={cat.id}
                >
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="mx-1 hidden h-6 w-px bg-border xl:block" />

          {/* View Mode Toggle */}
          <ViewModeToggle onChange={onViewModeChange} value={viewMode} />
        </div>
      </div>

      {/* Active Filters Row */}
      {activeFilterCount > 0 && (
        <ActiveFiltersRow
          onApplicationChange={onApplicationChange}
          onCategoryChange={onCategoryChange}
          onClearAllFilters={onClearAllFilters}
          onSearch={onSearch}
          onVisibilityChange={onVisibilityChange}
          searchParams={searchParams}
          selectedApp={selectedApp}
          selectedCategory={selectedCategory}
        />
      )}
    </div>
  );
});

// ============================================================================
// Visibility Pills Component
// ============================================================================
const VisibilityPills = memo(function VisibilityPills({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const options = [
    { id: "all", label: "All", icon: Globe2 },
    { id: "public", label: "Public", icon: Globe2 },
    { id: "private", label: "Private", icon: Lock },
  ];

  return (
    <div className="relative flex h-10 shrink-0 items-center gap-1 rounded-lg bg-muted p-1">
      {options.map((v) => {
        const isActive = value === v.id;
        return (
          <button
            className={cn(
              "relative z-10 flex h-8 items-center gap-1.5 rounded-md px-3 font-medium text-xs transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            key={v.id}
            onClick={() => onChange(v.id)}
            type="button"
          >
            {v.id !== "all" && (
              <v.icon
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
            )}
            {v.label}
            {isActive && (
              <motion.div
                className="absolute inset-0 -z-10 rounded-md border border-border/50 bg-background shadow-sm"
                layoutId="active-vis-bg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
});

// ============================================================================
// View Mode Toggle Component
// ============================================================================
const ViewModeToggle = memo(function ViewModeToggle({
  value,
  onChange,
}: {
  value: "grid" | "table" | "compact";
  onChange: (mode: "grid" | "table" | "compact") => void;
}) {
  const options = [
    { id: "grid", icon: LayoutList },
    { id: "table", icon: TableIcon },
    { id: "compact", icon: Grip },
  ];

  return (
    <div className="flex h-10 shrink-0 items-center gap-1 rounded-lg bg-muted p-1">
      {options.map((option) => (
        <button
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md transition-all",
            value === option.id
              ? "border border-border/50 bg-background text-primary shadow-sm"
              : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
          )}
          key={option.id}
          onClick={() => onChange(option.id as "grid" | "table" | "compact")}
          type="button"
        >
          <option.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
});

// ============================================================================
// Active Filters Row Component
// ============================================================================
const ActiveFiltersRow = memo(function ActiveFiltersRow({
  searchParams,
  selectedApp,
  selectedCategory,
  onSearch,
  onApplicationChange,
  onCategoryChange,
  onVisibilityChange,
  onClearAllFilters,
}: {
  searchParams: {
    search?: string;
    visibility?: string;
    applicationId?: string;
    categoryId?: string;
  };
  selectedApp: { id: string; applicationName: string } | undefined;
  selectedCategory: { id: string; name: string } | undefined;
  onSearch: (term: string) => void;
  onApplicationChange: (val: string | null) => void;
  onCategoryChange: (val: string | null) => void;
  onVisibilityChange: (val: string | null) => void;
  onClearAllFilters: () => void;
}) {
  return (
    <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto px-1 pb-1">
      <span className="mr-1 shrink-0 font-bold text-[10px] text-muted-foreground/60 uppercase tracking-wider">
        Active Filters:
      </span>
      {searchParams.search && (
        <Badge
          className="h-6 gap-1 rounded-lg border border-primary/20 bg-primary/5 pr-1 pl-2 font-bold text-[11px] text-primary shadow-sm"
          variant="secondary"
        >
          "{searchParams.search}"
          <button
            className="ml-1 rounded-full p-0.5 hover:bg-primary/10"
            onClick={() => onSearch("")}
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {selectedApp && (
        <Badge
          className="h-6 gap-1 rounded-lg border border-blue-500/20 bg-blue-500/5 pr-1 pl-2 font-bold text-[11px] text-blue-600 shadow-sm"
          variant="secondary"
        >
          <Box className="h-3 w-3" /> {selectedApp.applicationName}
          <button
            className="ml-1 rounded-full p-0.5 hover:bg-blue-500/10"
            onClick={() => onApplicationChange("all")}
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {selectedCategory && (
        <Badge
          className="h-6 gap-1 rounded-lg border border-purple-500/20 bg-purple-500/5 pr-1 pl-2 font-bold text-[11px] text-purple-600 shadow-sm"
          variant="secondary"
        >
          <Layers className="h-3 w-3" /> {selectedCategory.name}
          <button
            className="ml-1 rounded-full p-0.5 hover:bg-purple-500/10"
            onClick={() => onCategoryChange("all")}
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {searchParams.visibility && searchParams.visibility !== "all" && (
        <Badge
          className="h-6 gap-1 rounded-lg border border-border/20 bg-background/50 pr-1 pl-2 font-bold text-[11px] capitalize shadow-sm"
          variant="secondary"
        >
          {searchParams.visibility}
          <button
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/10"
            onClick={() => onVisibilityChange("all")}
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
      <button
        className="ml-auto flex items-center gap-1 font-bold text-muted-foreground text-xs hover:text-destructive"
        onClick={onClearAllFilters}
        type="button"
      >
        <RotateCcw className="h-3 w-3" /> Reset View
      </button>
    </div>
  );
});

// ============================================================================
// Empty Links State Component
// ============================================================================
const EmptyLinksState = memo(function EmptyLinksState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <EmptyState
      actionText="Clear Filters"
      description="We couldn't find any links matching your current filters. Try adjusting your search criteria."
      icon={Search}
      onAction={onClearFilters}
      size="lg"
      title="No resources found"
    />
  );
});
