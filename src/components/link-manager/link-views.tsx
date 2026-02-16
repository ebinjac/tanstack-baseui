
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { memo, useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    ExternalLink,
    Globe2,
    Lock,
    MoreHorizontal,
    Trash2,
    Calendar,
    MousePointer2,
    Pencil,
    Info,
    Box,
    Layers,
    CheckSquare,
    Square
} from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { LinkWithRelations } from "@/db/schema/links"
import { LinkCard } from "./link-card"
import { CreateLinkDialog } from "./create-link-dialog"
import { useLinkMutations } from "./hooks/use-link-mutations"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface ViewProps {
    links: LinkWithRelations[]
    teamId: string
    selectedLinks?: Set<string>
    onToggleSelect?: (linkId: string) => void
}

// =============================================================================
// GridView — single dialog instance lifted here
// =============================================================================
export function GridView({ links, teamId, selectedLinks, onToggleSelect }: ViewProps) {
    const [dialogLink, setDialogLink] = useState<LinkWithRelations | null>(null)
    const [dialogMode, setDialogMode] = useState<'edit' | 'view' | null>(null)

    const handleView = useCallback((link: LinkWithRelations) => {
        setDialogLink(link)
        setDialogMode('view')
    }, [])

    const handleEdit = useCallback((link: LinkWithRelations) => {
        setDialogLink(link)
        setDialogMode('edit')
    }, [])

    return (
        <>
            <CreateLinkDialog
                teamId={teamId}
                link={dialogLink || undefined}
                mode={dialogMode || 'view'}
                open={!!dialogMode}
                onOpenChange={(open) => !open && setDialogMode(null)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {links.map((link) => (
                    <GridItem
                        key={link.id}
                        link={link}
                        teamId={teamId}
                        isSelected={selectedLinks?.has(link.id) ?? false}
                        onToggleSelect={onToggleSelect}
                        onView={handleView}
                        onEdit={handleEdit}
                    />
                ))}
            </div>
        </>
    )
}

// Memoized individual grid item so selection toggle doesn't re-render siblings
interface GridItemProps {
    link: LinkWithRelations
    teamId: string
    isSelected: boolean
    onToggleSelect?: (linkId: string) => void
    onView: (link: LinkWithRelations) => void
    onEdit: (link: LinkWithRelations) => void
}

const GridItem = memo(function GridItem({ link, teamId, isSelected, onToggleSelect, onView, onEdit }: GridItemProps) {
    return (
        <div className="relative group">
            {onToggleSelect && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleSelect(link.id)
                    }}
                    className={cn(
                        "absolute -top-2 -left-2 z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-lg",
                        isSelected
                            ? "bg-primary text-primary-foreground scale-100"
                            : "bg-background border border-border/50 text-muted-foreground opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
                    )}
                >
                    {isSelected ? (
                        <CheckSquare className="w-4 h-4" />
                    ) : (
                        <Square className="w-4 h-4" />
                    )}
                </button>
            )}
            <div className={cn(
                "transition-all rounded-2xl",
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}>
                <LinkCard link={link} teamId={teamId} onView={onView} onEdit={onEdit} />
            </div>
        </div>
    )
})

// =============================================================================
// TableView
// =============================================================================
export function TableView({ links, teamId, selectedLinks, onToggleSelect }: ViewProps) {
    const { deleteMutation, handleOpen } = useLinkMutations(teamId)
    const [dialogLink, setDialogLink] = useState<LinkWithRelations | null>(null)
    const [dialogMode, setDialogMode] = useState<'edit' | 'view' | null>(null)

    return (
        <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden relative">
            <CreateLinkDialog
                teamId={teamId}
                link={dialogLink || undefined}
                mode={dialogMode || 'view'}
                open={!!dialogMode}
                onOpenChange={(open) => !open && setDialogMode(null)}
            />
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/30 h-14">
                        {onToggleSelect && <TableHead className="w-[60px]"></TableHead>}
                        <TableHead className="w-[340px] text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pl-6">Resource Details</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Application</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Classification</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Access</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Engagement</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Created</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 pr-8">Manage</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {links.map((link) => (
                        <TableRow
                            key={link.id}
                            className={cn(
                                "group transition-all h-20 border-border/20",
                                selectedLinks?.has(link.id) ? "bg-primary/5" : "hover:bg-muted/30"
                            )}
                        >
                            {onToggleSelect && (
                                <TableCell className="pl-6">
                                    <button
                                        onClick={() => onToggleSelect(link.id)}
                                        className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center transition-all border",
                                            selectedLinks?.has(link.id)
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background border-border/50 text-muted-foreground/40 hover:text-primary hover:border-primary/40 hover:bg-primary/5"
                                        )}
                                    >
                                        {selectedLinks?.has(link.id) ? (
                                            <CheckSquare className="w-4 h-4" />
                                        ) : (
                                            <Square className="w-4 h-4" />
                                        )}
                                    </button>
                                </TableCell>
                            )}
                            <TableCell className="max-w-[340px] pl-6">
                                <div className="flex flex-col gap-1.5 overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="font-black text-sm tracking-tight text-foreground cursor-pointer hover:text-primary transition-colors truncate block"
                                            onClick={() => handleOpen(link)}
                                        >
                                            {link.title}
                                        </span>
                                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                                    </div>

                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <span className="text-[10px] text-muted-foreground/60 truncate italic block cursor-help font-medium">
                                                    {link.url}
                                                </span>
                                            }
                                        />
                                        <TooltipContent className="max-w-md break-all rounded-xl p-3 shadow-2xl">
                                            <span className="font-bold text-xs">{link.url}</span>
                                        </TooltipContent>
                                    </Tooltip>

                                    {link.tags && link.tags.length > 0 && (
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {link.tags.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="inline-flex items-center text-[9px] px-1.5 py-0.5 bg-muted/40 rounded-md text-muted-foreground font-black uppercase tracking-widest border border-border/40">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                {link.application ? (
                                    <Badge variant="outline" className="h-6 gap-1.5 text-[9px] font-black uppercase tracking-widest bg-blue-500/5 text-blue-600 border-blue-500/20 rounded-lg shrink-0 px-2.5">
                                        <Box className="w-3 h-3" /> {link.application.tla}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground/20 font-black uppercase tracking-widest text-[9px]">Global Target</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {link.category ? (
                                    <Badge variant="outline" className="h-6 gap-1.5 text-[9px] font-black uppercase tracking-widest bg-purple-500/5 text-purple-600 border-purple-500/20 rounded-lg shrink-0 px-2.5">
                                        <Layers className="w-3 h-3" /> {link.category.name}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground/20 font-black uppercase tracking-widest text-[9px]">Unclassified</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {link.visibility === "public" ? (
                                    <Badge variant="outline" className="h-6 gap-1.5 text-[9px] font-black uppercase tracking-widest bg-green-500/5 text-green-600 border-green-500/20 rounded-lg shrink-0 px-2.5">
                                        <Globe2 className="w-3 h-3" /> PUBLIC
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="h-6 gap-1.5 text-[9px] font-black uppercase tracking-widest bg-muted/50 text-muted-foreground border-border/50 rounded-lg shrink-0 px-2.5">
                                        <Lock className="w-3 h-3" /> PRIVATE
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-black tracking-tight leading-none">
                                        <MousePointer2 className="w-3 h-3 text-primary opacity-60" />
                                        {link.usageCount || 0}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Insights</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-black tracking-tight leading-none">
                                        <Calendar className="w-3 h-3 text-muted-foreground/60" />
                                        {link.createdAt ? format(new Date(link.createdAt), "MMM d") : "N/A"}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Deployed</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        render={
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-muted/50 rounded-2xl">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        }
                                    />
                                    <DropdownMenuContent align="end" className="rounded-xl p-1.5 border-border/50 shadow-2xl min-w-[180px]">
                                        <DropdownMenuItem onClick={() => handleOpen(link)} className="gap-3 py-2 rounded-lg text-xs font-semibold cursor-pointer">
                                            <ExternalLink className="w-4 h-4 opacity-50" /> Navigate Home
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                            setDialogLink(link)
                                            setDialogMode('view')
                                        }} className="gap-3 py-2 rounded-lg text-xs font-semibold cursor-pointer">
                                            <Info className="mr-2 h-4 w-4 opacity-50" /> Asset Intelligence
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                            setDialogLink(link)
                                            setDialogMode('edit')
                                        }} className="gap-3 py-2 rounded-lg text-xs font-semibold cursor-pointer">
                                            <Pencil className="mr-2 h-4 w-4 opacity-50" /> Refine Metadata
                                        </DropdownMenuItem>
                                        <div className="h-px bg-border/50 my-1 mx-2" />
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive gap-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                                            onClick={() => deleteMutation.mutate({ data: { id: link.id, teamId } })}
                                        >
                                            <Trash2 className="w-4 h-4 opacity-50" /> Terminate Link
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

// =============================================================================
// CompactView
// =============================================================================
export function CompactView({ links, teamId, selectedLinks, onToggleSelect }: ViewProps) {
    const { handleOpen } = useLinkMutations(teamId)

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {links.map((link) => (
                <CompactItem
                    key={link.id}
                    link={link}
                    isSelected={selectedLinks?.has(link.id) ?? false}
                    onToggleSelect={onToggleSelect}
                    onOpen={handleOpen}
                />
            ))}
        </div>
    )
}

interface CompactItemProps {
    link: LinkWithRelations
    isSelected: boolean
    onToggleSelect?: (linkId: string) => void
    onOpen: (link: LinkWithRelations) => void
}

const CompactItem = memo(function CompactItem({ link, isSelected, onToggleSelect, onOpen }: CompactItemProps) {
    return (
        <div
            className={cn(
                "group bg-card/40 backdrop-blur-sm border border-border/50 p-3 rounded-xl flex items-center justify-between hover:shadow-lg hover:border-primary/30 hover:bg-card transition-all cursor-pointer relative overflow-hidden",
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5"
            )}
            onClick={() => onOpen(link)}
        >
            {/* Access Indicator Dots */}
            <div className={cn(
                "absolute top-0 right-0 h-8 w-8 flex items-center justify-center -mr-1 -mt-1 opacity-[0.05] rounded-full",
                link.visibility === "public" ? "bg-blue-500" : "bg-amber-500"
            )} />

            {onToggleSelect && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleSelect(link.id)
                    }}
                    className={cn(
                        "absolute -top-1 -left-1 z-10 w-6 h-6 rounded-md flex items-center justify-center transition-all shadow-md border",
                        isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border/50 text-muted-foreground/30 opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
                    )}
                >
                    {isSelected ? (
                        <CheckSquare className="w-3 h-3" />
                    ) : (
                        <Square className="w-3 h-3" />
                    )}
                </button>
            )}
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
                    link.visibility === "public" ? "bg-blue-500/5 text-blue-600 border-blue-500/20" : "bg-amber-500/5 text-amber-600 border-amber-500/20"
                )}>
                    {link.visibility === "public" ? <Globe2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div className="flex flex-col overflow-hidden">
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <span className="text-[12px] font-bold tracking-tight truncate group-hover:text-primary transition-colors block leading-tight">
                                    {link.title}
                                </span>
                            }
                        />
                        <TooltipContent className="max-w-xs break-all rounded-lg p-2.5 shadow-xl">
                            <p className="font-bold text-[11px]">{link.title}</p>
                            <p className="text-[9px] font-medium opacity-60 mt-0.5 truncate">{link.url}</p>
                        </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center gap-1.5 overflow-hidden mt-0.5">
                        <span className="text-[8px] font-bold text-primary uppercase tracking-wider truncate">
                            {link.application?.tla || "GLOBAL"}
                        </span>
                        <span className="text-[8px] text-muted-foreground/20 font-bold">•</span>
                        <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-wider truncate">
                            {link.usageCount || 0} INSIGHTS
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
})
