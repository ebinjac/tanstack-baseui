export function EnterpriseScorecardSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8 lg:flex-row">
      {/* Sidebar Skeleton */}
      <div className="w-full shrink-0 animate-pulse space-y-8 lg:w-72">
        <div className="space-y-4">
          <div className="h-3 w-16 rounded bg-muted/60" />
          <div className="h-10 w-full rounded-md bg-muted/30" />
        </div>
        <div className="space-y-4">
          <div className="h-3 w-24 rounded bg-muted/60" />
          <div className="h-10 w-full rounded-md bg-muted/30" />
        </div>
        <div className="space-y-4">
          <div className="h-3 w-20 rounded bg-muted/60" />
          <div className="h-10 w-full rounded-md bg-muted/30" />
        </div>

        <div className="my-6 h-px w-full bg-border/40" />

        <div className="space-y-4">
          <div className="h-3 w-28 rounded bg-muted/60" />
          <div className="h-10 w-full rounded-md bg-muted/30" />
        </div>
        <div className="space-y-4">
          <div className="h-3 w-24 rounded bg-muted/60" />
          <div className="h-10 w-full rounded-md bg-muted/30" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="w-full max-w-[calc(100vw-48px)] flex-1 animate-pulse space-y-8 lg:max-w-none">
        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-2 gap-8 py-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div className="flex flex-col py-2" key={i}>
              <div className="mb-3 flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-muted/40" />
                <div className="h-3 w-20 rounded bg-muted/40" />
              </div>
              <div className="mt-1 h-10 w-24 rounded bg-muted/20" />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid gap-8 py-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div className="flex flex-col py-2" key={i}>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-muted/40" />
                <div className="h-4 w-32 rounded bg-muted/40" />
              </div>
              <div className="mt-2 h-[180px] w-full rounded-lg bg-muted/10" />
            </div>
          ))}
        </div>

        {/* List/Heatmap Skeleton */}
        <div className="space-y-6 border-border/20 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 rounded bg-muted/40" />
            <div className="h-8 w-32 rounded-lg bg-muted/20" />
          </div>
          <div className="w-full space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                className="h-16 w-full rounded-lg border border-border/10 bg-muted/5"
                key={i}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
