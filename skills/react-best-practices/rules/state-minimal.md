# state-minimal: Derive Values Instead of Storing Redundant State

## Priority: HIGH

## Explanation

Redundant state causes **sync bugs** — when you store a value that could be computed from existing state, you must remember to update it whenever the source changes. Instead, **derive** values inline or with `useMemo`. Store only the **minimal** data needed.

## Bad Example

```tsx
// 🛑 Redundant state — `filteredItems` and `itemCount` can be derived
function ItemList({ items }: { items: Item[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredItems, setFilteredItems] = useState(items)
  const [itemCount, setItemCount] = useState(items.length)
  const [isEmpty, setIsEmpty] = useState(items.length === 0)

  useEffect(() => {
    const result = items.filter(i =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredItems(result)
    setItemCount(result.length)
    setIsEmpty(result.length === 0)
  }, [items, searchTerm])

  return (
    <>
      <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      <p>{itemCount} items</p>
      {isEmpty ? <EmptyState /> : <List items={filteredItems} />}
    </>
  )
}
```

## Good Example

```tsx
// ✅ Only store the input — derive everything else
function ItemList({ items }: { items: Item[] }) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredItems = useMemo(
    () => items.filter(i =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [items, searchTerm]
  )

  return (
    <>
      <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      <p>{filteredItems.length} items</p>
      {filteredItems.length === 0 ? <EmptyState /> : <List items={filteredItems} />}
    </>
  )
}
```

## Decision Framework

Ask: **"Can I calculate this from other state or props?"**

| If yes | Derive it (inline or `useMemo`) |
|--------|------|
| If no | Store it in `useState` |

Examples of derived values:
- `filteredList` → derive from `list` + `filter`
- `totalPrice` → derive from `cartItems`
- `isValid` → derive from `formFields`
- `fullName` → derive from `firstName` + `lastName`

## When to Use `useMemo`

- The derivation is **expensive** (O(n) filter, sort, reduce on large arrays)
- The result is passed as props to memoized children
- For **cheap** derivations (boolean checks, string concat), compute inline

## Context

- Every extra `useState` is a potential sync bug
- `useEffect` to sync state with other state is a strong code smell
- If you find yourself writing `useEffect` + `setState`, ask if you can derive instead
- TanStack Query's `select` option is the server-state equivalent of derivation
