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
import { HeroSection } from '../components/landing/hero-section'

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
    if (savedTeamId && session?.permissions?.find(t => t.teamId === savedTeamId)) {
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

      <HeroSection
        session={session}
        scorecardHref={scorecardHref}
        turnoverHref={turnoverHref}
        linkManagerHref={linkManagerHref}
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">

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

          <div className="space-y-32">

            {/* Step 01: Team Identity */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex flex-col md:flex-row items-center gap-8 md:gap-16"
            >
              <div className="md:w-1/2 text-center md:text-right">
                <div className="text-6xl font-black text-muted/20 mb-2">01</div>
                <h3 className="text-2xl font-bold mb-2">Team Identity</h3>
                <p className="text-muted-foreground text-lg">Define your team's profile, code name, and operational hours in one simple step. Establish your digital presence.</p>
              </div>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/30 ring-4 ring-background">
                  <Activity className="w-8 h-8" />
                </div>
              </div>

              <div className="md:w-1/2 p-6 md:p-0">
                <div className="bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden relative group hover:shadow-2xl transition-all duration-500 max-w-md">
                  <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                    <div className="absolute -bottom-8 left-6">
                      <div className="w-20 h-20 rounded-2xl bg-background p-1 shadow-lg">
                        <div className="w-full h-full rounded-xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">V</div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-10 p-6 space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Team Name</label>
                      <div className="h-10 w-full rounded-lg border border-border bg-muted/20 flex items-center px-3 text-sm font-medium">
                        Voyager Operations
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Code Name</label>
                      <div className="h-10 w-full rounded-lg border border-border bg-muted/20 flex items-center px-3 text-sm font-medium text-foreground/80">
                        DEEP_SPACE_9
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200">EST (UTC-5)</span>
                      <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200">Engineering</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 02: Access Control */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-16"
            >
              <div className="md:w-1/2 text-center md:text-left">
                <div className="text-6xl font-black text-muted/20 mb-2">02</div>
                <h3 className="text-2xl font-bold mb-2">Access Control</h3>
                <p className="text-muted-foreground text-lg">Granularly provision permissions for every member. Assign roles like 'Admin', 'Editor', or 'Viewer' with a single click. Secure by Design.</p>
              </div>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/30 ring-4 ring-background">
                  <Shield className="w-8 h-8" />
                </div>
              </div>

              <div className="md:w-1/2 p-6 md:p-0 flex justify-end">
                <div className="bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden relative max-w-md w-full">
                  <div className="px-6 py-4 border-b border-border/50 bg-muted/20 flex justify-between items-center">
                    <span className="font-bold text-sm">Team Members</span>
                    <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded border border-border">5 Active</span>
                  </div>
                  <div className="p-2">
                    {[
                      { name: "Sarah Connor", role: "Owner", active: true, color: "bg-orange-500" },
                      { name: "John Smith", role: "Admin", active: true, color: "bg-blue-500" },
                      { name: "Elena R.", role: "Contributor", active: true, color: "bg-purple-500" },
                      { name: "Mike Ross", role: "Viewer", active: false, color: "bg-slate-500" },
                    ].map((user, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 hover:bg-muted/30 rounded-lg transition-colors group cursor-default">
                        <div className={`w-8 h-8 rounded-full ${user.color} flex items-center justify-center text-white text-xs font-bold`}>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold leading-none mb-1">{user.name}</div>
                          <div className="text-[10px] text-muted-foreground">User ID: 89932-{i}</div>
                        </div>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${user.role === 'Owner' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          user.role === 'Admin' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                          {user.role}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Step 03: Tool Provisioning */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="flex flex-col md:flex-row items-center gap-8 md:gap-16"
            >
              <div className="md:w-1/2 text-center md:text-right">
                <div className="text-6xl font-black text-muted/20 mb-2">03</div>
                <h3 className="text-2xl font-bold mb-2">Tool Provisioning</h3>
                <p className="text-muted-foreground text-lg">Select the modules your team needs. We configure the backend instantly. Toggle features on or off as your team evolves.</p>
              </div>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground shadow-xl shadow-primary/30 ring-4 ring-background">
                  <BookOpen className="w-8 h-8" />
                </div>
              </div>

              <div className="md:w-1/2 p-6 md:p-0">
                <div className="bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden relative max-w-md w-full p-6 space-y-4">
                  {[
                    { name: "Scorecard Metrics", icon: LayoutDashboard, enabled: true },
                    { name: "Shift Turnover", icon: RefreshCcw, enabled: true },
                    { name: "Link Manager", icon: Link2, enabled: true },
                    { name: "EnvInventory", icon: Layers, enabled: false },
                  ].map((tool, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${tool.enabled ? 'bg-primary/5 border-primary/20' : 'bg-muted/10 border-border/50 opacity-60'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${tool.enabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          <tool.icon className="w-4 h-4" />
                        </div>
                        <span className={`font-semibold text-sm ${tool.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>{tool.name}</span>
                      </div>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${tool.enabled ? 'bg-primary' : 'bg-muted'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${tool.enabled ? 'left-5' : 'left-0.5'}`} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 text-center">
                    <span className="text-xs font-medium text-muted-foreground">Auto-provisioning resources...</span>
                    <div className="h-1 w-full bg-muted mt-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        whileInView={{ width: "70%" }}
                        transition={{ duration: 1.5, delay: 0.5 }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

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

          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">The Suite Detail.</h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed">
              Every tool in Ensemble is crafted to solve a specific operational challenge.
              <br className="hidden md:block" />
              Explore the capabilities designed for high-performance teams.
            </p>
          </div>

          {/* Tool 1: Scorecard - High Fidelity Dashboard UI */}
          <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">
            <div className="md:w-1/2 space-y-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20">
                <LayoutDashboard className="w-8 h-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-bold tracking-tight">Scorecard. <span className="text-muted-foreground font-medium">Know your health.</span></h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  The Scorecard aggregates data from multiple monitoring sources to provide a single, weighted health score for your application.
                  Eliminate ambiguity during leadership reviews.
                </p>
              </div>
              <ul className="space-y-4 pt-4">
                {[
                  { title: "Real-time Availability", desc: "Live integration with monitoring tools" },
                  { title: "Weighted Health Scoring", desc: "Custom algorithms for business impact" },
                  { title: "Trend Analysis", desc: "Historical tracking of performance" }
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">{feat.title}</span>
                      <p className="text-sm text-muted-foreground">{feat.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:w-1/2 w-full perspective-1000">
              <motion.div
                initial={{ transform: "rotateY(-5deg) rotateX(5deg)", opacity: 0 }}
                whileInView={{ transform: "rotateY(0deg) rotateX(0deg)", opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="rounded-xl bg-card border border-border shadow-2xl overflow-hidden"
              >
                {/* Mock Browser Header */}
                <div className="bg-muted/50 border-b border-border p-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                  </div>
                  <div className="h-5 w-1/3 bg-background rounded-md ml-2 border border-border/50" />
                </div>

                {/* Dashboard Content */}
                <div className="p-6 space-y-6 bg-background/50 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg">Platform Health</h4>
                      <div className="text-xs text-muted-foreground">Last updated: Just now</div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-bold border border-green-500/20 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      OPERATIONAL
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Availability", val: "99.99%", trend: "+0.01%", good: true },
                      { label: "Latency", val: "45ms", trend: "-12ms", good: true },
                      { label: "Error Rate", val: "0.02%", trend: "+0.01%", good: false },
                    ].map((stat, i) => (
                      <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{stat.label}</div>
                        <div className="text-xl font-bold font-mono">{stat.val}</div>
                        <div className={`text-xs font-medium ${stat.good ? 'text-green-600' : 'text-red-500'}`}>{stat.trend} vs last week</div>
                      </div>
                    ))}
                  </div>

                  <div className="h-32 rounded-xl border border-border/50 bg-gradient-to-b from-primary/5 to-transparent p-4 relative">
                    <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-between px-4 pb-4 gap-1 opacity-50">
                      {[40, 65, 50, 80, 55, 90, 70, 85, 60, 95, 75, 45, 65, 55, 80].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          transition={{ delay: i * 0.05, duration: 0.5 }}
                          className="w-full bg-primary/40 rounded-t-sm"
                        />
                      ))}
                    </div>
                    <div className="absolute top-4 left-4 text-xs font-bold text-primary">Traffic Volume (24h)</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Tool 2: Turnover - High Fidelity UI */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-16 md:gap-24">
            <div className="md:w-1/2 space-y-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20">
                <RefreshCcw className="w-8 h-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-bold tracking-tight">Turnover. <span className="text-muted-foreground font-medium">Zero dropped balls.</span></h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  A structured shift handover process that forces acknowledgment of critical issues.
                  Never let a Sev-1 slip through the cracks during a shift change again.
                </p>
              </div>
              <ul className="space-y-4 pt-4">
                {[
                  { title: "Structured Handsets", desc: "Standardized templates for consistency" },
                  { title: "Mandatory Acknowledgement", desc: "Ensure incoming engineers accept items" },
                  { title: "Audit Trail", desc: "Full history of every shift transition" }
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 mt-0.5">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">{feat.title}</span>
                      <p className="text-sm text-muted-foreground">{feat.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:w-1/2 w-full perspective-1000">
              <motion.div
                initial={{ transform: "rotateY(5deg) rotateX(5deg)", opacity: 0 }}
                whileInView={{ transform: "rotateY(0deg) rotateX(0deg)", opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="rounded-xl bg-card border border-border shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-border bg-muted/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-bold">SHIFT #4029</div>
                    <span className="text-sm text-muted-foreground">Oct 24, 14:00 - 22:00</span>
                  </div>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-background bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">JD</div>
                    <div className="w-8 h-8 rounded-full border-2 border-background bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">AS</div>
                  </div>
                </div>
                <div className="p-0 bg-background">
                  {[
                    { type: "CRITICAL", title: "Database Locking Incident", id: "INC-9921", time: "14:30", status: "Open" },
                    { type: "Maintenance", title: "API Gateway Patching", id: "CHG-221", time: "16:00", status: "Complete" },
                    { type: "Task", title: "Verify User Metrics", id: "TSK-009", time: "20:15", status: "Pending" },
                  ].map((item, i) => (
                    <div key={i} className="p-4 border-b border-border/50 last:border-0 flex gap-4 hover:bg-muted/20 transition-colors">
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'Open' ? 'bg-red-500' : item.status === 'Complete' ? 'bg-green-500' : 'bg-orange-400'}`} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{item.title}</span>
                          <span className="text-xs font-mono text-muted-foreground">{item.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{item.id}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.status === 'Open' ? 'bg-red-100 text-red-700' : item.status === 'Complete' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{item.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-muted/10">
                    <div className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-md">
                      Complete Handover
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Tool 3: Link Manager - High Fidelity UI */}
          <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">
            <div className="md:w-1/2 space-y-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20">
                <Link2 className="w-8 h-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-bold tracking-tight">Link Manager. <span className="text-muted-foreground font-medium">The team brain.</span></h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Stop asking "Where is the confluence page for that?". The Link Manager centralizes every URL your team needs, categorized, searchable, and shared.
                </p>
              </div>
              <ul className="space-y-4 pt-4">
                {[
                  { title: "Centralized Repository", desc: "One place for all team knowledge" },
                  { title: "Smart Categorization", desc: "Tag and filter resources instantly" },
                  { title: "One-Click Access", desc: "Launch tools directly from the dashboard" }
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 mt-0.5">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">{feat.title}</span>
                      <p className="text-sm text-muted-foreground">{feat.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:w-1/2 w-full perspective-1000">
              <motion.div
                initial={{ transform: "rotateY(-5deg) rotateX(5deg)", opacity: 0 }}
                whileInView={{ transform: "rotateY(0deg) rotateX(0deg)", opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="rounded-xl bg-card border border-border shadow-2xl overflow-hidden p-6 space-y-6"
              >
                {/* Search Bar Mockup */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <div className="w-full h-10 rounded-lg bg-muted/40 border border-border pl-10 pr-4 flex items-center text-sm text-muted-foreground">
                    Search knowledge base...
                  </div>
                </div>

                {/* Links Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "Production Logs", tool: "Splunk", color: "bg-green-500" },
                    { name: "API Documentation", tool: "Confluence", color: "bg-blue-500" },
                    { name: "Sprint Board", tool: "Jira", color: "bg-blue-600" },
                    { name: "CI/CD Pipelines", tool: "Jenkins", color: "bg-orange-500" },
                    { name: "Design System", tool: "Figma", color: "bg-purple-500" },
                    { name: "Cloud Console", tool: "AWS", color: "bg-yellow-500" }
                  ].map((link, i) => (
                    <div key={i} className="group p-3 rounded-lg border border-border/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-500/30 transition-all cursor-pointer flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${link.color} flex items-center justify-center text-white font-bold text-[10px] shadow-sm`}>
                        {link.tool[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate group-hover:text-indigo-600 transition-colors">{link.name}</div>
                        <div className="text-[10px] text-muted-foreground">{link.tool}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Tool 4: EnvMatrix - High Fidelity UI */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-16 md:gap-24">
            <div className="md:w-1/2 space-y-8">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 shadow-lg shadow-teal-500/10 ring-1 ring-teal-500/20">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl font-bold tracking-tight">EnvMatrix. <span className="text-muted-foreground font-medium">Total Inventory.</span></h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Maintain a precise matrix of every server, database, and microservice across DEV, UAT, and PROD environments.
                  Golden source of truth for your infrastructure.
                </p>
              </div>
              <ul className="space-y-4 pt-4">
                {[
                  { title: "Full-Stack Inventory", desc: "Databases, APIs, caching layers, and more" },
                  { title: "Status Monitoring", desc: "Live health checks for each component" },
                  { title: "Dependency Mapping", desc: "Visualize connections between services" }
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 mt-0.5">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">{feat.title}</span>
                      <p className="text-sm text-muted-foreground">{feat.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:w-1/2 w-full perspective-1000">
              <motion.div
                initial={{ transform: "rotateY(5deg) rotateX(5deg)", opacity: 0 }}
                whileInView={{ transform: "rotateY(0deg) rotateX(0deg)", opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="rounded-xl bg-card border border-border shadow-2xl overflow-hidden"
              >
                <div className="bg-muted/10 border-b border-border p-3 grid grid-cols-4 gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <div className="col-span-2">Service Name</div>
                  <div className="text-center">Env</div>
                  <div className="text-right pr-2">Status</div>
                </div>
                {[
                  { name: "Auth Service API", type: "Microservice", env: "PROD", status: "Healthy" },
                  { name: "Payment Gateway", type: "External API", env: "PROD", status: "Healthy" },
                  { name: "Redis Cache Primary", type: "Database", env: "PROD", status: "Degraded" },
                  { name: "User Profile DB", type: "Postgres", env: "UAT", status: "Healthy" },
                  { name: "Notification Svc", type: "Lambda", env: "DEV", status: "Offline" },
                  { name: "Promo Engine", type: "Microservice", env: "DEV", status: "Deploying" },
                ].map((svc, i) => (
                  <div key={i} className="p-3 border-b border-border/50 last:border-0 grid grid-cols-4 gap-4 items-center bg-background/50 hover:bg-muted/20 transition-colors">
                    <div className="col-span-2">
                      <div className="font-semibold text-sm">{svc.name}</div>
                      <div className="text-[10px] text-muted-foreground">{svc.type}</div>
                    </div>
                    <div className="flex justify-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted border border-border/50">{svc.env}</span>
                    </div>
                    <div className="flex justify-end pr-2">
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold ${svc.status === 'Healthy' ? 'text-green-600' :
                        svc.status === 'Degraded' ? 'text-yellow-600' :
                          svc.status === 'Offline' ? 'text-red-500' : 'text-blue-500'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${svc.status === 'Healthy' ? 'bg-green-500' :
                          svc.status === 'Degraded' ? 'bg-yellow-500' :
                            svc.status === 'Offline' ? 'bg-red-500' : 'bg-blue-500 animate-pulse'
                          }`} />
                        {svc.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

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
