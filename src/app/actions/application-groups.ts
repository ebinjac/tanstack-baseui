import { asc, eq, inArray, sql } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '@/db'
import {
  applicationGroupMemberships,
  applicationGroups,
} from '@/db/schema/application-groups'
import { applications, teams } from '@/db/schema/teams'
import { requireAuth } from '@/lib/middleware/auth.middleware'

// ============================================================================
// Schemas
// ============================================================================
const GetApplicationGroupsSchema = z.object({
  teamId: z.uuid(),
})

const CreateApplicationGroupSchema = z.object({
  teamId: z.uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().optional(),
})

const UpdateApplicationGroupSchema = z.object({
  groupId: z.uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  displayOrder: z.number().optional(),
})

const DeleteApplicationGroupSchema = z.object({
  groupId: z.uuid(),
})

const AddApplicationsToGroupSchema = z.object({
  groupId: z.uuid(),
  applicationIds: z.array(z.uuid()),
})

const RemoveApplicationFromGroupSchema = z.object({
  applicationId: z.uuid(),
})

const ReorderGroupsSchema = z.object({
  groupIds: z.array(z.uuid()),
})

const ToggleTurnoverGroupingSchema = z.object({
  teamId: z.uuid(),
  enabled: z.boolean(),
})

const SyncGroupStructureSchema = z.object({
  teamId: z.uuid(),
  groups: z.array(
    z.object({
      id: z.string(), // Can be temporary ID for new groups
      name: z.string(),
      applicationIds: z.array(z.uuid()),
      color: z.string().optional(),
    }),
  ),
})

// ============================================================================
// Get Application Groups for a Team
// ============================================================================
export const getApplicationGroups = createServerFn({ method: 'GET' })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => GetApplicationGroupsSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      // Get the team to check if grouping is enabled
      const team = await db.query.teams.findFirst({
        where: (t, { eq }) => eq(t.id, data.teamId),
        columns: { turnoverGroupingEnabled: true },
      })

      // Get all groups for the team
      const groups = await db.query.applicationGroups.findMany({
        where: (g, { eq }) => eq(g.teamId, data.teamId),
        orderBy: (g, { asc }) => [asc(g.displayOrder), asc(g.createdAt)],
      })

      // Get all group memberships with applications
      const groupIds = groups.map((g) => g.id)
      let membershipsWithApps: Array<{
        groupId: string
        applicationId: string
        displayOrder: number
        application: typeof applications.$inferSelect
      }> = []

      if (groupIds.length > 0) {
        membershipsWithApps = await db
          .select({
            groupId: applicationGroupMemberships.groupId,
            applicationId: applicationGroupMemberships.applicationId,
            displayOrder: applicationGroupMemberships.displayOrder,
            application: applications,
          })
          .from(applicationGroupMemberships)
          .innerJoin(
            applications,
            eq(applicationGroupMemberships.applicationId, applications.id),
          )
          .where(inArray(applicationGroupMemberships.groupId, groupIds))
          .orderBy(asc(applicationGroupMemberships.displayOrder))
      }

      // Get all applications for the team
      const allApps = await db.query.applications.findMany({
        where: (a, { eq }) => eq(a.teamId, data.teamId),
      })

      // Build grouped applications map
      const groupedAppIds = new Set(
        membershipsWithApps.map((m) => m.applicationId),
      )
      const ungroupedApplications = allApps.filter(
        (a) => !groupedAppIds.has(a.id),
      )

      // Attach applications to groups
      const groupsWithApps = groups.map((group) => ({
        ...group,
        applications: membershipsWithApps
          .filter((m) => m.groupId === group.id)
          .map((m) => m.application),
      }))

      return {
        groups: groupsWithApps,
        ungroupedApplications,
        groupingEnabled: team?.turnoverGroupingEnabled ?? false,
      }
    } catch (error: unknown) {
      console.error('Failed to fetch application groups:', error)
      throw new Error('Failed to fetch application groups')
    }
  })

// ============================================================================
// Create Application Group
// ============================================================================
export const createApplicationGroup = createServerFn({ method: 'POST' })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => CreateApplicationGroupSchema.parse(data))
  .handler(async ({ data, context }) => {
    const userEmail = context.userEmail

    try {
      // Get max display order
      const maxOrderResult = await db
        .select({
          maxOrder: sql<number>`COALESCE(MAX(${applicationGroups.displayOrder}), 0)`,
        })
        .from(applicationGroups)
        .where(eq(applicationGroups.teamId, data.teamId))

      const nextOrder = (maxOrderResult[0]?.maxOrder ?? 0) + 1

      const [newGroup] = await db
        .insert(applicationGroups)
        .values({
          teamId: data.teamId,
          name: data.name,
          description: data.description,
          color: data.color || '#6366f1',
          displayOrder: nextOrder,
          createdBy: userEmail,
        })
        .returning()

      return { success: true, group: newGroup }
    } catch (error: unknown) {
      console.error('Failed to create application group:', error)
      throw new Error('Failed to create application group')
    }
  })

// ============================================================================
// Update Application Group
// ============================================================================
export const updateApplicationGroup = createServerFn({ method: 'POST' })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => UpdateApplicationGroupSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const updateData: Partial<typeof applicationGroups.$inferInsert> = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined)
        updateData.description = data.description
      if (data.color !== undefined) updateData.color = data.color
      if (data.displayOrder !== undefined)
        updateData.displayOrder = data.displayOrder
      updateData.updatedAt = new Date()

      const [updated] = await db
        .update(applicationGroups)
        .set(updateData)
        .where(eq(applicationGroups.id, data.groupId))
        .returning()

      return { success: true, group: updated }
    } catch (error: unknown) {
      console.error('Failed to update application group:', error)
      throw new Error('Failed to update application group')
    }
  })

// ============================================================================
// Delete Application Group
// ============================================================================
export const deleteApplicationGroup = createServerFn({ method: 'POST' })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => DeleteApplicationGroupSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      // Delete memberships first (cascade should handle this, but be explicit)
      await db
        .delete(applicationGroupMemberships)
        .where(eq(applicationGroupMemberships.groupId, data.groupId))

      // Delete the group
      await db
        .delete(applicationGroups)
        .where(eq(applicationGroups.id, data.groupId))

      return { success: true }
    } catch (error: unknown) {
      console.error('Failed to delete application group:', error)
      throw new Error('Failed to delete application group')
    }
  })

// ============================================================================
// Add Applications to Group
// ============================================================================
export const addApplicationsToGroup = createServerFn({ method: 'POST' })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => AddApplicationsToGroupSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      // Get current max display order in the group
      const maxOrderResult = await db
        .select({
          maxOrder: sql<number>`COALESCE(MAX(${applicationGroupMemberships.displayOrder}), 0)`,
        })
        .from(applicationGroupMemberships)
        .where(eq(applicationGroupMemberships.groupId, data.groupId))

      const nextOrder = (maxOrderResult[0]?.maxOrder ?? 0) + 1

      // Remove existing memberships for these applications (they can only be in one group)
      await db
        .delete(applicationGroupMemberships)
        .where(
          inArray(
            applicationGroupMemberships.applicationId,
            data.applicationIds,
          ),
        )

      // Add new memberships
      const memberships = data.applicationIds.map(
        (appId: string, index: number) => ({
          groupId: data.groupId,
          applicationId: appId,
          displayOrder: nextOrder + index,
        }),
      )

      await db.insert(applicationGroupMemberships).values(memberships)

      return { success: true }
    } catch (error: unknown) {
      console.error('Failed to add applications to group:', error)
      throw new Error('Failed to add applications to group')
    }
  })

// ============================================================================
// Remove Application from Group
// ============================================================================
export const removeApplicationFromGroup = createServerFn({ method: 'POST' })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    RemoveApplicationFromGroupSchema.parse(data),
  )
  .handler(async ({ data }) => {
    try {
      await db
        .delete(applicationGroupMemberships)
        .where(
          eq(applicationGroupMemberships.applicationId, data.applicationId),
        )

      return { success: true }
    } catch (error: unknown) {
      console.error('Failed to remove application from group:', error)
      throw new Error('Failed to remove application from group')
    }
  })

// ============================================================================
// Reorder Groups
// ============================================================================
export const reorderGroups = createServerFn({ method: 'POST' })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => ReorderGroupsSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      // Update display order for each group
      await Promise.all(
        data.groupIds.map((groupId: string, index: number) =>
          db
            .update(applicationGroups)
            .set({ displayOrder: index, updatedAt: new Date() })
            .where(eq(applicationGroups.id, groupId)),
        ),
      )

      return { success: true }
    } catch (error: unknown) {
      console.error('Failed to reorder groups:', error)
      throw new Error('Failed to reorder groups')
    }
  })

// ============================================================================
// Toggle Turnover Grouping
// ============================================================================
export const toggleTurnoverGrouping = createServerFn({ method: 'POST' })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => ToggleTurnoverGroupingSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      await db
        .update(teams)
        .set({ turnoverGroupingEnabled: data.enabled })
        .where(eq(teams.id, data.teamId))

      return { success: true, enabled: data.enabled }
    } catch (error: unknown) {
      console.error('Failed to toggle turnover grouping:', error)
      throw new Error('Failed to toggle turnover grouping')
    }
  })

// ============================================================================
// Sync Group Structure (Drag and Drop Updates)
// ============================================================================
export const syncGroupStructure = createServerFn({ method: 'POST' })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => SyncGroupStructureSchema.parse(data))
  .handler(async ({ data, context }) => {
    const userEmail = context.userEmail

    try {
      await db.transaction(async (tx) => {
        // 1. Get existing groups
        const existingGroups = await tx.query.applicationGroups.findMany({
          where: (g, { eq }) => eq(g.teamId, data.teamId),
        })

        const submittedGroupIds = new Set(data.groups.map((g) => g.id))
        const validUuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

        // 2. Delete removed groups
        const groupsToDelete = existingGroups.filter(
          (g) => !submittedGroupIds.has(g.id),
        )

        if (groupsToDelete.length > 0) {
          await tx.delete(applicationGroups).where(
            inArray(
              applicationGroups.id,
              groupsToDelete.map((g) => g.id),
            ),
          )
        }

        // 3. Process each group in order
        for (let i = 0; i < data.groups.length; i++) {
          const groupData = data.groups[i]
          let groupId = groupData.id

          // If temporary ID, create new group
          if (!validUuidRegex.test(groupId)) {
            const [newGroup] = await tx
              .insert(applicationGroups)
              .values({
                teamId: data.teamId,
                name: groupData.name,
                description: '',
                color: groupData.color || '#6366f1',
                displayOrder: i,
                createdBy: userEmail,
              })
              .returning()
            groupId = newGroup.id
          } else {
            // Update existing group
            await tx
              .update(applicationGroups)
              .set({
                name: groupData.name,
                displayOrder: i,
                updatedAt: new Date(),
              })
              .where(eq(applicationGroups.id, groupId))
          }

          // 4. Update memberships
          // Remove existing memberships for this group
          await tx
            .delete(applicationGroupMemberships)
            .where(eq(applicationGroupMemberships.groupId, groupId))

          // Add new memberships
          if (groupData.applicationIds.length > 0) {
            const memberships = groupData.applicationIds.map((appId, idx) => ({
              groupId,
              applicationId: appId,
              displayOrder: idx,
            }))
            await tx.insert(applicationGroupMemberships).values(memberships)
          }
        }
      })

      return { success: true }
    } catch (error: unknown) {
      console.error('Failed to sync group structure:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error('Failed to sync group structure: ' + message)
    }
  })
