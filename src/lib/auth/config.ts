// lib/auth/config.ts
import { z } from 'zod'

// 1. Define the Session Schema (Single Source of Truth)
export const SessionSchema = z.object({
  user: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    adsId: z.string(),
  }),
  permissions: z.array(
    z.object({
      teamId: z.string(),
      teamName: z.string(),
      role: z.enum(['ADMIN', 'MEMBER']),
    }),
  ),
  expiresAt: z.number(), // Unix timestamp
})

export type SessionData = z.infer<typeof SessionSchema>

// 2. Security Configuration
export const SESSION_CONFIG = {
  password:
    process.env.SESSION_PASSWORD && process.env.SESSION_PASSWORD.length >= 32
      ? process.env.SESSION_PASSWORD
      : 'this-is-a-at-least-32-char-password-for-dev', // MUST be 32+ chars long
  cookieName: 'ensemble_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    httpOnly: true, // JS cannot read this (No XSS)
    sameSite: 'lax' as const, // CSRF protection
    path: '/',
    maxAge: 60 * 60 * 24 * 1, // 1 Day (in seconds)
  },
}
