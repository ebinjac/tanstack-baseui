// Reusable pill badge used in section headers across the landing page
interface SectionBadgeProps {
  label: string;
}

export function SectionBadge({ label }: SectionBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 shadow-sm">
      <span className="font-bold text-primary text-xs uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}
