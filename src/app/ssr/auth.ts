import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/react-start/server'
import { sealData, unsealData } from 'iron-session'
import { createServerFn } from '@tanstack/react-start'
import type { SessionData } from '@/lib/auth/config';
import { SESSION_CONFIG } from '@/lib/auth/config'
import { resolveUserPermissions } from '@/lib/auth/service'
import { ssoUserSchema } from '@/lib/zod/auth.schema'

/**
 * LOGIN: Receives SSO Data -> Calculates Roles -> Sets Encrypted Cookie
 */
export const loginUser = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => ssoUserSchema.parse(data))
  .handler(async ({ data: ssoUser }) => {
    // 1. Resolve Permissions from DB
    const permissions = await resolveUserPermissions(ssoUser.groups)

    // 2. Construct Session Object
    const sessionData: SessionData = {
      user: {
        firstName: ssoUser.attributes.firstName,
        lastName: ssoUser.attributes.lastName,
        email: ssoUser.attributes.email,
        adsId: ssoUser.attributes.adsId,
      },
      permissions,
      // Set strict expiration check inside the data payload
      expiresAt: Date.now() + SESSION_CONFIG.cookieOptions.maxAge * 1000,
    }

    // 3. Encrypt (Seal) the Session
    const sealedSession = await sealData(sessionData, {
      password: SESSION_CONFIG.password,
    })

    // 4. Set Cookie (HTTP Only)
    setCookie(
      SESSION_CONFIG.cookieName,
      sealedSession,
      SESSION_CONFIG.cookieOptions,
    )

    return { success: true, permissions }
  })

/**
 * GET SESSION: Reads Cookie -> Decrypts -> Returns User
 */
export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const cookie = getCookie(SESSION_CONFIG.cookieName)

    if (!cookie) return null

    try {
      // 1. Decrypt
      const session = await unsealData<SessionData>(cookie, {
        password: SESSION_CONFIG.password,
      })

      // 2. Verify Expiration
      if (Date.now() > session.expiresAt) {
        deleteCookie(SESSION_CONFIG.cookieName)
        return null
      }

      return session
    } catch (error) {
      // If decryption fails (tampered cookie), clear it
      deleteCookie(SESSION_CONFIG.cookieName)
      return null
    }
  },
)

/**
 * LOGOUT: Destroys the cookie
 */
export const logoutUser = createServerFn({ method: 'POST' }).handler(
  async () => {
    deleteCookie(SESSION_CONFIG.cookieName)
    return { success: true }
  },
)
