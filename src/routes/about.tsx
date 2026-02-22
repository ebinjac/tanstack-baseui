import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BookOpen,
  Building2,
  HeartHandshake,
  Layers,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

const PILLARS = [
  {
    icon: Zap,
    title: "Effortless Onboarding",
    description:
      "Teams can register, configure, and be operational within minutes. No tickets, no waiting — self-service from day one.",
  },
  {
    icon: Layers,
    title: "Unified Operations",
    description:
      "Scorecard, Turnover, and Link Manager in one place. No more switching between disparate tools or losing context mid-shift.",
  },
  {
    icon: HeartHandshake,
    title: "Seamless Handovers",
    description:
      "Structured shift turnovers with RFC, INC, ALERTS, MIM, COMMS, and FYI sections ensure nothing falls through the cracks.",
  },
  {
    icon: Users,
    title: "Cross-Team Visibility",
    description:
      "Enterprise Scorecard views and shared Link Manager make collaboration across American Express teams transparent and efficient.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="mx-auto max-w-4xl space-y-24 px-6 py-20">
        {/* Hero */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 text-center"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.55 }}
        >
          <div className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-black text-5xl leading-tight tracking-tight">
            About Ensemble
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Ensemble is the internal operations platform built to unify how
            engineering teams at American Express onboard, collaborate, and
            manage their day-to-day work.
          </p>
        </motion.div>

        {/* Origin Story */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/40 p-8 backdrop-blur-sm md:p-12"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="pointer-events-none absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-muted-foreground text-xs uppercase tracking-widest">
                  Origin
                </p>
                <h2 className="font-black text-foreground text-xl">
                  Built by Information Security SRE
                </h2>
              </div>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Ensemble was created by the{" "}
                <span className="font-semibold text-foreground">
                  Information Security Site Reliability Engineering (SRE)
                </span>{" "}
                team, operating under{" "}
                <span className="font-semibold text-foreground">
                  Global Infrastructure
                </span>{" "}
                at American Express.
              </p>
              <p>
                The project was born from a real pain point: onboarding new team
                members and coordinating shift handovers across multiple teams
                was slow, fragmented, and error-prone. Critical context lived in
                emails, chat threads, and spreadsheets — nowhere permanent,
                nowhere structured.
              </p>
              <p>
                Ensemble was designed to fix that. A single platform where any
                team across American Express can register, track their
                application health, manage shift turnovers, and centralize their
                resources — all with zero friction.
              </p>
            </div>

            {/* Org badges */}
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 font-semibold text-primary text-sm">
                <ShieldCheck className="h-4 w-4" />
                Information Security SRE
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/50 px-4 py-2 font-medium text-muted-foreground text-sm">
                <Building2 className="h-4 w-4" />
                Global Infrastructure · American Express
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pillars */}
        <motion.div
          animate={{ opacity: 1 }}
          className="space-y-8"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <div className="space-y-2 text-center">
            <h2 className="font-black text-2xl tracking-tight">
              What Ensemble stands for
            </h2>
            <p className="text-muted-foreground text-sm">
              Four principles that guide every feature we build.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PILLARS.map((pillar, i) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card/30 p-6 transition-colors hover:bg-muted/20"
                initial={{ opacity: 0, y: 16 }}
                key={pillar.title}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <pillar.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-foreground text-sm">
                    {pillar.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          animate={{ opacity: 1 }}
          className="space-y-4 py-4 text-center"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
        >
          <p className="text-muted-foreground text-sm">
            Questions about Ensemble or want to get involved?
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="/support">
              <Button className="gap-2" variant="outline">
                <HeartHandshake className="h-4 w-4" />
                Contact the Team
              </Button>
            </a>
            <a href="/docs">
              <Button className="gap-2" variant="ghost">
                <BookOpen className="h-4 w-4" />
                Read the Docs
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
