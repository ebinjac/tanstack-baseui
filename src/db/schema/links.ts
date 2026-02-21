import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
  boolean,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import { ensembleSchema, teams, applications } from './teams'

export const linkVisibility = ensembleSchema.enum('link_visibility', [
  'private',
  'public',
])

export const linkCategories = ensembleSchema.table(
  'link_categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    createdBy: varchar('created_by', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('link_categories_team_id_idx').on(table.teamId),
    uniqueIndex('link_categories_team_name_idx').on(table.teamId, table.name),
  ],
)

export const links = ensembleSchema.table(
  'links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    applicationId: uuid('application_id').references(() => applications.id, {
      onDelete: 'set null',
    }),
    categoryId: uuid('category_id').references(() => linkCategories.id, {
      onDelete: 'set null',
    }),

    // Core Link Data
    title: varchar('title', { length: 255 }).notNull(),
    url: text('url').notNull(),
    description: text('description'),
    visibility: linkVisibility('visibility').notNull().default('private'),

    // Custom Tags (Array of strings)
    tags: text('tags').array(),

    // Usage Metrics
    usageCount: integer('usage_count').default(0).notNull(),

    // Audit
    createdBy: varchar('created_by', { length: 255 }).notNull(), // User Email
    userEmail: varchar('user_email', { length: 255 }).notNull(), // Owner for Private links
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedBy: varchar('updated_by', { length: 255 }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (table) => [
    index('links_team_id_idx').on(table.teamId),
    index('links_user_email_idx').on(table.userEmail),
    index('links_application_id_idx').on(table.applicationId),
    index('links_category_id_idx').on(table.categoryId),
    index('links_visibility_idx').on(table.visibility),
    check('links_url_check', sql`${table.url} ~* '^https?://.+'`), // Basic URL check
  ],
)

export const linkCategoriesRelations = relations(
  linkCategories,
  ({ one, many }) => ({
    team: one(teams, {
      fields: [linkCategories.teamId],
      references: [teams.id],
    }),
    links: many(links),
  }),
)

export const linksRelations = relations(links, ({ one }) => ({
  team: one(teams, {
    fields: [links.teamId],
    references: [teams.id],
  }),
  application: one(applications, {
    fields: [links.applicationId],
    references: [applications.id],
  }),
  category: one(linkCategories, {
    fields: [links.categoryId],
    references: [linkCategories.id],
  }),
}))

export type Link = typeof links.$inferSelect
export type NewLink = typeof links.$inferInsert
export type LinkCategory = typeof linkCategories.$inferSelect
export type NewLinkCategory = typeof linkCategories.$inferInsert

export type LinkWithRelations = Link & {
  category?: LinkCategory | null
  application?: any | null // Replace 'any' with Application type if available
}
