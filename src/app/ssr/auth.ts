import { createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getCookie,
  setCookie,
} from "@tanstack/react-start/server";
import { sealData, unsealData } from "iron-session";
import type { SessionData } from "@/lib/auth/config";
import { SESSION_CONFIG } from "@/lib/auth/config";
import { resolveUserPermissions } from "@/lib/auth/service";
import { logger } from "@/lib/logger";
import { ssoUserSchema } from "@/lib/zod/auth.schema";

const log = logger.child({ module: "auth" });

// How long (ms) before we re-query the DB to refresh permissions.
const PERMISSIONS_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// The fraction of maxAge remaining that triggers a sliding-window re-seal.
const SLIDING_WINDOW_THRESHOLD = 0.25; // re-seal in the last 25% of the session lifetime

/**
 * LOGIN: Receives SSO Data -> Calculates Roles -> Sets Encrypted Cookie
 */
export const loginUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ssoUserSchema.parse(data))
  .handler(async ({ data: ssoUser }) => {
    const email = ssoUser.attributes.email;
    log.info({ email }, "loginUser: start");

    // 0. Email domain guard — defence in depth against forged SSO payloads.
    if (!email.endsWith("@aexp.com")) {
      log.warn({ email }, "loginUser: rejected — invalid email domain");
      throw new Error("Unauthorized: invalid email domain");
    }

    // 1. Resolve Permissions from DB
    const permissions = await resolveUserPermissions(ssoUser.groups);
    log.info(
      { email, permissionsCount: permissions.length },
      "loginUser: permissions resolved"
    );

    const now = Date.now();
    const maxAgeMs = SESSION_CONFIG.cookieOptions.maxAge * 1000;

    // 2. Construct Session Object — store groups so we can auto-refresh later
    const sessionData: SessionData = {
      user: {
        firstName: ssoUser.attributes.firstName,
        lastName: ssoUser.attributes.lastName,
        email,
        adsId: ssoUser.attributes.adsId,
      },
      groups: ssoUser.groups,
      permissions,
      expiresAt: now + maxAgeMs,
      refreshedAt: now,
    };

    // 3. Encrypt (Seal) the Session
    const sealedSession = await sealData(sessionData, {
      password: SESSION_CONFIG.password,
    });

    // 4. Set Cookie (HTTP Only)
    setCookie(
      SESSION_CONFIG.cookieName,
      sealedSession,
      SESSION_CONFIG.cookieOptions
    );

    log.debug({ email }, "loginUser: session sealed and cookie set");
    return { success: true, permissions };
  });

/**
 * GET SESSION: Reads Cookie -> Decrypts -> Returns User
 *
 * Side-effects (transparent to the caller):
 *  - Auto-refreshes permissions every PERMISSIONS_REFRESH_INTERVAL ms.
 *  - Slides the session expiry when <SLIDING_WINDOW_THRESHOLD of maxAge is left.
 */
export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const cookie = getCookie(SESSION_CONFIG.cookieName);

    if (!cookie) {
      log.debug("getSession: no cookie found");
      return null;
    }

    try {
      // 1. Decrypt
      const session = await unsealData<SessionData>(cookie, {
        password: SESSION_CONFIG.password,
      });

      const now = Date.now();

      // 2. Verify Expiration
      if (now > session.expiresAt) {
        log.warn(
          { email: session.user.email },
          "getSession: session expired — clearing cookie"
        );
        deleteCookie(SESSION_CONFIG.cookieName);
        return null;
      }

      const maxAgeMs = SESSION_CONFIG.cookieOptions.maxAge * 1000;
      let updatedSession = { ...session };
      let needsReseal = false;

      // 3. Auto-refresh permissions if groups are stored and refresh interval has elapsed.
      const lastRefresh = session.refreshedAt ?? 0;
      if (
        session.groups?.length &&
        now - lastRefresh > PERMISSIONS_REFRESH_INTERVAL
      ) {
        log.info(
          { email: session.user.email },
          "getSession: auto-refreshing permissions"
        );
        const freshPermissions = await resolveUserPermissions(session.groups);
        updatedSession = {
          ...updatedSession,
          permissions: freshPermissions,
          refreshedAt: now,
        };
        log.info(
          {
            email: session.user.email,
            permissionsCount: freshPermissions.length,
          },
          "getSession: permissions refreshed"
        );
        needsReseal = true;
      }

      // 4. Sliding session window: extend expiry when close to the end.
      const timeLeft = updatedSession.expiresAt - now;
      if (timeLeft < maxAgeMs * SLIDING_WINDOW_THRESHOLD) {
        log.debug(
          { email: session.user.email, timeLeftMs: timeLeft },
          "getSession: sliding session window"
        );
        updatedSession = { ...updatedSession, expiresAt: now + maxAgeMs };
        needsReseal = true;
      }

      // 5. Persist updated session in a single re-seal (if needed).
      if (needsReseal) {
        const resealed = await sealData(updatedSession, {
          password: SESSION_CONFIG.password,
        });
        setCookie(
          SESSION_CONFIG.cookieName,
          resealed,
          SESSION_CONFIG.cookieOptions
        );
        log.debug(
          { email: session.user.email },
          "getSession: session re-sealed"
        );
      }

      log.debug(
        {
          email: session.user.email,
          permissionsCount: updatedSession.permissions.length,
        },
        "getSession: session valid"
      );
      return updatedSession;
    } catch (err) {
      // If decryption fails (tampered cookie), clear it
      log.error({ err }, "getSession: decryption failed — clearing cookie");
      deleteCookie(SESSION_CONFIG.cookieName);
      return null;
    }
  }
);
