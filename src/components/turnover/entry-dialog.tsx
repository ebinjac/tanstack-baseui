import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type FieldValues, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CheckCircle2,
    AlertCircle,
    Bell,
    Zap,
    MessageSquare,
    HelpCircle,
    Star,
    Loader2,
    FileText,
    Activity,
    Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    CreateTurnoverEntrySchema,
    SECTION_CONFIG,
    type TurnoverSection,
    type CreateTurnoverEntryInput,
} from "@/lib/zod/turnover.schema";
import {
    createTurnoverEntry,
    updateTurnoverEntry,
} from "@/app/actions/turnover";
import type { TurnoverEntryWithDetails } from "@/db/schema/turnover";
import type { Application } from "@/db/schema/teams";

const RFC_STATUS_OPTIONS = [
    "Draft",
    "In Progress",
    "Pending Approval",
    "Approved",
    "Rejected",
    "Implemented",
    "Cancelled",
];

const SECTION_ICONS: Record<TurnoverSection, any> = {
    RFC: CheckCircle2,
    INC: AlertCircle,
    ALERTS: Bell,
    MIM: Zap,
    COMMS: MessageSquare,
    FYI: HelpCircle,
};

interface EntryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamId: string;
    applicationId: string;
    section: TurnoverSection;
    editEntry?: TurnoverEntryWithDetails | null;
    // Group-related props
    isGrouped?: boolean;
    groupApplications?: Application[];
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
}: EntryDialogProps) {
    const queryClient = useQueryClient();
    const isEditing = !!editEntry;

    const sectionConfig = SECTION_CONFIG[section];
    const SectionIcon = SECTION_ICONS[section];

    const form = useForm({
        // @ts-ignore - Type inference issue with Zod default values
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
                form.reset({
                    teamId,
                    applicationId: editEntry.applicationId,
                    section: editEntry.section as TurnoverSection,
                    title: editEntry.title,
                    description: editEntry.description || "",
                    comments: editEntry.comments || "",
                    isImportant: editEntry.isImportant,
                    rfcNumber: editEntry.rfcDetails?.rfcNumber || "",
                    rfcStatus: editEntry.rfcDetails?.rfcStatus as any,
                    validatedBy: editEntry.rfcDetails?.validatedBy || "",
                    incidentNumber: editEntry.incDetails?.incidentNumber || "",
                    mimLink: editEntry.mimDetails?.mimLink || "",
                    mimSlackLink: editEntry.mimDetails?.mimSlackLink || "",
                    emailSubject: editEntry.commsDetails?.emailSubject || "",
                    slackLink: editEntry.commsDetails?.slackLink || "",
                });
            } else {
                // For new entries in a group, default to the first application
                const defaultAppId = isGrouped && groupApplications.length > 0
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
    }, [open, editEntry, form, teamId, applicationId, section, isGrouped, groupApplications]);

    const createMutation = useMutation({
        mutationFn: (data: CreateTurnoverEntryInput) =>
            createTurnoverEntry({ data }),
        onSuccess: () => {
            toast.success("Entry created successfully");
            queryClient.invalidateQueries({ queryKey: ["turnover-entries", teamId] });
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
            queryClient.invalidateQueries({ queryKey: ["turnover-entries", teamId] });
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl min-w-[750px] p-0 gap-0 overflow-hidden">

                {/* Header */}
                <div className="px-6 py-5 border-b flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <SectionIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <DialogTitle className="text-lg font-semibold">
                            {isEditing ? "Modify Entry" : `New ${sectionConfig.name}`}
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {isEditing ? "Update details for this entry." : `Log a new ${sectionConfig.shortName.toLowerCase()} record.`}
                        </p>
                    </div>
                </div>

                {/* Form Body */}
                <form
                    onSubmit={form.handleSubmit(onSubmit, (errors) => {
                        console.log("Form validation errors:", errors);
                        toast.error("Please verify all required fields");
                    })}
                    className="flex flex-col max-h-[80vh]"
                >
                    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                        {/* Application Selector (Only for grouped entries) */}
                        {isGrouped && groupApplications.length > 1 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                                        <Layers className="w-3 h-3 text-primary" />
                                    </div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Application</h4>
                                </div>
                                <div className="p-4 rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 space-y-2">
                                    <Label htmlFor="applicationId" className="text-xs font-semibold">
                                        Select Application <span className="text-destructive">*</span>
                                    </Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        This entry will be logged under the selected application.
                                    </p>
                                    <Controller
                                        name="applicationId"
                                        control={form.control}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger className="h-11 text-sm bg-background">
                                                    <SelectValue placeholder="Select application">
                                                        {field.value && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold">
                                                                    {groupApplications.find(a => a.id === field.value)?.tla}
                                                                </span>
                                                                <span className="text-muted-foreground">
                                                                    {groupApplications.find(a => a.id === field.value)?.applicationName}
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
                        {(section === "RFC" || section === "INC" || section === "MIM" || section === "ALERTS" || section === "COMMS") && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                                        <Activity className="w-3 h-3 text-primary" />
                                    </div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Details</h4>
                                </div>
                                <div className={cn(
                                    "grid gap-4 p-4 rounded-xl border bg-muted/5",
                                    section === "RFC" ? "grid-cols-3" : "grid-cols-2"
                                )}>
                                    {section === "RFC" && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="rfcNumber" className="text-xs font-semibold">
                                                    RFC Number <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="rfcNumber"
                                                    placeholder="CHG..."
                                                    className="font-mono h-10 text-sm bg-background border-muted-foreground/15 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 rounded-lg"
                                                    {...form.register("rfcNumber")}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="rfcStatus" className="text-xs font-semibold">
                                                    Status <span className="text-destructive">*</span>
                                                </Label>
                                                <Controller
                                                    name="rfcStatus"
                                                    control={form.control}
                                                    render={({ field }) => (
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <SelectTrigger className="h-9 text-sm">
                                                                <SelectValue placeholder="Select status">
                                                                    {field.value && (
                                                                        <div className="flex items-center gap-2">
                                                                            <div className={cn(
                                                                                "w-2 h-2 rounded-full",
                                                                                field.value === "Approved" || field.value === "Implemented" ? "bg-green-500" :
                                                                                    field.value === "Rejected" || field.value === "Cancelled" ? "bg-red-500" :
                                                                                        field.value === "In Progress" || field.value === "Pending Approval" ? "bg-blue-500" :
                                                                                            "bg-slate-400"
                                                                            )} />
                                                                            {field.value}
                                                                        </div>
                                                                    )}
                                                                </SelectValue>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {RFC_STATUS_OPTIONS.map((status) => (
                                                                    <SelectItem key={status} value={status}>
                                                                        <div className="flex items-center gap-2">
                                                                            <div className={cn(
                                                                                "w-2 h-2 rounded-full",
                                                                                status === "Approved" || status === "Implemented" ? "bg-green-500" :
                                                                                    status === "Rejected" || status === "Cancelled" ? "bg-red-500" :
                                                                                        status === "In Progress" || status === "Pending Approval" ? "bg-blue-500" :
                                                                                            "bg-slate-400"
                                                                            )} />
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
                                                <Label htmlFor="validatedBy" className="text-xs font-semibold">
                                                    Validated By <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="validatedBy"
                                                    placeholder="Validator name..."
                                                    className="h-9 text-sm"
                                                    {...form.register("validatedBy")}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {section === "INC" && (
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="incidentNumber" className="text-xs font-semibold">
                                                Incident Number <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="incidentNumber"
                                                placeholder="INC..."
                                                className="font-mono h-10 text-lg font-bold"
                                                {...form.register("incidentNumber")}
                                            />
                                        </div>
                                    )}

                                    {section === "ALERTS" && (
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="title" className="text-xs font-semibold">
                                                Alert Title <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="title"
                                                placeholder="Alert title..."
                                                className="h-9 text-sm"
                                                {...form.register("title")}
                                            />
                                        </div>
                                    )}

                                    {section === "MIM" && (
                                        <>
                                            <div className="space-y-2 sm:col-span-2">
                                                <Label htmlFor="mimLink" className="text-xs font-semibold">
                                                    Bridge Link <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="mimLink"
                                                    placeholder="https://..."
                                                    className="h-9 text-sm"
                                                    {...form.register("mimLink")}
                                                />
                                            </div>
                                            <div className="space-y-2 sm:col-span-2">
                                                <Label htmlFor="mimSlackLink" className="text-xs font-semibold">
                                                    Slack Channel
                                                </Label>
                                                <Input
                                                    id="mimSlackLink"
                                                    placeholder="Slack link..."
                                                    className="h-9 text-sm"
                                                    {...form.register("mimSlackLink")}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {section === "COMMS" && (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="emailSubject" className="text-xs font-semibold">
                                                    Subject <span className="text-muted-foreground text-[10px]">(or Slack)</span>
                                                </Label>
                                                <Input
                                                    id="emailSubject"
                                                    placeholder="Email subject..."
                                                    className="h-9 text-sm font-medium"
                                                    {...form.register("emailSubject")}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="slackLink" className="text-xs font-semibold">
                                                    Slack Thread <span className="text-muted-foreground text-[10px]">(or Subject)</span>
                                                </Label>
                                                <Input
                                                    id="slackLink"
                                                    placeholder="Thread link..."
                                                    className="h-9 text-sm font-medium"
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
                                <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                                    <FileText className="w-3 h-3 text-primary" />
                                </div>
                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Content</h4>
                            </div>
                            <div className="space-y-4 rounded-xl border bg-muted/5 p-4">
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-xs font-semibold">
                                        Description {section === "FYI" && <span className="text-destructive">*</span>}
                                    </Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Brief overview..."
                                        rows={section === "FYI" ? 4 : 2}
                                        className="text-sm border-muted-foreground/10 focus:ring-1"
                                        {...form.register("description")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="comments" className="text-xs font-semibold">
                                        Detailed Comments
                                    </Label>
                                    <div className="rounded-lg border overflow-hidden bg-background">
                                        <RichTextEditor
                                            value={form.watch("comments") || ""}
                                            onChange={(value) => form.setValue("comments", value)}
                                            placeholder="Additional details..."
                                            disabled={isPending}
                                            className="min-h-[140px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section III: Toggle */}
                        <div className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                            form.watch("isImportant")
                                ? "bg-gradient-to-r from-orange-50 to-amber-50/50 border-orange-200 dark:from-orange-950/30 dark:to-amber-950/20 dark:border-orange-800/30"
                                : "bg-muted/5"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                                    form.watch("isImportant")
                                        ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md shadow-orange-500/20"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    <Star className={cn("w-4 h-4 transition-transform", form.watch("isImportant") && "fill-current scale-110")} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Mark as Important</p>
                                    <p className="text-[10px] text-muted-foreground">Highlight for urgent attention</p>
                                </div>
                            </div>
                            <Switch
                                id="isImportant"
                                checked={form.watch("isImportant")}
                                onCheckedChange={(checked) => form.setValue("isImportant", checked)}
                                className="data-[state=checked]:bg-orange-500"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t flex items-center justify-end gap-3 shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            className="h-9 px-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="h-9 px-6"
                        >
                            {isPending && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                            {isEditing ? "Save Updates" : "Create Entry"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
