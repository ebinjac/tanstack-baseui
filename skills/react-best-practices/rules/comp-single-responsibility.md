# comp-single-responsibility: One Concern per Component

## Priority: CRITICAL

## Explanation

A component should do **one thing well**. When a component handles data fetching, business logic, AND rendering, it becomes untestable, unreusable, and hard to reason about. Split by concern: data components fetch, logic components transform, UI components render.

## Bad Example

```tsx
// 🛑 450+ line component doing EVERYTHING
function TeamDashboard({ teamId }: { teamId: string }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/api/teams/${teamId}`)
      .then(r => r.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [teamId])

  // 200 lines of filtering, sorting, pagination logic...
  // 100 lines of modal handling...
  // 150 lines of JSX with deeply nested conditionals...
}
```

## Good Example

```tsx
// ✅ Data layer — custom hook
function useTeamDashboard(teamId: string) {
  const query = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => getTeamData({ data: { teamId } }),
  })

  return query
}

// ✅ Feature component — orchestrates
function TeamDashboard({ teamId }: { teamId: string }) {
  const { data, isLoading, error } = useTeamDashboard(teamId)
  const [filter, setFilter] = useState("")

  if (isLoading) return <DashboardSkeleton />
  if (error) return <ErrorFallback error={error} />

  const filtered = data.items.filter(item =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <DashboardLayout>
      <SearchFilter value={filter} onChange={setFilter} />
      <TeamList items={filtered} />
    </DashboardLayout>
  )
}

// ✅ Presentational component — only renders
function TeamList({ items }: { items: TeamItem[] }) {
  return (
    <ul className="team-list">
      {items.map(item => (
        <TeamCard key={item.id} item={item} />
      ))}
    </ul>
  )
}
```

## Signs You Need to Split

- Component file exceeds **150 lines**
- More than **5 `useState` calls** in one component
- Deeply nested JSX (3+ levels of ternaries/conditionals)
- The component is hard to name — "DashboardWithFilterAndModal"
- You can't describe what it does in one sentence

## Context

- This is the **foundation** of all other React patterns
- Extract hooks first (logic), then components (UI)
- Components under 50 lines almost never need splitting
- "Container/Presentational" is a useful starting mental model
