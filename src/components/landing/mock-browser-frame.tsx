// Reusable mock browser chrome (macOS-style traffic lights) used in showcase cards
interface MockBrowserFrameProps {
  children: React.ReactNode;
  className?: string;
}

export function MockBrowserFrame({
  children,
  className,
}: MockBrowserFrameProps) {
  return (
    <div
      className={`group relative flex h-[450px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl ${className ?? ""}`}
    >
      {/* Subtle Pattern Background */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/amex-1.png')] bg-cover opacity-[0.03]" />

      {/* Traffic Light Header */}
      <div className="relative z-10 flex items-center justify-between border-border border-b bg-muted/30 p-3">
        <div className="flex gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>
      </div>

      {children}
    </div>
  );
}
