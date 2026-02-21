import {
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  bigint,
  boolean,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { ensembleSchema, applications, teams } from './teams'

// Scorecard Entries - Sub-applications for tracking
export const scorecardEntries = ensembleSchema.table(
  'scorecard_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    // Unique identifier for future automated backend integration
    scorecardIdentifier: varchar('scorecard_identifier', { length: 100 })
      .notNull()
      .unique(),
    // Display name (e.g., "KMS-IDEAL", "KMS-V1")
    name: varchar('name', { length: 255 }).notNull(),
    // Threshold for availability (default 98%)
    availabilityThreshold: decimal('availability_threshold', {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default('98.00'),
    // Threshold for volume change percentage (default 20%)
    volumeChangeThreshold: decimal('volume_change_threshold', {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default('20.00'),
    createdBy: varchar('created_by', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedBy: varchar('updated_by', { length: 255 }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index('scorecard_entries_application_id_idx').on(table.applicationId),
    uniqueIndex('scorecard_entries_identifier_idx').on(
      table.scorecardIdentifier,
    ),
    index('scorecard_entries_name_idx').on(table.name),
  ],
)

// Monthly Availability Records
export const scorecardAvailability = ensembleSchema.table(
  'scorecard_availability',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scorecardEntryId: uuid('scorecard_entry_id')
      .notNull()
      .references(() => scorecardEntries.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    year: integer('year').notNull(),
    month: integer('month').notNull(), // 1-12
    availability: decimal('availability', { precision: 5, scale: 2 }).notNull(),
    // Reason for threshold breach (required when below threshold)
    reason: text('reason'),
    createdBy: varchar('created_by', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedBy: varchar('updated_by', { length: 255 }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index('scorecard_availability_entry_id_idx').on(table.scorecardEntryId),
    uniqueIndex('scorecard_availability_entry_year_month_idx').on(
      table.scorecardEntryId,
      table.year,
      table.month,
    ),
    index('scorecard_availability_year_idx').on(table.year),
  ],
)

// Scorecard Publish Status - Tracks which months are published for enterprise view
export const scorecardPublishStatus = ensembleSchema.table(
  'scorecard_publish_status',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    year: integer('year').notNull(),
    month: integer('month').notNull(), // 1-12
    isPublished: boolean('is_published').notNull().default(false),
    publishedBy: varchar('published_by', { length: 255 }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    unpublishedBy: varchar('unpublished_by', { length: 255 }),
    unpublishedAt: timestamp('unpublished_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index('scorecard_publish_status_team_id_idx').on(table.teamId),
    uniqueIndex('scorecard_publish_status_team_year_month_idx').on(
      table.teamId,
      table.year,
      table.month,
    ),
    index('scorecard_publish_status_is_published_idx').on(table.isPublished),
  ],
)

// Monthly Volume Records
export const scorecardVolume = ensembleSchema.table(
  'scorecard_volume',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scorecardEntryId: uuid('scorecard_entry_id')
      .notNull()
      .references(() => scorecardEntries.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
    year: integer('year').notNull(),
    month: integer('month').notNull(), // 1-12
    volume: bigint('volume', { mode: 'number' }).notNull(),
    // Reason for significant change (required when change > threshold)
    reason: text('reason'),
    createdBy: varchar('created_by', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedBy: varchar('updated_by', { length: 255 }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index('scorecard_volume_entry_id_idx').on(table.scorecardEntryId),
    uniqueIndex('scorecard_volume_entry_year_month_idx').on(
      table.scorecardEntryId,
      table.year,
      table.month,
    ),
    index('scorecard_volume_year_idx').on(table.year),
  ],
)

// Relations
export const scorecardEntriesRelations = relations(
  scorecardEntries,
  ({ one, many }) => ({
    application: one(applications, {
      fields: [scorecardEntries.applicationId],
      references: [applications.id],
    }),
    availabilityRecords: many(scorecardAvailability),
    volumeRecords: many(scorecardVolume),
  }),
)

export const scorecardAvailabilityRelations = relations(
  scorecardAvailability,
  ({ one }) => ({
    entry: one(scorecardEntries, {
      fields: [scorecardAvailability.scorecardEntryId],
      references: [scorecardEntries.id],
    }),
  }),
)

export const scorecardVolumeRelations = relations(
  scorecardVolume,
  ({ one }) => ({
    entry: one(scorecardEntries, {
      fields: [scorecardVolume.scorecardEntryId],
      references: [scorecardEntries.id],
    }),
  }),
)

export const scorecardPublishStatusRelations = relations(
  scorecardPublishStatus,
  ({ one }) => ({
    team: one(teams, {
      fields: [scorecardPublishStatus.teamId],
      references: [teams.id],
    }),
  }),
)

// Types
export type ScorecardEntry = typeof scorecardEntries.$inferSelect
export type NewScorecardEntry = typeof scorecardEntries.$inferInsert
export type ScorecardAvailability = typeof scorecardAvailability.$inferSelect
export type NewScorecardAvailability = typeof scorecardAvailability.$inferInsert
export type ScorecardVolume = typeof scorecardVolume.$inferSelect
export type NewScorecardVolume = typeof scorecardVolume.$inferInsert
export type ScorecardPublishStatus = typeof scorecardPublishStatus.$inferSelect
export type NewScorecardPublishStatus =
  typeof scorecardPublishStatus.$inferInsert
