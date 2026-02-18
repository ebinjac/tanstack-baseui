import { Card, CardContent } from '@/components/ui/card'
import { ArrowUpRight } from 'lucide-react'

interface StatsCardProps {
    icon: React.ReactNode
    label: string
    value: string | number
    subLabel: string
}

export function StatsCard({ icon, label, value, subLabel }: StatsCardProps) {
    return (
        <Card className="transition-colors hover:bg-muted/30">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-medium">{label}</p>
                        <p className="text-xl font-bold tabular-nums truncate leading-tight">{value}</p>
                        <p className="text-[10px] text-muted-foreground">{subLabel}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

interface InfoItemProps {
    icon: React.ReactNode
    label: string
    value: string
    desc: string
}

export function InfoItem({ icon, label, value, desc }: InfoItemProps) {
    return (
        <div className="space-y-1 p-3 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                {icon} {label}
            </div>
            <p className="text-sm font-semibold truncate select-all">{value || 'Not Configured'}</p>
            <p className="text-[11px] text-muted-foreground">{desc}</p>
        </div>
    )
}

interface ToolItemProps {
    icon: React.ReactNode
    title: string
    desc: string
    link: string
}

export function ToolItem({ icon, title, desc, link }: ToolItemProps) {
    return (
        <a href={link} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 group transition-colors">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted/50 border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
    )
}
