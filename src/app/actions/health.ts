import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export interface HealthCheck {
  details?: Record<string, string | number | boolean>;
  latency?: number;
  message?: string;
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
}

export interface SystemHealth {
  checks: HealthCheck[];
  environment: {
    nodeVersion: string;
    platform: string;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  overall: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
}

// Check database connection and response time
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Simple query to check database connectivity
    await db.execute(sql`SELECT 1 as health_check`);
    const latency = Date.now() - start;

    let status: "healthy" | "degraded" | "unhealthy" = "unhealthy";
    if (latency < 100) {
      status = "healthy";
    } else if (latency < 500) {
      status = "degraded";
    }

    return {
      name: "PostgreSQL Database",
      status,
      latency,
      message: `Connection successful (${latency}ms)`,
      details: {
        connectionString: process.env.DATABASE_URL
          ? "✓ Configured"
          : "✗ Missing",
        responseTime: `${latency}ms`,
      },
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Database connection failed";
    return {
      name: "PostgreSQL Database",
      status: "unhealthy",
      latency: Date.now() - start,
      message,
      details: {
        error: message,
      },
    };
  }
}

// Check if critical environment variables are set
function checkEnvironmentVariables(): HealthCheck {
  const requiredVars = ["DATABASE_URL", "SESSION_PASSWORD"];

  const optionalVars = ["NODE_ENV"];

  const missing = requiredVars.filter((v) => !process.env[v]);
  const configured = requiredVars.filter((v) => process.env[v]);

  const details: Record<string, string | number | boolean> = {};
  for (const v of requiredVars) {
    details[v] = process.env[v] ? "✓ Set" : "✗ Missing";
  }
  for (const v of optionalVars) {
    details[v] = process.env[v] || "Not set (optional)";
  }

  return {
    name: "Environment Variables",
    status: missing.length === 0 ? "healthy" : "unhealthy",
    message:
      missing.length === 0
        ? `All ${configured.length} required variables configured`
        : `Missing: ${missing.join(", ")}`,
    details,
  };
}

// Check memory usage
function checkMemory(): HealthCheck {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  const percentage = Math.round((used.heapUsed / used.heapTotal) * 100);

  let status: "healthy" | "degraded" | "unhealthy" = "unhealthy";
  if (percentage < 70) {
    status = "healthy";
  } else if (percentage < 90) {
    status = "degraded";
  }

  return {
    name: "Memory Usage",
    status,
    message: `${heapUsedMB}MB / ${heapTotalMB}MB (${percentage}%)`,
    details: {
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      external: `${Math.round(used.external / 1024 / 1024)}MB`,
      rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    },
  };
}

// Check API/Server health
function checkServer(): HealthCheck {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  return {
    name: "Server Runtime",
    status: "healthy",
    message: `Running for ${hours}h ${minutes}m`,
    details: {
      uptime: `${Math.round(uptime)}s`,
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
    },
  };
}

// Main health check function
export const getSystemHealth = createServerFn({ method: "GET" }).handler(
  async () => {
    const checks: HealthCheck[] = [];

    // Run all health checks
    checks.push(await checkDatabase());
    checks.push(checkEnvironmentVariables());
    checks.push(checkMemory());
    checks.push(checkServer());

    // Determine overall health
    const hasUnhealthy = checks.some((c) => c.status === "unhealthy");
    const hasDegraded = checks.some((c) => c.status === "degraded");

    const memUsage = process.memoryUsage();

    let overall: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (hasUnhealthy) {
      overall = "unhealthy";
    } else if (hasDegraded) {
      overall = "degraded";
    }

    return {
      overall,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          percentage: Math.round(
            (memUsage.heapUsed / memUsage.heapTotal) * 100
          ),
        },
      },
    };
  }
);
