import { format } from "date-fns";
import {
  Box,
  Calendar,
  CheckSquare,
  ExternalLink,
  Globe2,
  Info,
  Layers,
  Lock,
  MoreHorizontal,
  MousePointer2,
  Pencil,
  Square,
  Trash2,
} from "lucide-react";
import { memo, useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LinkWithRelations } from "@/db/schema/links";
import { cn } from "@/lib/utils";
import { CreateLinkDialog } from "./create-link-dialog";
import { useLinkMutations } from "./hooks/use-link-mutations";
import { LinkCard } from "./link-card";

interface ViewProps {
  links: LinkWithRelations[];
  onToggleSelect?: (linkId: string) => void;
  selectedLinks?: Set<string>;
  teamId: string;
}

// =============================================================================
// GridView — single dialog instance lifted here
// =============================================================================
export function GridView({
  links,
  teamId,
  selectedLinks,
  onToggleSelect,
}: ViewProps) {
  const [dialogLink, setDialogLink] = useState<LinkWithRelations | null>(null);
  const [dialogMode, setDialogMode] = useState<"edit" | "view" | null>(null);

  const handleView = useCallback((link: LinkWithRelations) => {
    setDialogLink(link);
    setDialogMode("view");
  }, []);

  const handleEdit = useCallback((link: LinkWithRelations) => {
    setDialogLink(link);
    setDialogMode("edit");
  }, []);

  return (
    <>
      <CreateLinkDialog
        link={dialogLink || undefined}
        mode={dialogMode || "view"}
        onOpenChange={(open) => !open && setDialogMode(null)}
        open={!!dialogMode}
        teamId={teamId}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {links.map((link) => (
          <GridItem
            isSelected={selectedLinks?.has(link.id) ?? false}
            key={link.id}
            link={link}
            onEdit={handleEdit}
            onToggleSelect={onToggleSelect}
            onView={handleView}
            teamId={teamId}
          />
        ))}
      </div>
    </>
  );
}

// Memoized individual grid item so selection toggle doesn't re-render siblings
interface GridItemProps {
  isSelected: boolean;
  link: LinkWithRelations;
  onEdit: (link: LinkWithRelations) => void;
  onToggleSelect?: (linkId: string) => void;
  onView: (link: LinkWithRelations) => void;
  teamId: string;
}

const GridItem = memo(function GridItem({
  link,
  teamId,
  isSelected,
  onToggleSelect,
  onView,
  onEdit,
}: GridItemProps) {
  return (
    <div className="group relative">
      {onToggleSelect && (
        <button
          className={cn(
            "absolute -top-2 -left-2 z-10 flex h-8 w-8 items-center justify-center rounded-xl shadow-lg transition-all",
            isSelected
              ? "scale-100 bg-primary text-primary-foreground"
              : "scale-90 border border-border/50 bg-background text-muted-foreground opacity-0 hover:scale-100 group-hover:opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(link.id);
          }}
          type="button"
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
      )}
      <div
        className={cn(
          "rounded-2xl transition-all",
          isSelected &&
            "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        <LinkCard link={link} onEdit={onEdit} onView={onView} teamId={teamId} />
      </div>
    </div>
  );
});

// =============================================================================
// TableView
// =============================================================================
export function TableView({
  links,
  teamId,
  selectedLinks,
  onToggleSelect,
}: ViewProps) {
  const { deleteMutation, handleOpen } = useLinkMutations(teamId);
  const [dialogLink, setDialogLink] = useState<LinkWithRelations | null>(null);
  const [dialogMode, setDialogMode] = useState<"edit" | "view" | null>(null);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md">
      <CreateLinkDialog
        link={dialogLink || undefined}
        mode={dialogMode || "view"}
        onOpenChange={(open) => !open && setDialogMode(null)}
        open={!!dialogMode}
        teamId={teamId}
      />
      <Table>
        <TableHeader>
          <TableRow className="h-14 border-border/30 hover:bg-transparent">
            {onToggleSelect && <TableHead className="w-[60px]" />}
            <TableHead className="w-[340px] pl-6 font-black text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em]">
              Resource Details
            </TableHead>
            <TableHead className="font-black text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em]">
              Application
            </TableHead>
            <TableHead className="font-black text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em]">
              Classification
            </TableHead>
            <TableHead className="font-black text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em]">
              Access
            </TableHead>
            <TableHead className="font-black text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em]">
              Engagement
            </TableHead>
            <TableHead className="font-black text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em]">
              Created
            </TableHead>
            <TableHead className="pr-8 text-right font-black text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em]">
              Manage
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow
              className={cn(
                "group h-20 border-border/20 transition-all",
                selectedLinks?.has(link.id)
                  ? "bg-primary/5"
                  : "hover:bg-muted/30"
              )}
              key={link.id}
            >
              {onToggleSelect && (
                <TableCell className="pl-6">
                  <button
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl border transition-all",
                      selectedLinks?.has(link.id)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/50 bg-background text-muted-foreground/40 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    )}
                    onClick={() => onToggleSelect(link.id)}
                    type="button"
                  >
                    {selectedLinks?.has(link.id) ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </TableCell>
              )}
              <TableCell className="max-w-[340px] pl-6">
                <div className="flex flex-col gap-1.5 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <button
                      className="block truncate font-black text-foreground text-sm tracking-tight transition-colors hover:text-primary"
                      onClick={() => handleOpen(link)}
                      type="button"
                    >
                      {link.title}
                    </button>
                    <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-40" />
                  </div>

                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span className="block cursor-help truncate font-medium text-[10px] text-muted-foreground/60 italic">
                          {link.url}
                        </span>
                      }
                    />
                    <TooltipContent className="max-w-md break-all rounded-xl p-3 shadow-2xl">
                      <span className="font-bold text-xs">{link.url}</span>
                    </TooltipContent>
                  </Tooltip>

                  {link.tags && link.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {link.tags.slice(0, 3).map((tag) => (
                        <span
                          className="inline-flex items-center rounded-md border border-border/40 bg-muted/40 px-1.5 py-0.5 font-black text-[9px] text-muted-foreground uppercase tracking-widest"
                          key={tag}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {link.application ? (
                  <Badge
                    className="h-6 shrink-0 gap-1.5 rounded-lg border-blue-500/20 bg-blue-500/5 px-2.5 font-black text-[9px] text-blue-600 uppercase tracking-widest"
                    variant="outline"
                  >
                    <Box className="h-3 w-3" /> {link.application.tla}
                  </Badge>
                ) : (
                  <span className="font-black text-[9px] text-muted-foreground/20 uppercase tracking-widest">
                    Global Target
                  </span>
                )}
              </TableCell>
              <TableCell>
                {link.category ? (
                  <Badge
                    className="h-6 shrink-0 gap-1.5 rounded-lg border-purple-500/20 bg-purple-500/5 px-2.5 font-black text-[9px] text-purple-600 uppercase tracking-widest"
                    variant="outline"
                  >
                    <Layers className="h-3 w-3" /> {link.category.name}
                  </Badge>
                ) : (
                  <span className="font-black text-[9px] text-muted-foreground/20 uppercase tracking-widest">
                    Unclassified
                  </span>
                )}
              </TableCell>
              <TableCell>
                {link.visibility === "public" ? (
                  <Badge
                    className="h-6 shrink-0 gap-1.5 rounded-lg border-green-500/20 bg-green-500/5 px-2.5 font-black text-[9px] text-green-600 uppercase tracking-widest"
                    variant="outline"
                  >
                    <Globe2 className="h-3 w-3" /> PUBLIC
                  </Badge>
                ) : (
                  <Badge
                    className="h-6 shrink-0 gap-1.5 rounded-lg border-border/50 bg-muted/50 px-2.5 font-black text-[9px] text-muted-foreground uppercase tracking-widest"
                    variant="outline"
                  >
                    <Lock className="h-3 w-3" /> PRIVATE
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 font-black text-xs leading-none tracking-tight">
                    <MousePointer2 className="h-3 w-3 text-primary opacity-60" />
                    {link.usageCount || 0}
                  </div>
                  <span className="font-black text-[9px] text-muted-foreground uppercase tracking-widest opacity-50">
                    Insights
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 font-black text-xs leading-none tracking-tight">
                    <Calendar className="h-3 w-3 text-muted-foreground/60" />
                    {link.createdAt
                      ? format(new Date(link.createdAt), "MMM d")
                      : "N/A"}
                  </div>
                  <span className="font-black text-[9px] text-muted-foreground uppercase tracking-widest opacity-50">
                    Deployed
                  </span>
                </div>
              </TableCell>
              <TableCell className="pr-8 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        className="h-10 w-10 rounded-2xl text-muted-foreground hover:bg-muted/50"
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
                      onClick={() => handleOpen(link)}
                    >
                      <ExternalLink className="h-4 w-4 opacity-50" /> Navigate
                      Home
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer gap-3 rounded-lg py-2 font-semibold text-xs"
                      onClick={() => {
                        setDialogLink(link);
                        setDialogMode("view");
                      }}
                    >
                      <Info className="mr-2 h-4 w-4 opacity-50" /> Asset
                      Intelligence
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer gap-3 rounded-lg py-2 font-semibold text-xs"
                      onClick={() => {
                        setDialogLink(link);
                        setDialogMode("edit");
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4 opacity-50" /> Refine
                      Metadata
                    </DropdownMenuItem>
                    <div className="mx-2 my-1 h-px bg-border/50" />
                    <DropdownMenuItem
                      className="cursor-pointer gap-3 rounded-lg py-2 font-semibold text-destructive text-xs focus:text-destructive"
                      onClick={() =>
                        deleteMutation.mutate({ data: { id: link.id, teamId } })
                      }
                    >
                      <Trash2 className="h-4 w-4 opacity-50" /> Terminate Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// =============================================================================
// CompactView
// =============================================================================
export function CompactView({
  links,
  teamId,
  selectedLinks,
  onToggleSelect,
}: ViewProps) {
  const { handleOpen } = useLinkMutations(teamId);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {links.map((link) => (
        <CompactItem
          isSelected={selectedLinks?.has(link.id) ?? false}
          key={link.id}
          link={link}
          onOpen={handleOpen}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}

interface CompactItemProps {
  isSelected: boolean;
  link: LinkWithRelations;
  onOpen: (link: LinkWithRelations) => void;
  onToggleSelect?: (linkId: string) => void;
}

const CompactItem = memo(function CompactItem({
  link,
  isSelected,
  onToggleSelect,
  onOpen,
}: CompactItemProps) {
  return (
    <button
      className={cn(
        "group relative flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-xl border border-border/50 bg-card/40 p-3 text-left backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card hover:shadow-lg",
        isSelected &&
          "bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      onClick={() => onOpen(link)}
      type="button"
    >
      {/* Access Indicator Dots */}
      <div
        className={cn(
          "absolute top-0 right-0 -mt-1 -mr-1 flex h-8 w-8 items-center justify-center rounded-full opacity-[0.05]",
          link.visibility === "public" ? "bg-blue-500" : "bg-amber-500"
        )}
      />

      {onToggleSelect && (
        <button
          className={cn(
            "absolute -top-1 -left-1 z-10 flex h-6 w-6 items-center justify-center rounded-md border shadow-md transition-all",
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "scale-90 border-border/50 bg-background text-muted-foreground/30 opacity-0 hover:scale-100 group-hover:opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(link.id);
          }}
          type="button"
        >
          {isSelected ? (
            <CheckSquare className="h-3 w-3" />
          ) : (
            <Square className="h-3 w-3" />
          )}
        </button>
      )}
      <div className="flex items-center gap-3 overflow-hidden">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-105",
            link.visibility === "public"
              ? "border-blue-500/20 bg-blue-500/5 text-blue-600"
              : "border-amber-500/20 bg-amber-500/5 text-amber-600"
          )}
        >
          {link.visibility === "public" ? (
            <Globe2 className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
        </div>
        <div className="flex flex-col overflow-hidden">
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="block truncate font-bold text-[12px] leading-tight tracking-tight transition-colors group-hover:text-primary">
                  {link.title}
                </span>
              }
            />
            <TooltipContent className="max-w-xs break-all rounded-lg p-2.5 shadow-xl">
              <p className="font-bold text-[11px]">{link.title}</p>
              <p className="mt-0.5 truncate font-medium text-[9px] opacity-60">
                {link.url}
              </p>
            </TooltipContent>
          </Tooltip>
          <div className="mt-0.5 flex items-center gap-1.5 overflow-hidden">
            <span className="truncate font-bold text-[8px] text-primary uppercase tracking-wider">
              {link.application?.tla || "GLOBAL"}
            </span>
            <span className="font-bold text-[8px] text-muted-foreground/20">
              •
            </span>
            <span className="truncate font-bold text-[8px] text-muted-foreground/40 uppercase tracking-wider">
              {link.usageCount || 0} INSIGHTS
            </span>
          </div>
        </div>
      </div>
    </button>
  );
});
