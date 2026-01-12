import { createFileRoute, Link } from '@tanstack/react-router'
import { getSession } from '../app/ssr/auth'
import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  LayoutDashboard,
  RefreshCcw,
  Link2,
  Layers,
  ArrowRight,
  Activity,
  BookOpen,
  Shield
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: RouteComponent,
  loader: async () => {
    const session = await getSession()
    return { session }
  },
})

function RouteComponent() {
  const { session } = Route.useLoaderData()
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)

  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  // Active team ID effect
  useEffect(() => {
    const savedTeamId = localStorage.getItem('ensemble-last-team-id')
    if (savedTeamId && session?.permissions.find(t => t.teamId === savedTeamId)) {
      setActiveTeamId(savedTeamId)
    } else if (session?.permissions && session.permissions.length > 0) {
      setActiveTeamId(session.permissions[0].teamId)
    }
  }, [session])

  const scorecardHref = activeTeamId ? `/teams/${activeTeamId}/scorecard` : "/scorecard"
  const turnoverHref = activeTeamId ? `/teams/${activeTeamId}/turnover` : "/turnover"
  const linkManagerHref = activeTeamId ? `/teams/${activeTeamId}/link-manager` : "/link-manager"

  return (
    <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/20">

      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-background to-background">
        <motion.div
          style={{ y }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[130px] rounded-full mix-blend-screen opacity-60 dark:opacity-20"
        />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Creative Hero Section */}
        <motion.section
          className="min-h-[85vh] flex flex-col items-center justify-center text-center space-y-10 relative"
          style={{ opacity }}
        >
          {/* Logo Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative w-24 h-24 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <div className="relative bg-gradient-to-tr from-primary to-blue-600 p-0.5 rounded-2xl rotate-3">
              <div className="bg-background rounded-2xl p-4 flex items-center justify-center h-full w-full">
                <Layers className="w-10 h-10 text-primary" />
              </div>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 border border-dashed border-primary/20 rounded-full"
            />
          </motion.div>

          <div className="space-y-6 max-w-4xl z-10">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-6xl md:text-8xl font-bold tracking-tighter"
            >
              The Pulse of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-primary to-blue-600">Engineering.</span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed"
            >
              Orchestrate your team's rhythm with <strong>Ensemble</strong>. <br className="hidden md:block" />
              One platform for scorecards, handovers, and resource intelligence.
            </motion.p>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-wrap gap-4"
          >
            <Link to={scorecardHref as any} className="group h-14 px-8 rounded-full bg-primary text-primary-foreground text-lg font-medium flex items-center gap-2 hover:bg-primary/90 hover:scale-105 transition-all shadow-xl shadow-primary/20">
              <span>Open Dashboard</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            {!session && (
              <Link to="/teams/register" className="h-14 px-8 rounded-full bg-secondary/50 backdrop-blur-sm border border-border text-secondary-foreground text-lg font-medium flex items-center hover:bg-secondary/80 transition-all">
                Register Team
              </Link>
            )}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-muted-foreground/50"
          >
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-primary/30 to-transparent mx-auto mb-2" />
            <span className="text-xs uppercase tracking-[0.3em]">Scroll</span>
          </motion.div>
        </motion.section>


        {/* Tools Section - Sliding Hover Demo Grid */}
        <section className="py-32 space-y-24">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Your Instrumental Toolkit</h2>
            <p className="text-xl text-muted-foreground">Everything you need to keep operations in perfect harmony.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Tool 1: Scorecard */}
            <Link to={scorecardHref as any} className="group relative h-[500px] rounded-[2.5rem] bg-card border border-border/50 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* Content Top */}
              <div className="relative p-10 z-10 pointer-events-none">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-inner">
                  <LayoutDashboard className="w-7 h-7" />
                </div>
                <h3 className="text-3xl font-bold mb-3">Scorecard Metrics</h3>
                <p className="text-muted-foreground text-lg max-w-md">Visualize reliability, availability, and performance trends in real-time. Know your score before the meeting starts.</p>
              </div>

              {/* Animated Demo Bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-[280px] bg-gradient-to-t from-background/50 to-transparent flex items-end justify-center pb-0 px-10">
                <div className="w-full max-w-md h-[220px] bg-background border border-border rounded-t-xl shadow-2xl p-6 group-hover:translate-y-[-10px] transition-transform duration-500 relative overflow-hidden">
                  <div className="flex items-end justify-between h-[120px] gap-2 mb-4">
                    {/* Animated Bars */}
                    {[40, 70, 50, 90, 65, 85, 45].map((h, i) => (
                      <div key={i} className="w-full bg-muted rounded-full relative overflow-hidden h-full">
                        <motion.div
                          initial={{ height: "0%" }}
                          whileInView={{ height: `${h}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="absolute bottom-0 left-0 w-full bg-primary/20 group-hover:bg-primary transition-colors duration-300 rounded-full"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <div className="h-2 w-1/3 bg-muted rounded-full" />
                    <div className="h-2 w-1/4 bg-muted rounded-full" />
                  </div>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-primary/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">View Live Data</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Tool 2: Turnover */}
            <Link to={turnoverHref as any} className="group relative h-[500px] rounded-[2.5rem] bg-card border border-border/50 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="relative p-10 z-10 pointer-events-none">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-6 shadow-inner">
                  <RefreshCcw className="w-7 h-7" />
                </div>
                <h3 className="text-3xl font-bold mb-3">Seamless Turnover</h3>
                <p className="text-muted-foreground text-lg max-w-md">Pass the baton with confidence. Log incidents, tickets, and critical updates for the next shift seamlessly.</p>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-[280px] flex items-end justify-center px-10">
                <div className="w-full max-w-md bg-background border border-border rounded-t-xl shadow-2xl p-4 space-y-3 group-hover:translate-y-[-10px] transition-transform duration-500 relative">
                  {/* Chat/List Items Animation */}
                  {[1, 2, 3].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.2 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 ${i === 0 ? 'bg-blue-500' : 'bg-muted-foreground/30'}`} />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-2 w-3/4 bg-foreground/10 rounded-full" />
                        <div className="h-2 w-1/2 bg-foreground/5 rounded-full" />
                      </div>
                    </motion.div>
                  ))}
                  <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-t-xl">
                    <span className="bg-blue-600 text-white px-4 py-2 rounded-full font-medium text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">Start Handover</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Tool 3: Link Manager */}
            <Link to={linkManagerHref as any} className="group lg:col-span-2 relative h-[400px] rounded-[2.5rem] bg-card border border-border/50 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 flex flex-col md:flex-row">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="relative p-10 md:w-1/2 z-10 flex flex-col justify-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-6 shadow-inner">
                  <Link2 className="w-7 h-7" />
                </div>
                <h3 className="text-3xl font-bold mb-3">Link Manager</h3>
                <p className="text-muted-foreground text-lg">Your team's central repository for documentation, dashboards, and critical URLs. Never lose a bookmark again.</p>

                <div className="mt-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-2 group-hover:translate-y-0">
                  <span className="px-3 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">Tags</span>
                  <span className="px-3 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">Search</span>
                  <span className="px-3 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">Categories</span>
                </div>
              </div>

              <div className="relative md:w-1/2 bg-muted/20 p-8 flex items-center justify-center overflow-hidden">
                {/* Floating Cards Animation */}
                <div className="relative w-full max-w-[300px] h-[200px] perspective-1000">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ rotateY: 30, x: 50, opacity: 0 }}
                      whileInView={{ rotateY: -10, x: i * -20, y: i * 20, opacity: 1 }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                      className="absolute top-0 right-10 w-48 h-16 bg-background rounded-xl shadow-lg border border-border p-3 flex items-center gap-3 z-10"
                      style={{ zIndex: 3 - i }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex-shrink-0" />
                      <div className="space-y-1.5 w-full">
                        <div className="h-2 w-3/4 bg-muted rounded-full" />
                        <div className="h-1.5 w-1/2 bg-muted/50 rounded-full" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Link>
          </div>
        </section>


        {/* Onboarding - Scroll Triggered Sequence */}
        <section className="py-24 relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-border/50 -translate-x-1/2 hidden md:block" />

          <div className="text-center mb-16 relative z-10">
            <span className="bg-background px-4 text-sm font-semibold text-primary tracking-widest uppercase">Joining Ensemble</span>
            <h2 className="text-4xl font-bold mt-4">One wizard. Infinite possibilities.</h2>
          </div>

          <div className="space-y-24">
            {[
              {
                step: "01",
                icon: Activity,
                title: "Team Identity",
                description: "Define your team's profile, code name, and operational hours in one simple step."
              },
              {
                step: "02",
                icon: Shield,
                title: "Access Control",
                description: "Granularly provision permissions for every member. Secure by Design."
              },
              {
                step: "03",
                icon: BookOpen,
                title: "Tool Provisioning",
                description: "Select the modules your team needs. We configure the backend instantly."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${i % 2 === 0 ? '' : 'md:flex-row-reverse'}`}
              >
                <div className={`md:w-1/2 text-center md:text-left ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                  <div className="text-6xl font-black text-muted/20 mb-2">{item.step}</div>
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-lg">{item.description}</p>
                </div>

                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/30">
                    <item.icon className="w-8 h-8" />
                  </div>
                </div>

                <div className="md:w-1/2 p-6 md:p-0">
                  <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg h-32 flex items-center justify-center text-muted-foreground/50 italic">
                    {item.title} Visual Preview
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-24">
            {!session && (
              <Link to="/teams/register" className="inline-flex h-16 px-12 rounded-full bg-foreground text-background text-xl font-bold items-center gap-3 hover:scale-105 transition-transform">
                Start the Wizard <ArrowRight />
              </Link>
            )}
          </div>
        </section>

      </main>

      {/* Deep Dive Tool Showcase */}
      <section className="bg-muted/10 py-32 border-t border-border/50">
        <div className="container mx-auto px-4 max-w-7xl space-y-32">

          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">The Suite Detail.</h2>
            <p className="text-xl text-muted-foreground">Every tool in Ensemble is crafted to solve a specific operational challenge. Explore the capabilities.</p>
          </div>

          {/* Tool 1: Scorecard */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ margin: "-100px" }}
            className="flex flex-col md:flex-row items-center gap-12 md:gap-24"
          >
            <div className="md:w-1/2 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <LayoutDashboard className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold">Scorecard. <span className="text-muted-foreground">Know your health.</span></h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                The Scorecard aggregates data from multiple monitoring sources to provide a single, weighted health score for your application.
              </p>
              <ul className="space-y-3">
                {["Real-time Availability Tracking", "Traffic Volume Analysis", "Error Rate Monitoring", "Customizable Thresholds"].map(feat => (
                  <li key={feat} className="flex items-center gap-3 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="rounded-3xl border border-border bg-card p-2 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="rounded-2xl bg-muted/20 p-8 h-[300px] flex items-end justify-between relative overflow-hidden">
                  <div className="absolute top-6 left-6 right-6 flex justify-between">
                    <div className="space-y-2">
                      <div className="h-2 w-24 bg-foreground/10 rounded-full" />
                      <div className="h-8 w-16 bg-primary/20 rounded-lg" />
                    </div>
                    <div className="h-12 w-12 rounded-full border-4 border-green-500 flex items-center justify-center text-[10px] font-bold">98%</div>
                  </div>
                  {/* Abstract Chart */}
                  <div className="w-full h-32 flex items-end gap-2">
                    {[30, 50, 45, 80, 60, 90, 75].map((h, i) => (
                      <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-gradient-to-t from-primary/40 to-primary/80 rounded-t-sm" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tool 2: Turnover */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ margin: "-100px" }}
            className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-24"
          >
            <div className="md:w-1/2 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                <RefreshCcw className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold">Turnover. <span className="text-muted-foreground">Zero dropped balls.</span></h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                A structured shift handover process that forces acknowledgment of critical issues. Never let a Sev-1 slip through the cracks during a shift change.
              </p>
              <ul className="space-y-3">
                {["Structured Shift Logs", "Blocking Issue Tracking", "Automated Email Summaries", "Historical Archive"].map(feat => (
                  <li key={feat} className="flex items-center gap-3 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="rounded-3xl border border-border bg-card p-2 shadow-2xl -rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="rounded-2xl bg-muted/20 p-6 h-[300px] flex flex-col relative overflow-hidden">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="mb-4 bg-background p-4 rounded-xl border border-border/50 shadow-sm flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex-shrink-0" />
                      <div className="space-y-2 w-full">
                        <div className="h-2 w-1/3 bg-foreground/10 rounded-full" />
                        <div className="h-2 w-full bg-foreground/5 rounded-full" />
                        <div className="h-2 w-2/3 bg-foreground/5 rounded-full" />
                      </div>
                    </div>
                  ))}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tool 3: Link Manager */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ margin: "-100px" }}
            className="flex flex-col md:flex-row items-center gap-12 md:gap-24"
          >
            <div className="md:w-1/2 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Link2 className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold">Link Manager. <span className="text-muted-foreground">The team brain.</span></h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Stop asking "Where is the confluence page for that?". The Link Manager centralizes every URL your team needs, categorized and searchable.
              </p>
              <ul className="space-y-3">
                {["Categorized Bookmarks", "Team-wide Sharing", "Quick Search", "Private & Public Links"].map(feat => (
                  <li key={feat} className="flex items-center gap-3 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="rounded-3xl border border-border bg-card p-2 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="rounded-2xl bg-muted/20 p-8 h-[300px] grid grid-cols-2 gap-4 relative overflow-hidden">
                  <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20"></div>
                  <div className="bg-background rounded-xl p-4 border border-border/50"></div>
                  <div className="bg-background rounded-xl p-4 border border-border/50"></div>
                  <div className="bg-indigo-500/10 rounded-xl p-4 border border-indigo-500/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-background/80 backdrop-blur-md px-6 py-3 rounded-full border border-border shadow-xl font-mono text-sm">
                      /search production-logs
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tool 4: EnvMatrix */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ margin: "-100px" }}
            className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-24"
          >
            <div className="md:w-1/2 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold">EnvMatrix. <span className="text-muted-foreground">Total Inventory.</span></h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Maintain a precise matrix of every server, database, and microservice across DEV, UAT, and PROD environments.
              </p>
              <ul className="space-y-3">
                {["Environment Consistency", "Resource Ownership", "Version Tracking", "Dependency Mapping"].map(feat => (
                  <li key={feat} className="flex items-center gap-3 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500" /> {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="rounded-3xl border border-border bg-card p-2 shadow-2xl -rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="rounded-2xl bg-muted/20 p-2 h-[300px] flex items-center justify-center relative overflow-hidden">
                  <div className="w-full grid grid-cols-3 gap-2 p-4">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="aspect-square rounded-lg bg-background border border-border/50 flex flex-col items-center justify-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                        <div className="h-1 w-8 bg-muted rounded-full" />
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-card via-card/50 to-transparent" />
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-12 bg-background relative z-10">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row justify-between items-center opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-xs text-muted-foreground w-full md:w-auto text-center md:text-left">
            &copy; {new Date().getFullYear()} American Express. <br />
            Built for internal excellence. Use responsibly.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="text-xs font-medium cursor-pointer hover:text-primary">Policy</span>
            <span className="text-xs font-medium cursor-pointer hover:text-primary">Support</span>
            <span className="text-xs font-medium cursor-pointer hover:text-primary">Status</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
