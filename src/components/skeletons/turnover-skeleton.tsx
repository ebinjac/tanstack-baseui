/** Turnover page skeleton — shown while applications/groups resolve */
export function TurnoverSkeleton() {
  return (
    <div className="animate-pulse space-y-8 p-8">
      {/* Page header */}
      <div className="h-20 w-full rounded-2xl bg-primary/10" />

      {/* Application tabs bar */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            className="h-9 w-24 rounded-lg bg-muted/50"
            key={`tab-${String(i)}`}
          />
        ))}
      </div>

      {/* Section grid — 2 columns */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            className="overflow-hidden rounded-2xl border border-border"
            key={`section-${String(i)}`}
          >
            {/* Section header */}
            <div className="flex items-center justify-between border-border border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted/50" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 rounded bg-muted/50" />
                  <div className="h-2.5 w-20 rounded bg-muted/30" />
                </div>
              </div>
              <div className="h-7 w-20 rounded-full bg-muted/40" />
            </div>
            {/* Entry rows */}
            <div className="space-y-2 p-4">
              {Array.from({ length: 2 }).map((_, j) => (
                <div
                  className="h-16 rounded-xl bg-muted/30"
                  key={`entry-${String(j)}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
