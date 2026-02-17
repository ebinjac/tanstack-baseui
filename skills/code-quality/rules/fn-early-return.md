# fn-early-return: Guard Clauses First, Happy Path Unindented

## Priority: HIGH

## Explanation

Deeply nested code is hard to follow. **Guard clauses** (early returns) eliminate invalid cases at the top of the function, leaving the "happy path" — the main logic — at the base indentation level. This dramatically improves readability and reduces cognitive load.

## Bad Example

```tsx
// 🛑 Arrow code — nested conditionals create "pyramid of doom"
async function handleTeamAction(session: SessionData | null, teamId: string, action: string) {
  if (session) {
    if (session.user.email) {
      const permission = session.user.permissions.find(p => p.teamId === teamId)
      if (permission) {
        if (permission.role === "ADMIN") {
          if (action === "delete") {
            const team = await getTeam(teamId)
            if (team) {
              if (team.memberCount === 0) {
                await deleteTeam(teamId)
                return { success: true }
              } else {
                throw new Error("Team has members")
              }
            } else {
              throw new Error("Team not found")
            }
          } else {
            throw new Error("Unknown action")
          }
        } else {
          throw new Error("Not an admin")
        }
      } else {
        throw new Error("No permission for team")
      }
    } else {
      throw new Error("No email")
    }
  } else {
    throw new Error("Not authenticated")
  }
}
```

## Good Example

```tsx
// ✅ Guard clauses — flat, readable, each check is obvious
async function handleTeamAction(session: SessionData | null, teamId: string, action: string) {
  if (!session) throw new Error("Not authenticated")
  if (!session.user.email) throw new Error("No email")

  const permission = session.user.permissions.find(p => p.teamId === teamId)
  if (!permission) throw new Error("No permission for team")
  if (permission.role !== "ADMIN") throw new Error("Not an admin")
  if (action !== "delete") throw new Error("Unknown action")

  const team = await getTeam(teamId)
  if (!team) throw new Error("Team not found")
  if (team.memberCount > 0) throw new Error("Team has members")

  await deleteTeam(teamId)
  return { success: true }
}
```

## Pattern in React Components

```tsx
// 🛑 Nested rendering conditionals
function TeamPage({ teamId }: { teamId: string }) {
  const { data, isLoading, error } = useTeamData(teamId)

  return (
    <div>
      {isLoading ? (
        <Skeleton />
      ) : error ? (
        <ErrorMessage error={error} />
      ) : data ? (
        data.members.length > 0 ? (
          <MemberList members={data.members} />
        ) : (
          <EmptyState />
        )
      ) : null}
    </div>
  )
}

// ✅ Early returns — each state is clear
function TeamPage({ teamId }: { teamId: string }) {
  const { data, isLoading, error } = useTeamData(teamId)

  if (isLoading) return <Skeleton />
  if (error) return <ErrorMessage error={error} />
  if (!data) return null
  if (data.members.length === 0) return <EmptyState />

  return <MemberList members={data.members} />
}
```

## Rules

1. **Check the abnormal first** — validate, reject, and return
2. **One condition per guard** — don't combine unrelated checks
3. **Specific error messages** — each guard should state exactly what's wrong
4. **Happy path at base indentation** — the main logic should never be inside `if/else`

## Context

- Guard clauses reduce maximum indentation from 5-8 levels to 1-2
- Each guard is a documented precondition — readable without comments
- In server functions, guards naturally map to HTTP error responses
- In components, early returns map to loading/error/empty states
- This pattern works especially well with TypeScript's type narrowing
