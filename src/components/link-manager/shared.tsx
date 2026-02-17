import { Link as RouterLink } from '@tanstack/react-router'
import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, Search, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmptyState as SharedEmptyState } from '@/components/shared/empty-state'

// ============================================================================
// Page Header with Back Button
// ============================================================================
interface SubPageHeaderProps {
    teamId: string
    parentLabel: string
    sectionLabel: string
    title: string
    actions?: ReactNode
}

export function SubPageHeader({ teamId, parentLabel, sectionLabel, title, actions }: SubPageHeaderProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-6">
                <RouterLink to="/teams/$teamId/link-manager" params={{ teamId }}>
                    <div className="h-14 w-14 rounded-2xl bg-background border border-border flex items-center justify-center hover:bg-muted/50 transition-all group shadow-sm">
                        <ArrowLeft className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-all" />
                    </div>
                </RouterLink>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] font-bold bg-primary/5 border-primary/20 text-primary px-2 h-5">
                            {parentLabel}
                        </Badge>
                        <span className="text-muted-foreground/30">/</span>
                        <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">{sectionLabel}</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
                </div>
            </div>
            {actions && <div className="flex items-center gap-4">{actions}</div>}
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
    primary: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", glow: "bg-primary", hover: "hover:border-primary/30" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/20", glow: "bg-blue-500", hover: "hover:border-blue-500/30" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/20", glow: "bg-amber-500", hover: "hover:border-amber-500/30" },
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-600", border: "border-indigo-500/20", glow: "bg-indigo-500", hover: "hover:border-indigo-500/30" },
}

export function StatsSummaryItem({ label, value, icon: Icon, color = 'primary' }: StatsSummaryItemProps) {
    const style = colorVariants[color]

    return (
        <div
            className={cn(
                "relative overflow-hidden transition-all duration-300 border border-border/50 bg-card/40 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 group",
                style.hover
            )}
        >
            <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] rounded-full", style.glow)} />
            <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-transform relative z-10 group-hover:scale-110",
                style.bg, style.text, style.border
            )}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="relative z-10 min-w-0 flex flex-col justify-center">
                <p className={cn("text-2xl font-bold tabular-nums tracking-tighter leading-none", style.text)}>{value}</p>
                <p className="text-[10px] text-muted-foreground font-bold mt-1.5 opacity-60">{label}</p>
            </div>
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
