# tsx-no-any: Never Use `any` — Prefer `unknown`, Generics, or Specific Types

## Priority: CRITICAL

## Explanation

`any` disables TypeScript's entire type system for that value and everything it touches. It silently propagates, creating a web of untyped code. In a React codebase this leads to prop mismatches, runtime crashes, and impossible-to-refactor components.

Every `any` should be replaced with:
- **`unknown`** — when the type is truly opaque (then narrow with type guards)
- **Specific types** — when you know the shape
- **Generics** — when the type varies by caller

## Bad Example

```tsx
// 🛑 any everywhere
function DataTable({ data, columns, onRowClick }: {
  data: any[]
  columns: any[]
  onRowClick: (row: any) => void
}) {
  return (
    <table>
      {data.map((row: any, i: number) => (
        <tr key={i} onClick={() => onRowClick(row)}>
          {columns.map((col: any) => (
            <td key={col.key}>{row[col.key]}</td>
          ))}
        </tr>
      ))}
    </table>
  )
}

// 🛑 any in catch blocks
try {
  await submitForm(data)
} catch (error: any) {
  setError(error.message)    // Runtime crash if error is not an Error
}

// 🛑 any in event handlers
const handleChange = (e: any) => {
  setFormData({ ...formData, [e.target.name]: e.target.value })
}
```

## Good Example

```tsx
// ✅ Generic component — type flows from caller
interface Column<T> {
  key: keyof T & string
  header: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

interface DataTableProps<T extends Record<string, unknown>> {
  data: T[]
  columns: Column<T>[]
  onRowClick: (row: T) => void
}

function DataTable<T extends Record<string, unknown>>({
  data, columns, onRowClick,
}: DataTableProps<T>) {
  return (
    <table>
      {data.map((row, i) => (
        <tr key={i} onClick={() => onRowClick(row)}>
          {columns.map(col => (
            <td key={col.key}>
              {col.render ? col.render(row[col.key], row) : String(row[col.key])}
            </td>
          ))}
        </tr>
      ))}
    </table>
  )
}

// Usage — types inferred from data
<DataTable
  data={teamMembers}           // TeamMember[]
  columns={[
    { key: "name", header: "Name" },
    { key: "role", header: "Role" },
  ]}
  onRowClick={(member) => navigate(`/members/${member.id}`)}
/>

// ✅ unknown + type narrowing in catch
try {
  await submitForm(data)
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Something went wrong"
  setError(message)
}

// ✅ Typed event handlers
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
}
```

## Common Replacements

| Instead of `any` | Use |
|---|---|
| `error: any` | `error: unknown` + `instanceof Error` check |
| `data: any` | Define an interface or use a Zod schema's inferred type |
| `event: any` | `React.ChangeEvent<HTMLInputElement>`, `React.MouseEvent<HTMLButtonElement>` |
| `props: any` | Define a `Props` interface |
| `record: any` | `Record<string, unknown>` or a specific record type |
| `callback: any` | `(...args: unknown[]) => void` or specific signature |
| `ref: any` | `React.RefObject<HTMLDivElement>` |

## Context

- Enable `"strict": true` and `"noImplicitAny": true` in `tsconfig.json`
- Prefer `unknown` over `any` — it forces you to narrow before using
- Zod's `z.infer<typeof Schema>` is excellent for deriving types from schemas
- Generic components (`<T>`) provide flexibility without sacrificing type safety
- The `satisfies` operator can replace many `as` casts
