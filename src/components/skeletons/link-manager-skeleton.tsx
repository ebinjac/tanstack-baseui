/** Link Manager page skeleton — shown while links/categories/apps resolve */
export function LinkManagerSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-8">
      {/* Page header */}
      <div className="h-20 w-full rounded-2xl bg-primary/10" />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            className="flex items-center gap-3 rounded-2xl border border-border p-4"
            key={`stat-${String(i)}`}
          >
            <div className="h-10 w-10 rounded-xl bg-muted/50" />
            <div className="space-y-1.5">
              <div className="h-5 w-8 rounded bg-muted/50" />
              <div className="h-2.5 w-20 rounded bg-muted/30" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="h-12 w-full rounded-xl bg-muted/40" />

      {/* Link cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            className="space-y-3 rounded-2xl border border-border p-5"
            key={`card-${String(i)}`}
          >
            <div className="h-3 w-24 rounded bg-muted/40" />
            <div className="h-5 w-3/4 rounded bg-muted/50" />
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-muted/30" />
              <div className="h-3 w-4/5 rounded bg-muted/30" />
            </div>
            <div className="flex gap-2 pt-1">
              <div className="h-5 w-14 rounded-md bg-muted/40" />
            </div>
            <div className="border-border border-t pt-3">
              <div className="h-8 w-full rounded-lg bg-muted/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
