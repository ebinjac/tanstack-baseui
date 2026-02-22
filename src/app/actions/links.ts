import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, ilike, lt, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { linkCategories, links } from "@/db/schema/links";
import type { SessionData } from "@/lib/auth/config";
import { requireAuth } from "@/lib/middleware/auth.middleware";
import { BulkCreateLinkSchema, CreateLinkSchema } from "@/lib/zod/links.schema";

// ─── Helpers ───

interface StatsBucket {
  clicks: number;
  count: number;
}

function validateBulkLinkUpdatesRbac(
  link: typeof links.$inferSelect,
  updates: { visibility?: "private" | "public" },
  isAdmin: boolean,
  userEmail: string
) {
  const isOwner = link.userEmail === userEmail;

  if (link.visibility === "public" && !isAdmin) {
    throw new Error("Only Admins can update Public links");
  }
  if (link.visibility !== "public" && !(isOwner || isAdmin)) {
    throw new Error("You can only update your own private links");
  }

  // If changing visibility to public, must be admin
  if (updates.visibility === "public" && !isAdmin) {
    throw new Error("Only Admins can make links public");
  }
}

/** Check if the user is an admin for a given team */
function isTeamAdminCheck(session: SessionData, teamId: string): boolean {
  return session.permissions.some(
    (p) => p.teamId === teamId && p.role === "ADMIN"
  );
}

function parseSelectFieldValue(
  value: string | null | undefined
): string | null | undefined {
  if (value && value !== "none") {
    return value;
  }
  if (value === "none") {
    return null;
  }
  return undefined;
}

/**
 * GET LINKS
 * Fetches links for a team based on visibility and search permissions.
 */
export const getLinks = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        teamId: z.uuid(),
        search: z.string().optional(),
        visibility: z.enum(["all", "private", "public"]).prefault("all"),
        applicationId: z.uuid().optional(),
        categoryId: z.uuid().optional(),
        limit: z.int().min(1).max(100).prefault(30),
        cursor: z.string().optional(), // ISO timestamp cursor for pagination
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    const {
      teamId,
      search,
      visibility,
      applicationId,
      categoryId,
      limit,
      cursor,
    } = data;
    const userEmail = context.userEmail;

    // Base filters: Always filter by Team
    const filters = [eq(links.teamId, teamId)];

    // Visibility Logic
    if (visibility === "private") {
      const privateCondition = and(
        eq(links.visibility, "private"),
        eq(links.userEmail, userEmail)
      );
      if (privateCondition) {
        filters.push(privateCondition);
      }
    } else if (visibility === "public") {
      filters.push(eq(links.visibility, "public"));
    } else {
      // "all" = (Public) OR (Private AND My Own)
      const allCondition = or(
        eq(links.visibility, "public"),
        and(eq(links.visibility, "private"), eq(links.userEmail, userEmail))
      );
      if (allCondition) {
        filters.push(allCondition);
      }
    }

    // Application Filter
    if (applicationId) {
      filters.push(eq(links.applicationId, applicationId));
    }

    // Category Filter
    if (categoryId) {
      filters.push(eq(links.categoryId, categoryId));
    }

    // Search Logic
    if (search) {
      const searchCondition = or(
        ilike(links.title, `%${search}%`),
        ilike(links.description, `%${search}%`),
        ilike(links.url, `%${search}%`)
      );
      if (searchCondition) {
        filters.push(searchCondition);
      }
    }

    // Separate base filters (for count) from page filters (+ cursor for data)
    const baseFilters = [...filters];
    if (cursor) {
      filters.push(lt(links.createdAt, new Date(cursor)));
    }

    // Run count (without cursor) + data (with cursor) queries in parallel
    const [countResult, rows] = await Promise.all([
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(links)
        .where(and(...baseFilters)),
      db.query.links.findMany({
        where: and(...filters),
        orderBy: [desc(links.createdAt)],
        limit: limit + 1,
        with: {
          category: true,
          application: true,
        },
      }),
    ]);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const lastItem = items.length > 0 ? items.at(-1) : undefined;
    const nextCursor =
      hasMore && lastItem ? lastItem.createdAt.toISOString() : null;

    return {
      items,
      nextCursor,
      totalCount: countResult[0].count,
    };
  });

/**
 * CREATE LINK
 */
export const createLink = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => CreateLinkSchema.parse(data))
  .handler(async ({ data, context }) => {
    // Validations
    if (
      data.visibility === "public" &&
      !isTeamAdminCheck(context.session, data.teamId)
    ) {
      throw new Error("Only Admins can create Public links");
    }

    const userEmail = context.userEmail;

    // Insert
    await db.insert(links).values({
      ...data,
      applicationId:
        data.applicationId && data.applicationId !== "none"
          ? data.applicationId
          : null,
      categoryId:
        data.categoryId && data.categoryId !== "none" ? data.categoryId : null,
      userEmail,
      createdBy: userEmail,
    });

    return { success: true };
  });

/**
 * DELETE LINK
 */
export const deleteLink = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.uuid(), teamId: z.uuid() }).parse(data)
  )
  .handler(async ({ data, context }) => {
    const link = await db.query.links.findFirst({
      where: eq(links.id, data.id),
    });

    if (!link) {
      throw new Error("Link not found");
    }

    // RBAC for Deletion
    const isAdmin = isTeamAdminCheck(context.session, data.teamId);
    const isOwner = link.userEmail === context.userEmail;

    if (link.visibility === "public" && !isAdmin) {
      throw new Error("Only Admins can delete Public links");
    }
    if (link.visibility !== "public" && !isOwner) {
      throw new Error("You can only delete your own private links");
    }

    await db.delete(links).where(eq(links.id, data.id));
    return { success: true };
  });

/**
 * INCREMENT USAGE
 */
export const trackLinkUsage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ id: z.uuid() }).parse(data))
  .handler(async ({ data }) => {
    await db
      .update(links)
      .set({ usageCount: sql`${links.usageCount} + 1` })
      .where(eq(links.id, data.id));

    return { success: true };
  });

/**
 * UPDATE LINK
 */
export const updateLink = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.uuid(),
        teamId: z.uuid(),
        title: z.string().optional(),
        url: z.url().optional(),
        description: z.string().optional(),
        visibility: z.enum(["private", "public"]).optional(),
        categoryId: z.uuid().nullable().optional(),
        applicationId: z.uuid().nullable().optional(),
        tags: z.array(z.string()).optional(),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    const link = await db.query.links.findFirst({
      where: eq(links.id, data.id),
    });

    if (!link) {
      throw new Error("Link not found");
    }

    // RBAC for Update
    const isAdmin = isTeamAdminCheck(context.session, link.teamId);
    const isOwner = link.userEmail === context.userEmail;

    if (link.visibility === "public" && !isAdmin) {
      throw new Error("Only Admins can update Public links");
    }
    if (link.visibility !== "public" && !isOwner) {
      throw new Error("You can only update your own private links");
    }

    const { id, ...updateFields } = data;
    const userEmail = context.userEmail;

    const updates: Record<string, unknown> = {
      ...updateFields,
      applicationId: parseSelectFieldValue(updateFields.applicationId),
      categoryId: parseSelectFieldValue(updateFields.categoryId),
      updatedBy: userEmail,
      updatedAt: new Date(),
    };

    // Remove undefined fields to avoid overwriting with null
    for (const key of Object.keys(updates)) {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    }

    await db.update(links).set(updates).where(eq(links.id, id));

    return { success: true };
  });

/**
 * BULK CREATE LINKS
 */
export const bulkCreateLinks = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => BulkCreateLinkSchema.parse(data))
  .handler(async ({ data, context }) => {
    const userEmail = context.userEmail;

    // Check permissions
    // If any link is public, user must be admin
    const hasPublicLinks = data.links.some((l) => l.visibility === "public");
    if (hasPublicLinks && !isTeamAdminCheck(context.session, data.teamId)) {
      throw new Error("Only admins can create public links");
    }

    // Prepare data for insertion
    if (data.links.length === 0) {
      return { count: 0 };
    }

    const linksToInsert = data.links.map((link) => ({
      ...link,
      id: crypto.randomUUID(),
      teamId: data.teamId,
      userEmail,
      createdBy: userEmail,
      createdAt: new Date(),
      updatedBy: userEmail,
      updatedAt: new Date(),
      usageCount: 0,
      applicationId: link.applicationId || null,
      categoryId: link.categoryId || null,
      description: link.description || null,
      visibility: link.visibility,
    }));

    await db.insert(links).values(linksToInsert);

    return { count: linksToInsert.length };
  });

/**
 * BULK UPDATE LINKS
 * Updates multiple links at once with the same values
 */
export const bulkUpdateLinks = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        teamId: z.uuid(),
        linkIds: z.array(z.uuid()).min(1),
        updates: z.object({
          visibility: z.enum(["private", "public"]).optional(),
          categoryId: z.uuid().nullable().optional(),
          applicationId: z.uuid().nullable().optional(),
          tagsToAdd: z.array(z.string()).optional(),
          replaceTags: z.boolean().optional(),
        }),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    const { teamId, linkIds, updates } = data;
    const userEmail = context.userEmail;

    // Get permission for this team
    const isAdmin = isTeamAdminCheck(context.session, teamId);

    // Fetch all links to be updated
    const linksToUpdate = await db.query.links.findMany({
      where: and(
        eq(links.teamId, teamId),
        sql`${links.id} IN (${sql.raw(linkIds.map((id) => `'${id}'`).join(","))})`
      ),
    });

    if (linksToUpdate.length === 0) {
      throw new Error("No links found to update");
    }

    // RBAC: Check permissions for each link
    for (const link of linksToUpdate) {
      validateBulkLinkUpdatesRbac(link, updates, isAdmin, userEmail);
    }

    // Build the update object
    const updatePayload: Record<string, unknown> = {
      updatedBy: userEmail,
      updatedAt: new Date(),
    };

    if (updates.visibility !== undefined) {
      updatePayload.visibility = updates.visibility;
    }

    if (updates.categoryId !== undefined) {
      updatePayload.categoryId = updates.categoryId;
    }

    if (updates.applicationId !== undefined) {
      updatePayload.applicationId = updates.applicationId;
    }

    // Handle tags - need to update each link individually if appending
    if (updates.tagsToAdd && updates.tagsToAdd.length > 0) {
      // Update links one by one to handle tags properly
      for (const link of linksToUpdate) {
        const existingTags = link.tags || [];
        const newTags = updates.replaceTags
          ? updates.tagsToAdd
          : [...new Set([...existingTags, ...updates.tagsToAdd])];

        await db
          .update(links)
          .set({
            ...updatePayload,
            tags: newTags,
          })
          .where(eq(links.id, link.id));
      }
    } else {
      // Bulk update all links at once
      await db
        .update(links)
        .set(updatePayload)
        .where(
          and(
            eq(links.teamId, teamId),
            sql`${links.id} IN (${sql.raw(linkIds.map((id) => `'${id}'`).join(","))})`
          )
        );
    }

    return { success: true, count: linksToUpdate.length };
  });

/**
 * GET LINK CATEGORIES
 */
export const getLinkCategories = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => z.object({ teamId: z.uuid() }).parse(data))
  .handler(async ({ data }) => {
    return await db.query.linkCategories.findMany({
      where: eq(linkCategories.teamId, data.teamId),
      orderBy: [desc(linkCategories.createdAt)],
    });
  });

/**
 * CREATE LINK CATEGORY
 */
export const createLinkCategory = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        teamId: z.uuid(),
        name: z.string().min(1).max(100),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    const [newCategory] = await db
      .insert(linkCategories)
      .values({
        teamId: data.teamId,
        name: data.name,
        createdBy: context.userEmail,
      })
      .returning();

    return newCategory;
  });

/**
 * UPDATE LINK CATEGORY
 */
export const updateLinkCategory = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.uuid(),
        name: z.string().min(1).max(100),
        description: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { id, ...updates } = data;

    await db
      .update(linkCategories)
      .set({
        ...updates,
      })
      .where(eq(linkCategories.id, id));

    return { success: true };
  });

/**
 * DELETE LINK CATEGORY
 */
export const deleteLinkCategory = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.uuid(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    // Note: Links with this categoryId will be set to null due to onDelete: "set null"
    await db.delete(linkCategories).where(eq(linkCategories.id, data.id));

    return { success: true };
  });

/**
 * GET LINK STATS
 */
export const getLinkStats = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        teamId: z.uuid(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { teamId } = data;

    // Fetch all links for the team to calculate stats
    const allLinks = await db.query.links.findMany({
      where: eq(links.teamId, teamId),
      with: {
        category: true,
        application: true,
      },
    });

    const totalLinks = allLinks.length;
    const totalClicks = allLinks.reduce(
      (acc, link) => acc + (link.usageCount || 0),
      0
    );

    // Top 5 links
    const topLinks = [...allLinks]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5);

    // Category breakdown
    const categoryStatsMap = allLinks.reduce<Record<string, StatsBucket>>(
      (acc, link) => {
        const catName = link.category?.name || "Uncategorized";
        if (!acc[catName]) {
          acc[catName] = { count: 0, clicks: 0 };
        }
        acc[catName].count++;
        acc[catName].clicks += link.usageCount || 0;
        return acc;
      },
      {}
    );

    // Application breakdown
    const applicationStatsMap = allLinks.reduce<Record<string, StatsBucket>>(
      (acc, link) => {
        const appName = link.application?.applicationName || "No Application";
        if (!acc[appName]) {
          acc[appName] = { count: 0, clicks: 0 };
        }
        acc[appName].count++;
        acc[appName].clicks += link.usageCount || 0;
        return acc;
      },
      {}
    );

    // Visibility breakdown
    const visibilityStatsMap = allLinks.reduce<Record<string, StatsBucket>>(
      (acc, link) => {
        const vis = link.visibility;
        if (!acc[vis]) {
          acc[vis] = { count: 0, clicks: 0 };
        }
        acc[vis].count++;
        acc[vis].clicks += link.usageCount || 0;
        return acc;
      },
      {}
    );

    return {
      totalLinks,
      totalClicks,
      topLinks,
      categoryStats: Object.entries(categoryStatsMap).map(([name, stats]) => ({
        name,
        ...stats,
      })),
      applicationStats: Object.entries(applicationStatsMap).map(
        ([name, stats]) => ({ name, ...stats })
      ),
      visibilityStats: Object.entries(visibilityStatsMap).map(
        ([name, stats]) => ({ name, ...stats })
      ),
    };
  });
