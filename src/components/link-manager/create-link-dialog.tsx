import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe2, Lock, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { getTeamApplications } from "@/app/actions/applications";
import { createLink, getLinkCategories, updateLink } from "@/app/actions/links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { LinkWithRelations } from "@/db/schema/links";
import { cn } from "@/lib/utils";
import { CreateLinkSchema } from "@/lib/zod/links.schema";

type FormData = z.infer<typeof CreateLinkSchema>;

interface Application {
  applicationName: string;
  id: string;
}

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
      <Label className="text-xs">Tags</Label>
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{titleText} Link</DialogTitle>
          <DialogDescription>
            {isView ? "Resource details." : "Share with your team."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="u">URL</Label>
              <Input id="u" {...form.register("url")} disabled={isView} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="t">Title</Label>
              <Input id="t" {...form.register("title")} disabled={isView} />
            </div>
          </div>
          <Controller
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <VisibilitySelector disabled={isView} field={field} />
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>App</Label>
              <Controller
                control={form.control}
                name="applicationId"
                render={({ field }) => (
                  <Select
                    disabled={isView}
                    onValueChange={field.onChange}
                    value={field.value || "none"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {apps?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.applicationName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    disabled={isView}
                    onValueChange={field.onChange}
                    value={field.value || "none"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {cats?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
          <Textarea
            placeholder="Notes"
            {...form.register("description")}
            disabled={isView}
          />
          <DialogFooter>
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
