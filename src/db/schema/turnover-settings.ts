import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { applications, ensembleSchema, teams } from "./teams";

// Enums for import modes
export const importMode = ensembleSchema.enum("import_mode", [
  "AUTO",
  "REVIEW",
]);

// Enum for ITSM record status in review queue
export const itsmRecordStatus = ensembleSchema.enum("itsm_record_status", [
  "PENDING",
  "IMPORTED",
  "REJECTED",
]);

// Enum for ITSM record type
export const itsmRecordType = ensembleSchema.enum("itsm_record_type", [
  "RFC",
  "INC",
]);

// Turnover Settings table
export const turnoverSettings = ensembleSchema.table("turnover_settings", {
  teamId: uuid("team_id")
    .primaryKey()
    .references(() => teams.id, { onDelete: "cascade" }),
  maxSearchDays: integer("max_search_days").notNull().default(30),
  rfcImportMode: importMode("rfc_import_mode").notNull().default("REVIEW"),
  incImportMode: importMode("inc_import_mode").notNull().default("REVIEW"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date()
  ),
});

// Per-Application ITSM Workgroups (Multiple for each app)
export const turnoverAppAssignmentGroups = ensembleSchema.table(
  "turnover_app_assignment_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    type: itsmRecordType("type").notNull(), // RFC or INC
    groupName: varchar("group_name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("turnover_app_groups_app_id_idx").on(table.applicationId),
    index("turnover_app_groups_name_idx").on(table.groupName),
  ]
);

// Per-Application CMDB CIs (Multiple for each app)
export const turnoverAppCmdbCis = ensembleSchema.table(
  "turnover_app_cmdb_cis",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    cmdbCiName: varchar("cmdb_ci_name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("turnover_app_cmdb_cis_app_id_idx").on(table.applicationId),
    index("turnover_app_cmdb_cis_name_idx").on(table.cmdbCiName),
  ]
);

// ITSM Records (Review Queue) table
export const turnoverItsmRecords = ensembleSchema.table(
  "turnover_itsm_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    applicationId: uuid("application_id").references(() => applications.id, {
      onDelete: "set null",
    }),
    externalId: varchar("external_id", { length: 50 }).notNull(), // CHG/INC number
    type: itsmRecordType("type").notNull(),
    status: itsmRecordStatus("status").notNull().default("PENDING"),
    rawData: jsonb("raw_data").notNull(), // Full API response payload
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (table) => [
    index("turnover_itsm_records_team_id_idx").on(table.teamId),
    index("turnover_itsm_records_status_idx").on(table.status),
    index("turnover_itsm_records_team_status_idx").on(
      table.teamId,
      table.status
    ),
    uniqueIndex("turnover_itsm_records_team_id_ext_id_unq").on(
      table.teamId,
      table.externalId
    ),
  ]
);

// Relations
export const turnoverSettingsRelations = relations(
  turnoverSettings,
  ({ one }) => ({
    team: one(teams, {
      fields: [turnoverSettings.teamId],
      references: [teams.id],
    }),
  })
);

export const turnoverAppAssignmentGroupsRelations = relations(
  turnoverAppAssignmentGroups,
  ({ one }) => ({
    application: one(applications, {
      fields: [turnoverAppAssignmentGroups.applicationId],
      references: [applications.id],
    }),
  })
);

export const turnoverAppCmdbCisRelations = relations(
  turnoverAppCmdbCis,
  ({ one }) => ({
    application: one(applications, {
      fields: [turnoverAppCmdbCis.applicationId],
      references: [applications.id],
    }),
  })
);

export const turnoverItsmRecordsRelations = relations(
  turnoverItsmRecords,
  ({ one }) => ({
    team: one(teams, {
      fields: [turnoverItsmRecords.teamId],
      references: [teams.id],
    }),
    application: one(applications, {
      fields: [turnoverItsmRecords.applicationId],
      references: [applications.id],
    }),
  })
);

// Types
export type TurnoverSettings = typeof turnoverSettings.$inferSelect;
export type NewTurnoverSettings = typeof turnoverSettings.$inferInsert;
export type TurnoverItsmRecord = typeof turnoverItsmRecords.$inferSelect;
export type NewTurnoverItsmRecord = typeof turnoverItsmRecords.$inferInsert;
