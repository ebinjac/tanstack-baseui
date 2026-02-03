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
    Activity,
    Layers
} from "lucide-react"
import { deleteLink, trackLinkUsage } from "@/app/actions/links"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { LinkWithRelations } from "@/db/schema/links"
import { CreateLinkDialog } from "./create-link-dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

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
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
            className="h-full"
        >
            <CreateLinkDialog
                teamId={teamId}
                link={link}
                mode={dialogMode || 'view'}
                open={!!dialogMode}
                onOpenChange={(open) => !open && setDialogMode(null)}
            />
            <Card className="group relative h-full flex flex-col transition-all duration-300 border border-border/50 bg-card/40 backdrop-blur-md hover:bg-card/60 hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden rounded-2xl">
                {/* Status Accent Bar */}
                <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2",
                    link.visibility === "public" ? "bg-blue-500/30" : "bg-amber-500/30"
                )} />

                <CardHeader className="pb-3 pt-5 px-5 space-y-3">
                    <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {link.visibility === "public" ? (
                                    <div className="h-4 w-4 rounded bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                        <Globe2 className="h-2.5 w-2.5 text-blue-600" />
                                    </div>
                                ) : (
                                    <div className="h-4 w-4 rounded bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                        <Lock className="h-2.5 w-2.5 text-amber-600" />
                                    </div>
                                )}
                                <span className="text-[10px] font-bold text-muted-foreground/50">
                                    {link.application?.tla || "Global"} • {link.category?.name || "Uncategorized"}
                                </span>
                            </div>

                            <CardTitle
                                className="text-lg font-bold leading-tight line-clamp-2 cursor-pointer group-hover:text-primary transition-colors tracking-tight"
                                onClick={handleOpen}
                            >
                                {link.title}
                            </CardTitle>

                            <p className="text-[12px] font-medium text-muted-foreground/70 line-clamp-2 leading-relaxed h-[2.2rem]">
                                {link.description || "Information resource shared by the team for operational enablement."}
                            </p>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger render={
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/40 hover:bg-muted/50 rounded-lg -mt-1 -mr-1">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            } />
                            <DropdownMenuContent align="end" className="rounded-xl p-1.5 border-border/50 shadow-2xl min-w-[180px]">
                                <DropdownMenuItem onClick={() => setDialogMode('view')} className="gap-3 py-2 rounded-lg text-xs font-semibold cursor-pointer">
                                    <Info className="h-3.5 w-3.5 opacity-50" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDialogMode('edit')} className="gap-3 py-2 rounded-lg text-xs font-semibold cursor-pointer">
                                    <Pencil className="h-3.5 w-3.5 opacity-50" /> Edit Resource
                                </DropdownMenuItem>
                                <div className="h-px bg-border/50 my-1 mx-1.5" />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive gap-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                                    onClick={() => deleteMutation.mutate({ data: { id: link.id, teamId } })}
                                >
                                    <Trash2 className="h-3.5 w-3.5 opacity-50" /> Delete Resource
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="pb-4 pt-0 px-5 flex flex-col gap-4 flex-1">
                    {/* Visual Pill Metadata */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {link.application && (
                            <Badge variant="outline" className="h-5 gap-1 text-[10px] font-bold bg-blue-500/5 text-blue-600 border border-blue-500/20 rounded-md shrink-0 px-2">
                                <Box className="w-2.5 h-2.5" /> {link.application.tla}
                            </Badge>
                        )}
                        {link.category && (
                            <Badge variant="outline" className="h-5 gap-1 text-[10px] font-bold bg-purple-500/5 text-purple-600 border border-purple-500/20 rounded-md shrink-0 px-2">
                                <Layers className="w-2.5 h-2.5" /> {link.category.name}
                            </Badge>
                        )}
                        <Badge variant="outline" className={cn(
                            "h-5 gap-1 text-[10px] font-bold rounded-md shrink-0 px-2",
                            link.visibility === "public"
                                ? "bg-green-500/5 text-green-600 border-green-500/20"
                                : "bg-muted/50 text-muted-foreground border-border/50"
                        )}>
                            {link.visibility === "public" ? <Globe2 className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                            <span className="capitalize">{link.visibility}</span>
                        </Badge>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                        {link.tags && link.tags.length > 0 ? (
                            link.tags.slice(0, 5).map((tag, i) => (
                                <span key={i} className="inline-flex items-center text-[10px] font-bold text-muted-foreground/40 bg-muted/20 px-1.5 py-0 rounded border border-border/30">
                                    #{tag}
                                </span>
                            ))
                        ) : (
                            <span className="text-[10px] font-bold text-muted-foreground/20 italic">No Tags</span>
                        )}
                        {link.tags && link.tags.length > 5 && (
                            <span className="text-[10px] font-bold text-primary/40">+{link.tags.length - 5}</span>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="pt-3 pb-4 px-5 border-t border-border/40 bg-muted/[0.02] mt-auto">
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <Activity className="h-3.5 w-3.5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold tracking-tight leading-none text-foreground">{link.usageCount || 0}</p>
                                <p className="text-[10px] font-bold text-muted-foreground/50">Insights</p>
                            </div>
                        </div>

                        <Button
                            onClick={handleOpen}
                            variant="secondary"
                            className="h-8 px-4 font-bold text-xs rounded-lg gap-2 shadow-sm transition-all hover:bg-primary hover:text-primary-foreground group-hover:shadow-[0_4px_12px_rgba(var(--primary-rgb),0.15)]"
                        >
                            Open Resource <ExternalLink className="w-3 h-3" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    )
}
