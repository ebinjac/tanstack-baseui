import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useLocation,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider } from '@tanstack/react-query'

import appCss from '../styles.css?url'
import type { RouterContext } from '@/router'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/header'
import { SessionGuard } from '@/components/session-guard'
import { getSession } from '@/app/ssr/auth'
import { MotionConfig } from 'framer-motion'
import { RootProvider } from 'fumadocs-ui/provider/tanstack';

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    try {
      const session = await getSession()
      return { session }
    } catch (e) {
      return { session: null }
    }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Ensemble | Platform Operations',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { session, queryClient } = Route.useRouteContext()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="ensemble-theme">
          <MotionConfig reducedMotion="user">
            <QueryClientProvider client={queryClient}>
              <RootProvider>
                <SessionGuard session={session}>
                  <div className="relative flex min-h-screen flex-col">
                    {!isAdminRoute &&
                      !location.pathname.includes('/link-manager') &&
                      !location.pathname.includes('/turnover') && (
                        <Header session={session} />
                      )}
                    <main className="flex-1">{children}</main>
                  </div>
                  <Toaster />
                </SessionGuard>
              </RootProvider>
            </QueryClientProvider>
          </MotionConfig>
        </ThemeProvider>

        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
