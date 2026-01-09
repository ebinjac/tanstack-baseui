import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type FieldValues } from "react-hook-form";
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
    StickyNote,
    MessageCircle,
    FileText,
    LinkIcon,
    Mail,
    UserCheck,
    Hash,
    Activity,
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
}

export function EntryDialog({
    open,
    onOpenChange,
    teamId,
    applicationId,
    section,
    editEntry,
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
                form.reset({
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
                });
            }
        }
    }, [open, editEntry, form, teamId, applicationId, section]);

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
            <DialogContent className="max-w-4xl min-w-[700px] p-0 gap-0 overflow-hidden sm:rounded-2xl border shadow-2xl bg-background">

                {/* Visual Header */}
                <div className="px-8 py-8 border-b bg-muted/20">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm shrink-0 bg-background border">
                            <SectionIcon className="w-7 h-7 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1 text-center sm:text-left">
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                                {isEditing ? "Edit Entry" : `New ${sectionConfig.name}`}
                            </DialogTitle>
                            <p className="text-muted-foreground font-medium text-base">
                                {isEditing
                                    ? `Update existing details for this ${sectionConfig.shortName} entry.`
                                    : `Provide the details below to log a new ${sectionConfig.shortName} entry.`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Body */}
                <form
                    onSubmit={form.handleSubmit(onSubmit, (errors) => {
                        console.log("Form validation errors:", errors);
                        toast.error("Please check the required fields");
                    })}
                    className="flex flex-col h-full max-h-[75vh]"
                >
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">

                        {/* Section I: Core Identifiers */}
                        <div className="space-y-4">
                            {(section === "RFC" || section === "INC" || section === "MIM" || section === "ALERTS" || section === "COMMS") && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {section === "RFC" && (
                                        <>
                                            <div className="space-y-3">
                                                <Label htmlFor="rfcNumber" className="flex items-center gap-2 text-foreground font-medium">
                                                    <Hash className="w-4 h-4 text-muted-foreground" />
                                                    RFC Number <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="rfcNumber"
                                                    placeholder="CHG..."
                                                    className="font-mono"
                                                    {...form.register("rfcNumber")}
                                                />
                                                {form.formState.errors.rfcNumber && (
                                                    <p className="text-xs font-medium text-destructive mt-1">
                                                        {form.formState.errors.rfcNumber.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                <Label htmlFor="rfcStatus" className="flex items-center gap-2 text-foreground font-medium">
                                                    <Activity className="w-4 h-4 text-muted-foreground" />
                                                    Status <span className="text-destructive">*</span>
                                                </Label>
                                                <Select
                                                    value={form.watch("rfcStatus")}
                                                    onValueChange={(val) =>
                                                        form.setValue("rfcStatus", val as any)
                                                    }
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {RFC_STATUS_OPTIONS.map((status) => (
                                                            <SelectItem key={status} value={status}>
                                                                {status}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {form.formState.errors.rfcStatus && (
                                                    <p className="text-xs font-medium text-destructive mt-1">
                                                        {form.formState.errors.rfcStatus.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-3 sm:col-span-2">
                                                <Label htmlFor="validatedBy" className="flex items-center gap-2 text-foreground font-medium">
                                                    <UserCheck className="w-4 h-4 text-muted-foreground" />
                                                    Validated By <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="validatedBy"
                                                    placeholder="Enter validator name or ID..."
                                                    {...form.register("validatedBy")}
                                                />
                                                {form.formState.errors.validatedBy && (
                                                    <p className="text-xs font-medium text-destructive mt-1">
                                                        {form.formState.errors.validatedBy.message}
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {section === "INC" && (
                                        <div className="space-y-3 sm:col-span-2">
                                            <Label htmlFor="incidentNumber" className="flex items-center gap-2 text-foreground font-medium">
                                                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                                Incident Number <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="incidentNumber"
                                                placeholder="INC..."
                                                className="font-mono text-lg"
                                                {...form.register("incidentNumber")}
                                            />
                                            {form.formState.errors.incidentNumber && (
                                                <p className="text-xs font-medium text-destructive mt-1">
                                                    {form.formState.errors.incidentNumber.message}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {section === "ALERTS" && (
                                        <div className="space-y-3 sm:col-span-2">
                                            <Label htmlFor="title" className="flex items-center gap-2 text-foreground font-medium">
                                                <Bell className="w-4 h-4 text-muted-foreground" />
                                                Alert Title <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="title"
                                                placeholder="Brief title of the alert..."
                                                className="font-medium"
                                                {...form.register("title")}
                                            />
                                            {form.formState.errors.title && (
                                                <p className="text-xs font-medium text-destructive mt-1">
                                                    {form.formState.errors.title.message}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {section === "MIM" && (
                                        <>
                                            <div className="space-y-3 sm:col-span-2">
                                                <Label htmlFor="mimLink" className="flex items-center gap-2 text-foreground font-medium">
                                                    <LinkIcon className="w-4 h-4 text-muted-foreground" />
                                                    MIM Bridge Link <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="mimLink"
                                                    placeholder="https://..."
                                                    type="url"
                                                    {...form.register("mimLink")}
                                                />
                                                {form.formState.errors.mimLink && (
                                                    <p className="text-xs font-medium text-destructive mt-1">
                                                        {form.formState.errors.mimLink.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-3 sm:col-span-2">
                                                <Label htmlFor="mimSlackLink" className="flex items-center gap-2 text-foreground font-medium">
                                                    <Hash className="w-4 h-4 text-muted-foreground" />
                                                    Slack Channel
                                                </Label>
                                                <Input
                                                    id="mimSlackLink"
                                                    placeholder="https://slack.com..."
                                                    type="url"
                                                    {...form.register("mimSlackLink")}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {section === "COMMS" && (
                                        <>
                                            <div className="space-y-3 sm:col-span-2">
                                                <Label htmlFor="emailSubject" className="flex items-center gap-2 text-foreground font-medium">
                                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                                    Email Subject / Primary Link <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="emailSubject"
                                                    placeholder="Subject line or URL..."
                                                    {...form.register("emailSubject")}
                                                />
                                                {form.formState.errors.emailSubject && (
                                                    <p className="text-xs font-medium text-destructive mt-1">
                                                        {form.formState.errors.emailSubject.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-3 sm:col-span-2">
                                                <Label htmlFor="slackLink" className="flex items-center gap-2 text-foreground font-medium">
                                                    <Hash className="w-4 h-4 text-muted-foreground" />
                                                    Slack Link (Optional)
                                                </Label>
                                                <Input
                                                    id="slackLink"
                                                    placeholder="https://slack.com..."
                                                    type="url"
                                                    {...form.register("slackLink")}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Section II: Description */}
                        <div className="space-y-4">
                            {section === "FYI" ? (
                                <div className="space-y-3">
                                    <Label htmlFor="description" className="flex items-center gap-2 text-foreground text-base font-medium">
                                        <StickyNote className="w-4 h-4 text-muted-foreground" />
                                        Content <span className="text-destructive">*</span>
                                    </Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter the information to share..."
                                        rows={6}
                                        className="min-h-[120px] resize-y"
                                        {...form.register("description")}
                                    />
                                    {form.formState.errors.description && (
                                        <p className="text-xs font-medium text-destructive mt-1">
                                            {form.formState.errors.description.message}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Label htmlFor="description" className="flex items-center gap-2 text-foreground font-medium">
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        placeholder={`Describe the ${sectionConfig.shortName.toLowerCase()} details and impact...`}
                                        rows={3}
                                        className="resize-y"
                                        {...form.register("description")}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Section III: Comments & Notes */}
                        <div className="space-y-3">
                            <Label htmlFor="comments" className="flex items-center gap-2 text-foreground font-medium">
                                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                                Additional Comments
                            </Label>
                            <div className="rounded-md border overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all">
                                <RichTextEditor
                                    value={form.watch("comments") || ""}
                                    onChange={(value) => form.setValue("comments", value)}
                                    placeholder="Add detailed notes, timeline updates, or context..."
                                    disabled={isPending}
                                    className="border-none shadow-none min-h-[150px]"
                                />
                            </div>
                        </div>

                        {/* Section IV: Importance Toggle */}
                        <div className="bg-muted/30 p-5 rounded-xl border flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={cn("p-2.5 rounded-lg border shadow-sm", form.watch("isImportant") ? "bg-primary/10 text-primary border-primary/20" : "bg-background text-muted-foreground")}>
                                    <Star className={cn("w-5 h-5", form.watch("isImportant") && "fill-current")} />
                                </div>
                                <div className="space-y-0.5">
                                    <Label htmlFor="isImportant" className="text-base font-semibold cursor-pointer">
                                        Mark as Important
                                    </Label>
                                    <p className="text-sm text-muted-foreground mr-1">
                                        Flag high-priority entries for attention.
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="isImportant"
                                checked={form.watch("isImportant")}
                                onCheckedChange={(checked) =>
                                    form.setValue("isImportant", checked)
                                }
                            />
                        </div>
                    </div>

                    <div className="p-8 border-t bg-muted/20 flex items-center justify-end gap-3 shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="min-w-[140px]"
                        >
                            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isEditing ? "Save Changes" : "Create Entry"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
