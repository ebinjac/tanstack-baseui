import {
  Activity,
  Box,
  ExternalLink,
  Globe2,
  Info,
  Layers,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LinkWithRelations } from "@/db/schema/links";
import { cn } from "@/lib/utils";
import { useLinkMutations } from "./hooks/use-link-mutations";

interface LinkCardProps {
  link: LinkWithRelations;
  onEdit?: (link: LinkWithRelations) => void;
  onView?: (link: LinkWithRelations) => void;
  teamId: string;
}

export const LinkCard = memo(function LinkCard({
  link,
  teamId,
  onView,
  onEdit,
}: LinkCardProps) {
  const { deleteMutation, handleOpen } = useLinkMutations(teamId);

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-[5px] hover:border-primary/40 hover:bg-card/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
      <CardHeader className="space-y-3 px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="mb-1 flex items-center gap-2">
              {link.visibility === "public" ? (
                <div className="flex h-4 w-4 items-center justify-center rounded border border-blue-500/20 bg-blue-500/10">
                  <Globe2 className="h-2.5 w-2.5 text-blue-600" />
                </div>
              ) : (
                <div className="flex h-4 w-4 items-center justify-center rounded border border-amber-500/20 bg-amber-500/10">
                  <Lock className="h-2.5 w-2.5 text-amber-600" />
                </div>
              )}
              <span className="font-bold text-[10px] text-muted-foreground/50">
                {link.application?.tla || "Global"} •{" "}
                {link.category?.name || "Uncategorized"}
              </span>
            </div>

            <CardTitle
              className="line-clamp-2 cursor-pointer font-bold text-lg leading-tight tracking-tight transition-colors group-hover:text-primary"
              onClick={() => handleOpen(link)}
            >
              {link.title}
            </CardTitle>

            <p className="line-clamp-2 h-[2.2rem] font-medium text-[12px] text-muted-foreground/70 leading-relaxed">
              {link.description ||
                "Information resource shared by the team for operational enablement."}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  className="-mt-1 -mr-1 h-8 w-8 rounded-lg text-muted-foreground/40 hover:bg-muted/50"
                  size="icon"
                  variant="ghost"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent
              align="end"
              className="min-w-[180px] rounded-xl border-border/50 p-1.5 shadow-2xl"
            >
              <DropdownMenuItem
                className="cursor-pointer gap-3 rounded-lg py-2 font-semibold text-xs"
                onClick={() => onView?.(link)}
              >
                <Info className="h-3.5 w-3.5 opacity-50" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-3 rounded-lg py-2 font-semibold text-xs"
                onClick={() => onEdit?.(link)}
              >
                <Pencil className="h-3.5 w-3.5 opacity-50" /> Edit Resource
              </DropdownMenuItem>
              <div className="mx-1.5 my-1 h-px bg-border/50" />
              <DropdownMenuItem
                className="cursor-pointer gap-3 rounded-lg py-2 font-semibold text-destructive text-xs focus:text-destructive"
                onClick={() =>
                  deleteMutation.mutate({ data: { id: link.id, teamId } })
                }
              >
                <Trash2 className="h-3.5 w-3.5 opacity-50" /> Delete Resource
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 px-5 pt-0 pb-4">
        {/* Visual Pill Metadata */}
        <div className="flex flex-wrap items-center gap-1.5">
          {link.application && (
            <Badge
              className="h-5 shrink-0 gap-1 rounded-md border border-blue-500/20 bg-blue-500/5 px-2 font-bold text-[10px] text-blue-600"
              variant="outline"
            >
              <Box className="h-2.5 w-2.5" /> {link.application.tla}
            </Badge>
          )}
          {link.category && (
            <Badge
              className="h-5 shrink-0 gap-1 rounded-md border border-purple-500/20 bg-purple-500/5 px-2 font-bold text-[10px] text-purple-600"
              variant="outline"
            >
              <Layers className="h-2.5 w-2.5" /> {link.category.name}
            </Badge>
          )}
          <Badge
            className={cn(
              "h-5 shrink-0 gap-1 rounded-md px-2 font-bold text-[10px]",
              link.visibility === "public"
                ? "border-green-500/20 bg-green-500/5 text-green-600"
                : "border-border/50 bg-muted/50 text-muted-foreground"
            )}
            variant="outline"
          >
            {link.visibility === "public" ? (
              <Globe2 className="h-2.5 w-2.5" />
            ) : (
              <Lock className="h-2.5 w-2.5" />
            )}
            <span className="capitalize">{link.visibility}</span>
          </Badge>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {link.tags && link.tags.length > 0 ? (
            link.tags.slice(0, 5).map((tag) => (
              <span
                className="inline-flex items-center rounded border border-border/30 bg-muted/20 px-1.5 py-0 font-bold text-[10px] text-muted-foreground/40"
                key={tag}
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="font-bold text-[10px] text-muted-foreground/20 italic">
              No Tags
            </span>
          )}
          {link.tags && link.tags.length > 5 && (
            <span className="font-bold text-[10px] text-primary/40">
              +{link.tags.length - 5}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="mt-auto border-border/40 border-t bg-muted/[0.02] px-5 pt-3 pb-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="font-bold text-[11px] text-foreground leading-none tracking-tight">
                {link.usageCount || 0}
              </p>
              <p className="font-bold text-[10px] text-muted-foreground/50">
                Insights
              </p>
            </div>
          </div>

          <Button
            className="h-8 gap-2 rounded-lg px-4 font-bold text-xs shadow-sm transition-all hover:bg-primary hover:text-primary-foreground group-hover:shadow-[0_4px_12px_rgba(var(--primary-rgb),0.15)]"
            onClick={() => handleOpen(link)}
            variant="secondary"
          >
            Open Resource <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
});
