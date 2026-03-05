/** Scorecard page skeleton — shown while getTeamById resolves */
export function ScorecardSkeleton() {
  return (
    <div className="min-h-screen flex-1 animate-pulse bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="mx-auto max-w-7xl space-y-8 p-8 pt-6">
        {/* Page header banner */}
        <div className="h-20 w-full rounded-2xl bg-primary/10" />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-8 py-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="space-y-3 py-2" key={`stat-${String(i)}`}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-muted/50" />
                <div className="h-3 w-20 rounded bg-muted/40" />
              </div>
              <div className="h-10 w-16 rounded bg-muted/50" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="overflow-hidden rounded-3xl border border-border/50">
          <div className="border-border/40 border-b px-6 py-4">
            <div className="h-6 w-48 rounded bg-muted/50" />
            <div className="mt-1 h-4 w-72 rounded bg-muted/30" />
          </div>
          <div className="divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                className="flex items-center gap-6 px-6 py-5"
                key={`row-${String(i)}`}
              >
                <div className="h-10 w-10 shrink-0 rounded-xl bg-muted/40" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-muted/50" />
                  <div className="h-3 w-32 rounded bg-muted/30" />
                </div>
                <div className="h-4 w-20 rounded bg-muted/40" />
                <div className="h-4 w-20 rounded bg-muted/40" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
