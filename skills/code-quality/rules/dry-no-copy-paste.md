# dry-no-copy-paste: Extract Duplicated Blocks into Functions or Hooks

## Priority: CRITICAL

## Explanation

Copy-pasted code is the **#1 source of maintenance bugs**. When logic exists in multiple places, a fix in one location is silently missed in others. The Rule of Three: if you see the same pattern **three times**, extract it. For **critical logic** (auth checks, validation), extract on the **second** occurrence.

## Bad Example

```tsx
// 🛑 Same auth + permission check copy-pasted across 10 server functions
export const getTeamData = createServerFn({ method: 'GET' }).handler(
  async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')
    const userEmail = session.user.email
    if (!userEmail) throw new Error('Email required')
    const permission = session.user.permissions.find(
      (p) => p.teamId === data.teamId,
    )
    if (!permission || permission.role !== 'ADMIN')
      throw new Error('Not authorized')
    // ... actual logic
  },
)

export const updateTeamSettings = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')
    const userEmail = session.user.email
    if (!userEmail) throw new Error('Email required')
    const permission = session.user.permissions.find(
      (p) => p.teamId === data.teamId,
    )
    if (!permission || permission.role !== 'ADMIN')
      throw new Error('Not authorized')
    // ... actual logic (same 7 lines of auth copied!)
  },
)
```

## Good Example

```tsx
// ✅ Auth logic extracted into reusable middleware
import { requireAuth, assertTeamAdmin } from '@/lib/middleware/auth.middleware'

export const getTeamData = createServerFn({ method: 'GET' })
  .middleware([requireAuth])
  .handler(async ({ data, context }) => {
    assertTeamAdmin(context.session, data.teamId)
    // ... actual logic uses context.userEmail
  })

export const updateTeamSettings = createServerFn({ method: 'POST' })
  .middleware([requireAuth])
  .handler(async ({ data, context }) => {
    assertTeamAdmin(context.session, data.teamId)
    // ... actual logic
  })
```

## Good Example: UI Patterns

```tsx
// 🛑 Same card layout repeated 5 times with slight variations
;<div className="rounded-lg border p-4 shadow">
  <h3 className="text-lg font-semibold">{title}</h3>
  <p className="text-muted-foreground">{description}</p>
  {children}
</div>

// ✅ Extract a shared UI component
function FeatureCard({ title, description, children }: FeatureCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
```

## What to Extract

| Duplication Type        | Extract Into                          |
| ----------------------- | ------------------------------------- |
| Auth/permission checks  | Middleware functions                  |
| Data fetching + state   | Custom hooks (`useXxx`)               |
| UI layout patterns      | Shared components                     |
| Validation logic        | Zod schemas + utility functions       |
| Error handling patterns | Utility functions or error boundaries |
| API call patterns       | Typed helper functions                |

## Context

- **Premature abstraction** is also harmful — wait for the pattern to emerge 2-3 times
- DRY applies to **knowledge**, not just code — two identical lines that serve different purposes can stay separate
- Create abstractions that are **easy to delete** — better a small utility than a sprawling framework
- When extracting hooks, ensure they have a **clear, single responsibility**
