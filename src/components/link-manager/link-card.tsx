import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardFooter,
    CardHeader,
    CardTitle,
    CardContent
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    ExternalLink,
    Globe2,
    Lock,
    MoreHorizontal,
    Trash2,
    Pencil,
    Info,
    Box,
    Tag as TagIcon,
    Layers
} from "lucide-react"
import { deleteLink, trackLinkUsage } from "@/app/actions/links"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { LinkWithRelations } from "@/db/schema/links"
import { CreateLinkDialog } from "./create-link-dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface LinkCardProps {
    link: LinkWithRelations
    teamId: string
}

export function LinkCard({ link, teamId }: LinkCardProps) {
    const queryClient = useQueryClient()

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (vars: { data: { id: string, teamId: string } }) => deleteLink(vars),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links", teamId] })
            toast.success("Link deleted")
        },
        onError: (err) => {
            toast.error("Failed to delete link: " + err.message)
        },
    })

    // Usage Tracking
    const trackUsageMutation = useMutation({
        mutationFn: (vars: { data: { id: string } }) => trackLinkUsage(vars),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["links", teamId] })
        }
    })

    const handleOpen = () => {
        trackUsageMutation.mutate({ data: { id: link.id } })
        window.open(link.url, "_blank", "noopener,noreferrer")
    }

    const [dialogMode, setDialogMode] = useState<'edit' | 'view' | null>(null);

    return (
        <>
            <CreateLinkDialog
                teamId={teamId}
                link={link}
                mode={dialogMode || 'view'}
                open={!!dialogMode}
                onOpenChange={(open) => !open && setDialogMode(null)}
            />
            <Card className="group relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 bg-card overflow-hidden h-full flex flex-col">
                {/* Visual Status Indicator */}
                <div className={cn(
                    "absolute top-0 left-0 w-1 h-full transition-all group-hover:w-1.5",
                    link.visibility === "public" ? "bg-blue-500/40" : "bg-amber-500/40"
                )} />

                <CardHeader className="pb-3 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1.5 min-w-0 flex-1">
                            <CardTitle
                                className="text-lg font-black leading-tight line-clamp-1 group-hover:text-primary transition-colors cursor-pointer flex items-center gap-2"
                                onClick={handleOpen}
                            >
                                {link.title}
                            </CardTitle>

                            <p className="text-xs text-muted-foreground/80 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                                {link.description || "No description provided."}
                            </p>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted -mr-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={() => setDialogMode('view')} className="gap-2">
                                    <Info className="h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDialogMode('edit')} className="gap-2">
                                    <Pencil className="h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive gap-2"
                                    onClick={() => deleteMutation.mutate({ data: { id: link.id, teamId } })}
                                >
                                    <Trash2 className="h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Metadata Badges Row */}
                    <div className="flex flex-wrap items-center gap-2">
                        {link.application && (
                            <Badge variant="outline" className="h-5 gap-1 text-[9px] font-black uppercase tracking-wider bg-primary/[0.03] text-primary border-primary/20 rounded-lg shrink-0">
                                <Box className="w-2.5 h-2.5" />
                                {link.application.applicationName}
                            </Badge>
                        )}
                        {link.category && (
                            <Badge variant="outline" className="h-5 gap-1 text-[9px] font-black uppercase tracking-wider bg-purple-500/[0.03] text-purple-600 border-purple-500/20 rounded-lg shrink-0">
                                <Layers className="w-2.5 h-2.5" />
                                {link.category.name}
                            </Badge>
                        )}
                        {link.visibility === "public" ? (
                            <Badge variant="outline" className="h-5 gap-1 text-[9px] font-black uppercase tracking-wider bg-blue-500/[0.03] text-blue-600 border-blue-500/20 rounded-lg shrink-0">
                                <Globe2 className="w-2.5 h-2.5" /> Public
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="h-5 gap-1 text-[9px] font-black uppercase tracking-wider bg-amber-500/[0.03] text-amber-600 border-amber-500/20 rounded-lg shrink-0">
                                <Lock className="w-2.5 h-2.5" /> Private
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pb-3 pt-0 flex-1">
                    <div className="flex flex-wrap gap-1.5">
                        {link.tags && link.tags.length > 0 ? (
                            link.tags.slice(0, 4).map((tag, i) => (
                                <span key={i} className="inline-flex items-center text-[10px] font-medium text-muted-foreground/70 bg-muted/40 px-1.5 py-0.5 rounded-md border border-border/50">
                                    <TagIcon className="w-2.5 h-2.5 mr-1 opacity-50" />
                                    {tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-[10px] italic text-muted-foreground/30">No tags</span>
                        )}
                        {link.tags && link.tags.length > 4 && (
                            <span className="text-[10px] font-bold text-muted-foreground/50">+{link.tags.length - 4}</span>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="pt-3 border-t bg-muted/[0.02] flex justify-between items-center px-6 mt-auto">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/60">
                        <div className="flex items-center gap-1">
                            <span className="text-foreground font-black">{link.usageCount || 0}</span> CLICKS
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2 font-bold text-xs hover:bg-primary hover:text-primary-foreground rounded-lg transition-all"
                        onClick={handleOpen}
                    >
                        Visit Link <ExternalLink className="w-3 h-3" />
                    </Button>
                </CardFooter>
            </Card>
        </>
    )
}
