# smell-long-files: Files Over 300 Lines Should Be Split

## Priority: HIGH

## Explanation

Long files are a **smell indicating too many responsibilities**. They're hard to navigate, slow to understand, and prone to merge conflicts. When a file crosses **300 lines**, critically evaluate whether it contains multiple concerns that should be separated.

## Decision Framework

### When to Split

| File Type | Split When | Split Into |
|-----------|-----------|------------|
| Component | >200 lines JSX, or >3 sections | Sub-components + hook |
| Server actions | >10 server functions | Domain-specific files |
| Hook | >100 lines, or multiple `useEffect`s | Composed smaller hooks |
| Utility file | >15 exported functions | Domain-grouped util files |
| Type file | >100 lines | Domain-specific type files |

### Where to Split

```
# 🛑 Before: one massive actions file
src/app/actions/
  api.ts              # 1200 lines — teams, members, scores, links...

# ✅ After: domain-focused files
src/app/actions/
  teams.ts            # 150 lines — CRUD for teams
  applications.ts     # 120 lines — app management
  scorecard.ts        # 200 lines — scoring operations
  links.ts            # 180 lines — link management
  turnover.ts         # 250 lines — turnover tracking
```

## Bad Example: Monolithic Component

```tsx
// 🛑 scorecard-page.tsx — 800 lines
function ScorecardPage() {
  // 50 lines of hooks and state
  // 100 lines of event handlers
  // 50 lines of utility functions
  // 600 lines of JSX with inline conditionals

  return (
    <div>
      {/* Header section — 80 lines */}
      {/* Filter bar — 60 lines */}
      {/* Data table — 200 lines */}
      {/* Modal dialogs — 150 lines */}
      {/* Chart visualization — 110 lines */}
    </div>
  )
}
```

## Good Example: Split by Concern

```tsx
// ✅ scorecard-page.tsx — 40 lines (orchestrator)
function ScorecardPage() {
  const { teamId } = useParams()
  const scorecard = useScorecardData(teamId)
  const filters = useScorecardFilters()

  return (
    <ScorecardLayout>
      <ScorecardHeader teamId={teamId} />
      <ScorecardFilters {...filters} />
      <ScorecardTable
        entries={scorecard.filtered}
        onEdit={scorecard.editEntry}
      />
      <ScorecardCharts data={scorecard.chartData} />
    </ScorecardLayout>
  )
}

// ✅ hooks/use-scorecard-data.ts — focused data hook
// ✅ components/scorecard-header.tsx — 50 lines
// ✅ components/scorecard-filters.tsx — 60 lines
// ✅ components/scorecard-table.tsx — 120 lines
// ✅ components/scorecard-charts.tsx — 80 lines
```

## File Size Guidelines

| Lines | Status | Action |
|-------|--------|--------|
| <150 | ✅ Healthy | No action needed |
| 150-300 | ⚠️ Watch | Consider splitting if adding more |
| 300-500 | 🟡 Split soon | Actively plan extraction |
| 500+ | 🔴 Split now | This is an active maintenance risk |

## What NOT to Split

- Files that are **cohesive** — all exports serve one purpose
- Type definition files that define a complete domain model
- Test files that cover a complex component (keep tests co-located)
- Generated files (schemas, route trees)

## Context

- File length is a **heuristic**, not a hard rule — cohesion matters more than line count
- Split by **domain concern** first, then by **technical layer** (hook vs component)
- A file with 10 small, related utility functions is fine at 250 lines
- A file with 2 unrelated features should be split even at 150 lines
