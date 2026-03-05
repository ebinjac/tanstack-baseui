/** Generic full-page skeleton — used as the router's defaultPendingComponent */
export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-8">
      {/* Page header */}
      <div className="h-20 w-full rounded-2xl bg-muted/50" />
      {/* Content rows */}
      <div className="space-y-4">
        <div className="h-10 w-3/4 rounded-xl bg-muted/40" />
        <div className="h-10 w-1/2 rounded-xl bg-muted/30" />
        <div className="h-10 w-2/3 rounded-xl bg-muted/40" />
      </div>
      {/* Main card */}
      <div className="h-64 w-full rounded-2xl bg-muted/30" />
    </div>
  );
}
