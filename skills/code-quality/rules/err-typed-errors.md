# err-typed-errors: Use `unknown` in Catch, Narrow with `instanceof`

## Priority: CRITICAL

## Explanation

TypeScript's `catch` clause variable is `unknown` by default (with `useUnknownInCatchVariables: true`). Never use `any` — it defeats type safety. Always narrow the error type before accessing properties.

## Bad Example

```tsx
// 🛑 any in catch — runtime crash if error isn't an Error object
try {
  await createTeam({ data: formData })
} catch (error: any) {
  setErrorMessage(error.message) // 💥 Crash if error is a string
  console.error(error.stack) // 💥 Crash if error is a number
  sendToSentry(error.code) // 💥 .code doesn't exist on Error
}

// 🛑 Assuming error shape without checking
try {
  const response = await fetch('/api/data')
  const json = await response.json()
} catch (err: any) {
  if (err.status === 404) {
    // 💥 fetch errors don't have .status
    showNotFound()
  }
}
```

## Good Example

```tsx
// ✅ unknown + instanceof narrowing
try {
  await createTeam({ data: formData })
} catch (error: unknown) {
  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred'

  setErrorMessage(message)
  console.error('Team creation failed:', error)
}

// ✅ Multiple error type checks
try {
  await submitForm(data)
} catch (error: unknown) {
  if (error instanceof ZodError) {
    // Validation errors — show field-level feedback
    setFieldErrors(error.flatten().fieldErrors)
  } else if (error instanceof AuthError) {
    // Auth errors — redirect to login
    navigate({ to: '/login' })
  } else if (error instanceof Error) {
    // Generic errors — show message
    toast.error(error.message)
  } else {
    // Unknown shape — safe fallback
    toast.error('Something went wrong. Please try again.')
  }
}
```

## Utility: Type-Safe Error Extraction

```tsx
// ✅ Reusable error message extractor
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as Record<string, unknown>).message as string
  }
  return 'An unexpected error occurred'
}

// Usage
try {
  await saveData(payload)
} catch (error: unknown) {
  toast.error(getErrorMessage(error))
}
```

## Server Function Pattern

```tsx
// ✅ In server functions — log details, throw clean errors
export const updateTeam = createServerFn({ method: 'POST' })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => UpdateTeamSchema.parse(data))
  .handler(async ({ data, context }) => {
    try {
      const [updated] = await db
        .update(teams)
        .set({ name: data.name })
        .where(eq(teams.id, data.teamId))
        .returning()
      return { success: true, team: updated }
    } catch (error: unknown) {
      console.error('Failed to update team:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to update team: ${message}`)
    }
  })
```

## Context

- Enable `"useUnknownInCatchVariables": true` in `tsconfig.json` (included in `strict: true`)
- `unknown` is the **type-safe** version of `any` — forces narrowing before use
- JavaScript can throw **anything**: strings, numbers, objects, `undefined`
- Libraries may throw non-Error objects (e.g., Axios throws objects with `.response`)
- Always provide a user-facing fallback message for truly unknown errors
