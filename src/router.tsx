import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import type { SessionData } from "@/lib/auth/config";
import { routeTree } from "./routeTree.gen";

// Import the generated route tree

// Router context type — available to all routes via beforeLoad/loader
export interface RouterContext {
  queryClient: QueryClient;
  session: SessionData | null;
}

// Create a new router instance with context
export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute default
      },
    },
  });

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    // Preloading
    defaultPreload: "intent",
    defaultPreloadDelay: 100, // 100ms hover before firing preload (prevents thrash)
    defaultPreloadStaleTime: 0, // Let React Query handle cache freshness
    // Loading states
    defaultPendingMs: 0, // Show skeleton immediately — no 1s blank screen
    defaultPendingMinMs: 300, // Keep skeleton ≥300ms (avoids flash if data is cached)
    // Cache lifetime
    defaultGcTime: 1000 * 60 * 5, // Keep unused route data for 5 min (fast back-nav)
    context: {
      queryClient,
      session: null, // Will be populated by __root.tsx beforeLoad
    },
  });

  return router;
};

// Type registration for full type safety across the app
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
