# fn-small-focused: Functions Under 30 Lines, One Level of Abstraction

## Priority: HIGH

## Explanation

Long functions are hard to read, test, and modify. A function should operate at **one level of abstraction** — either it orchestrates high-level steps, or it implements a low-level detail, never both. If a function exceeds **30 lines** or you need to scroll to understand it, it should be split.

## Bad Example

```tsx
// 🛑 150-line function mixing orchestration with implementation
async function processScorecard(teamId: string, entries: ScorecardEntry[]) {
  // 1. Validate all entries (15 lines of validation logic)
  for (const entry of entries) {
    if (!entry.metricId) throw new Error('Missing metric')
    if (entry.score < 0 || entry.score > 100)
      throw new Error('Score out of range')
    if (entry.notes && entry.notes.length > 500)
      throw new Error('Notes too long')
    // ... more validation
  }

  // 2. Calculate aggregates (20 lines of math)
  let totalScore = 0
  let weightedSum = 0
  let totalWeight = 0
  for (const entry of entries) {
    const metric = await db.query.metrics.findFirst({
      where: eq(metrics.id, entry.metricId),
    })
    if (!metric) continue
    const weight = metric.weight ?? 1
    weightedSum += entry.score * weight
    totalWeight += weight
    // ... more calculations
  }
  const averageScore = totalWeight > 0 ? weightedSum / totalWeight : 0

  // 3. Persist to database (20 lines of DB operations)
  await db.transaction(async (tx) => {
    for (const entry of entries) {
      await tx.insert(scorecardEntries).values({
        teamId,
        metricId: entry.metricId,
        score: entry.score,
        notes: entry.notes,
        // ... more fields
      })
    }
    await tx.update(teams).set({ lastScorecardScore: averageScore })
  })

  // 4. Send notifications (15 lines of notification logic)
  // ... continues for 100+ more lines
}
```

## Good Example

```tsx
// ✅ Orchestrator — reads like a high-level recipe
async function processScorecard(teamId: string, entries: ScorecardEntry[]) {
  validateEntries(entries)
  const aggregates = await calculateAggregates(entries)
  await persistScorecard(teamId, entries, aggregates)
  await notifyTeam(teamId, aggregates)
}

// ✅ Each step is focused and independently testable
function validateEntries(entries: ScorecardEntry[]) {
  for (const entry of entries) {
    if (!entry.metricId) throw new Error('Missing metric ID')
    if (entry.score < 0 || entry.score > 100) {
      throw new Error(`Score ${entry.score} out of range [0, 100]`)
    }
  }
}

async function calculateAggregates(entries: ScorecardEntry[]) {
  const metrics = await fetchMetrics(entries.map((e) => e.metricId))
  return computeWeightedAverage(entries, metrics)
}

function computeWeightedAverage(
  entries: ScorecardEntry[],
  metrics: Map<string, Metric>,
): ScorecardAggregates {
  let weightedSum = 0
  let totalWeight = 0

  for (const entry of entries) {
    const weight = metrics.get(entry.metricId)?.weight ?? 1
    weightedSum += entry.score * weight
    totalWeight += weight
  }

  return {
    averageScore: totalWeight > 0 ? weightedSum / totalWeight : 0,
    entryCount: entries.length,
    totalWeight,
  }
}
```

## The "Newspaper" Rule

Read the code like a newspaper article:

1. **Headline** = function name (tells you what it does)
2. **Lead paragraph** = function body (high-level steps)
3. **Details** = helper functions (implementation details)

A reader should understand the **intent** from the top-level function without reading every helper.

## Extraction Signals

| Signal                           | Action                        |
| -------------------------------- | ----------------------------- |
| Comment like `// Step 1: ...`    | Extract into a named function |
| Blank line separating "sections" | Each section → own function   |
| Deeply nested `if`/`for` blocks  | Extract the inner block       |
| Same operation on different data | Extract a generic utility     |
| Function name needs "And"        | Split into two functions      |

## Context

- Functions should fit on **one screen** (~30 lines)
- Each function should be at **one level of abstraction**
- Prefer many small, well-named functions over comments explaining a long one
- Pure helper functions are easy to test, memoize, and parallelize
- This rule applies equally to React components — extract render functions or child components
