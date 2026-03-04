/**
 * Global Pino logger singleton.
 *
 * Usage anywhere on the SERVER (server functions, loaders):
 *
 *   import { logger } from "@/lib/logger";
 *   const log = logger.child({ module: "my-module" });
 *   log.info({ userId }, "action succeeded");
 *
 * Do NOT import this in client-side (browser) code — Pino is a Node module.
 */
import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  // debug in dev, info in production (override via LOG_LEVEL env var)
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),

  // In dev → pipe through pino-pretty for coloured, human-readable output.
  // In production → raw JSON to stdout (Docker / PM2 / log aggregator picks it up).
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          // SYS:HH:MM:ss.l → local time with milliseconds
          translateTime: "SYS:HH:MM:ss.l",
          // Show the module field prominently in the prefix
          messageFormat: "{module} › {msg}",
          // Suppress fields that pino-pretty renders inline
          ignore: "pid,hostname,module",
        },
      }
    : undefined,

  // Always tag every log line with the runtime environment
  base: { env: process.env.NODE_ENV ?? "development" },

  // Redact sensitive fields — they appear as [Redacted] in all log output.
  // Add more paths here as needed (e.g. "*.apiKey", "req.headers.authorization").
  redact: {
    paths: [
      "*.password",
      "*.token",
      "*.secret",
      "*.cookie",
      "session.password",
    ],
    censor: "[Redacted]",
  },
});
