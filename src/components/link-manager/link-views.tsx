
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { useState } from "react"
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
    Tag,
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
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteLink, trackLinkUsage } from "@/app/actions/links"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface ViewProps {
    links: LinkWithRelations[]
    teamId: string
    selectedLinks?: Set<string>
    onToggleSelect?: (linkId: string) => void
}

export function GridView({ links, teamId, selectedLinks, onToggleSelect }: ViewProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {links.map((link) => (
                <div key={link.id} className="relative group">
                    {onToggleSelect && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleSelect(link.id)
                            }}
                            className={cn(
                                "absolute -top-2 -left-2 z-10 w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-lg",
                                selectedLinks?.has(link.id)
                                    ? "bg-primary text-primary-foreground scale-100"
                                    : "bg-background border border-border/50 text-muted-foreground opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
                            )}
                        >
                            {selectedLinks?.has(link.id) ? (
                                <CheckSquare className="w-4 h-4" />
                            ) : (
                                <Square className="w-4 h-4" />
                            )}
                        </button>
                    )}
                    <div className={cn(
                        "transition-all rounded-2xl",
                        selectedLinks?.has(link.id) && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}>
                        <LinkCard link={link} teamId={teamId} />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function TableView({ links, teamId, selectedLinks, onToggleSelect }: ViewProps) {
    const queryClient = useQueryClient()
    const [dialogLink, setDialogLink] = useState<LinkWithRelations | null>(null)
    const [dialogMode, setDialogMode] = useState<'edit' | 'view' | null>(null)

    const deleteMutation = useMutation({
        mutationFn: (vars: { data: { id: string, teamId: string } }) => deleteLink(vars),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links", teamId] })
            toast.success("Link deleted")
        },
    })

    const trackUsageMutation = useMutation({
        mutationFn: (vars: { data: { id: string } }) => trackLinkUsage(vars),
    })

    const handleOpen = (link: LinkWithRelations) => {
        trackUsageMutation.mutate({ data: { id: link.id } })
        window.open(link.url, "_blank", "noopener,noreferrer")
    }

    return (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            <CreateLinkDialog
                teamId={teamId}
                link={dialogLink || undefined}
                mode={dialogMode || 'view'}
                open={!!dialogMode}
                onOpenChange={(open) => !open && setDialogMode(null)}
            />
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent uppercase text-[10px] font-black tracking-widest text-muted-foreground/60">
                        {onToggleSelect && <TableHead className="w-[50px]"></TableHead>}
                        <TableHead className="w-[300px]">Link</TableHead>
                        <TableHead>Application</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {links.map((link) => (
                        <TableRow
                            key={link.id}
                            className={cn(
                                "group transition-colors",
                                selectedLinks?.has(link.id) && "bg-primary/5"
                            )}
                        >
                            {onToggleSelect && (
                                <TableCell>
                                    <button
                                        onClick={() => onToggleSelect(link.id)}
                                        className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                            selectedLinks?.has(link.id)
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted/50 text-muted-foreground hover:bg-muted"
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
                            <TableCell className="max-w-[300px]">
                                <div className="flex flex-col overflow-hidden">
                                    <span
                                        className="font-bold text-foreground cursor-pointer hover:text-primary transition-colors truncate block"
                                        onClick={() => handleOpen(link)}
                                        title={link.title}
                                    >
                                        {link.title}
                                    </span>
                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <span className="text-[10px] text-muted-foreground truncate italic block cursor-help">
                                                    {link.url}
                                                </span>
                                            }
                                        />
                                        <TooltipContent className="max-w-md break-all">
                                            {link.url}
                                        </TooltipContent>
                                    </Tooltip>

                                    {link.tags && link.tags.length > 0 && (
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {link.tags.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="inline-flex items-center text-[8px] px-1 bg-muted/50 rounded-sm text-muted-foreground/70 font-bold border border-border/50 uppercase tracking-tighter">
                                                    <Tag className="w-2 h-2 mr-0.5 opacity-40" />
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                {link.application ? (
                                    <Badge variant="outline" className="text-[10px] font-bold bg-primary/[0.03] text-primary border-primary/20">
                                        <Box className="w-3 h-3 mr-1" />
                                        {link.application.applicationName}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground/40 italic text-xs">None</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {link.category ? (
                                    <Badge variant="outline" className="text-[10px] font-bold bg-purple-500/[0.03] text-purple-600 border-purple-500/20">
                                        <Layers className="w-3 h-3 mr-1" />
                                        {link.category.name}
                                    </Badge>
                                ) : (
                                    <span className="text-muted-foreground/40 italic text-xs">None</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {link.visibility === "public" ? (
                                    <Badge variant="secondary" className="text-[10px] font-bold text-blue-500 bg-blue-500/10 border-blue-500/10">
                                        <Globe2 className="w-3 h-3 mr-1" /> PUBLIC
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border-amber-500/10">
                                        <Lock className="w-3 h-3 mr-1" /> PRIVATE
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                    <MousePointer2 className="w-3 h-3 text-muted-foreground" />
                                    {link.usageCount || 0} clicks
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    {link.createdAt ? format(new Date(link.createdAt), "MMM d, yyyy") : "Never"}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger
                                        render={
                                            <Button variant="ghost" size="icon-sm">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        }
                                    />
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpen(link)}>
                                            <ExternalLink className="w-4 h-4 mr-2" /> Open link
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                            setDialogLink(link)
                                            setDialogMode('view')
                                        }}>
                                            <Info className="mr-2 h-4 w-4" /> View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                            setDialogLink(link)
                                            setDialogMode('edit')
                                        }}>
                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => deleteMutation.mutate({ data: { id: link.id, teamId } })}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
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

export function CompactView({ links, teamId, selectedLinks, onToggleSelect }: ViewProps) {
    const queryClient = useQueryClient()

    const trackUsageMutation = useMutation({
        mutationFn: (vars: { data: { id: string } }) => trackLinkUsage(vars),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links", teamId] })
        }
    })

    const handleOpen = (link: LinkWithRelations) => {
        trackUsageMutation.mutate({ data: { id: link.id } })
        window.open(link.url, "_blank", "noopener,noreferrer")
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {links.map((link) => (
                <div
                    key={link.id}
                    className={cn(
                        "group bg-card border border-border/50 p-2.5 rounded-xl flex items-center justify-between hover:shadow-md hover:border-primary/30 transition-all cursor-pointer relative",
                        selectedLinks?.has(link.id) && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => handleOpen(link)}
                >
                    {onToggleSelect && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleSelect(link.id)
                            }}
                            className={cn(
                                "absolute -top-1.5 -left-1.5 z-10 w-6 h-6 rounded-lg flex items-center justify-center transition-all shadow-md",
                                selectedLinks?.has(link.id)
                                    ? "bg-primary text-primary-foreground scale-100"
                                    : "bg-background border border-border/50 text-muted-foreground opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
                            )}
                        >
                            {selectedLinks?.has(link.id) ? (
                                <CheckSquare className="w-3 h-3" />
                            ) : (
                                <Square className="w-3 h-3" />
                            )}
                        </button>
                    )}
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            link.visibility === "public" ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                            {link.visibility === "public" ? <Globe2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <span className="text-sm font-bold truncate group-hover:text-primary transition-colors block">
                                            {link.title}
                                        </span>
                                    }
                                />
                                <TooltipContent className="max-w-xs break-all">
                                    <p className="font-bold">{link.title}</p>
                                    <p className="text-[10px] opacity-70 mt-1">{link.url}</p>
                                </TooltipContent>
                            </Tooltip>
                            <div className="flex items-center gap-1.5 overflow-hidden">
                                {link.application && (
                                    <span className="text-[9px] font-black text-primary uppercase truncate">
                                        {link.application.tla || link.application.applicationName}
                                    </span>
                                )}
                                {link.application && link.category && (
                                    <span className="text-[9px] text-muted-foreground/30">•</span>
                                )}
                                {link.category && (
                                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase truncate">
                                        {link.category.name}
                                    </span>
                                )}
                                <span className="text-[9px] text-muted-foreground truncate">
                                    • {link.usageCount || 0} clks
                                </span>
                            </div>
                            {link.tags && link.tags.length > 0 && (
                                <div className="flex gap-1 mt-0.5 overflow-hidden">
                                    {link.tags.slice(0, 2).map((tag, i) => (
                                        <span key={i} className="inline-flex items-center text-[8px] px-1 bg-muted/50 rounded-sm text-muted-foreground font-medium">
                                            <Tag className="w-2 h-2 mr-0.5 opacity-50" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
            ))}
        </div>
    )
}
