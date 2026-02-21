import { createMiddleware } from '@tanstack/react-start'
import type { SessionData } from '@/lib/auth/config'
import { getSession } from '@/app/ssr/auth'

/**
 * Base auth middleware — attaches session to context for all downstream handlers.
 * Does NOT enforce authentication; use `requireAuth` for that.
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await getSession()
  return next({
    context: { session },
  })
})

/**
 * Requires authenticated user — throws "Unauthorized" if no session.
 * Provides typed `session`, `userEmail`, and `userName` in context.
 */
export const requireAuth = createMiddleware()
  .middleware([authMiddleware])
  .server(async ({ next, context }) => {
    if (!context.session) {
      throw new Error('Unauthorized')
    }

    const session = context.session

    return next({
      context: {
        session,
        userEmail: session.user.email,
        userName: `${session.user.firstName} ${session.user.lastName}`,
      },
    })
  })

// ─── Authorization Helpers (used inside handlers) ───

/**
 * Asserts the session user is an admin for the given team.
 * Throws "Forbidden" if not.
 */
export function assertTeamAdmin(session: SessionData, teamId: string): void {
  const isAdmin = session.permissions.some(
    (p) => p.teamId === teamId && p.role === 'ADMIN',
  )
  if (!isAdmin) {
    throw new Error('Forbidden: Team admin required')
  }
}

/**
 * Asserts the session user is a member (any role) of the given team.
 * Throws "Forbidden" if not.
 */
export function assertTeamMember(session: SessionData, teamId: string): void {
  const isMember = session.permissions.some((p) => p.teamId === teamId)
  if (!isMember) {
    throw new Error('Forbidden: Team membership required')
  }
}
