import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface NavItem {
  count?: number;
  icon: LucideIcon;
  label: string;
  value: string;
}

interface SettingsNavProps {
  activeTab: string;
  items: NavItem[];
  onTabChange: (tab: string) => void;
}

export function SettingsNav({
  items,
  activeTab,
  onTabChange,
}: SettingsNavProps) {
  return (
    <nav className="flex shrink-0 flex-row gap-1 md:w-52 md:flex-col">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.value;
        return (
          <button
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-left font-medium text-sm transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            key={item.value}
            onClick={() => onTabChange(item.value)}
            type="button"
          >
            <Icon className="h-4 w-4" />
            {item.label}
            {item.count !== undefined && item.count > 0 && (
              <Badge
                className="ml-auto h-5 px-1.5 font-bold text-[10px]"
                variant="secondary"
              >
                {item.count}
              </Badge>
            )}
          </button>
        );
      })}
    </nav>
  );
}
