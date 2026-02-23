import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe2, Lock, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { getTeamApplications } from "@/app/actions/applications";
import {
  createLink,
  createLinkCategory,
  getLinkCategories,
  updateLink,
} from "@/app/actions/links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { LinkWithRelations } from "@/db/schema/links";
import { cn } from "@/lib/utils";
import { CreateLinkSchema } from "@/lib/zod/links.schema";

type FormData = z.infer<typeof CreateLinkSchema>;

interface Application {
  applicationName: string;
  id: string;
  tla?: string | null;
}

const getAppLabel = (a: Application) => {
  return a.tla ? `${a.tla} - ${a.applicationName}` : a.applicationName;
};

interface Category {
  id: string;
  name: string;
}

const VisibilitySelector = ({
  field,
  disabled,
}: {
  field: { value: string; onChange: (val: string) => void };
  disabled: boolean;
}) => (
  <RadioGroup
    className="grid grid-cols-2 gap-4"
    disabled={disabled}
    onValueChange={field.onChange}
    value={field.value}
  >
    {["private", "public"].map((v) => (
      <div className="relative" key={v}>
        <RadioGroupItem className="sr-only" id={v} value={v} />
        <Label
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-accent",
            field.value === v && "border-primary bg-primary/5"
          )}
          htmlFor={v}
        >
          {v === "private" ? (
            <Lock className="h-4 w-4" />
          ) : (
            <Globe2 className="h-4 w-4" />
          )}
          <div className="flex flex-col">
            <span className="font-medium text-sm capitalize">{v}</span>
            <span className="text-muted-foreground text-xs">
              {v === "private" ? "Only you" : "Everyone"}
            </span>
          </div>
        </Label>
      </div>
    ))}
  </RadioGroup>
);

const TagInput = ({
  tags,
  onAdd,
  onRemove,
  disabled,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  disabled: boolean;
}) => {
  const [val, setVal] = useState("");
  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && val.trim()) {
      e.preventDefault();
      onAdd(val.trim());
      setVal("");
    }
  };

  const placeholder = disabled || tags.length > 0 ? "" : "Add tag...";

  return (
    <div className="grid gap-2">
      <div className="space-y-1">
        <Label className="font-medium text-sm">Tags</Label>
        <p className="text-[13px] text-muted-foreground">
          Help others discover this link with keywords.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 rounded-md border p-2">
        {tags.map((t) => (
          <Badge className="gap-1" key={t} variant="secondary">
            {t}
            {!disabled && (
              <button onClick={() => onRemove(t)} type="button">
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <input
          className="flex-1 bg-transparent text-sm outline-none"
          disabled={disabled}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          value={val}
        />
      </div>
    </div>
  );
};

export function CreateLinkDialog({
  teamId,
  trigger,
  link,
  mode = "create",
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  teamId: string;
  trigger?: React.ReactNode;
  link?: LinkWithRelations;
  mode?: "create" | "edit" | "view";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (val: boolean) => {
    if (setControlledOpen) {
      setControlledOpen(val);
    } else {
      setInternalOpen(val);
    }
  };
  const queryClient = useQueryClient();
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const createCatMut = useMutation({
    mutationFn: (name: string) =>
      createLinkCategory({ data: { teamId, name } }),
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ["cats", teamId] });
      form.setValue("categoryId", newCat.id);
      setIsCreatingCat(false);
      setNewCatName("");
      toast.success("Category created");
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(CreateLinkSchema),
    defaultValues: {
      teamId,
      visibility: link?.visibility || "private",
      title: link?.title || "",
      url: link?.url || "",
      description: link?.description || "",
      tags: link?.tags || [],
      categoryId: link?.categoryId || null,
      applicationId: link?.applicationId || null,
    },
  });

  useEffect(() => {
    if (open && link) {
      form.reset({
        teamId,
        visibility: link.visibility || "private",
        title: link.title || "",
        url: link.url || "",
        description: link.description ?? undefined,
        tags: link.tags || [],
        categoryId: link.categoryId || null,
        applicationId: link.applicationId || null,
      });
    }
  }, [open, link, form.reset, teamId]);

  const { data: apps } = useQuery<Application[]>({
    queryKey: ["apps", teamId],
    queryFn: () =>
      getTeamApplications({ data: { teamId } }) as Promise<Application[]>,
    enabled: open,
  });

  const { data: cats } = useQuery<Category[]>({
    queryKey: ["cats", teamId],
    queryFn: () =>
      getLinkCategories({ data: { teamId } }) as Promise<Category[]>,
    enabled: open,
  });

  const mut = useMutation({
    mutationFn: (data: FormData) =>
      mode === "edit" && link
        ? updateLink({ data: { id: link.id, ...data } })
        : createLink({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links", teamId] });
      toast.success(mode === "edit" ? "Updated" : "Created");
      setOpen(false);
    },
  });

  const onSubmit = (data: FormData) => {
    const categoryId = data.categoryId === "none" ? null : data.categoryId;
    const applicationId =
      data.applicationId === "none" ? null : data.applicationId;
    mut.mutate({ ...data, categoryId, applicationId });
  };

  const isView = mode === "view";
  let titleText = "Add";
  if (mode === "edit") {
    titleText = "Edit";
  } else if (isView) {
    titleText = "Details";
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
      {!trigger && mode === "create" && (
        <DialogTrigger
          render={
            (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Link
              </Button>
            ) as React.ReactElement
          }
        />
      )}
      <DialogContent className="min-w-4xl">
        <DialogHeader>
          <DialogTitle>{titleText} Link</DialogTitle>
          <DialogDescription>
            {isView ? "Resource details." : "Share with your team."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <div className="space-y-1">
                <Label htmlFor="u">URL</Label>
                <p className="text-[13px] text-muted-foreground">
                  The web address for this link.
                </p>
              </div>
              <Input
                id="u"
                {...form.register("url")}
                disabled={isView}
                placeholder="https://"
              />
            </div>
            <div className="grid gap-2">
              <div className="space-y-1">
                <Label htmlFor="t">Title</Label>
                <p className="text-[13px] text-muted-foreground">
                  A clear, descriptive name.
                </p>
              </div>
              <Input
                id="t"
                {...form.register("title")}
                disabled={isView}
                placeholder="e.g. Design Spec"
              />
            </div>
          </div>
          <Controller
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <VisibilitySelector disabled={isView} field={field} />
            )}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2">
              <div className="space-y-1">
                <Label>App</Label>
                <p className="text-[13px] text-muted-foreground">
                  Link to an application (optional).
                </p>
              </div>
              <Controller
                control={form.control}
                name="applicationId"
                render={({ field }) => {
                  const selectedApp = apps?.find((a) => a.id === field.value);
                  const displayValue = selectedApp
                    ? getAppLabel(selectedApp)
                    : "none";
                  return (
                    <Combobox
                      disabled={isView}
                      onValueChange={(val) => {
                        if (val === "none" || !val) {
                          field.onChange(null);
                        } else {
                          const app = apps?.find((a) => getAppLabel(a) === val);
                          field.onChange(app ? app.id : null);
                        }
                      }}
                      value={displayValue}
                    >
                      <ComboboxInput
                        placeholder={isView ? "None" : "Select application..."}
                        showClear={
                          !!field.value && field.value !== "none" && !isView
                        }
                      />
                      <ComboboxContent className="w-[--anchor-width] min-w-48">
                        <ComboboxList>
                          <ComboboxItem value="none">None</ComboboxItem>
                          {apps?.map((a) => {
                            const label = getAppLabel(a);
                            return (
                              <ComboboxItem key={a.id} value={label}>
                                {label}
                              </ComboboxItem>
                            );
                          })}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  );
                }}
              />
            </div>
            <div className="grid gap-2">
              <div className="space-y-1">
                <Label>Category</Label>
                <p className="text-[13px] text-muted-foreground">
                  Group similar links together (optional).
                </p>
              </div>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => {
                  const selectedCat = cats?.find((c) => c.id === field.value);
                  const displayValue = selectedCat ? selectedCat.name : "none";
                  return (
                    <Combobox
                      disabled={isView}
                      onValueChange={(val) => {
                        if (val === "none" || !val) {
                          field.onChange(null);
                        } else {
                          const cat = cats?.find((c) => c.name === val);
                          field.onChange(cat ? cat.id : null);
                        }
                      }}
                      value={displayValue}
                    >
                      <ComboboxInput
                        placeholder={isView ? "None" : "Select category..."}
                        showClear={
                          !!field.value && field.value !== "none" && !isView
                        }
                      />
                      <ComboboxContent className="w-[--anchor-width] min-w-48">
                        <ComboboxList>
                          <ComboboxItem value="none">None</ComboboxItem>
                          {cats?.map((c) => (
                            <ComboboxItem key={c.id} value={c.name}>
                              {c.name}
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                        {!isView && (
                          <div className="border-t p-2">
                            {isCreatingCat ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  autoFocus
                                  className="h-8"
                                  onChange={(e) =>
                                    setNewCatName(e.target.value)
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (
                                      e.key === "Enter" &&
                                      newCatName.trim()
                                    ) {
                                      e.preventDefault();
                                      createCatMut.mutate(newCatName.trim());
                                    } else if (e.key === "Escape") {
                                      e.preventDefault();
                                      setIsCreatingCat(false);
                                    }
                                  }}
                                  placeholder="New category name..."
                                  value={newCatName}
                                />
                                <Button
                                  className="h-8 w-8 shrink-0 px-0"
                                  disabled={
                                    !newCatName.trim() || createCatMut.isPending
                                  }
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    createCatMut.mutate(newCatName.trim());
                                  }}
                                  size="sm"
                                  type="button"
                                >
                                  {createCatMut.isPending ? (
                                    "..."
                                  ) : (
                                    <Plus className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <Button
                                className="w-full justify-start text-xs"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsCreatingCat(true);
                                }}
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                <Plus className="mr-2 h-3 w-3" />
                                Quick Add Category
                              </Button>
                            )}
                          </div>
                        )}
                      </ComboboxContent>
                    </Combobox>
                  );
                }}
              />
            </div>
          </div>
          <TagInput
            disabled={isView}
            onAdd={(t) =>
              form.setValue("tags", [...(form.getValues("tags") || []), t])
            }
            onRemove={(t) =>
              form.setValue(
                "tags",
                (form.getValues("tags") || []).filter((x) => x !== t)
              )
            }
            tags={form.watch("tags") || []}
          />
          <div className="grid gap-2">
            <div className="space-y-1">
              <Label>Notes</Label>
              <p className="text-[13px] text-muted-foreground">
                Add any extra context or instructions here (optional).
              </p>
            </div>
            <Textarea
              className="resize-none"
              disabled={isView}
              placeholder="e.g. Access via VPN only..."
              rows={3}
              {...form.register("description")}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              {isView ? "Close" : "Cancel"}
            </Button>
            {!isView && (
              <Button disabled={mut.isPending} type="submit">
                {mut.isPending ? "Saving..." : "Save"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
