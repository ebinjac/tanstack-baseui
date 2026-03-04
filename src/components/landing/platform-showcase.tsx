import { SectionBadge } from "./section-badge";
import { ShowcaseEnvMatrix } from "./showcase-env-matrix";
import { ShowcaseLinkManager } from "./showcase-link-manager";
import { ShowcaseScorecard } from "./showcase-scorecard";
import { ShowcaseTurnover } from "./showcase-turnover";

export function PlatformShowcase() {
  return (
    <section className="relative overflow-hidden border-border/10 border-t bg-background py-32">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-muted/20 blur-[150px]" />

      <div className="container relative z-10 mx-auto max-w-7xl space-y-32 px-4 md:space-y-40">
        {/* Section header */}
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <div className="mb-4">
            <SectionBadge label="Explore the Platform" />
          </div>
          <h2 className="font-black text-4xl text-foreground tracking-tight drop-shadow-sm md:text-5xl lg:text-6xl">
            Built for High Performance.
          </h2>
          <p className="font-medium text-muted-foreground text-xl leading-relaxed md:text-2xl">
            Every tool in Ensemble is purpose-built to eliminate friction.{" "}
            <br className="hidden md:block" />
            Discover the capabilities powering modern engineering teams.
          </p>
        </div>

        <ShowcaseScorecard />
        <ShowcaseTurnover />
        <ShowcaseLinkManager />
        <ShowcaseEnvMatrix />
      </div>
    </section>
  );
}
