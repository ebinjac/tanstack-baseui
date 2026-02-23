import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Check,
  Layers,
  LayoutDashboard,
  Link2,
  RefreshCcw,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { HeroSection } from "../components/landing/hero-section";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { session } = useRouteContext({ from: "__root__" });
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const _y = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const _opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Active team ID effect
  useEffect(() => {
    if (!session) {
      return;
    }
    const savedTeamId = localStorage.getItem("ensemble-last-team-id");
    if (
      savedTeamId &&
      session.permissions.find((t) => t.teamId === savedTeamId)
    ) {
      setActiveTeamId(savedTeamId);
    } else if (session.permissions.length > 0) {
      setActiveTeamId(session.permissions[0].teamId);
    }
  }, [session]);

  const scorecardHref = activeTeamId
    ? `/teams/${activeTeamId}/scorecard`
    : "/scorecard";
  const turnoverHref = activeTeamId
    ? `/teams/${activeTeamId}/turnover`
    : "/turnover";
  const linkManagerHref = activeTeamId
    ? `/teams/${activeTeamId}/link-manager`
    : "/link-manager";

  const getStatusTextColor = (status: string): string => {
    if (status === "Healthy") {
      return "text-success";
    }
    if (status === "Degraded") {
      return "text-warning";
    }
    if (status === "Offline") {
      return "text-destructive";
    }
    return "text-primary";
  };

  const getStatusDotClass = (status: string): string => {
    if (status === "Healthy") {
      return "animate-pulse bg-success shadow-success/50";
    }
    if (status === "Degraded") {
      return "bg-warning shadow-warning/50";
    }
    return "bg-destructive shadow-destructive/50";
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/20">
      <HeroSection
        linkManagerHref={linkManagerHref}
        scorecardHref={scorecardHref}
        session={session}
        turnoverHref={turnoverHref}
      />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Tools Section - Premium Bento Grid */}
        <section className="relative z-20 space-y-20 py-24">
          <motion.div
            className="relative space-y-6 text-center"
            initial={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 shadow-sm">
              <span className="font-bold text-primary text-xs uppercase tracking-widest">
                Core Capabilities
              </span>
            </div>
            <h2 className="font-black text-4xl text-foreground tracking-tight drop-shadow-sm md:text-6xl">
              Your Instrumental Toolkit
            </h2>
            <p className="mx-auto max-w-2xl font-medium text-muted-foreground text-xl md:text-2xl">
              Everything you need to keep operations in perfect harmony.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
            {/* Tool 1: Scorecard (7 Cols) */}
            <Link
              className="group col-span-1 block transform-gpu transition-all duration-300 hover:-translate-y-1 md:col-span-7"
              to={scorecardHref as string}
            >
              <div className="relative flex h-full min-h-[450px] flex-col justify-between overflow-hidden rounded-[2.5rem] bg-primary p-10 text-primary-foreground shadow-lg ring-1 ring-border">
                {/* Background Pattern */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-20 mix-blend-color-dodge transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('/patterns/amex-1.png')`,
                    backgroundSize: "400px",
                    backgroundPosition: "center right",
                  }}
                />

                {/* Content Top */}
                <div className="relative z-10 max-w-sm">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-sm transition-colors group-hover:bg-white group-hover:text-primary">
                    <LayoutDashboard className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 font-black text-3xl tracking-tight">
                    Scorecard Metrics
                  </h3>
                  <p className="font-medium text-lg text-white/80 leading-relaxed">
                    Visualize availability, and performance trends in real-time.
                    Know your score without any manual intervention.
                  </p>
                </div>

                {/* Bottom visual mocked UI */}
                <div className="relative z-10 mt-12 h-[180px] w-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-colors duration-300 group-hover:bg-white/20">
                  <div className="absolute top-10 right-0 bottom-0 left-0 flex items-end justify-between gap-2 px-6 opacity-80 transition-opacity group-hover:opacity-100">
                    {[40, 70, 50, 90, 65, 85, 45, 60, 80].map((h, i) => (
                      <div
                        className="relative h-full w-full overflow-hidden rounded-t-sm bg-white/20"
                        key={`bar-${String(h)}`}
                      >
                        <motion.div
                          className="absolute bottom-0 left-0 w-full rounded-t-sm bg-white transition-all duration-500"
                          initial={{ height: "0%" }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          viewport={{ once: true }}
                          whileInView={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>

            {/* Tool 2: Turnover (5 Cols) */}
            <Link
              className="group col-span-1 block transform-gpu transition-all duration-300 hover:-translate-y-1 md:col-span-5"
              to={turnoverHref as string}
            >
              <div className="relative flex h-full min-h-[450px] flex-col justify-between overflow-hidden rounded-[2.5rem] bg-card p-10 text-foreground shadow-lg ring-1 ring-border">
                {/* Pattern Background overlay */}
                <div
                  className="pointer-events-none absolute inset-0 transform-gpu opacity-[0.03] transition-all duration-1000 group-hover:scale-105 dark:opacity-[0.05]"
                  style={{
                    backgroundImage: `url('/patterns/amex-1.png')`,
                    backgroundSize: "400px",
                    backgroundPosition: "top left",
                  }}
                />

                <div className="relative z-10">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <RefreshCcw className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 font-black text-3xl tracking-tight">
                    Seamless Turnover
                  </h3>
                  <p className="font-medium text-lg text-muted-foreground leading-relaxed">
                    Pass the baton with confidence. Log incidents, tickets, and
                    critical updates seamlessly.
                  </p>
                </div>

                <div className="relative z-10 mt-12 space-y-3 rounded-2xl border border-border bg-muted/30 p-4 shadow-inner transition-colors duration-300 group-hover:bg-muted/50">
                  {[1, 2, 3].map((item, i) => (
                    <div
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-background p-3 shadow-sm"
                      key={`turnover-item-${String(item)}`}
                    >
                      <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-[10px] shadow-inner ${i === 0 ? "bg-primary text-primary-foreground" : "border border-border bg-muted text-muted-foreground"}`}
                      >
                        {i === 0 ? "L" : "P"}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2 w-3/4 rounded-full bg-muted-foreground/30" />
                        <div className="h-2 w-1/2 rounded-full bg-muted-foreground/20" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>

            {/* Tool 3: Link Manager (12 Cols wide block) */}
            <Link
              className="group relative col-span-1 block min-h-[350px] transform-gpu overflow-hidden rounded-[2.5rem] bg-card shadow-lg ring-1 ring-border transition-all duration-300 hover:-translate-y-1 md:col-span-12"
              to={linkManagerHref as string}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/5 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

              <div className="flex h-full flex-col lg:flex-row">
                {/* Text Section */}
                <div className="relative z-10 flex flex-col justify-center border-border/50 border-b bg-card p-10 lg:w-1/2 lg:border-r lg:border-b-0">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-secondary/20 text-secondary-foreground shadow-sm transition-colors duration-300 group-hover:bg-secondary">
                    <Link2 className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 font-black text-3xl tracking-tight">
                    Link Manager
                  </h3>
                  <p className="max-w-md font-medium text-lg text-muted-foreground leading-relaxed">
                    Your team's central repository for documentation,
                    dashboards, and critical URLs. Never lose a bookmark again
                    with powerful categories and tags.
                  </p>
                </div>

                {/* Animated Mock Section */}
                <div className="relative flex min-h-[250px] items-center justify-center overflow-hidden bg-muted/10 p-10 lg:w-1/2">
                  {/* Pattern Background overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 transform-gpu opacity-[0.03] transition-all duration-1000 group-hover:scale-110 group-hover:opacity-[0.08] dark:opacity-[0.05]"
                    style={{
                      backgroundImage: `url('/patterns/amex-1.png')`,
                      backgroundSize: "400px",
                      backgroundPosition: "center",
                    }}
                  />

                  {/* Floating Cards mock */}
                  <div className="relative z-10 w-full max-w-sm space-y-4 transition-transform duration-500 group-hover:-translate-y-2">
                    {[
                      {
                        title: "Production AWS Console",
                        cat: "Infrastructure",
                      },
                      { title: "Splunk Dashboard", cat: "Monitoring" },
                      { title: "Service Repository", cat: "Source Code" },
                    ].map((item) => (
                      <div
                        className="flex w-full items-center justify-between rounded-2xl border border-border bg-background p-4 shadow-sm transition-colors hover:bg-muted/50"
                        key={item.title}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Link2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap font-bold text-foreground sm:max-w-[200px]">
                              {item.title}
                            </p>
                            <p className="mt-0.5 text-muted-foreground text-xs">
                              {item.cat}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-50" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Onboarding - Premium Step Grid */}
        <section className="relative overflow-hidden py-32">
          <motion.div
            className="relative z-10 mb-20 text-center"
            initial={{ opacity: 0, y: 30 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 shadow-sm">
              <span className="font-bold text-primary text-xs uppercase tracking-widest">
                How It Works
              </span>
            </div>
            <h2 className="font-black text-4xl text-foreground tracking-tight drop-shadow-sm md:text-5xl md:text-6xl">
              Onboard in 3 simple steps.
            </h2>
          </motion.div>

          {/* Easy Onboarding Flow */}
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            {/* Connecting Line (Desktop) */}
            <div className="absolute top-10 right-[15%] left-[15%] z-0 hidden h-1 overflow-hidden rounded-full bg-border/40 md:block">
              <motion.div
                className="h-full bg-primary/30"
                initial={{ width: "0%" }}
                transition={{ duration: 1.5, delay: 0.2 }}
                whileInView={{ width: "100%" }}
              />
            </div>

            <div className="relative z-10 grid grid-cols-1 gap-12 md:grid-cols-3 lg:gap-16">
              {/* Step 1 */}
              <motion.div
                className="group flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="relative mb-6">
                  <div className="relative z-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-2 border-border bg-card shadow-xl transition-colors group-hover:border-primary/40">
                    <div className="absolute inset-0 bg-primary/5 transition-colors group-hover:bg-primary/10" />
                    <Users className="h-8 w-8 text-primary drop-shadow-sm" />
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-background bg-black font-black text-sm text-white shadow-sm">
                    1
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <h3 className="font-black text-2xl text-foreground tracking-tight drop-shadow-sm">
                    Define Your Team
                  </h3>
                  <p className="px-2 font-medium text-muted-foreground text-sm leading-relaxed lg:px-4">
                    Provide a name, enter a brief description, and assign
                    primary contacts in seconds. No complex paperwork or
                    tickets.
                  </p>
                </div>

                {/* Mini Mockup Visual */}
                <div className="relative mt-auto w-full cursor-default overflow-hidden rounded-[1.5rem] border border-border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md">
                  <div className="relative z-10 space-y-4">
                    <div className="space-y-1.5">
                      <div className="font-black text-[9px] text-muted-foreground uppercase tracking-widest">
                        Team Name
                      </div>
                      <div className="flex h-10 w-full items-center rounded-xl border border-border bg-background px-3 shadow-inner">
                        <span className="font-bold text-foreground text-xs">
                          Information_Security_SRE
                        </span>
                        <motion.div
                          className="ml-auto flex h-5 w-5 items-center justify-center rounded-full border border-success/20 bg-success/10 text-success"
                          initial={{ scale: 0 }}
                          transition={{ delay: 0.4 }}
                          whileInView={{ scale: 1 }}
                        >
                          <Check className="h-3 w-3" />
                        </motion.div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="font-black text-[9px] text-muted-foreground uppercase tracking-widest">
                        Description
                      </div>
                      <div className="flex h-14 w-full rounded-xl border border-border bg-background p-3 shadow-inner">
                        <span className="font-medium text-[10px] text-muted-foreground italic">
                          Core trading infrastructure...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                className="group flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="relative mb-6">
                  <div className="relative z-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-2 border-border bg-card shadow-xl transition-colors group-hover:border-primary/40">
                    <div className="absolute inset-0 bg-primary/5 transition-colors group-hover:bg-primary/10" />
                    <Shield className="h-8 w-8 text-primary drop-shadow-sm" />
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-background bg-black font-black text-sm text-white shadow-sm">
                    2
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <h3 className="font-black text-2xl text-foreground tracking-tight drop-shadow-sm">
                    Secure Access
                  </h3>
                  <p className="px-2 font-medium text-muted-foreground text-sm leading-relaxed lg:px-4">
                    Configure permissions instantly by linking your existing
                    Active Directory groups. Zero friction, enterprise security.
                  </p>
                </div>

                {/* Mini Mockup Visual */}
                <div className="relative mt-auto w-full cursor-default overflow-hidden rounded-[1.5rem] border border-border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md">
                  <div className="relative z-10 space-y-4">
                    <div className="group/item relative rounded-xl border border-border bg-background p-3 shadow-inner transition-colors hover:border-primary/40">
                      <div className="mb-1.5 flex items-center gap-1.5 pl-1 font-bold text-[8px] text-muted-foreground uppercase tracking-widest">
                        <Users className="h-3 w-3" /> User Access Group
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-success" />
                        <span className="truncate font-black text-xs tracking-tight">
                          PRC_ENSEMBLE-IS-SRE-USERS
                        </span>
                      </div>
                    </div>
                    <div className="group/item relative rounded-xl border border-border bg-background p-3 shadow-inner transition-colors hover:border-primary/40">
                      <div className="mb-1.5 flex items-center gap-1.5 pl-1 font-bold text-[8px] text-muted-foreground uppercase tracking-widest">
                        <Shield className="h-3 w-3 text-secondary" /> Admin
                        Access Group
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-success" />
                        <span className="truncate font-black text-xs tracking-tight">
                          PRC_ENSEMBLE-IS-SRE-USERS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                className="group flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="relative mb-6">
                  <div className="relative z-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-2 border-border bg-card shadow-xl transition-colors group-hover:border-primary/40">
                    <div className="absolute inset-0 bg-primary/5 transition-colors group-hover:bg-primary/10" />
                    <Activity className="h-8 w-8 text-primary drop-shadow-sm" />
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-background bg-black font-black text-sm text-white shadow-sm">
                    3
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <h3 className="font-black text-2xl text-foreground tracking-tight drop-shadow-sm">
                    Instant Launch
                  </h3>
                  <p className="px-2 font-medium text-muted-foreground text-sm leading-relaxed lg:px-4">
                    Hit submit and your robust suite is provisioned
                    automatically. Scorecards, Turnover, and more ready
                    immediately.
                  </p>
                </div>

                {/* Mini Mockup Visual */}
                <div className="relative mt-auto flex min-h-[160px] w-full cursor-default items-center justify-center overflow-hidden rounded-[1.5rem] border border-border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md">
                  <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/amex-1.png')] bg-cover opacity-[0.03] transition-opacity group-hover:opacity-[0.06]" />
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
                    <motion.div
                      className="relative flex h-16 w-16 items-center justify-center rounded-full border border-success/30 bg-success/15 text-success shadow-lg shadow-success/20"
                      initial={{ scale: 0.5, opacity: 0 }}
                      transition={{ delay: 0.8, type: "spring" }}
                      whileInView={{ scale: 1, opacity: 1 }}
                    >
                      <Check className="relative z-10 h-8 w-8 drop-shadow-sm" />
                      <div className="absolute inset-0 animate-ping rounded-full border-2 border-success opacity-30" />
                    </motion.div>
                    <div className="text-center">
                      <div className="font-black text-sm drop-shadow-sm">
                        Workspace Automated!
                      </div>
                      <div className="mt-1.5 rounded-md border border-border bg-muted/30 px-3 py-1 font-black text-[10px] text-muted-foreground uppercase tracking-widest">
                        Tools Initialized
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="mt-20 text-center">
            {!session && (
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-primary px-10 py-4 font-bold text-lg text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
                to="/teams/register"
              >
                Start the Wizard <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* === PREMIUM CTA SECTION === */}
      <section className="relative mt-20 w-full overflow-hidden bg-primary py-32">
        {/* Deep AmEx Blue Base with rich gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#000] via-primary to-[#000] opacity-90" />

        {/* Cinematic Pattern Background */}
        <div
          className="absolute inset-0 rotate-[-2deg] scale-110 transform-gpu opacity-50 mix-blend-overlay"
          style={{
            backgroundImage: `url('/patterns/amex-2.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "contrast(1.5) brightness(0.8)",
          }}
        />

        {/* Dynamic Glow Intersections - Removed per user request */}

        <motion.div
          className="container relative z-10 mx-auto max-w-5xl px-4"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
        >
          <div className="relative flex flex-col items-center justify-between gap-12 overflow-hidden rounded-[3rem] border border-white/20 bg-black/20 p-12 shadow-2xl md:flex-row md:p-20">
            {/* Inner Pattern Accent */}
            <div className="pointer-events-none absolute top-0 right-0 h-full w-1/2 bg-[url('/patterns/amex-3.avif')] bg-cover opacity-10 mix-blend-plus-lighter" />

            {/* Left Content */}
            <div className="relative z-10 space-y-6 text-center md:w-2/3 md:text-left">
              <h2 className="font-black text-4xl text-white leading-[1.1] tracking-tighter drop-shadow-md md:text-6xl">
                Ready to modernize <br className="hidden md:block" /> your
                operations?
              </h2>
              <p className="mx-auto max-w-xl font-medium text-white/80 text-xl leading-relaxed drop-shadow-sm md:mx-0 md:text-2xl">
                Join the high-performance teams already using Ensemble to
                streamline their workflow.
              </p>
            </div>

            {/* Right Action */}
            <div className="relative z-10 flex justify-center md:w-1/3 md:justify-end">
              <Link className="group" to="/teams/register">
                <div className="relative inline-flex h-20 items-center gap-4 overflow-hidden rounded-full bg-white px-10 font-black text-primary text-xl shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-white/30">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative z-10">Enroll Today</span>
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Deep Dive Tool Showcase / Premium Suite Detail */}
      <section className="relative overflow-hidden border-border/10 border-t bg-background py-32">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-muted/20 blur-[150px]" />

        <div className="container relative z-10 mx-auto max-w-7xl space-y-32 px-4 md:space-y-40">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 shadow-sm">
              <span className="font-bold text-primary text-xs uppercase tracking-widest">
                Explore the Platform
              </span>
            </div>
            <h2 className="font-black text-4xl text-foreground tracking-tight drop-shadow-sm md:text-5xl lg:text-6xl">
              Built for High Performance.
            </h2>
            <p className="font-medium text-muted-foreground text-xl leading-relaxed md:text-2xl">
              Every tool in Ensemble is purpose-built to eliminate friction.
              <br className="hidden md:block" />
              Discover the capabilities powering modern engineering teams.
            </p>
          </div>

          {/* Tool 1: Scorecard - High Fidelity Dashboard UI */}
          <div className="flex flex-col items-center gap-12 md:flex-row md:gap-24">
            <div className="space-y-8 md:w-1/2">
              <div className="group relative mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.5rem] bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                <LayoutDashboard className="relative z-10 h-10 w-10" />
              </div>
              <div className="space-y-4">
                <h3 className="font-black text-4xl text-foreground tracking-tight md:text-5xl">
                  Scorecard.
                  <br />
                  <span className="font-medium text-muted-foreground md:text-4xl">
                    Know your health.
                  </span>
                </h3>
                <p className="font-medium text-lg text-muted-foreground leading-relaxed md:text-xl">
                  The Scorecard aggregates data from multiple monitoring sources
                  to provide a single, weighted health score for your
                  application. Eliminate ambiguity during leadership reviews.
                </p>
              </div>
              <ul className="space-y-4 pt-4">
                {[
                  {
                    title: "Real-time Availability",
                    desc: "Live integration with monitoring tools",
                  },
                  {
                    title: "Weighted Health Scoring",
                    desc: "Custom algorithms for business impact",
                  },
                  {
                    title: "Trend Analysis",
                    desc: "Historical tracking of performance",
                  },
                ].map((feat) => (
                  <li className="flex items-start gap-4" key={feat.title}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-sm">
                        {feat.title}
                      </span>
                      <p className="font-medium text-muted-foreground text-sm">
                        {feat.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full md:w-1/2">
              <motion.div
                className="group relative flex h-[450px] transform-gpu flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl transition-shadow duration-500 hover:shadow-primary/10"
                initial={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.8 }}
                viewport={{ margin: "-100px" }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                {/* Subtle Pattern Background in App Window */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-multiply"
                  style={{
                    backgroundImage: `url('/patterns/amex-1.png')`,
                    backgroundSize: "cover",
                  }}
                />

                {/* Mock Browser Header */}
                <div className="relative z-10 flex items-center justify-between border-border border-b bg-muted/30 p-3">
                  <div className="flex gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
                  </div>
                </div>

                {/* Dashboard Content matching Screenshot */}
                <div className="relative z-10 flex flex-1 flex-col justify-start space-y-4 overflow-hidden bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-foreground text-lg tracking-tight">
                        Performance Scorecard
                      </h4>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Activity className="h-3 w-3 text-primary/70" />{" "}
                        Tracking for{" "}
                        <span className="font-bold text-foreground">
                          enterprise-security
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {
                        val: "3",
                        label: "APPLICATIONS",
                        icon: <Activity className="h-3 w-3 text-primary" />,
                        iconBg: "bg-primary/10",
                      },
                      {
                        val: "6",
                        label: "TRACKED TECH",
                        icon: (
                          <span className="font-black text-secondary text-xs">
                            #
                          </span>
                        ),
                        iconBg: "bg-secondary/10",
                      },
                      {
                        val: "5",
                        label: "AVAILABILITY",
                        icon: (
                          <span className="font-black text-success text-xs">
                            %
                          </span>
                        ),
                        iconBg: "bg-success/10",
                      },
                      {
                        val: "0",
                        label: "SLA BREACHES",
                        icon: (
                          <span className="font-black text-destructive text-xs">
                            !
                          </span>
                        ),
                        iconBg: "bg-destructive/10",
                      },
                    ].map((stat, i) => (
                      <motion.div
                        className="flex flex-col rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/50"
                        initial={{ opacity: 0, scale: 0.9 }}
                        key={stat.label}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${stat.iconBg}`}
                          >
                            {stat.icon}
                          </div>
                          <span className="font-black text-foreground text-xl leading-none tracking-tighter">
                            {stat.val}
                          </span>
                        </div>
                        <span className="font-bold text-[7.5px] text-muted-foreground uppercase tracking-wider">
                          {stat.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    className="flex w-full items-center rounded-md border border-success/30 bg-success/5 px-3 py-1.5 font-bold text-[10px] text-success"
                    initial={{ opacity: 0 }}
                    transition={{ delay: 0.4 }}
                    whileInView={{ opacity: 1 }}
                  >
                    <Activity className="mr-2 h-3 w-3" /> FULLY SYNCHRONIZED
                  </motion.div>

                  <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex flex-col border-border/50 border-b bg-muted/20 p-3">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Activity className="h-4 w-4 text-primary" />
                        <span className="font-black text-sm tracking-tight">
                          Application Health
                        </span>
                      </div>
                      <span className="mt-0.5 text-[9px] text-muted-foreground">
                        Performance tracking and reliability metrics across your
                        portfolio.
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col space-y-2 overflow-hidden p-3">
                      {[
                        {
                          name: "Key Management Services",
                          tag: "KMS",
                          comp: "3",
                          avail: "99.49%",
                          vol: "9023.1B",
                          ok: true,
                        },
                        {
                          name: "Key Management Services",
                          tag: "AIF",
                          comp: "0",
                          avail: "-",
                          vol: "0",
                          ok: true,
                        },
                        {
                          name: "Token Services",
                          tag: "TKS",
                          comp: "3",
                          avail: "96.50%",
                          vol: "558.9B",
                          ok: false,
                        },
                      ].map((app, i) => (
                        <motion.div
                          className="flex items-center justify-between rounded-xl border border-border bg-background p-2 transition-colors hover:bg-muted/10"
                          initial={{ opacity: 0, x: -10 }}
                          key={app.name}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          whileInView={{ opacity: 1, x: 0 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                              <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-[11px] tracking-tight">
                                  {app.name}
                                </span>
                                <span className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-bold text-[8px] text-primary uppercase">
                                  {app.tag}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 font-semibold text-[8px] text-muted-foreground">
                                # 200004789{" "}
                                <span className="opacity-50">•</span>{" "}
                                <Activity className="h-2 w-2" /> {app.comp}{" "}
                                COMPONENTS
                              </div>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-6 text-right">
                            {app.avail !== "-" && (
                              <div className="w-16">
                                <div className="mb-0.5 font-bold text-[7.5px] text-muted-foreground uppercase tracking-widest">
                                  AVAILABILITY
                                </div>
                                <div
                                  className={`flex items-center justify-end gap-1 font-black text-xs ${app.ok ? "text-success" : "text-destructive"}`}
                                >
                                  <div
                                    className={`h-1.5 w-1.5 rounded-full ${app.ok ? "bg-success" : "bg-destructive"}`}
                                  />{" "}
                                  {app.avail}
                                </div>
                              </div>
                            )}
                            <div className="w-16">
                              <div className="mb-0.5 font-bold text-[7.5px] text-muted-foreground uppercase tracking-widest">
                                ANNUAL VOLUME
                              </div>
                              <div className="font-black text-[11px] text-primary tracking-tight">
                                # {app.vol}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Tool 2: Turnover - High Fidelity UI */}
          <div className="flex flex-col items-center gap-12 md:flex-row-reverse md:gap-24">
            <div className="space-y-8 md:w-1/2">
              <div className="group relative mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.5rem] bg-card text-foreground shadow-sm ring-1 ring-border">
                <RefreshCcw className="relative z-10 h-10 w-10" />
              </div>
              <div className="space-y-4">
                <h3 className="font-black text-4xl text-foreground tracking-tight md:text-5xl">
                  Turnover.
                  <br />
                  <span className="font-medium text-muted-foreground md:text-4xl">
                    Zero dropped balls.
                  </span>
                </h3>
                <p className="font-medium text-lg text-muted-foreground leading-relaxed md:text-xl">
                  A structured shift handover process that forces acknowledgment
                  of critical issues. Never let a Sev-1 slip through the cracks
                  during a shift change.
                </p>
              </div>
              <ul className="space-y-4 pt-4">
                {[
                  {
                    title: "Structured Handsets",
                    desc: "Standardized templates for consistency",
                  },
                  {
                    title: "Mandatory Acknowledgement",
                    desc: "Ensure incoming engineers accept items",
                  },
                  {
                    title: "Audit Trail",
                    desc: "Full history of every shift transition",
                  },
                ].map((feat) => (
                  <li className="flex items-start gap-4" key={feat.title}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-sm">
                        {feat.title}
                      </span>
                      <p className="font-medium text-muted-foreground text-sm">
                        {feat.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full md:w-1/2">
              <motion.div
                className="group relative flex h-[450px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
                initial={{ transform: "scale(0.95)", opacity: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ margin: "-100px" }}
                whileInView={{ transform: "scale(1)", opacity: 1 }}
              >
                {/* Subtle Pattern Background */}
                <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/amex-1.png')] bg-cover opacity-[0.03]" />

                {/* Mock Browser Header */}
                <div className="relative z-10 flex items-center justify-between border-border border-b bg-muted/30 p-3">
                  <div className="flex gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
                  </div>
                </div>

                {/* Dashboard Content matching Screenshot */}
                <div className="relative z-10 flex flex-col gap-2 border-border border-b bg-background p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary shadow-md shadow-primary/20">
                      <RefreshCcw className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="mb-1 font-black text-foreground text-sm leading-none tracking-tight">
                        KMS/TKS
                      </span>
                      <span className="font-bold text-[8.5px] text-muted-foreground tracking-wide">
                        Manage turnover entries for 2 grouped applications
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="font-bold text-[8px] text-muted-foreground uppercase tracking-widest">
                        KMS
                      </span>
                      <span className="font-bold text-[8px] text-muted-foreground uppercase tracking-widest">
                        TKS
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex flex-1 flex-col overflow-hidden bg-muted/10 p-4">
                  <motion.div
                    className="mb-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-3 text-warning shadow-sm"
                    initial={{ opacity: 0, y: -5 }}
                    transition={{ delay: 0.2 }}
                    whileInView={{ opacity: 1, y: 0 }}
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="flex flex-col space-y-0.5">
                      <span className="flex items-center gap-2 font-black text-xs tracking-tight">
                        Critical Turnover Items{" "}
                        <span className="rounded-md bg-warning px-1.5 py-0.5 text-[8px] text-warning-foreground">
                          1 items
                        </span>
                      </span>
                      <p className="font-medium text-[10px] text-warning/80">
                        Action required: These items have been flagged for
                        immediate attention.
                      </p>
                    </div>
                  </motion.div>

                  <div className="grid flex-1 grid-cols-2 gap-3 overflow-hidden">
                    {[
                      {
                        title: "Request for Change",
                        subtitle: "RFC",
                        count: 2,
                        entries: ["TEST", "CHG34552662"],
                        color: "text-primary",
                        bg: "bg-primary",
                        icon: <Shield className="h-3 w-3 text-primary" />,
                      },
                      {
                        title: "Incidents",
                        subtitle: "INC",
                        count: 0,
                        entries: [],
                        color: "text-destructive",
                        bg: "bg-destructive",
                        icon: (
                          <AlertCircle className="h-3 w-3 text-destructive" />
                        ),
                      },
                      {
                        title: "Alerts/Issues",
                        subtitle: "Alerts",
                        count: 1,
                        entries: [
                          "Bridging the gap between engineering excellence... ",
                        ],
                        color: "text-warning",
                        bg: "bg-warning",
                        icon: <AlertCircle className="h-3 w-3 text-warning" />,
                      },
                      {
                        title: "Major Incident Management",
                        subtitle: "MIM",
                        count: 0,
                        entries: [],
                        color: "text-secondary",
                        bg: "bg-secondary",
                        icon: <Activity className="h-3 w-3 text-secondary" />,
                      },
                    ].map((section, i) => (
                      <motion.div
                        className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                        initial={{ opacity: 0, scale: 0.95 }}
                        key={section.subtitle}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                      >
                        <div className="flex items-center justify-between border-border/50 border-b p-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={
                                "flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm"
                              }
                            >
                              {section.icon}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-[11px] tracking-tight">
                                {section.title}
                              </span>
                              <span className="font-semibold text-[8px] text-muted-foreground uppercase">
                                {section.subtitle}{" "}
                                <span className="pl-1 lowercase normal-case">
                                  {section.count} entries
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="flex cursor-pointer items-center gap-1 rounded-full bg-primary px-2 py-1 font-bold text-[8px] text-primary-foreground shadow-sm">
                            <div className="flex h-2 w-2 items-center justify-center rounded-full bg-primary-foreground/20">
                              +
                            </div>{" "}
                            Add Entry
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col items-stretch gap-2 overflow-hidden p-3">
                          {section.entries.length > 0 ? (
                            section.entries.map((ent) => (
                              <div
                                className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-background p-2.5 shadow-sm transition-colors hover:border-primary/40"
                                key={ent}
                              >
                                <div className="flex w-full items-center gap-1.5">
                                  {ent.includes("CHG") && (
                                    <span className="text-[10px] text-warning">
                                      ★
                                    </span>
                                  )}
                                  <span className="flex-1 truncate font-black text-[10px] tracking-tight">
                                    {ent}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="rounded-md border border-border bg-muted/30 px-1.5 py-0.5 font-bold text-[7.5px] text-muted-foreground">
                                    KMS
                                  </span>
                                  <div
                                    className={
                                      "flex items-center gap-1 rounded-md border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-bold text-[7.5px] text-warning"
                                    }
                                  >
                                    <div
                                      className={
                                        "h-1.5 w-1.5 rounded-full bg-warning"
                                      }
                                    />
                                    {ent.includes("CHG")
                                      ? "In Progress"
                                      : "Pending Approval"}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-1 flex-col items-center justify-center opacity-40">
                              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-muted">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <span className="font-black text-[10px] text-foreground">
                                No entries yet
                              </span>
                              <span className="mt-0.5 font-medium text-[8px] text-muted-foreground">
                                Get started by adding a new entry.
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Tool 3: Link Manager - High Fidelity UI */}
          <div className="flex flex-col items-center gap-12 md:flex-row md:gap-24">
            <div className="space-y-8 md:w-1/2">
              <div className="group relative mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.5rem] bg-secondary/20 text-secondary-foreground shadow-sm ring-1 ring-border">
                <Link2 className="relative z-10 h-10 w-10" />
              </div>
              <div className="space-y-4">
                <h3 className="font-black text-4xl text-foreground tracking-tight md:text-5xl">
                  Link Manager.
                  <br />
                  <span className="font-medium text-muted-foreground md:text-4xl">
                    The team brain.
                  </span>
                </h3>
                <p className="font-medium text-lg text-muted-foreground leading-relaxed md:text-xl">
                  Stop asking "Where is the confluence page for that?". The Link
                  Manager centralizes every URL your team needs, categorized,
                  searchable, and shared.
                </p>
              </div>
              <ul className="space-y-4 pt-4">
                {[
                  {
                    title: "Centralized Repository",
                    desc: "One place for all team knowledge",
                  },
                  {
                    title: "Smart Categorization",
                    desc: "Tag and filter resources instantly",
                  },
                  {
                    title: "One-Click Access",
                    desc: "Launch tools directly from the dashboard",
                  },
                ].map((feat) => (
                  <li className="flex items-start gap-4" key={feat.title}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary-foreground">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-sm">
                        {feat.title}
                      </span>
                      <p className="font-medium text-muted-foreground text-sm">
                        {feat.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full md:w-1/2">
              <motion.div
                className="group relative flex h-[450px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
                initial={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.8 }}
                viewport={{ margin: "-100px" }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                {/* Subtle Pattern Background */}
                <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/amex-1.png')] bg-cover opacity-[0.03]" />

                {/* Mock Browser Header */}
                <div className="relative z-10 flex items-center justify-between border-border border-b bg-muted/30 p-3">
                  <div className="flex gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
                  </div>
                </div>

                <div className="relative z-10 flex h-full flex-col overflow-hidden bg-muted/5 p-5">
                  <div className="mb-4 flex flex-col rounded-2xl border border-border bg-background p-4 shadow-sm">
                    <div className="mb-1 flex items-center gap-2 font-bold text-[8px] text-muted-foreground uppercase tracking-widest">
                      <span className="text-primary">Link Manager</span> / ALL
                      RESOURCES
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-foreground text-xl tracking-tight">
                        Link Manager
                      </h4>
                      <div className="flex cursor-pointer items-center gap-1 rounded-full bg-primary px-3 py-1.5 font-bold text-[10px] text-primary-foreground shadow-sm">
                        + Add Link
                      </div>
                    </div>
                    <p className="mt-1 font-medium text-[10px] text-muted-foreground">
                      Central team repository for bookmarks & tools
                    </p>
                  </div>

                  {/* Top Stats */}
                  <div className="mb-5 grid grid-cols-4 gap-3">
                    {[
                      {
                        val: "13",
                        label: "Total Resources",
                        icon: <Layers className="h-4 w-4 text-primary" />,
                        iconBg: "bg-primary/10",
                        border: "border-primary/20",
                      },
                      {
                        val: "7",
                        label: "Public Access",
                        icon: <Shield className="h-4 w-4 text-success" />,
                        iconBg: "bg-success/10",
                        border: "border-success/20",
                      },
                      {
                        val: "6",
                        label: "Team Restricted",
                        icon: <Shield className="h-4 w-4 text-warning" />,
                        iconBg: "bg-warning/10",
                        border: "border-warning/20",
                      },
                      {
                        val: "1",
                        label: "Total Insights",
                        icon: <Activity className="h-4 w-4 text-secondary" />,
                        iconBg: "bg-secondary/10",
                        border: "border-secondary/20",
                      },
                    ].map((stat, i) => (
                      <motion.div
                        className={`rounded-2xl border p-3 ${stat.border} group relative flex items-center gap-3 overflow-hidden bg-card shadow-sm`}
                        initial={{ opacity: 0, y: -5 }}
                        key={stat.label}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        whileInView={{ opacity: 1, y: 0 }}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}
                        >
                          {stat.icon}
                        </div>
                        <div className="flex flex-col">
                          <div className="origin-left font-black text-lg text-primary leading-none tracking-tight transition-transform group-hover:scale-105">
                            {stat.val}
                          </div>
                          <div className="mt-1 font-bold text-[7.5px] text-muted-foreground uppercase tracking-widest">
                            {stat.label}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Cards Grid */}
                  <div className="grid flex-1 grid-cols-2 gap-3 overflow-hidden pr-1">
                    {[
                      {
                        title: "Monitoring Dashboard",
                        type: "Private",
                        tags: [],
                        global: true,
                      },
                      {
                        title: "Internal Docs",
                        type: "Private",
                        tags: [],
                        global: true,
                      },
                      {
                        title: "Engineering Docs",
                        type: "Public",
                        tags: ["#docs", "#eng"],
                        global: false,
                        app: "KMS",
                      },
                      {
                        title: "Grafana",
                        type: "Public",
                        tags: [],
                        global: false,
                        app: "KMS",
                      },
                    ].map((card, i) => (
                      <motion.div
                        className="group flex cursor-pointer flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                        initial={{ opacity: 0, scale: 0.95 }}
                        key={card.title}
                        transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                      >
                        <div className="mb-2 flex items-center gap-1 font-bold text-[8px] text-muted-foreground tracking-wide">
                          <Layers className="h-3 w-3 text-primary" />{" "}
                          {card.global ? "Global" : card.app}{" "}
                          <span className="opacity-50">•</span>{" "}
                          {card.global ? "Uncategorized" : "Documentation"}
                        </div>
                        <h5 className="font-black text-foreground text-sm tracking-tight transition-colors group-hover:text-primary">
                          {card.title}
                        </h5>
                        <p className="mt-1 mb-3 font-medium text-[9px] text-muted-foreground/80 leading-relaxed">
                          Information resource shared by the team for
                          operational enablement.
                        </p>
                        <div className="mb-auto flex gap-1.5">
                          <span
                            className={`flex items-center gap-1 rounded-md border px-2 py-0.5 font-bold text-[8px] ${card.type === "Public" ? "border-success/20 bg-success/10 text-success" : "border-warning/20 bg-warning/10 text-warning"}`}
                          >
                            {card.type === "Public" ? (
                              <Activity className="h-2 w-2" />
                            ) : (
                              <Shield className="h-2 w-2" />
                            )}{" "}
                            {card.type}
                          </span>
                          {card.tags.map((tag) => (
                            <span
                              className="rounded-md border border-border bg-muted/20 px-2 py-0.5 font-bold text-[8px] text-muted-foreground"
                              key={tag}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between border-border/50 border-t pt-3">
                          <div className="flex items-center gap-1.5 font-bold text-[9px] text-muted-foreground">
                            <Activity className="h-3 w-3 text-primary/70" /> 0
                            Insights
                          </div>
                          <span className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 font-black text-[9px] shadow-sm transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                            Open Resource <ArrowRight className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Tool 4: EnvMatrix - High Fidelity UI */}
          <div className="flex flex-col items-center gap-12 md:flex-row-reverse md:gap-24">
            <div className="space-y-8 md:w-1/2">
              <div className="group relative mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.5rem] bg-card text-foreground shadow-sm ring-1 ring-border">
                <Layers className="relative z-10 h-10 w-10" />
              </div>
              <div className="space-y-4">
                <h3 className="font-black text-4xl text-foreground tracking-tight md:text-5xl">
                  EnvMatrix.
                  <br />
                  <span className="font-medium text-muted-foreground md:text-4xl">
                    Total Inventory.
                  </span>
                </h3>
                <p className="font-medium text-lg text-muted-foreground leading-relaxed md:text-xl">
                  Maintain a precise matrix of every server, database, and
                  microservice across DEV, UAT, and PROD environments. Golden
                  source of truth.
                </p>
              </div>
              <ul className="space-y-4 pt-4">
                {[
                  {
                    title: "Full-Stack Inventory",
                    desc: "Databases, APIs, caching layers, and more",
                  },
                  {
                    title: "Status Monitoring",
                    desc: "Live health checks for each component",
                  },
                  {
                    title: "Dependency Mapping",
                    desc: "Visualize connections between services",
                  },
                ].map((feat) => (
                  <li className="flex items-start gap-4" key={feat.title}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-foreground shadow-sm">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-sm">
                        {feat.title}
                      </span>
                      <p className="font-medium text-muted-foreground text-sm">
                        {feat.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full md:w-1/2">
              <motion.div
                className="group relative flex h-[450px] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
                initial={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.8 }}
                viewport={{ margin: "-100px" }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                {/* Subtle Pattern Background */}
                <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/amex-1.png')] bg-cover opacity-[0.03]" />

                <div className="relative z-10 flex gap-4 border-border border-b bg-muted/30 p-4 font-black text-[10px] text-muted-foreground uppercase tracking-widest">
                  <div className="flex-[2]">Service Name</div>
                  <div className="flex-1 text-center">Env</div>
                  <div className="flex-1 text-right">Status</div>
                </div>

                <div className="relative z-10 flex flex-1 flex-col justify-center overflow-hidden p-2">
                  {[
                    {
                      name: "Auth Service API",
                      type: "Microservice",
                      env: "PROD",
                      status: "Healthy",
                    },
                    {
                      name: "Payment Gateway",
                      type: "External API",
                      env: "PROD",
                      status: "Healthy",
                    },
                    {
                      name: "Redis Cache",
                      type: "Database",
                      env: "PROD",
                      status: "Degraded",
                    },
                    {
                      name: "User Profile DB",
                      type: "Postgres",
                      env: "UAT",
                      status: "Healthy",
                    },
                    {
                      name: "Notification Svc",
                      type: "Lambda",
                      env: "DEV",
                      status: "Offline",
                    },
                  ].map((svc, i) => (
                    <motion.div
                      className="group mx-2 my-1 flex items-center justify-between gap-4 rounded-xl border border-border/50 border-b bg-background p-4 shadow-sm transition-colors last:border-0 hover:bg-muted/10"
                      initial={{ opacity: 0, x: 20 }}
                      key={svc.name}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                      whileInView={{ opacity: 1, x: 0 }}
                    >
                      <div className="min-w-0 flex-[2]">
                        <div className="truncate font-bold text-sm transition-colors group-hover:text-primary">
                          {svc.name}
                        </div>
                        <div className="mt-0.5 font-bold text-[10px] text-muted-foreground">
                          {svc.type}
                        </div>
                      </div>
                      <div className="flex flex-1 justify-center">
                        <span className="rounded-md border border-border/50 bg-muted px-2 py-1 font-black text-[9px] shadow-sm">
                          {svc.env}
                        </span>
                      </div>
                      <div className="flex flex-1 justify-end">
                        <div
                          className={`flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider ${getStatusTextColor(svc.status)}`}
                        >
                          <div
                            className={`h-2 w-2 rounded-full shadow-sm ${getStatusDotClass(svc.status)}`}
                          />
                          {svc.status}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-border/20 border-t bg-background py-12">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between px-4 opacity-60 transition-opacity hover:opacity-100 md:flex-row">
          <p className="w-full text-center text-muted-foreground text-xs md:w-auto md:text-left">
            &copy; {new Date().getFullYear()} American Express. <br />
            Built for internal excellence. Use responsibly.
          </p>
          <div className="mt-4 flex gap-6 md:mt-0">
            <span className="cursor-pointer font-medium text-xs hover:text-primary">
              Policy
            </span>
            <span className="cursor-pointer font-medium text-xs hover:text-primary">
              Support
            </span>
            <span className="cursor-pointer font-medium text-xs hover:text-primary">
              Status
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
