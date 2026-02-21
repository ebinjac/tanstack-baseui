# err-boundaries: Wrap Feature Areas with Error Boundaries

## Priority: MEDIUM

## Explanation

Unhandled errors in React components crash the **entire app**. Error boundaries catch rendering errors in their subtree and display a fallback UI instead of a blank screen. Place them around **feature areas** — not around every component, and not just at the root.

## Bad Example

```tsx
// 🛑 Only root-level error boundary — one error crashes everything
function App() {
  return (
    <ErrorBoundary>
      <Header />
      <Sidebar />
      <MainContent /> {/* Error here kills sidebar + header too */}
      <Footer />
    </ErrorBoundary>
  )
}

// 🛑 No error boundary at all — white screen of death
function App() {
  return (
    <>
      <Header />
      <MainContent />
      <Footer />
    </>
  )
}
```

## Good Example

```tsx
// ✅ Error boundaries around feature areas
function DashboardPage() {
  return (
    <div className="dashboard">
      <Header />
      <div className="dashboard-grid">
        <ErrorBoundary fallback={<WidgetError title="Scorecard" />}>
          <ScorecardWidget />
        </ErrorBoundary>

        <ErrorBoundary fallback={<WidgetError title="Team Activity" />}>
          <ActivityWidget />
        </ErrorBoundary>

        <ErrorBoundary fallback={<WidgetError title="Links" />}>
          <LinksWidget />
        </ErrorBoundary>
      </div>
    </div>
  )
}

// ✅ Reusable error fallback
function WidgetError({ title }: { title: string }) {
  return (
    <div className="widget-error" role="alert">
      <AlertCircle className="icon" />
      <p>Failed to load {title}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  )
}
```

## Good Example: Error Boundary with Reset

```tsx
// ✅ Error boundary that can retry
import { ErrorBoundary } from 'react-error-boundary'

function FeatureSection({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div role="alert" className="error-panel">
          <h3>Something went wrong</h3>
          <pre>{error.message}</pre>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
      onReset={() => {
        // Clear any stale state that caused the error
        queryClient.invalidateQueries()
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

## Placement Strategy

| Level   | What to Wrap           | Why                                         |
| ------- | ---------------------- | ------------------------------------------- |
| Root    | Entire `<App />`       | Last resort — shows "app crashed" UI        |
| Route   | Each route's content   | One route failing doesn't affect navigation |
| Feature | Widgets, panels, cards | One widget failing doesn't affect others    |
| Dynamic | User-generated content | Malformed data doesn't crash the page       |

## What Error Boundaries DON'T Catch

- Event handlers (use try/catch)
- Async code / promises (use `.catch()` or TanStack Query error handling)
- Server-side rendering (use route-level error handling)
- Errors in the error boundary itself

## Context

- Use `react-error-boundary` package for production — it adds reset, retry, and logging
- Combine with TanStack Query's `useErrorBoundary` option for fetch errors
- Error boundaries are React components — they must be class components or use the `react-error-boundary` wrapper
- Log errors to a monitoring service (Sentry, etc.) in the `onError` callback
