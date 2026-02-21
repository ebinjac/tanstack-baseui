import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { TeamRegistrationSchema } from '@/lib/zod/team-registration.schema'
import { db } from '@/db'
import { teamRegistrationRequests, teams } from '@/db/schema/teams'
import { requireAuth } from '@/lib/middleware/auth.middleware'
import {
  sendTeamApprovalEmail,
  sendTeamRegistrationEmail,
  sendTeamRejectionEmail,
} from '@/lib/email/email.service'

// Server functions for team registration workflow
export const registerTeam = createServerFn({ method: 'POST' })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => {
    if (data instanceof FormData) {
      throw new Error('FormData not supported yet')
    }
    return TeamRegistrationSchema.parse(data)
  })
  .handler(async ({ data, context }) => {
    const requestedBy = context.userEmail

    try {
      const [newRequest] = await db
        .insert(teamRegistrationRequests)
        .values({
          teamName: data.teamName,
          userGroup: data.userGroup,
          adminGroup: data.adminGroup,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          comments: data.comments,
          requestedBy,
          requestedAt: new Date(),
          status: 'pending',
        })
        .returning()

      // Send confirmation email to the contact
      const emailResult = await sendTeamRegistrationEmail({
        to: data.contactEmail,
        teamName: data.teamName,
        contactName: data.contactName,
      })

      if (!emailResult.success) {
        console.error('Failed to send confirmation email:', emailResult.error)
        // Don't fail the registration if email fails, just log the error
      }

      return { success: true, requestId: newRequest.id }
    } catch (error: unknown) {
      console.error('Failed to register team:', error)
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as Record<string, unknown>).code === '23505'
      ) {
        throw new Error(
          'A request for this team name already exists or team name is taken.',
        )
      }
      throw new Error('Failed to submit team registration request')
    }
  })

export const checkTeamNameAvailability = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) =>
    z.object({ name: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { name } = data

    // Check existing teams
    const existingTeams = await db
      .select()
      .from(teams)
      .where(sql`lower(${teams.teamName}) = lower(${name})`)
      .limit(1)

    if (existingTeams.length > 0) {
      return { available: false, reason: 'Team name already exists.' }
    }

    // Check pending requests
    const existingRequests = await db
      .select()
      .from(teamRegistrationRequests)
      .where(
        sql`lower(${teamRegistrationRequests.teamName}) = lower(${name}) AND ${teamRegistrationRequests.status} = 'pending'`,
      )
      .limit(1)

    if (existingRequests.length > 0) {
      return {
        available: false,
        reason: 'A request for this team name is already pending.',
      }
    }

    return { available: true }
  })

export const getRegistrationRequests = createServerFn({ method: 'GET' })
  .middleware([requireAuth])
  .handler(async () => {
    try {
      const requests = await db
        .select()
        .from(teamRegistrationRequests)
        .orderBy(sql`${teamRegistrationRequests.requestedAt} DESC`)

      return requests
    } catch (error: unknown) {
      console.error('Failed to fetch registration requests:', error)
      throw new Error('Failed to fetch registration requests')
    }
  })

const UpdateRequestStatusSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(['approved', 'rejected', 'pending']),
  comments: z.string().optional(),
})

export const updateRequestStatus = createServerFn({ method: 'POST' })
  .middleware([requireAuth])
  .inputValidator((data: unknown) => UpdateRequestStatusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const reviewedBy = context.userEmail

    try {
      const [request] = await db
        .select()
        .from(teamRegistrationRequests)
        .where(sql`${teamRegistrationRequests.id} = ${data.requestId}`)
        .limit(1)

      if (!request) {
        throw new Error('Request not found')
      }

      if (data.status === 'approved') {
        await db.transaction(async (tx) => {
          await tx
            .update(teamRegistrationRequests)
            .set({
              status: 'approved',
              reviewedBy,
              reviewedAt: new Date(),
              comments: data.comments || request.comments,
            })
            .where(sql`${teamRegistrationRequests.id} = ${data.requestId}`)

          await tx.insert(teams).values({
            teamName: request.teamName,
            userGroup: request.userGroup,
            adminGroup: request.adminGroup,
            contactName: request.contactName,
            contactEmail: request.contactEmail,
            createdBy: request.requestedBy,
          })
        })

        // Send approval email
        const emailResult = await sendTeamApprovalEmail({
          to: request.contactEmail,
          teamName: request.teamName,
          contactName: request.contactName,
          reviewedBy,
          comments: data.comments,
        })

        if (!emailResult.success) {
          console.error('Failed to send approval email:', emailResult.error)
        }
      } else {
        await db
          .update(teamRegistrationRequests)
          .set({
            status: data.status,
            reviewedBy,
            reviewedAt: new Date(),
            comments: data.comments || request.comments,
          })
          .where(sql`${teamRegistrationRequests.id} = ${data.requestId}`)

        // Send rejection email
        const emailResult = await sendTeamRejectionEmail({
          to: request.contactEmail,
          teamName: request.teamName,
          contactName: request.contactName,
          reviewedBy,
          comments: data.comments,
        })

        if (!emailResult.success) {
          console.error('Failed to send rejection email:', emailResult.error)
        }
      }

      return { success: true }
    } catch (error: unknown) {
      console.error('Failed to update request status:', error)
      throw new Error('Failed to update request status')
    }
  })
