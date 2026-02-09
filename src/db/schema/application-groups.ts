import {
    uuid,
    varchar,
    text,
    timestamp,
    integer,
    boolean,
    index,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { ensembleSchema, teams, applications } from "./teams";

// ============================================================================
// Application Groups - Logical grouping of applications
// ============================================================================
export const applicationGroups = ensembleSchema.table(
    "application_groups",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        teamId: uuid("team_id")
            .notNull()
            .references(() => teams.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        name: varchar("name", { length: 100 }).notNull(),
        description: text("description"),
        color: varchar("color", { length: 20 }).default("#6366f1"), // Default indigo
        displayOrder: integer("display_order").notNull().default(0),
        isEnabled: boolean("is_enabled").notNull().default(true),
        createdBy: varchar("created_by", { length: 255 }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedBy: varchar("updated_by", { length: 255 }),
        updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
            () => new Date()
        ),
    },
    (table) => [
        index("app_groups_team_id_idx").on(table.teamId),
        index("app_groups_display_order_idx").on(table.teamId, table.displayOrder),
        index("app_groups_is_enabled_idx").on(table.teamId, table.isEnabled),
    ]
);

// ============================================================================
// Application Group Memberships - Links applications to groups
// ============================================================================
export const applicationGroupMemberships = ensembleSchema.table(
    "application_group_memberships",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        groupId: uuid("group_id")
            .notNull()
            .references(() => applicationGroups.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        applicationId: uuid("application_id")
            .notNull()
            .references(() => applications.id, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        displayOrder: integer("display_order").notNull().default(0),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        uniqueIndex("app_group_membership_unique_idx").on(
            table.groupId,
            table.applicationId
        ),
        index("app_group_membership_group_id_idx").on(table.groupId),
        index("app_group_membership_app_id_idx").on(table.applicationId),
        index("app_group_membership_order_idx").on(table.groupId, table.displayOrder),
    ]
);

// ============================================================================
// Relations
// ============================================================================
export const applicationGroupsRelations = relations(
    applicationGroups,
    ({ one, many }) => ({
        team: one(teams, {
            fields: [applicationGroups.teamId],
            references: [teams.id],
        }),
        memberships: many(applicationGroupMemberships),
    })
);

export const applicationGroupMembershipsRelations = relations(
    applicationGroupMemberships,
    ({ one }) => ({
        group: one(applicationGroups, {
            fields: [applicationGroupMemberships.groupId],
            references: [applicationGroups.id],
        }),
        application: one(applications, {
            fields: [applicationGroupMemberships.applicationId],
            references: [applications.id],
        }),
    })
);

// ============================================================================
// Types
// ============================================================================
export type ApplicationGroup = typeof applicationGroups.$inferSelect;
export type NewApplicationGroup = typeof applicationGroups.$inferInsert;
export type ApplicationGroupMembership =
    typeof applicationGroupMemberships.$inferSelect;
export type NewApplicationGroupMembership =
    typeof applicationGroupMemberships.$inferInsert;
