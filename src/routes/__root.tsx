import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useLocation,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { MotionConfig } from "framer-motion";
import { RootProvider } from "fumadocs-ui/provider/tanstack";
import { getSession } from "@/app/ssr/auth";
import { Header } from "@/components/header";
import { SessionGuard } from "@/components/session-guard";
import { GlobalNavigationProgress } from "@/components/shared/navigation-progress";
import { PageSkeleton } from "@/components/skeletons/page-skeleton";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { logger } from "@/lib/logger";
import type { RouterContext } from "@/router";
import appCss from "../styles.css?url";

const log = logger.child({ module: "root" });

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const t = performance.now();
    try {
      const session = await getSession();
      log.debug(
        {
          durationMs: Math.round(performance.now() - t),
          authenticated: !!session,
        },
        "root: getSession complete"
      );
      return { session };
    } catch (err) {
      log.error(
        { err, durationMs: Math.round(performance.now() - t) },
        "root: getSession failed"
      );
      return { session: null };
    }
  },
  pendingComponent: PageSkeleton,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Ensemble | Platform Operations",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { session, queryClient } = Route.useRouteContext();
  const location = useLocation();
  const routerState = useRouterState();

  // Use the pending pathname during navigation so UI decisions are based on
  // where we're going, not where we currently are. This prevents header/hero
  // flashing when transitioning between routes.
  const effectivePath =
    routerState.status === "pending" && routerState.location
      ? routerState.location.pathname
      : location.pathname;

  const isAdminRoute = effectivePath.startsWith("/admin");
  const hideHeader =
    isAdminRoute ||
    effectivePath.includes("/link-manager") ||
    effectivePath.includes("/turnover") ||
    effectivePath.includes("/scorecard");

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" storageKey="ensemble-theme">
          <MotionConfig reducedMotion="user">
            <GlobalNavigationProgress />
            <QueryClientProvider client={queryClient}>
              <RootProvider>
                <SessionGuard session={session}>
                  <div className="relative flex min-h-screen flex-col">
                    {!hideHeader && <Header session={session} />}
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
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
