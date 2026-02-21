import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'

export interface NavItem {
  value: string
  label: string
  icon: LucideIcon
  count?: number
}

interface SettingsNavProps {
  items: NavItem[]
  activeTab: string
  onTabChange: (tab: string) => void
}

export function SettingsNav({
  items,
  activeTab,
  onTabChange,
}: SettingsNavProps) {
  return (
    <nav className="flex flex-row md:flex-col gap-1 md:w-52 shrink-0">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.value
        return (
          <button
            key={item.value}
            onClick={() => onTabChange(item.value)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors text-left',
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
            {item.count !== undefined && item.count > 0 && (
              <Badge
                variant="secondary"
                className="ml-auto h-5 px-1.5 text-[10px] font-bold"
              >
                {item.count}
              </Badge>
            )}
          </button>
        )
      })}
    </nav>
  )
}
