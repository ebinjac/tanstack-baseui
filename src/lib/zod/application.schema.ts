import { z } from "zod";

export const CreateApplicationSchema = z.object({
    teamId: z.string().uuid(),
    assetId: z.number().int().positive(),
    applicationName: z.string().min(1, "Application Name is required"),
    tla: z.string().min(1, "Short Identifier (TNA) is required").max(12, "TNA must be 12 characters or less"),

    // Contacts
    snowGroup: z.string().nullish(),
    slackChannel: z.string().nullish().refine(val => !val || val.startsWith('#'), {
        message: "Slack channel must start with #"
    }),
    description: z.string().nullish(),

    // Emails
    escalationEmail: z.string().email().nullish().or(z.literal('')),
    contactEmail: z.string().email().nullish().or(z.literal('')),
    teamEmail: z.string().email().nullish().or(z.literal('')),

    // Metadata from API
    lifeCycleStatus: z.string().nullish(),
    tier: z.string().nullish(),

    // Ownership (All optional as they come from API)
    vpName: z.string().nullish(),
    vpEmail: z.string().email().nullish().or(z.literal('')),
    directorName: z.string().nullish(),
    directorEmail: z.string().email().nullish().or(z.literal('')),

    applicationOwnerName: z.string().nullish(),
    applicationOwnerEmail: z.string().email().nullish().or(z.literal('')),
    applicationOwnerBand: z.string().nullish(),

    applicationManagerName: z.string().nullish(),
    applicationManagerEmail: z.string().email().nullish().or(z.literal('')),
    applicationManagerBand: z.string().nullish(),

    ownerSvpName: z.string().nullish(),
    ownerSvpEmail: z.string().email().nullish().or(z.literal('')),
    ownerSvpBand: z.string().nullish(),

    businessOwnerName: z.string().nullish(),
    businessOwnerEmail: z.string().email().nullish().or(z.literal('')),
    businessOwnerBand: z.string().nullish(),

    productionSupportOwnerName: z.string().nullish(),
    productionSupportOwnerEmail: z.string().email().nullish().or(z.literal('')),
    productionSupportOwnerBand: z.string().nullish(),

    pmoName: z.string().nullish(),
    pmoEmail: z.string().email().nullish().or(z.literal('')),
    pmoBand: z.string().nullish(),

    unitCioName: z.string().nullish(),
    unitCioEmail: z.string().email().nullish().or(z.literal('')),
    unitCioBand: z.string().nullish(),

    // Leaders 
    applicationOwnerLeader1Name: z.string().nullish(),
    applicationOwnerLeader1Email: z.string().email().nullish().or(z.literal('')),
    applicationOwnerLeader1Band: z.string().nullish(),

    applicationOwnerLeader2Name: z.string().nullish(),
    applicationOwnerLeader2Email: z.string().email().nullish().or(z.literal('')),
    applicationOwnerLeader2Band: z.string().nullish(),

    businessOwnerLeader1Name: z.string().nullish(),
    businessOwnerLeader1Email: z.string().email().nullish().or(z.literal('')),
    businessOwnerLeader1Band: z.string().nullish(),

    productionSupportOwnerLeader1Name: z.string().nullish(),
    productionSupportOwnerLeader1Email: z.string().email().nullish().or(z.literal('')),
    productionSupportOwnerLeader1Band: z.string().nullish(),
});

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;

export const UpdateApplicationSchema = CreateApplicationSchema.partial().extend({
    id: z.string().uuid(),
});

export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;
