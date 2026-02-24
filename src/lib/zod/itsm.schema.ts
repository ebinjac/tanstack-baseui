import { z } from "zod";

export const ImportModeSchema = z.enum(["AUTO", "REVIEW"]);
export const ItsmRecordStatusSchema = z.enum([
  "PENDING",
  "IMPORTED",
  "REJECTED",
]);
export const ItsmRecordTypeSchema = z.enum(["RFC", "INC"]);

export const ItsmWorkgroupSchema = z.object({
  id: z.string().uuid().optional(),
  applicationId: z.string().uuid(),
  type: ItsmRecordTypeSchema,
  groupName: z.string().min(1, "Group name is required"),
});

export const ItsmCmdbCiSchema = z.object({
  id: z.string().uuid().optional(),
  applicationId: z.string().uuid(),
  cmdbCiName: z.string().min(1, "CMDB CI name is required"),
});

export const TurnoverSettingsSchema = z.object({
  teamId: z.string().uuid(),
  maxSearchDays: z.number().min(1).max(5).default(3),
  rfcImportMode: ImportModeSchema.default("REVIEW"),
  incImportMode: ImportModeSchema.default("REVIEW"),
  appWorkgroups: z.array(ItsmWorkgroupSchema).default([]),
  appCmdbCis: z.array(ItsmCmdbCiSchema).default([]),
});

export const UpdateTurnoverSettingsSchema = z.object({
  teamId: z.string().uuid(),
  settings: TurnoverSettingsSchema.omit({ teamId: true }),
});

export const SyncItsmSchema = z.object({
  teamId: z.string().uuid(),
  fallbackApplicationId: z.string().uuid().optional(),
});

export const ProcessReviewQueueItemSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(["IMPORT", "REJECT"]),
});

export const BulkImportItsmSchema = z.object({
  ids: z.array(z.string().uuid()),
  fallbackApplicationId: z.string().uuid().optional(),
});

export const UntrackItsmSchema = z.object({
  entryId: z.string().uuid(),
  teamId: z.string().uuid(),
});
