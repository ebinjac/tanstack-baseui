import { createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import type { SessionData } from '@/lib/auth/config'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Router context type — available to all routes via beforeLoad/loader
export interface RouterContext {
  queryClient: QueryClient
  session: SessionData | null
}

// Create a new router instance with context
export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute default
      },
    },
  })

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    context: {
      queryClient,
      session: null, // Will be populated by __root.tsx beforeLoad
    },
  })

  return router
}

// Type registration for full type safety across the app
declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
