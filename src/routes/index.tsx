import {
  createFileRoute,
  useRouteContext,
  useRouterState,
} from "@tanstack/react-router";
import { CtaSection } from "@/components/landing/cta-section";
import { HeroSection } from "@/components/landing/hero-section";
import { OnboardingSteps } from "@/components/landing/onboarding-steps";
import { PageFooter } from "@/components/landing/page-footer";
import { PlatformShowcase } from "@/components/landing/platform-showcase";
import { ToolsBentoGrid } from "@/components/landing/tools-bento-grid";
import { useActiveHrefs } from "@/hooks/use-active-hrefs";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const routerState = useRouterState();

  // Only hide when actively navigating TO a different page.
  // routerState.status === "pending" is also true on the initial page load,
  // which would cause a black screen on hard refresh without this check.
  const pendingPath = routerState.location?.pathname;
  const isNavigatingAway =
    routerState.status === "pending" && !!pendingPath && pendingPath !== "/";

  const { session } = useRouteContext({ from: "__root__" });
  const { scorecardHref, turnoverHref, linkManagerHref } =
    useActiveHrefs(session);

  return (
    <div
      className="relative min-h-screen bg-background text-foreground selection:bg-primary/20"
      style={{
        opacity: isNavigatingAway ? 0 : 1,
        transition: isNavigatingAway ? "opacity 0ms" : "opacity 150ms ease-in",
        pointerEvents: isNavigatingAway ? "none" : undefined,
      }}
    >
      <HeroSection
        linkManagerHref={linkManagerHref}
        scorecardHref={scorecardHref}
        session={session}
        turnoverHref={turnoverHref}
      />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <ToolsBentoGrid
          linkManagerHref={linkManagerHref}
          scorecardHref={scorecardHref}
          turnoverHref={turnoverHref}
        />
        <OnboardingSteps isLoggedIn={!!session} />
      </main>

      <CtaSection />
      <PlatformShowcase />
      <PageFooter />
    </div>
  );
}
