# fx-avoid-effects: Prefer Event Handlers Over useEffect for User Actions

## Priority: HIGH

## Explanation

`useEffect` is for **synchronizing with external systems** (subscriptions, DOM manipulation, timers). It is NOT for responding to user events. When you use `useEffect` to react to state changes caused by a click/submit, you create unnecessary render cycles and harder-to-follow code.

**The rule**: If the action is triggered by the user (click, submit, change), handle it in the **event handler**, not in an effect.

## Bad Example

```tsx
// 🛑 useEffect responding to user action via state change
function CreateTeamForm() {
  const [teamName, setTeamName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)

  // User clicks submit → sets submitted → useEffect fires → calls API
  // This is a Rube Goldberg machine
  useEffect(() => {
    if (submitted) {
      createTeam({ data: { name: teamName } })
        .then(setResult)
        .finally(() => setSubmitted(false))
    }
  }, [submitted, teamName])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
      }}
    >
      <input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
      <button type="submit">Create</button>
    </form>
  )
}

// 🛑 useEffect to "sync" a value that changes on user input
function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    if (query) {
      searchItems({ data: { query } }).then(setResults)
    }
  }, [query])

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />
}
```

## Good Example

```tsx
// ✅ Direct event handler — no intermediate state
function CreateTeamForm() {
  const [teamName, setTeamName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await createTeam({ data: { name: teamName } })
    // Handle result directly
    toast.success(`Team "${result.name}" created`)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
      <button type="submit">Create</button>
    </form>
  )
}

// ✅ TanStack Query for search — handles caching, deduplication, loading
function SearchPage() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  const { data: results = [] } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchItems({ data: { query: debouncedQuery } }),
    enabled: debouncedQuery.length > 0,
  })

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />
}
```

## When useEffect IS Appropriate

| ✅ Use `useEffect` for   | ❌ Don't use `useEffect` for                        |
| ------------------------ | --------------------------------------------------- |
| WebSocket subscriptions  | Responding to button clicks                         |
| `document.title` sync    | Transforming data for rendering                     |
| `IntersectionObserver`   | Resetting state when props change (use key instead) |
| Third-party library init | Calling APIs triggered by user                      |
| Event listener cleanup   | "Chaining" state updates                            |

## The "Key" Reset Pattern

```tsx
// 🛑 Resetting form on prop change with useEffect
useEffect(() => {
  setFormData(initialData)
}, [initialData])

// ✅ Use React's key to reset — unmounts and remounts cleanly
<EditForm key={selectedItem.id} initialData={selectedItem} />
```

## Context

- `useEffect` runs **after** paint — user actions should feel **synchronous**
- Most `useEffect` + `setState` combos can be replaced with event handlers or derived state
- TanStack Query, mutations, and server functions handle async data without `useEffect`
- When you need effects, always return a cleanup function
