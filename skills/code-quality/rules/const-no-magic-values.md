# const-no-magic-values: Extract Magic Numbers and Strings into Named Constants

## Priority: MEDIUM

## Explanation

Magic values — unexplained numbers and strings scattered through code — make the code **unreadable** and **error-prone**. When the same value appears in multiple places, a change requires finding every occurrence. Named constants document their purpose and provide a single source of truth.

## Bad Example

```tsx
// 🛑 What do these numbers mean?
if (entries.length > 50) {
  setShowPagination(true)
}

const cooldownMs = Date.now() - 18000000  // What is 18000000?

if (score >= 85) {
  setBadge("gold")
} else if (score >= 70) {
  setBadge("silver")
}

// 🛑 Scattered string literals
if (permission.role === "ADMIN") { ... }
if (status === "PENDING_REVIEW") { ... }
toast.error("Failed to save changes. Please try again.")
```

## Good Example

```tsx
// ✅ Named constants with clear purpose
const PAGINATION_THRESHOLD = 50
const COOLDOWN_HOURS = 5
const COOLDOWN_MS = COOLDOWN_HOURS * 60 * 60 * 1000

const SCORE_THRESHOLDS = {
  GOLD: 85,
  SILVER: 70,
} as const

// ✅ Usage is self-documenting
if (entries.length > PAGINATION_THRESHOLD) {
  setShowPagination(true)
}

const cooldownStart = Date.now() - COOLDOWN_MS

if (score >= SCORE_THRESHOLDS.GOLD) {
  setBadge('gold')
} else if (score >= SCORE_THRESHOLDS.SILVER) {
  setBadge('silver')
}

// ✅ String constants as typed objects
const ROLES = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const

type Role = (typeof ROLES)[keyof typeof ROLES]

const STATUS = {
  PENDING: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

const ERROR_MESSAGES = {
  SAVE_FAILED: 'Failed to save changes. Please try again.',
  UNAUTHORIZED: "You don't have permission to perform this action.",
  NOT_FOUND: 'The requested resource was not found.',
} as const
```

## Where to Define Constants

| Scope                 | Location                                     |
| --------------------- | -------------------------------------------- |
| Used in one file      | Top of the file, before component            |
| Used across a feature | Feature-level `constants.ts`                 |
| Used project-wide     | `src/lib/constants.ts`                       |
| Configuration values  | `src/lib/config.ts` or environment variables |

## Values That Are NOT Magic

These are fine inline:

- `0`, `1`, `-1` in array operations (`.slice(0, 1)`, `index + 1`)
- Empty strings `""` for initialization
- Boolean literals `true`/`false`
- CSS values in component styling

## Context

- Named constants make code **searchable** — `COOLDOWN_MS` is easier to find than `18000000`
- Use `as const` for string constants to get **literal type inference**
- Prefer typed constant objects over TypeScript `enum` — they're more flexible and tree-shakeable
- Configuration values that change per environment should be in env vars, not constants
