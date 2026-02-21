# hook-extract-logic: Extract Reusable Logic into Custom Hooks

## Priority: CRITICAL

## Explanation

When a component contains **complex logic** (data fetching, state machines, event handling, derived computations), extract it into a custom hook. This makes the logic independently testable, reusable across components, and keeps components focused on rendering.

**The rule of thumb**: If a component has more than **3 hooks** or **20 lines of non-JSX logic**, extract a custom hook.

## Bad Example

```tsx
// 🛑 Logic buried inside the component
function ScorecardPage({ teamId }: { teamId: string }) {
  const [entries, setEntries] = useState<ScorecardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    setLoading(true)
    getScorecardEntries({ data: { teamId } })
      .then((data) => {
        setEntries(data.entries)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [teamId])

  const filtered = useMemo(() => {
    let result = entries
    if (filter !== 'all') result = result.filter((e) => e.category === filter)
    if (searchTerm)
      result = result.filter((e) =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    return result.sort((a, b) =>
      sortBy === 'date'
        ? b.createdAt.localeCompare(a.createdAt)
        : b.score - a.score,
    )
  }, [entries, filter, sortBy, searchTerm])

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)

  // 200+ more lines of JSX...
}
```

## Good Example

```tsx
// ✅ Hook: data fetching and state
function useScorecardEntries(teamId: string) {
  return useQuery({
    queryKey: ['scorecard', teamId],
    queryFn: () => getScorecardEntries({ data: { teamId } }),
    select: (data) => data.entries,
  })
}

// ✅ Hook: filtering and sorting logic
function useScorecardFilters(entries: ScorecardEntry[]) {
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date')
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = useMemo(() => {
    let result = entries
    if (filter !== 'all') result = result.filter((e) => e.category === filter)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter((e) => e.title.toLowerCase().includes(term))
    }
    return result.sort((a, b) =>
      sortBy === 'date'
        ? b.createdAt.localeCompare(a.createdAt)
        : b.score - a.score,
    )
  }, [entries, filter, sortBy, searchTerm])

  return {
    filtered,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    searchTerm,
    setSearchTerm,
  }
}

// ✅ Hook: pagination
function usePagination<T>(items: T[], pageSize = 20) {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(items.length / pageSize)
  const paginated = items.slice((page - 1) * pageSize, page * pageSize)

  return { page, setPage, totalPages, paginated }
}

// ✅ Clean component — only renders
function ScorecardPage({ teamId }: { teamId: string }) {
  const { data: entries = [], isLoading, error } = useScorecardEntries(teamId)
  const { filtered, ...filterProps } = useScorecardFilters(entries)
  const { paginated, ...paginationProps } = usePagination(filtered)

  if (isLoading) return <ScorecardSkeleton />
  if (error) return <ErrorFallback error={error} />

  return (
    <ScorecardLayout>
      <FilterBar {...filterProps} />
      <EntryList entries={paginated} />
      <Pagination {...paginationProps} />
    </ScorecardLayout>
  )
}
```

## When to Extract a Hook

| Signal                                     | Action                                             |
| ------------------------------------------ | -------------------------------------------------- |
| `useState` + `useEffect` for data fetching | Extract `useXxxQuery` hook (prefer TanStack Query) |
| Multiple `useState` managing related state | Extract `useXxxState` or use `useReducer`          |
| `useMemo`/`useCallback` with complex logic | Extract `useXxxComputed` hook                      |
| Same logic appears in 2+ components        | Extract shared hook immediately                    |
| Component has 5+ `useState` declarations   | Extract into focused hooks                         |

## Naming Convention

```
useTeamMembers       — fetches team member data
useFilteredEntries   — filters/sorts a list
usePagination        — generic pagination state
useDebounce          — generic debounced value
useLocalStorage      — generic storage with sync
```

## Context

- Hooks are the React way to share **stateful logic** — not components, not HOCs
- A hook should be **independently testable** via `renderHook`
- Prefer returning objects `{ data, loading, error }` over arrays for named destructuring
- Custom hooks can call other custom hooks — compose freely
- Don't over-extract: a single `useState` doesn't need its own hook
