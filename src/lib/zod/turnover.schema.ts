import { z } from "zod";

// Section types
export const TurnoverSectionSchema = z.enum(["RFC", "INC", "ALERTS", "MIM", "COMMS", "FYI"]);
export type TurnoverSection = z.infer<typeof TurnoverSectionSchema>;

// Status types
export const TurnoverStatusSchema = z.enum(["OPEN", "RESOLVED"]);
export type TurnoverStatus = z.infer<typeof TurnoverStatusSchema>;

// RFC Status options
export const RfcStatusSchema = z.enum([
    "Draft",
    "In Progress",
    "Pending Approval",
    "Approved",
    "Rejected",
    "Implemented",
    "Cancelled",
]);
export type RfcStatus = z.infer<typeof RfcStatusSchema>;

// Section-specific field schemas
export const RfcFieldsSchema = z.object({
    rfcNumber: z.string().min(1, "RFC Number is required"),
    rfcStatus: RfcStatusSchema,
    validatedBy: z.string().min(1, "Validated By is required"),
});

export const IncFieldsSchema = z.object({
    incidentNumber: z.string().min(1, "Incident Number is required"),
});

export const MimFieldsSchema = z.object({
    mimLink: z.string().url("Must be a valid URL"),
    mimSlackLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const CommsFieldsSchema = z.object({
    emailSubject: z.string().optional(),
    slackLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

// Base entry schema
export const CreateTurnoverEntryBaseSchema = z.object({
    teamId: z.string().uuid(),
    applicationId: z.string().uuid(),
    section: TurnoverSectionSchema,
    title: z.string().max(255).optional().or(z.literal("")), // Title is auto-generated if empty
    description: z.string().optional(),
    comments: z.string().optional(), // HTML rich text
    isImportant: z.boolean().optional().default(false),
});

// Combined create schema with section-specific fields
export const CreateTurnoverEntrySchema = CreateTurnoverEntryBaseSchema.extend({
    // RFC fields
    rfcNumber: z.string().optional(),
    rfcStatus: RfcStatusSchema.optional(),
    validatedBy: z.string().optional(),
    // INC fields
    incidentNumber: z.string().optional(),
    // MIM fields
    mimLink: z.string().optional(),
    mimSlackLink: z.string().optional(),
    // COMMS fields
    emailSubject: z.string().optional(),
    slackLink: z.string().optional(),
}).superRefine((data, ctx) => {
    // Validate section-specific required fields
    switch (data.section) {
        case "RFC":
            if (!data.rfcNumber) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "RFC Number is required",
                    path: ["rfcNumber"],
                });
            }
            if (!data.rfcStatus) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "RFC Status is required",
                    path: ["rfcStatus"],
                });
            }
            if (!data.validatedBy) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Validated By is required",
                    path: ["validatedBy"],
                });
            }
            break;
        case "INC":
            if (!data.incidentNumber) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Incident Number is required",
                    path: ["incidentNumber"],
                });
            }
            break;
        case "MIM":
            if (!data.mimLink) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "MIM Link is required",
                    path: ["mimLink"],
                });
            }
            break;
        case "COMMS":
            if (!data.emailSubject && !data.slackLink) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Email Subject or Slack Link is required",
                    path: ["emailSubject"],
                });
            }
            break;
        case "ALERTS":
            // Title is already required by base schema
            break;
        case "FYI":
            if (!data.description) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Content is required for FYI entries",
                    path: ["description"],
                });
            }
            break;
    }
});

export type CreateTurnoverEntryInput = z.infer<typeof CreateTurnoverEntrySchema>;

// Base schema for updates (without superRefine, so we can use .partial())
const UpdateTurnoverEntryBaseSchema = CreateTurnoverEntryBaseSchema.extend({
    // RFC fields
    rfcNumber: z.string().optional(),
    rfcStatus: RfcStatusSchema.optional(),
    validatedBy: z.string().optional(),
    // INC fields
    incidentNumber: z.string().optional(),
    // MIM fields
    mimLink: z.string().optional(),
    mimSlackLink: z.string().optional(),
    // COMMS fields
    emailSubject: z.string().optional(),
    slackLink: z.string().optional(),
});

// Update schema
export const UpdateTurnoverEntrySchema = UpdateTurnoverEntryBaseSchema.partial().extend({
    id: z.string().uuid(),
    teamId: z.string().uuid(),
});

export type UpdateTurnoverEntryInput = z.infer<typeof UpdateTurnoverEntrySchema>;

// Toggle important
export const ToggleImportantSchema = z.object({
    id: z.string().uuid(),
    isImportant: z.boolean(),
});

// Resolve entry
export const ResolveEntrySchema = z.object({
    id: z.string().uuid(),
});

// Delete entry
export const DeleteEntrySchema = z.object({
    id: z.string().uuid(),
    teamId: z.string().uuid(),
});

// Get entries
export const GetEntriesSchema = z.object({
    teamId: z.string().uuid(),
    applicationId: z.string().uuid().optional(),
    section: TurnoverSectionSchema.optional(),
    status: TurnoverStatusSchema.optional(),
    includeRecentlyResolved: z.boolean().optional(), // Include resolved entries from last 24 hours
    limit: z.number().int().positive().default(50).optional(),
    offset: z.number().int().nonnegative().default(0).optional(),
});

// Finalize turnover
export const FinalizeTurnoverSchema = z.object({
    teamId: z.string().uuid(),
    notes: z.string().optional(),
});

// Get finalized turnovers
export const GetFinalizedTurnoversSchema = z.object({
    teamId: z.string().uuid(),
    search: z.string().optional(),
    fromDate: z.string().optional(), // ISO date string
    toDate: z.string().optional(), // ISO date string
    limit: z.number().int().positive().default(20).optional(),
    offset: z.number().int().nonnegative().default(0).optional(),
});

// Metrics
export const GetTurnoverMetricsSchema = z.object({
    teamId: z.string().uuid(),
    startDate: z.string(), // ISO date string
    endDate: z.string(), // ISO date string
});

// Section configuration for UI
export const SECTION_CONFIG = {
    RFC: {
        id: "RFC",
        name: "Request for Change",
        shortName: "RFC",
        icon: "CheckCircle2",
        colorClass: "text-blue-600",
        bgClass: "bg-blue-50 dark:bg-blue-950/30",
        borderClass: "border-blue-200 dark:border-blue-800",
    },
    INC: {
        id: "INC",
        name: "Incidents",
        shortName: "INC",
        icon: "AlertCircle",
        colorClass: "text-red-600",
        bgClass: "bg-red-50 dark:bg-red-950/30",
        borderClass: "border-red-200 dark:border-red-800",
    },
    ALERTS: {
        id: "ALERTS",
        name: "Alerts/Issues",
        shortName: "Alerts",
        icon: "Bell",
        colorClass: "text-orange-600",
        bgClass: "bg-orange-50 dark:bg-orange-950/30",
        borderClass: "border-orange-200 dark:border-orange-800",
    },
    MIM: {
        id: "MIM",
        name: "Major Incident Management",
        shortName: "MIM",
        icon: "Zap",
        colorClass: "text-purple-600",
        bgClass: "bg-purple-50 dark:bg-purple-950/30",
        borderClass: "border-purple-200 dark:border-purple-800",
    },
    COMMS: {
        id: "COMMS",
        name: "Communications",
        shortName: "Comms",
        icon: "MessageSquare",
        colorClass: "text-green-600",
        bgClass: "bg-green-50 dark:bg-green-950/30",
        borderClass: "border-green-200 dark:border-green-800",
    },
    FYI: {
        id: "FYI",
        name: "For Your Information",
        shortName: "FYI",
        icon: "HelpCircle",
        colorClass: "text-slate-600",
        bgClass: "bg-slate-50 dark:bg-slate-800/30",
        borderClass: "border-slate-200 dark:border-slate-700",
    },
} as const;

export type SectionConfigKey = keyof typeof SECTION_CONFIG;
