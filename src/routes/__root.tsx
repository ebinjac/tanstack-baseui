import { HeadContent, Scripts, createRootRoute, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import appCss from '../styles.css?url'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { Header } from '@/components/header'
import { SessionGuard } from '@/components/session-guard'
import { getSession } from '@/app/ssr/auth'

export const Route = createRootRoute({
  loader: async () => {
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


const queryClient = new QueryClient()

function RootDocument({ children }: { children: React.ReactNode }) {
  const { session } = Route.useLoaderData()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="ensemble-theme">
          <QueryClientProvider client={queryClient}>
            <SessionGuard session={session}>
              <div className="relative flex min-h-screen flex-col">
                {!isAdminRoute && <Header session={session} />}
                <main className="flex-1">
                  {children}
                </main>
              </div>
              <Toaster />
            </SessionGuard>
          </QueryClientProvider>
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

