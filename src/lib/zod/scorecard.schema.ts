import { z } from "zod";

// Create Scorecard Entry Schema
export const CreateScorecardEntrySchema = z.object({
    applicationId: z.string().uuid("Invalid application ID"),
    scorecardIdentifier: z
        .string()
        .max(100, "Identifier must be less than 100 characters")
        .regex(
            /^[a-zA-Z0-9_-]*$/,
            "Identifier can only contain letters, numbers, hyphens, and underscores"
        )
        .optional()
        .or(z.literal("")),
    name: z
        .string()
        .min(1, "Name is required")
        .max(255, "Name must be less than 255 characters"),
    availabilityThreshold: z
        .number()
        .min(0, "Threshold must be at least 0")
        .max(100, "Threshold must be at most 100"),
    volumeChangeThreshold: z
        .number()
        .min(0, "Threshold must be at least 0")
        .max(100, "Threshold must be at most 100"),
});

// Update Scorecard Entry Schema
export const UpdateScorecardEntrySchema = z.object({
    id: z.string().uuid("Invalid entry ID"),
    scorecardIdentifier: z
        .string()
        .min(2, "Identifier must be at least 2 characters")
        .max(100, "Identifier must be less than 100 characters")
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            "Identifier can only contain letters, numbers, hyphens, and underscores"
        )
        .optional(),
    name: z
        .string()
        .min(1, "Name is required")
        .max(255, "Name must be less than 255 characters")
        .optional(),
    availabilityThreshold: z
        .number()
        .min(0, "Threshold must be at least 0")
        .max(100, "Threshold must be at most 100")
        .optional(),
    volumeChangeThreshold: z
        .number()
        .min(0, "Threshold must be at least 0")
        .max(100, "Threshold must be at most 100")
        .optional(),
});

// Upsert Availability Schema
export const UpsertAvailabilitySchema = z.object({
    scorecardEntryId: z.string().uuid("Invalid entry ID"),
    year: z
        .number()
        .int()
        .min(2000, "Year must be 2000 or later")
        .max(2100, "Year must be before 2100"),
    month: z
        .number()
        .int()
        .min(1, "Month must be between 1 and 12")
        .max(12, "Month must be between 1 and 12"),
    availability: z
        .number()
        .min(0, "Availability must be at least 0%")
        .max(100, "Availability must be at most 100%"),
    reason: z.string().nullable().optional(),
});

// Upsert Volume Schema
export const UpsertVolumeSchema = z.object({
    scorecardEntryId: z.string().uuid("Invalid entry ID"),
    year: z
        .number()
        .int()
        .min(2000, "Year must be 2000 or later")
        .max(2100, "Year must be before 2100"),
    month: z
        .number()
        .int()
        .min(1, "Month must be between 1 and 12")
        .max(12, "Month must be between 1 and 12"),
    volume: z.number().int().min(0, "Volume must be non-negative"),
    reason: z.string().nullable().optional(),
});

// Bulk Upsert Schema for saving multiple entries at once
export const BulkUpsertScorecardDataSchema = z.object({
    availability: z.array(UpsertAvailabilitySchema).optional(),
    volume: z.array(UpsertVolumeSchema).optional(),
});

// Query Schemas
export const GetScorecardDataSchema = z.object({
    teamId: z.string().uuid("Invalid team ID"),
    year: z.number().int().min(2000).max(2100),
});

export const CheckScorecardIdentifierSchema = z.object({
    identifier: z.string().min(1),
    excludeId: z.string().uuid().optional(), // Exclude current entry when editing
});

// Publish/Unpublish Scorecard Schema
export const PublishScorecardSchema = z.object({
    teamId: z.string().uuid("Invalid team ID"),
    year: z
        .number()
        .int()
        .min(2000, "Year must be 2000 or later")
        .max(2100, "Year must be before 2100"),
    month: z
        .number()
        .int()
        .min(1, "Month must be between 1 and 12")
        .max(12, "Month must be between 1 and 12"),
});

export const UnpublishScorecardSchema = PublishScorecardSchema;

export const GetPublishStatusSchema = z.object({
    teamId: z.string().uuid("Invalid team ID"),
    year: z
        .number()
        .int()
        .min(2000, "Year must be 2000 or later")
        .max(2100, "Year must be before 2100"),
});

// Type exports
export type CreateScorecardEntry = z.infer<typeof CreateScorecardEntrySchema>;
export type UpdateScorecardEntry = z.infer<typeof UpdateScorecardEntrySchema>;
export type UpsertAvailability = z.infer<typeof UpsertAvailabilitySchema>;
export type UpsertVolume = z.infer<typeof UpsertVolumeSchema>;
export type BulkUpsertScorecardData = z.infer<typeof BulkUpsertScorecardDataSchema>;
export type GetScorecardData = z.infer<typeof GetScorecardDataSchema>;
export type PublishScorecard = z.infer<typeof PublishScorecardSchema>;
export type UnpublishScorecard = z.infer<typeof UnpublishScorecardSchema>;
export type GetPublishStatus = z.infer<typeof GetPublishStatusSchema>;

