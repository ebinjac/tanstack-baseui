import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  Bell,
  CheckCircle2,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  MessageSquare,
  Star,
  Zap,
} from "lucide-react";
import { useEffect } from "react";
import type { FieldValues } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createTurnoverEntry,
  updateTurnoverEntry,
} from "@/app/actions/turnover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Application } from "@/db/schema/teams";
import type { TurnoverEntryWithDetails } from "@/db/schema/turnover";
import { turnoverKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type {
  CreateTurnoverEntryInput,
  TurnoverSection,
} from "@/lib/zod/turnover.schema";
import {
  CreateTurnoverEntrySchema,
  SECTION_CONFIG,
} from "@/lib/zod/turnover.schema";

const RFC_STATUS_OPTIONS = [
  "Draft",
  "In Progress",
  "Pending Approval",
  "Approved",
  "Rejected",
  "Implemented",
  "Cancelled",
] as const;

type RfcStatus = (typeof RFC_STATUS_OPTIONS)[number];

const SECTION_ICONS: Record<
  TurnoverSection,
  React.ComponentType<{ className?: string }>
> = {
  RFC: CheckCircle2,
  INC: AlertCircle,
  ALERTS: Bell,
  MIM: Zap,
  COMMS: MessageSquare,
  FYI: HelpCircle,
};

function getRfcStatusColor(status: string): string {
  if (status === "Approved" || status === "Implemented") {
    return "bg-green-500";
  }
  if (status === "Rejected" || status === "Cancelled") {
    return "bg-red-500";
  }
  if (status === "In Progress" || status === "Pending Approval") {
    return "bg-blue-500";
  }
  return "bg-slate-400";
}

function buildEditFormValues(teamId: string, entry: TurnoverEntryWithDetails) {
  return {
    teamId,
    applicationId: entry.applicationId,
    section: entry.section,
    title: entry.title,
    description: entry.description || "",
    comments: entry.comments || "",
    isImportant: entry.isImportant,
    rfcNumber: entry.rfcDetails?.rfcNumber || "",
    rfcStatus: (entry.rfcDetails?.rfcStatus ?? "") as RfcStatus,
    validatedBy: entry.rfcDetails?.validatedBy || "",
    incidentNumber: entry.incDetails?.incidentNumber || "",
    mimLink: entry.mimDetails?.mimLink || "",
    mimSlackLink: entry.mimDetails?.mimSlackLink || "",
    emailSubject: entry.commsDetails?.emailSubject || "",
    slackLink: entry.commsDetails?.slackLink || "",
  };
}

export function buildItsmFormValues(
  teamId: string,
  section: TurnoverSection,
  record: ItsmRecord
) {
  const data = record.rawData;
  return {
    teamId,
    applicationId: "", // User must select
    section,
    title: record.externalId,
    description: data.short_description || data.description || "",
    comments: data.description || "",
    isImportant: false,
    rfcNumber: record.type === "RFC" ? record.externalId : "",
    rfcStatus: (data.state ?? "") as RfcStatus,
    validatedBy: data.assignment_group || "",
    incidentNumber: record.type === "INC" ? record.externalId : "",
    mimLink: "",
    mimSlackLink: "",
    emailSubject: "",
    slackLink: "",
  };
}

export interface ItsmRecord {
  applicationId?: string | null;
  externalId: string;
  id: string;
  rawData: {
    short_description?: string;
    description?: string;
    state?: string;
    assignment_group?: string;
    opened_at?: string;
    priority?: string;
    [key: string]: string | number | boolean | null | undefined;
  };
  type: "RFC" | "INC";
}

interface EntryDialogProps {
  applicationId: string;
  editEntry?: TurnoverEntryWithDetails | null;
  groupApplications?: Application[];
  initialData?: ItsmRecord | null;
  isGrouped?: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  section: TurnoverSection;
  teamId: string;
}

export function EntryDialog({
  open,
  onOpenChange,
  teamId,
  applicationId,
  section,
  editEntry,
  isGrouped = false,
  groupApplications = [],
  initialData,
}: EntryDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editEntry;

  const sectionConfig = SECTION_CONFIG[section];
  const SectionIcon = SECTION_ICONS[section];

  const form = useForm({
    resolver: zodResolver(CreateTurnoverEntrySchema),
    defaultValues: {
      teamId,
      applicationId,
      section,
      title: "",
      description: "",
      comments: "",
      isImportant: false,
      rfcNumber: "",
      rfcStatus: undefined,
      validatedBy: "",
      incidentNumber: "",
      mimLink: "",
      mimSlackLink: "",
      emailSubject: "",
      slackLink: "",
    },
  });

  // Reset form when dialog opens or editEntry changes
  useEffect(() => {
    if (open) {
      if (editEntry) {
        form.reset(buildEditFormValues(teamId, editEntry));
      } else if (initialData) {
        form.reset(buildItsmFormValues(teamId, section, initialData));
      } else {
        // For new entries in a group, default to the first application
        const defaultAppId =
          isGrouped && groupApplications.length > 0
            ? groupApplications[0].id
            : applicationId;

        form.reset({
          teamId,
          applicationId: defaultAppId,
          section,
          title: "",
          description: "",
          comments: "",
          isImportant: false,
          rfcNumber: "",
          rfcStatus: undefined,
          validatedBy: "",
          incidentNumber: "",
          mimLink: "",
          mimSlackLink: "",
          emailSubject: "",
          slackLink: "",
        });
      }
    }
  }, [
    open,
    editEntry,
    form,
    teamId,
    applicationId,
    section,
    isGrouped,
    groupApplications,
    initialData,
  ]);

  const createMutation = useMutation({
    mutationFn: (data: CreateTurnoverEntryInput) =>
      createTurnoverEntry({ data }),
    onSuccess: () => {
      toast.success("Entry created successfully");
      queryClient.invalidateQueries({
        queryKey: turnoverKeys.entries.all(teamId),
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create entry");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateTurnoverEntryInput & { id: string }) =>
      updateTurnoverEntry({ data }),
    onSuccess: () => {
      toast.success("Entry updated successfully");
      queryClient.invalidateQueries({
        queryKey: turnoverKeys.entries.all(teamId),
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update entry");
    },
  });

  const onSubmit = (data: FieldValues) => {
    const entryData = data as CreateTurnoverEntryInput;
    if (isEditing && editEntry) {
      updateMutation.mutate({ ...entryData, id: editEntry.id });
    } else {
      createMutation.mutate(entryData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="min-w-[750px] max-w-2xl gap-0 overflow-hidden p-0">
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <SectionIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <DialogTitle className="font-semibold text-lg">
              {isEditing ? "Modify Entry" : `New ${sectionConfig.name}`}
            </DialogTitle>
            <p className="mt-0.5 text-muted-foreground text-xs">
              {isEditing
                ? "Update details for this entry."
                : `Log a new ${sectionConfig.shortName.toLowerCase()} record.`}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form
          className="flex max-h-[80vh] flex-col"
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log("Form validation errors:", errors);
            toast.error("Please verify all required fields");
          })}
        >
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {/* Application Selector (Only for grouped entries) */}
            {isGrouped && groupApplications.length > 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                    <Layers className="h-3 w-3 text-primary" />
                  </div>
                  <h4 className="font-bold text-[11px] text-muted-foreground uppercase tracking-widest">
                    Application
                  </h4>
                </div>
                <div className="space-y-2 rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                  <Label
                    className="font-semibold text-xs"
                    htmlFor="applicationId"
                  >
                    Select Application{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <p className="mb-2 text-muted-foreground text-xs">
                    This entry will be logged under the selected application.
                  </p>
                  <Controller
                    control={form.control}
                    name="applicationId"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="h-11 bg-background text-sm">
                          <SelectValue placeholder="Select application">
                            {field.value && (
                              <div className="flex items-center gap-2">
                                <span className="font-bold">
                                  {
                                    groupApplications.find(
                                      (a) => a.id === field.value
                                    )?.tla
                                  }
                                </span>
                                <span className="text-muted-foreground">
                                  {
                                    groupApplications.find(
                                      (a) => a.id === field.value
                                    )?.applicationName
                                  }
                                </span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {groupApplications.map((app) => (
                            <SelectItem key={app.id} value={app.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{app.tla}</span>
                                <span className="text-muted-foreground text-xs">
                                  {app.applicationName}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Section I: Core Identifiers */}
            {(section === "RFC" ||
              section === "INC" ||
              section === "MIM" ||
              section === "ALERTS" ||
              section === "COMMS") && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                    <Activity className="h-3 w-3 text-primary" />
                  </div>
                  <h4 className="font-bold text-[11px] text-muted-foreground uppercase tracking-widest">
                    Details
                  </h4>
                </div>
                <div
                  className={cn(
                    "grid gap-4 rounded-xl border bg-muted/5 p-4",
                    section === "RFC" ? "grid-cols-3" : "grid-cols-2"
                  )}
                >
                  {section === "RFC" && (
                    <>
                      <div className="space-y-2">
                        <Label
                          className="font-semibold text-xs"
                          htmlFor="rfcNumber"
                        >
                          RFC Number <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          className="h-10 rounded-lg border-muted-foreground/15 bg-background font-mono text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                          id="rfcNumber"
                          placeholder="CHG..."
                          {...form.register("rfcNumber")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          className="font-semibold text-xs"
                          htmlFor="rfcStatus"
                        >
                          Status <span className="text-destructive">*</span>
                        </Label>
                        <Controller
                          control={form.control}
                          name="rfcStatus"
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Select status">
                                  {field.value && (
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={cn(
                                          "h-2 w-2 rounded-full",
                                          getRfcStatusColor(field.value ?? "")
                                        )}
                                      />
                                      {field.value}
                                    </div>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {RFC_STATUS_OPTIONS.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={cn(
                                          "h-2 w-2 rounded-full",
                                          getRfcStatusColor(status)
                                        )}
                                      />
                                      {status}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          className="font-semibold text-xs"
                          htmlFor="validatedBy"
                        >
                          Validated By{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          className="h-9 text-sm"
                          id="validatedBy"
                          placeholder="Validator name..."
                          {...form.register("validatedBy")}
                        />
                      </div>
                    </>
                  )}

                  {section === "INC" && (
                    <div className="space-y-2 sm:col-span-2">
                      <Label
                        className="font-semibold text-xs"
                        htmlFor="incidentNumber"
                      >
                        Incident Number{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        className="h-10 font-bold font-mono text-lg"
                        id="incidentNumber"
                        placeholder="INC..."
                        {...form.register("incidentNumber")}
                      />
                    </div>
                  )}

                  {section === "ALERTS" && (
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="font-semibold text-xs" htmlFor="title">
                        Alert Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        className="h-9 text-sm"
                        id="title"
                        placeholder="Alert title..."
                        {...form.register("title")}
                      />
                    </div>
                  )}

                  {section === "MIM" && (
                    <>
                      <div className="space-y-2 sm:col-span-2">
                        <Label
                          className="font-semibold text-xs"
                          htmlFor="mimLink"
                        >
                          Bridge Link{" "}
                          <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          className="h-9 text-sm"
                          id="mimLink"
                          placeholder="https://..."
                          {...form.register("mimLink")}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label
                          className="font-semibold text-xs"
                          htmlFor="mimSlackLink"
                        >
                          Slack Channel
                        </Label>
                        <Input
                          className="h-9 text-sm"
                          id="mimSlackLink"
                          placeholder="Slack link..."
                          {...form.register("mimSlackLink")}
                        />
                      </div>
                    </>
                  )}

                  {section === "COMMS" && (
                    <>
                      <div className="space-y-2">
                        <Label
                          className="font-semibold text-xs"
                          htmlFor="emailSubject"
                        >
                          Subject{" "}
                          <span className="text-[10px] text-muted-foreground">
                            (or Slack)
                          </span>
                        </Label>
                        <Input
                          className="h-9 font-medium text-sm"
                          id="emailSubject"
                          placeholder="Email subject..."
                          {...form.register("emailSubject")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          className="font-semibold text-xs"
                          htmlFor="slackLink"
                        >
                          Slack Thread{" "}
                          <span className="text-[10px] text-muted-foreground">
                            (or Subject)
                          </span>
                        </Label>
                        <Input
                          className="h-9 font-medium text-sm"
                          id="slackLink"
                          placeholder="Thread link..."
                          {...form.register("slackLink")}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Section II: Narrative Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                  <FileText className="h-3 w-3 text-primary" />
                </div>
                <h4 className="font-bold text-[11px] text-muted-foreground uppercase tracking-widest">
                  Content
                </h4>
              </div>
              <div className="space-y-4 rounded-xl border bg-muted/5 p-4">
                <div className="space-y-2">
                  <Label
                    className="font-semibold text-xs"
                    htmlFor="description"
                  >
                    Description{" "}
                    {section === "FYI" && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  <Textarea
                    className="border-muted-foreground/10 text-sm focus:ring-1"
                    id="description"
                    placeholder="Brief overview..."
                    rows={section === "FYI" ? 4 : 2}
                    {...form.register("description")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold text-xs" htmlFor="comments">
                    Detailed Comments
                  </Label>
                  <div className="overflow-hidden rounded-lg border bg-background">
                    <RichTextEditor
                      className="min-h-[140px]"
                      disabled={isPending}
                      onChange={(value) => form.setValue("comments", value)}
                      placeholder="Additional details..."
                      value={form.watch("comments") || ""}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section III: Toggle */}
            <div
              className={cn(
                "flex items-center justify-between rounded-xl border p-4 transition-all duration-200",
                form.watch("isImportant")
                  ? "border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50/50 dark:border-orange-800/30 dark:from-orange-950/30 dark:to-amber-950/20"
                  : "bg-muted/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200",
                    form.watch("isImportant")
                      ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md shadow-orange-500/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Star
                    className={cn(
                      "h-4 w-4 transition-transform",
                      form.watch("isImportant") && "scale-110 fill-current"
                    )}
                  />
                </div>
                <div>
                  <p className="font-bold text-sm">Mark as Important</p>
                  <p className="text-[10px] text-muted-foreground">
                    Highlight for urgent attention
                  </p>
                </div>
              </div>
              <Switch
                checked={form.watch("isImportant")}
                className="data-[state=checked]:bg-orange-500"
                id="isImportant"
                onCheckedChange={(checked) =>
                  form.setValue("isImportant", checked)
                }
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t px-6 py-4">
            <Button
              className="h-9 px-4"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button className="h-9 px-6" disabled={isPending} type="submit">
              {isPending && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              {isEditing ? "Save Updates" : "Create Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
