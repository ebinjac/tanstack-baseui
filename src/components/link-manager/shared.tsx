import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, Search, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState as SharedEmptyState } from '@/components/shared/empty-state'

// ============================================================================
// Standard Page Wrapper
// ============================================================================
export function LinkManagerPage({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("flex-1 space-y-6 p-8 pt-6 min-h-screen bg-background w-full max-w-[1600px] mx-auto", className)}>
            {children}
        </div>
    )
}

// ============================================================================
// Page Header
// ============================================================================
interface SubPageHeaderProps {
    teamId?: string // Optional now since we don't use it for back link styling usually
    parentLabel: string
    sectionLabel: string
    title: string
    description?: string
    actions?: ReactNode
}

export function SubPageHeader({ parentLabel, sectionLabel, title, description, actions }: SubPageHeaderProps) {
    return (
        <div className="space-y-4 pb-2">
            <div className="relative rounded-3xl overflow-hidden bg-primary p-6 md:p-8 shadow-2xl flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-6">
                {/* Background Base & Pattern */}
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#00175a] via-primary to-[#004e9a]" />

                <div
                    className="absolute inset-0 z-0 opacity-40 mix-blend-overlay rotate-[1deg] scale-105"
                    style={{
                        backgroundImage: `url('/patterns/amex-1.png')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/40 via-transparent to-transparent mix-blend-multiply" />

                {/* Decorative Glow */}
                <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-white/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />

                <div className="relative z-10 space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-white/80">
                        <Badge variant="outline" className="text-[10px] font-bold bg-white/10 border-white/20 text-white px-2 h-5 rounded-md">
                            {parentLabel}
                        </Badge>
                        <span className="text-[10px] font-bold text-white/50">/</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">{sectionLabel}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-md">{title}</h1>
                    {description && (
                        <p className="text-sm font-medium text-white/80 max-w-4xl leading-relaxed mt-1">
                            {description}
                        </p>
                    )}
                </div>
                {actions && <div className="relative z-10 flex items-center gap-3 pt-2 md:pt-0 shrink-0">{actions}</div>}
            </div>
        </div>
    )
}

// ============================================================================
// Content Loading State
// ============================================================================
interface ContentLoadingProps {
    message?: string
}

export function ContentLoading({ message = "Loading..." }: ContentLoadingProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-[10px] font-bold text-muted-foreground">{message}</p>
        </div>
    )
}

// ============================================================================
// Empty State - Re-export from shared with backwards compatibility
// ============================================================================
interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    action?: ReactNode
    size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({ icon, title, description, size = 'md' }: EmptyStateProps) {
    return (
        <SharedEmptyState
            icon={icon}
            title={title}
            description={description}
            size={size}
        />
    )
}

// ============================================================================
// Search Input with Icon
// ============================================================================
interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

export function SearchInput({ value, onChange, placeholder = "Search...", className }: SearchInputProps) {
    return (
        <div className={cn("relative group flex-1 max-w-md", className)}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-12 pl-12 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-bold text-sm"
            />
        </div>
    )
}

// ============================================================================
// Stats Summary Card
// ============================================================================
interface StatsSummaryItemProps {
    label: string
    value: string | number
    icon: LucideIcon
    color?: 'primary' | 'blue' | 'amber' | 'indigo'
}

const colorVariants = {
    primary: { icon: "text-primary bg-primary/10" },
    blue: { icon: "text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/20" },
    amber: { icon: "text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20" },
    indigo: { icon: "text-indigo-600 bg-indigo-500/10 dark:text-indigo-400 dark:bg-indigo-500/20" },
}

export function StatsSummaryItem({ label, value, icon: Icon, color = 'primary' }: StatsSummaryItemProps) {
    const style = colorVariants[color]

    return (
        <div className="flex flex-col justify-center py-2 px-1">
            <div className="flex items-center gap-2.5 mb-3">
                <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    style.icon
                )}>
                    <Icon className="h-4 w-4" />
                </div>
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest truncate">
                    {label}
                </p>
            </div>
            <p className="text-4xl md:text-5xl font-black tabular-nums tracking-tighter text-foreground leading-none">
                {value}
            </p>
        </div>
    )
}

// ============================================================================
// Full Page Loading State
// ============================================================================
interface PageLoadingProps {
    message?: string
}

export function PageLoading({ message = "Loading..." }: PageLoadingProps) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background text-muted-foreground">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-bold">{message}</p>
            </div>
        </div>
    )
}
