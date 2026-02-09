import {
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

import { pgSchema } from "drizzle-orm/pg-core";

export const ensembleSchema = pgSchema("ensemble");


export const approvalStatus = ensembleSchema.enum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "processed",
]);
export const applicationStatus = ensembleSchema.enum("application_status", [
  "active",
  "inactive",
  "deprecated",
  "archived",
]);
export const syncStatus = ensembleSchema.enum("sync_status", [
  "pending",
  "syncing",
  "success",
  "failed",
]);

export const teams = ensembleSchema.table(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamName: varchar("team_name", { length: 100 }).notNull().unique(),
    userGroup: varchar("user_group", { length: 100 }).notNull(),
    adminGroup: varchar("admin_group", { length: 100 }).notNull(),
    contactName: varchar("contact_name", { length: 100 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    turnoverGroupingEnabled: boolean("turnover_grouping_enabled")
      .notNull()
      .default(false),
    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedBy: varchar("updated_by", { length: 255 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    uniqueIndex("teams_team_name_idx").on(table.teamName),
    index("teams_contact_email_idx").on(table.contactEmail),
    index("teams_is_active_idx").on(table.isActive),
    index("teams_user_group_idx").on(table.userGroup),
    check(
      "teams_email_check",
      sql`${table.contactEmail} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`,
    ),
  ],
);

export const teamRegistrationRequests = ensembleSchema.table(
  "team_registration_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamName: varchar("team_name", { length: 100 }).notNull(),
    userGroup: varchar("user_group", { length: 100 }).notNull(),
    adminGroup: varchar("admin_group", { length: 100 }).notNull(),
    contactName: varchar("contact_name", { length: 100 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    status: approvalStatus("status").notNull().default("pending"),
    requestedBy: varchar("requested_by", { length: 255 }).notNull(),
    requestedAt: timestamp("requested_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    reviewedBy: varchar("reviewed_by", { length: 255 }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    comments: text("comments"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index("team_reg_status_idx").on(table.status),
    index("team_reg_requested_by_idx").on(table.requestedBy),
    index("team_reg_requested_at_idx").on(table.requestedAt),
    index("team_reg_status_requested_at_idx").on(
      table.status,
      table.requestedAt,
    ),
    index("team_reg_team_name_idx").on(table.teamName),
    check(
      "team_reg_email_check",
      sql`${table.contactEmail} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`,
    ),
  ],
);

export const applications = ensembleSchema.table(
  "applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    assetId: integer("asset_id").notNull(),
    applicationName: varchar("application_name", { length: 255 }).notNull(),
    tla: varchar("tla", { length: 12 }).notNull(),
    lifeCycleStatus: varchar("life_cycle_status", { length: 50 }),
    tier: varchar("tier", { length: 50 }),

    vpName: varchar("vp_name", { length: 100 }),
    vpEmail: varchar("vp_email", { length: 255 }),
    directorName: varchar("director_name", { length: 100 }),
    directorEmail: varchar("director_email", { length: 255 }),

    escalationEmail: varchar("escalation_email", { length: 255 }),
    contactEmail: varchar("contact_email", { length: 255 }),
    teamEmail: varchar("team_email", { length: 255 }),

    applicationOwnerName: varchar("application_owner_name", { length: 100 }),
    applicationOwnerEmail: varchar("application_owner_email", { length: 255 }),
    applicationOwnerBand: varchar("application_owner_band", { length: 10 }),

    applicationManagerName: varchar("application_manager_name", {
      length: 100,
    }),
    applicationManagerEmail: varchar("application_manager_email", {
      length: 255,
    }),
    applicationManagerBand: varchar("application_manager_band", { length: 10 }),

    applicationOwnerLeader1Name: varchar("application_owner_leader1_name", {
      length: 100,
    }),
    applicationOwnerLeader1Email: varchar("application_owner_leader1_email", {
      length: 255,
    }),
    applicationOwnerLeader1Band: varchar("application_owner_leader1_band", {
      length: 10,
    }),

    applicationOwnerLeader2Name: varchar("application_owner_leader2_name", {
      length: 100,
    }),
    applicationOwnerLeader2Email: varchar("application_owner_leader2_email", {
      length: 255,
    }),
    applicationOwnerLeader2Band: varchar("application_owner_leader2_band", {
      length: 10,
    }),

    ownerSvpName: varchar("owner_svp_name", { length: 100 }),
    ownerSvpEmail: varchar("owner_svp_email", { length: 255 }),
    ownerSvpBand: varchar("owner_svp_band", { length: 10 }),

    businessOwnerName: varchar("business_owner_name", { length: 100 }),
    businessOwnerEmail: varchar("business_owner_email", { length: 255 }),
    businessOwnerBand: varchar("business_owner_band", { length: 10 }),

    businessOwnerLeader1Name: varchar("business_owner_leader1_name", {
      length: 100,
    }),
    businessOwnerLeader1Email: varchar("business_owner_leader1_email", {
      length: 255,
    }),
    businessOwnerLeader1Band: varchar("business_owner_leader1_band", {
      length: 10,
    }),

    productionSupportOwnerName: varchar("production_support_owner_name", {
      length: 100,
    }),
    productionSupportOwnerEmail: varchar("production_support_owner_email", {
      length: 255,
    }),
    productionSupportOwnerBand: varchar("production_support_owner_band", {
      length: 10,
    }),

    productionSupportOwnerLeader1Name: varchar(
      "production_support_owner_leader1_name",
      { length: 100 },
    ),
    productionSupportOwnerLeader1Email: varchar(
      "production_support_owner_leader1_email",
      { length: 255 },
    ),
    productionSupportOwnerLeader1Band: varchar(
      "production_support_owner_leader1_band",
      { length: 10 },
    ),

    pmoName: varchar("pmo_name", { length: 100 }),
    pmoEmail: varchar("pmo_email", { length: 255 }),
    pmoBand: varchar("pmo_band", { length: 10 }),

    unitCioName: varchar("unit_cio_name", { length: 100 }),
    unitCioEmail: varchar("unit_cio_email", { length: 255 }),
    unitCioBand: varchar("unit_cio_band", { length: 10 }),

    snowGroup: varchar("snow_group", { length: 255 }),
    slackChannel: varchar("slack_channel", { length: 100 }),
    description: text("description"),
    status: applicationStatus("status").notNull().default("active"),

    lastCentralApiSync: timestamp("last_central_api_sync", {
      withTimezone: true,
    }),
    centralApiSyncStatus: syncStatus("central_api_sync_status").default(
      "pending",
    ),
    syncErrorMessage: text("sync_error_message"),

    createdBy: varchar("created_by", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedBy: varchar("updated_by", { length: 255 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("applications_team_id_idx").on(table.teamId),
    index("applications_status_idx").on(table.status),
    index("applications_tla_idx").on(table.tla),
    index("applications_tier_idx").on(table.tier),
    index("applications_life_cycle_status_idx").on(table.lifeCycleStatus),
    index("applications_asset_id_idx").on(table.assetId),
    index("applications_sync_status_idx").on(table.centralApiSyncStatus),
    index("applications_team_status_idx").on(table.teamId, table.status),
    index("applications_team_status_created_idx").on(
      table.teamId,
      table.status,
      table.createdAt,
    ),
    index("applications_name_idx").on(table.applicationName),
    check(
      "applications_slack_check",
      sql`${table.slackChannel} IS NULL OR ${table.slackChannel} LIKE '#%'`,
    ),
    check(
      "applications_email_checks",
      sql`
    (${table.vpEmail} IS NULL OR ${table.vpEmail} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') AND
    (${table.directorEmail} IS NULL OR ${table.directorEmail} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') AND
    (${table.escalationEmail} IS NULL OR ${table.escalationEmail} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') AND
    (${table.contactEmail} IS NULL OR ${table.contactEmail} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') AND
    (${table.teamEmail} IS NULL OR ${table.teamEmail} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') AND
    (${table.applicationOwnerEmail} IS NULL OR ${table.applicationOwnerEmail} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') AND
    (${table.applicationManagerEmail} IS NULL OR ${table.applicationManagerEmail} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') AND
    (${table.businessOwnerEmail} IS NULL OR ${table.businessOwnerEmail} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') AND
    (${table.productionSupportOwnerEmail} IS NULL OR ${table.productionSupportOwnerEmail} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
  `,
    ),
  ],
);

export const teamsRelations = relations(teams, ({ many }) => ({
  applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  team: one(teams, {
    fields: [applications.teamId],
    references: [teams.id],
  }),
}));

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamRegistrationRequest =
  typeof teamRegistrationRequests.$inferSelect;
export type NewTeamRegistrationRequest =
  typeof teamRegistrationRequests.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
