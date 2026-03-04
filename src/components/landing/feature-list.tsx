// Reusable feature bullet list used in showcase sections
interface Feature {
  desc: string;
  title: string;
}

interface FeatureListProps {
  features: Feature[];
  icon: React.ReactNode;
  iconClassName?: string;
}

export function FeatureList({
  features,
  icon,
  iconClassName,
}: FeatureListProps) {
  return (
    <ul className="space-y-4 pt-4">
      {features.map((feat) => (
        <li className="flex items-start gap-4" key={feat.title}>
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconClassName ?? "bg-primary/10 text-primary"}`}
          >
            {icon}
          </div>
          <div>
            <span className="font-bold text-foreground text-sm">
              {feat.title}
            </span>
            <p className="font-medium text-muted-foreground text-sm">
              {feat.desc}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
