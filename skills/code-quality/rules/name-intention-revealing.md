# name-intention-revealing: Names Describe Purpose, Not Implementation

## Priority: HIGH

## Explanation

Good names eliminate the need for comments. A name should tell you **what** something does and **why** it exists, not **how** it works internally. You should be able to understand code by reading names alone, without diving into implementations.

## Bad Example

```tsx
// 🛑 Implementation-focused, cryptic names
const d = new Date()                      // What is d?
const arr = data.filter(x => x.a > 0)    // What is arr? What is a?
const flag = checkPerms(u, t)             // What flag? What perms?

function proc(items: Item[]) {            // proc what?
  const tmp = items.map(i => i.v * 2)    // What's tmp? What's v?
  const res = tmp.reduce((a, b) => a + b) // Generic accumulator name
  return res
}

// 🛑 Vague, generic names
const handleClick = () => { ... }         // Every button "handles a click"
const data = useQuery(...)                // data of what?
const info = getUserInfo()                // info is meaningless
const processData = (input: any) => ...   // process how? data of what?
```

## Good Example

```tsx
// ✅ Purpose-revealing names
const registrationDeadline = new Date("2025-03-01")
const activeApplications = applications.filter(app => app.status === "ACTIVE")
const isTeamAdmin = hasPermission(currentUser, team, "ADMIN")

function calculateWeightedScore(entries: ScorecardEntry[]): number {
  const weightedValues = entries.map(entry => entry.score * entry.weight)
  const totalScore = weightedValues.reduce((sum, value) => sum + value, 0)
  return totalScore
}

// ✅ Specific handler names
const handleRegistrationSubmit = () => { ... }
const handleMemberRemoval = (memberId: string) => { ... }

// ✅ Descriptive query results
const { data: teamMembers } = useQuery(...)
const { data: scorecardEntries } = useQuery(...)
```

## Naming Cheat Sheet

| Type | Convention | Examples |
|------|-----------|----------|
| **Booleans** | `is`/`has`/`can`/`should` prefix | `isLoading`, `hasPermission`, `canEdit`, `shouldAutoSave` |
| **Arrays** | Plural nouns | `teamMembers`, `scorecardEntries`, `activeLinks` |
| **Functions** | Verb + noun | `createTeam`, `deleteEntry`, `validateScore`, `fetchMembers` |
| **Event handlers** | `handle` + event | `handleSubmit`, `handleFilterChange`, `handleRowClick` |
| **Callbacks (props)** | `on` + event | `onSubmit`, `onChange`, `onRowClick`, `onDelete` |
| **Hooks** | `use` + purpose | `useTeamMembers`, `useScorecardFilters`, `useDebounce` |
| **Components** | Noun (PascalCase) | `TeamMemberCard`, `ScorecardFilterBar`, `LinkImportDialog` |
| **Constants** | UPPER_SNAKE or descriptive | `MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE`, `COOLDOWN_MINUTES` |
| **Types/Interfaces** | Noun (PascalCase) | `TeamMember`, `ScorecardEntry`, `LinkCategory` |

## Anti-Pattern Names to Avoid

| ❌ Avoid | ✅ Prefer |
|----------|----------|
| `data`, `info`, `item` | `teamData`, `memberInfo`, `scorecardEntry` |
| `temp`, `tmp`, `val` | Named by what it holds |
| `flag`, `status` | `isActive`, `registrationStatus` |
| `list`, `arr` | `teamMembers`, `pendingRequests` |
| `handle`, `process` | `handleMemberInvite`, `calculateScore` |
| `util`, `helper` | Name by what it does |
| `Manager`, `Processor` | More specific: `TeamService`, `ScoreCalculator` |

## Context

- Spend time on names — they're read **10x more than written**
- If you can't name something clearly, you may not understand its purpose yet
- Rename freely during refactoring — IDE tools make this safe
- Abbreviations are acceptable only for **universally known** terms: `id`, `url`, `api`, `db`, `config`
- Avoid single-letter variables except in very short lambdas: `.map(n => n * 2)` is okay
