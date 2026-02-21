# perf-stable-references: Stabilize References Passed to Children

## Priority: HIGH

## Explanation

Every re-render creates **new references** for inline functions and objects. When these are passed as props to memoized children or added to dependency arrays, they cause unnecessary re-renders or infinite effect loops. Use `useCallback` for functions and `useMemo` for objects that are **passed to child components** or used in **dependency arrays**.

**Important**: Don't memoize everything. Only stabilize references when:

1. The value is passed to a child wrapped in `React.memo`
2. The value is in a `useEffect`/`useMemo`/`useCallback` dependency array
3. The value is passed to a context provider

## Bad Example

```tsx
// 🛑 New function + object created every render
function ParentComponent({ teamId }: { teamId: string }) {
  const [count, setCount] = useState(0)

  // New function on every render → MemoizedChild re-renders unnecessarily
  const handleClick = (id: string) => {
    console.log('clicked', id)
  }

  // New object on every render → context consumers all re-render
  const contextValue = { teamId, handleClick }

  return (
    <TeamContext.Provider value={contextValue}>
      <MemoizedChild onClick={handleClick} />
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
    </TeamContext.Provider>
  )
}
```

## Good Example

```tsx
// ✅ Stable references — children don't re-render needlessly
function ParentComponent({ teamId }: { teamId: string }) {
  const [count, setCount] = useState(0)

  const handleClick = useCallback((id: string) => {
    console.log('clicked', id)
  }, [])

  const contextValue = useMemo(
    () => ({ teamId, handleClick }),
    [teamId, handleClick],
  )

  return (
    <TeamContext.Provider value={contextValue}>
      <MemoizedChild onClick={handleClick} />
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
    </TeamContext.Provider>
  )
}

const MemoizedChild = React.memo(function Child({
  onClick,
}: {
  onClick: (id: string) => void
}) {
  console.log('Child rendered') // Only logs once now
  return <button onClick={() => onClick('123')}>Click me</button>
})
```

## When NOT to Memoize

```tsx
// ✅ No memo needed — handler only used in this component's own JSX
function SimpleButton() {
  const [count, setCount] = useState(0)

  // This is fine inline — no children depend on this reference
  return <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
}
```

## Decision Table

| Scenario                               | Memoize?                   |
| -------------------------------------- | -------------------------- |
| Function passed to `React.memo` child  | ✅ `useCallback`           |
| Object passed to Context Provider      | ✅ `useMemo`               |
| Value in `useEffect` dependency array  | ✅ `useMemo`/`useCallback` |
| Inline handler on own JSX element      | ❌ Not needed              |
| Object only used within same component | ❌ Not needed              |

## Context

- `React.memo` on a child is useless if parent passes unstable props
- `useMemo`/`useCallback` are **not free** — they add code complexity and memory
- Profile with React DevTools Profiler before memoizing
- The React compiler (React 19+) will eventually auto-memoize, reducing need for manual `useCallback`/`useMemo`
