import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  json,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { applications, ensembleSchema, teams } from "./teams";

// Enum for entry section types
export const turnoverSection = ensembleSchema.enum("turnover_section", [
  "RFC",
  "INC",
  "ALERTS",
  "MIM",
  "COMMS",
  "FYI",
]);

// Enum for entry status
export const turnoverStatus = ensembleSchema.enum("turnover_status", [
  "OPEN",
  "RESOLVED",
]);

// Main turnover entries table
export const turnoverEntries = ensembleSchema.table(
  "turnover_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    section: turnoverSection("section").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    comments: text("comments"), // HTML rich text
    status: turnoverStatus("status").notNull().default("OPEN"),
    isImportant: boolean("is_important").notNull().default(false),

    // Audit fields
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedBy: varchar("updated_by", { length: 255 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
    resolvedBy: varchar("resolved_by", { length: 255 }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("turnover_entries_team_id_idx").on(table.teamId),
    index("turnover_entries_application_id_idx").on(table.applicationId),
    index("turnover_entries_section_idx").on(table.section),
    index("turnover_entries_status_idx").on(table.status),
    index("turnover_entries_is_important_idx").on(table.isImportant),
    index("turnover_entries_team_app_idx").on(
      table.teamId,
      table.applicationId
    ),
    index("turnover_entries_created_at_idx").on(table.createdAt),
  ]
);

// RFC-specific extension table
export const turnoverRfcDetails = ensembleSchema.table(
  "turnover_rfc_details",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => turnoverEntries.id, { onDelete: "cascade" })
      .unique(),
    rfcNumber: varchar("rfc_number", { length: 50 }).notNull(),
    rfcStatus: varchar("rfc_status", { length: 50 }).notNull(),
    validatedBy: varchar("validated_by", { length: 255 }).notNull(),
  },
  (table) => [
    index("turnover_rfc_entry_id_idx").on(table.entryId),
    index("turnover_rfc_number_idx").on(table.rfcNumber),
  ]
);

// INC-specific extension table
export const turnoverIncDetails = ensembleSchema.table(
  "turnover_inc_details",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => turnoverEntries.id, { onDelete: "cascade" })
      .unique(),
    incidentNumber: varchar("incident_number", { length: 50 }).notNull(),
  },
  (table) => [
    index("turnover_inc_entry_id_idx").on(table.entryId),
    index("turnover_inc_number_idx").on(table.incidentNumber),
  ]
);

// MIM-specific extension table
export const turnoverMimDetails = ensembleSchema.table(
  "turnover_mim_details",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => turnoverEntries.id, { onDelete: "cascade" })
      .unique(),
    mimLink: text("mim_link").notNull(),
    mimSlackLink: text("mim_slack_link"),
  },
  (table) => [index("turnover_mim_entry_id_idx").on(table.entryId)]
);

// COMMS-specific extension table
export const turnoverCommsDetails = ensembleSchema.table(
  "turnover_comms_details",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => turnoverEntries.id, { onDelete: "cascade" })
      .unique(),
    emailSubject: varchar("email_subject", { length: 255 }),
    slackLink: text("slack_link"),
  },
  (table) => [index("turnover_comms_entry_id_idx").on(table.entryId)]
);

// Finalized turnover snapshots
export const finalizedTurnovers = ensembleSchema.table(
  "finalized_turnovers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    snapshotData: json("snapshot_data").notNull(), // Complete snapshot of entries
    totalApplications: varchar("total_applications", { length: 10 }).notNull(),
    totalEntries: varchar("total_entries", { length: 10 }).notNull(),
    importantCount: varchar("important_count", { length: 10 }).notNull(),
    notes: text("notes"),
    finalizedBy: varchar("finalized_by", { length: 255 }).notNull(),
    finalizedAt: timestamp("finalized_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("finalized_turnovers_team_id_idx").on(table.teamId),
    index("finalized_turnovers_finalized_at_idx").on(table.finalizedAt),
    index("finalized_turnovers_team_date_idx").on(
      table.teamId,
      table.finalizedAt
    ),
  ]
);

// ========================
// Relations
// ========================

export const turnoverEntriesRelations = relations(
  turnoverEntries,
  ({ one }) => ({
    team: one(teams, {
      fields: [turnoverEntries.teamId],
      references: [teams.id],
    }),
    application: one(applications, {
      fields: [turnoverEntries.applicationId],
      references: [applications.id],
    }),
    rfcDetails: one(turnoverRfcDetails, {
      fields: [turnoverEntries.id],
      references: [turnoverRfcDetails.entryId],
    }),
    incDetails: one(turnoverIncDetails, {
      fields: [turnoverEntries.id],
      references: [turnoverIncDetails.entryId],
    }),
    mimDetails: one(turnoverMimDetails, {
      fields: [turnoverEntries.id],
      references: [turnoverMimDetails.entryId],
    }),
    commsDetails: one(turnoverCommsDetails, {
      fields: [turnoverEntries.id],
      references: [turnoverCommsDetails.entryId],
    }),
  })
);

export const turnoverRfcDetailsRelations = relations(
  turnoverRfcDetails,
  ({ one }) => ({
    entry: one(turnoverEntries, {
      fields: [turnoverRfcDetails.entryId],
      references: [turnoverEntries.id],
    }),
  })
);

export const turnoverIncDetailsRelations = relations(
  turnoverIncDetails,
  ({ one }) => ({
    entry: one(turnoverEntries, {
      fields: [turnoverIncDetails.entryId],
      references: [turnoverEntries.id],
    }),
  })
);

export const turnoverMimDetailsRelations = relations(
  turnoverMimDetails,
  ({ one }) => ({
    entry: one(turnoverEntries, {
      fields: [turnoverMimDetails.entryId],
      references: [turnoverEntries.id],
    }),
  })
);

export const turnoverCommsDetailsRelations = relations(
  turnoverCommsDetails,
  ({ one }) => ({
    entry: one(turnoverEntries, {
      fields: [turnoverCommsDetails.entryId],
      references: [turnoverEntries.id],
    }),
  })
);

export const finalizedTurnoversRelations = relations(
  finalizedTurnovers,
  ({ one }) => ({
    team: one(teams, {
      fields: [finalizedTurnovers.teamId],
      references: [teams.id],
    }),
  })
);

// ========================
// Types
// ========================

export type TurnoverEntry = typeof turnoverEntries.$inferSelect;
export type NewTurnoverEntry = typeof turnoverEntries.$inferInsert;
export type TurnoverRfcDetails = typeof turnoverRfcDetails.$inferSelect;
export type TurnoverIncDetails = typeof turnoverIncDetails.$inferSelect;
export type TurnoverMimDetails = typeof turnoverMimDetails.$inferSelect;
export type TurnoverCommsDetails = typeof turnoverCommsDetails.$inferSelect;
export type FinalizedTurnover = typeof finalizedTurnovers.$inferSelect;
export type NewFinalizedTurnover = typeof finalizedTurnovers.$inferInsert;

// Extended entry type with all details
export type TurnoverEntryWithDetails = TurnoverEntry & {
  application?: {
    applicationName: string;
    tla: string;
    tier?: string | null;
  } | null;
  rfcDetails?: TurnoverRfcDetails | null;
  incDetails?: TurnoverIncDetails | null;
  mimDetails?: TurnoverMimDetails | null;
  commsDetails?: TurnoverCommsDetails | null;
};
