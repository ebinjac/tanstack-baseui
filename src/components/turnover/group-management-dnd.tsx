"use client";

import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FolderOpen,
  FolderPlus,
  GripVertical,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { syncGroupStructure } from "@/app/actions/application-groups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ApplicationGroup } from "@/db/schema/application-groups";
import type { Application } from "@/db/schema/teams";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

type GroupWithApps = ApplicationGroup & { applications: Application[] };

interface DndGroup {
  color: string;
  id: string;
  isNew?: boolean;
  items: Application[];
  name: string;
}

interface GroupManagementDndProps {
  initialGroups: GroupWithApps[];
  initialUngrouped: Application[];
  onClose?: () => void;
  teamId: string;
}

// ============================================================================
// Constants & Helper Functions
// ============================================================================

const GROUP_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#14b8a6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#a855f7",
];

function generateGroupName(apps: Application[]) {
  if (apps.length === 0) {
    return "New Group";
  }
  return apps.map((a) => a.tla).join("/");
}

function getRandomColor() {
  return GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)];
}

// ============================================================================
// Sortable Application Item
// ============================================================================

interface SortableAppProps {
  app: Application;
}

function SortableApp({ app }: SortableAppProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex cursor-grab items-center gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-sm transition-all hover:border-primary/50 active:cursor-grabbing",
        isDragging && "shadow-lg ring-2 ring-primary"
      )}
    >
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      <Badge className="shrink-0 font-bold text-xs" variant="secondary">
        {app.tla}
      </Badge>
      <span className="flex-1 truncate text-muted-foreground text-xs">
        {app.applicationName}
      </span>
    </div>
  );
}

// ============================================================================
// Droppable Group Container
// ============================================================================

interface DroppableGroupProps {
  group: DndGroup;
  onColorChange: (color: string) => void;
  onRemove: () => void;
}

function DroppableGroup({
  group,
  onRemove,
  onColorChange,
}: DroppableGroupProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: group.id,
    data: { type: "group", group },
  });

  const isInvalid = group.items.length < 2;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card/50 shadow-sm transition-all",
        isOver && "border-primary/50 bg-primary/5 ring-2 ring-primary",
        isInvalid &&
          !isOver &&
          "border-amber-400/50 bg-amber-50/10 dark:bg-amber-950/10"
      )}
      ref={setNodeRef}
      style={{
        borderLeftWidth: 4,
        borderLeftColor: isInvalid ? "#f59e0b" : group.color,
      }}
    >
      {/* Group Header */}
      <div
        className={cn(
          "flex items-center justify-between border-b px-4 py-3",
          isInvalid ? "bg-amber-50/50 dark:bg-amber-950/30" : "bg-muted/30"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <FolderOpen
            className="h-5 w-5 shrink-0"
            style={{ color: isInvalid ? "#f59e0b" : group.color }}
          />
          <div className="min-w-0">
            <h4 className="truncate font-semibold text-sm">{group.name}</h4>
            <p
              className={cn(
                "text-xs",
                isInvalid
                  ? "font-medium text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              )}
            >
              {isInvalid
                ? `Needs ${2 - group.items.length} more app${2 - group.items.length > 1 ? "s" : ""}`
                : `${group.items.length} application${group.items.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Color Picker */}
          <div className="flex items-center gap-1">
            {GROUP_COLORS.slice(0, 5).map((c) => (
              <button
                className={cn(
                  "h-4 w-4 rounded-full transition-transform hover:scale-110",
                  group.color === c && "ring-2 ring-foreground ring-offset-1"
                )}
                key={c}
                onClick={() => onColorChange(c)}
                style={{ backgroundColor: c }}
                type="button"
              />
            ))}
          </div>
          <Separator className="h-5" orientation="vertical" />
          <Button
            className="text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            size="icon-sm"
            variant="ghost"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Applications List */}
      <SortableContext
        items={group.items.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="min-h-[100px] space-y-2 p-3">
          {group.items.length === 0 && (
            <div
              className={cn(
                "flex h-[80px] flex-col items-center justify-center rounded-lg border-2 border-dashed text-xs transition-colors",
                isOver
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-amber-300 bg-amber-50/50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
              )}
            >
              {isOver ? (
                "Drop here!"
              ) : (
                <>
                  <span className="font-medium">Drag 2+ apps here</span>
                  <span className="text-[10px] opacity-70">
                    to form a group
                  </span>
                </>
              )}
            </div>
          )}
          {group.items.length === 1 && (
            <>
              {group.items.map((app) => (
                <SortableApp app={app} key={app.id} />
              ))}
              <div
                className={cn(
                  "flex h-[50px] items-center justify-center rounded-lg border-2 border-dashed text-xs transition-colors",
                  isOver
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-amber-300 bg-amber-50/50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                )}
              >
                {isOver ? "Drop here!" : "Add 1 more app"}
              </div>
            </>
          )}
          {group.items.length > 1 &&
            group.items.map((app) => <SortableApp app={app} key={app.id} />)}
        </div>
      </SortableContext>
    </div>
  );
}

// ============================================================================
// Droppable Ungrouped Container
// ============================================================================

interface DroppableUngroupedProps {
  items: Application[];
}

function DroppableUngrouped({ items }: DroppableUngroupedProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "ungrouped",
    data: { type: "ungrouped" },
  });

  return (
    <div
      className={cn(
        "min-h-[200px] space-y-2 rounded-xl border bg-muted/10 p-4 transition-all",
        isOver && "border-primary/50 bg-primary/5 ring-2 ring-primary"
      )}
      ref={setNodeRef}
    >
      <SortableContext
        items={items.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.length === 0 ? (
          <div
            className={cn(
              "flex h-full min-h-[150px] flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 text-muted-foreground transition-colors",
              isOver ? "border-primary bg-primary/10 text-primary" : ""
            )}
          >
            {isOver ? (
              <p className="font-medium text-sm">Drop here to ungroup</p>
            ) : (
              <>
                <p className="font-medium text-sm">
                  All applications are grouped!
                </p>
                <p className="text-xs">🎉</p>
              </>
            )}
          </div>
        ) : (
          items.map((app) => <SortableApp app={app} key={app.id} />)
        )}
      </SortableContext>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function GroupManagementDragDrop({
  teamId,
  initialGroups,
  initialUngrouped,
  onClose,
}: GroupManagementDndProps) {
  const queryClient = useQueryClient();

  // State
  const [groups, setGroups] = useState<DndGroup[]>(() =>
    initialGroups.map((g) => ({
      id: g.id,
      name: g.name,
      items: g.applications,
      color: g.color || getRandomColor(),
    }))
  );
  const [ungrouped, setUngrouped] = useState<Application[]>(initialUngrouped);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // Find active app for overlay
  const activeApp = useMemo(() => {
    if (!activeId) {
      return null;
    }
    const inUngrouped = ungrouped.find((a) => a.id === activeId);
    if (inUngrouped) {
      return inUngrouped;
    }
    for (const g of groups) {
      const inGroup = g.items.find((a) => a.id === activeId);
      if (inGroup) {
        return inGroup;
      }
    }
    return null;
  }, [activeId, ungrouped, groups]);

  // Mutation
  const saveMutation = useMutation({
    mutationFn: (data: {
      teamId: string;
      groups: Array<{
        id: string;
        name: string;
        applicationIds: string[];
        color?: string;
      }>;
    }) => syncGroupStructure({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["application-groups", teamId],
      });
      toast.success("Groups saved successfully!");
      onClose?.();
    },
    onError: () => {
      toast.error("Failed to save groups");
    },
  });

  // Sensors with smaller activation distance for better UX
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find which container an app belongs to
  const findContainer = (appId: UniqueIdentifier): string | null => {
    if (ungrouped.find((a) => a.id === appId)) {
      return "ungrouped";
    }
    for (const g of groups) {
      if (g.items.find((a) => a.id === appId)) {
        return g.id;
      }
    }
    return null;
  };

  // Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeContainer = findContainer(active.id);

    // Determine over container - could be the container itself or an item in it
    let overContainer: string | null = null;

    // Check if over is a group container
    if (over.id === "ungrouped") {
      overContainer = "ungrouped";
    } else if (groups.find((g) => g.id === over.id)) {
      overContainer = over.id as string;
    } else {
      // Over is an app, find its container
      overContainer = findContainer(over.id);
    }

    if (
      !(activeContainer && overContainer) ||
      activeContainer === overContainer
    ) {
      return;
    }

    // Move the app between containers
    const app = activeApp;
    if (!app) {
      return;
    }

    // Remove from source container
    if (activeContainer === "ungrouped") {
      setUngrouped((prev) => prev.filter((a) => a.id !== active.id));
    } else {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === activeContainer) {
            const newItems = g.items.filter((a) => a.id !== active.id);
            return { ...g, items: newItems, name: generateGroupName(newItems) };
          }
          return g;
        })
      );
    }

    // Add to destination container
    if (overContainer === "ungrouped") {
      setUngrouped((prev) => [...prev, app]);
    } else {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === overContainer) {
            const newItems = [...g.items, app];
            return { ...g, items: newItems, name: generateGroupName(newItems) };
          }
          return g;
        })
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      return;
    }

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    // Reordering within same container
    if (
      activeContainer &&
      overContainer &&
      activeContainer === overContainer &&
      active.id !== over.id
    ) {
      if (activeContainer === "ungrouped") {
        const oldIndex = ungrouped.findIndex((a) => a.id === active.id);
        const newIndex = ungrouped.findIndex((a) => a.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          setUngrouped((prev) => arrayMove(prev, oldIndex, newIndex));
        }
      } else {
        setGroups((prev) =>
          prev.map((g) => {
            if (g.id === activeContainer) {
              const oldIndex = g.items.findIndex((a) => a.id === active.id);
              const newIndex = g.items.findIndex((a) => a.id === over.id);
              if (oldIndex !== -1 && newIndex !== -1) {
                const newItems = arrayMove(g.items, oldIndex, newIndex);
                return {
                  ...g,
                  items: newItems,
                  name: generateGroupName(newItems),
                };
              }
            }
            return g;
          })
        );
      }
    }
  };

  const handleCreateGroup = () => {
    const newGroup: DndGroup = {
      id: `new-${crypto.randomUUID()}`,
      name: "New Group",
      items: [],
      color: getRandomColor(),
      isNew: true,
    };
    setGroups((prev) => [newGroup, ...prev]);
  };

  const handleRemoveGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group) {
      setUngrouped((prev) => [...prev, ...group.items]);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    }
  };

  const handleColorChange = (groupId: string, color: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, color } : g))
    );
  };

  const handleSave = () => {
    // Validate: groups must have at least 2 applications
    const validGroups = groups.filter((g) => g.items.length >= 2);
    const invalidGroups = groups.filter(
      (g) => g.items.length < 2 && g.items.length > 0
    );

    if (invalidGroups.length > 0) {
      toast.warning(
        `${invalidGroups.length} group(s) with less than 2 applications will not be saved. A group needs at least 2 applications.`
      );
    }

    // Only save valid groups
    saveMutation.mutate({
      teamId,
      groups: validGroups.map((g) => ({
        id: g.id,
        name: g.name,
        applicationIds: g.items.map((a) => a.id),
        color: g.color,
      })),
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Actions Bar */}
      <div className="flex shrink-0 items-center justify-between border-b bg-background px-6 py-4">
        <Button
          className="gap-2"
          onClick={handleCreateGroup}
          size="sm"
          variant="outline"
        >
          <FolderPlus className="h-4 w-4" />
          Create New Group
        </Button>

        <div className="flex items-center gap-2">
          {onClose && (
            <Button onClick={onClose} size="sm" variant="ghost">
              Cancel
            </Button>
          )}
          <Button
            className="gap-2"
            disabled={saveMutation.isPending}
            onClick={handleSave}
            size="sm"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <DndContext
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDragStart={handleDragStart}
          sensors={sensors}
        >
          <div className="grid min-h-full grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Groups Column */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
                <FolderOpen className="h-4 w-4" />
                Groups ({groups.length})
              </h3>

              {groups.length === 0 ? (
                <button
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/5 p-8 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  onClick={handleCreateGroup}
                  type="button"
                >
                  <FolderPlus className="mb-3 h-12 w-12 opacity-50" />
                  <p className="font-medium">No groups yet</p>
                  <p className="text-xs">Click to create your first group</p>
                </button>
              ) : (
                <div className="space-y-4">
                  {groups.map((group) => (
                    <DroppableGroup
                      group={group}
                      key={group.id}
                      onColorChange={(color) =>
                        handleColorChange(group.id, color)
                      }
                      onRemove={() => handleRemoveGroup(group.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Ungrouped Column */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-muted-foreground text-sm uppercase tracking-wider">
                <Plus className="h-4 w-4" />
                Ungrouped Applications ({ungrouped.length})
              </h3>

              <DroppableUngrouped items={ungrouped} />
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeApp && (
              <div className="flex scale-105 cursor-grabbing items-center gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-xl ring-2 ring-primary">
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                <Badge
                  className="shrink-0 font-bold text-xs"
                  variant="secondary"
                >
                  {activeApp.tla}
                </Badge>
                <span className="truncate text-muted-foreground text-xs">
                  {activeApp.applicationName}
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
