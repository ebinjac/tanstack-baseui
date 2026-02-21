import { Link, createFileRoute, useRouteContext } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
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
  User,
  Users,
} from 'lucide-react'
import { HeroSection } from '../components/landing/hero-section'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { session } = useRouteContext({ from: '__root__' })
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)

  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  // Active team ID effect
  useEffect(() => {
    if (!session) return
    const savedTeamId = localStorage.getItem('ensemble-last-team-id')
    if (
      savedTeamId &&
      session.permissions.find((t) => t.teamId === savedTeamId)
    ) {
      setActiveTeamId(savedTeamId)
    } else if (session.permissions.length > 0) {
      setActiveTeamId(session.permissions[0].teamId)
    }
  }, [session])

  const scorecardHref = activeTeamId
    ? `/teams/${activeTeamId}/scorecard`
    : '/scorecard'
  const turnoverHref = activeTeamId
    ? `/teams/${activeTeamId}/turnover`
    : '/turnover'
  const linkManagerHref = activeTeamId
    ? `/teams/${activeTeamId}/link-manager`
    : '/link-manager'

  return (
    <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/20">
      <HeroSection
        session={session}
        scorecardHref={scorecardHref}
        turnoverHref={turnoverHref}
        linkManagerHref={linkManagerHref}
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Tools Section - Premium Bento Grid */}
        <section className="py-24 space-y-20 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: '-100px' }}
            className="text-center space-y-6 relative"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-sm">
              <span className="text-xs font-bold tracking-widest uppercase text-primary">
                Core Capabilities
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight drop-shadow-sm text-foreground">
              Your Instrumental Toolkit
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
              Everything you need to keep operations in perfect harmony.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
            {/* Tool 1: Scorecard (7 Cols) */}
            <Link
              to={scorecardHref as any}
              className="col-span-1 md:col-span-7 group block transform-gpu transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-full min-h-[450px] rounded-[2.5rem] overflow-hidden bg-primary text-primary-foreground shadow-lg ring-1 ring-border flex flex-col justify-between p-10">
                {/* Background Pattern */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none mix-blend-color-dodge transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('/patterns/amex-1.png')`,
                    backgroundSize: '400px',
                    backgroundPosition: 'center right',
                  }}
                />

                {/* Content Top */}
                <div className="relative z-10 max-w-sm">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6 shadow-sm border border-white/20 group-hover:bg-white group-hover:text-primary transition-colors">
                    <LayoutDashboard className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight mb-3">
                    Scorecard Metrics
                  </h3>
                  <p className="text-white/80 text-lg font-medium leading-relaxed">
                    Visualize reliability, availability, and performance trends
                    in real-time. Know your score before the meeting starts.
                  </p>
                </div>

                {/* Bottom visual mocked UI */}
                <div className="relative z-10 w-full mt-12 bg-white/10 border border-white/20 rounded-2xl p-6 h-[180px] overflow-hidden backdrop-blur-sm group-hover:bg-white/20 transition-colors duration-300">
                  <div className="absolute bottom-0 left-0 right-0 top-10 flex items-end justify-between px-6 gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    {[40, 70, 50, 90, 65, 85, 45, 60, 80].map((h, i) => (
                      <div
                        key={i}
                        className="w-full bg-white/20 rounded-t-sm relative overflow-hidden h-full"
                      >
                        <motion.div
                          initial={{ height: '0%' }}
                          whileInView={{ height: `${h}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          viewport={{ once: true }}
                          className="absolute bottom-0 left-0 w-full bg-white transition-all duration-500 rounded-t-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>

            {/* Tool 2: Turnover (5 Cols) */}
            <Link
              to={turnoverHref as any}
              className="col-span-1 md:col-span-5 group block transform-gpu transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-full min-h-[450px] rounded-[2.5rem] overflow-hidden bg-card text-foreground shadow-lg ring-1 ring-border flex flex-col justify-between p-10">
                {/* Pattern Background overlay */}
                <div
                  className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] transition-all duration-1000 transform-gpu group-hover:scale-105 pointer-events-none"
                  style={{
                    backgroundImage: `url('/patterns/amex-1.png')`,
                    backgroundSize: '400px',
                    backgroundPosition: 'top left',
                  }}
                />

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <RefreshCcw className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight mb-3">
                    Seamless Turnover
                  </h3>
                  <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                    Pass the baton with confidence. Log incidents, tickets, and
                    critical updates seamlessly.
                  </p>
                </div>

                <div className="relative z-10 mt-12 bg-muted/30 border border-border rounded-2xl p-4 space-y-3 shadow-inner group-hover:bg-muted/50 transition-colors duration-300">
                  {[1, 2, 3].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/50 shadow-sm"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex-shrink-0 shadow-inner flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border text-muted-foreground'}`}
                      >
                        {i === 0 ? 'L' : 'P'}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="h-2 w-3/4 bg-muted-foreground/30 rounded-full" />
                        <div className="h-2 w-1/2 bg-muted-foreground/20 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Link>

            {/* Tool 3: Link Manager (12 Cols wide block) */}
            <Link
              to={linkManagerHref as any}
              className="col-span-1 md:col-span-12 group relative min-h-[350px] rounded-[2.5rem] bg-card shadow-lg ring-1 ring-border overflow-hidden block transform-gpu transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="flex flex-col lg:flex-row h-full">
                {/* Text Section */}
                <div className="p-10 lg:w-1/2 flex flex-col justify-center relative z-10 border-b lg:border-b-0 lg:border-r border-border/50 bg-card">
                  <div className="w-14 h-14 rounded-2xl bg-secondary/20 text-secondary-foreground flex items-center justify-center mb-6 border border-border group-hover:bg-secondary transition-colors duration-300 shadow-sm">
                    <Link2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight mb-3">
                    Link Manager
                  </h3>
                  <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-md">
                    Your team's central repository for documentation,
                    dashboards, and critical URLs. Never lose a bookmark again
                    with powerful categories and tags.
                  </p>
                </div>

                {/* Animated Mock Section */}
                <div className="lg:w-1/2 bg-muted/10 p-10 relative overflow-hidden flex items-center justify-center min-h-[250px]">
                  {/* Pattern Background overlay */}
                  <div
                    className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.08] transition-all duration-1000 transform-gpu group-hover:scale-110 pointer-events-none"
                    style={{
                      backgroundImage: `url('/patterns/amex-1.png')`,
                      backgroundSize: '400px',
                      backgroundPosition: 'center',
                    }}
                  />

                  {/* Floating Cards mock */}
                  <div className="w-full max-w-sm space-y-4 relative z-10 group-hover:-translate-y-2 transition-transform duration-500">
                    {[
                      {
                        title: 'Production AWS Console',
                        cat: 'Infrastructure',
                      },
                      { title: 'Splunk Dashboard', cat: 'Monitoring' },
                      { title: 'Service Repository', cat: 'Source Code' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="w-full bg-background rounded-2xl shadow-sm border border-border p-4 flex items-center justify-between transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Link2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px] sm:max-w-[200px]">
                              {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.cat}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-50" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Onboarding - Premium Step Grid */}
        <section className="py-32 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20 relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-sm mb-8">
              <span className="text-xs font-bold tracking-widest uppercase text-primary">
                How It Works
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl md:text-6xl font-black text-foreground tracking-tight drop-shadow-sm">
              Onboard in 3 simple steps.
            </h2>
          </motion.div>

          {/* Easy Onboarding Flow */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
            {/* Connecting Line (Desktop) */}
            <div className="absolute top-10 left-[15%] right-[15%] h-1 bg-border/40 hidden md:block rounded-full z-0 overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                whileInView={{ width: '100%' }}
                transition={{ duration: 1.5, delay: 0.2 }}
                className="h-full bg-primary/30"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 relative z-10">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-card border-2 border-border shadow-xl flex items-center justify-center relative overflow-hidden group-hover:border-primary/40 transition-colors z-10">
                    <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                    <Users className="w-8 h-8 text-primary drop-shadow-sm" />
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-black text-sm border-[3px] border-background z-20 shadow-sm">
                    1
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <h3 className="text-2xl font-black text-foreground tracking-tight drop-shadow-sm">
                    Define Your Team
                  </h3>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed px-2 lg:px-4">
                    Provide a name, enter a brief description, and assign
                    primary contacts in seconds. No complex paperwork or
                    tickets.
                  </p>
                </div>

                {/* Mini Mockup Visual */}
                <div className="w-full bg-card rounded-[1.5rem] border border-border shadow-sm p-5 relative overflow-hidden text-left hover:shadow-md transition-shadow cursor-default mt-auto">
                  <div className="space-y-4 relative z-10">
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        Team Name
                      </div>
                      <div className="h-10 w-full rounded-xl bg-background border border-border flex items-center px-3 shadow-inner">
                        <span className="text-xs font-bold text-foreground">
                          Platform Trading Systems
                        </span>
                        <motion.div
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          transition={{ delay: 0.4 }}
                          className="ml-auto flex h-5 w-5 rounded-full bg-success/10 border border-success/20 items-center justify-center text-success"
                        >
                          <Check className="w-3 h-3" />
                        </motion.div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        Description
                      </div>
                      <div className="h-14 w-full rounded-xl bg-background border border-border flex p-3 shadow-inner">
                        <span className="text-[10px] text-muted-foreground font-medium italic">
                          Core trading infrastructure...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-card border-2 border-border shadow-xl flex items-center justify-center relative overflow-hidden group-hover:border-primary/40 transition-colors z-10">
                    <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                    <Shield className="w-8 h-8 text-primary drop-shadow-sm" />
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-black text-sm border-[3px] border-background z-20 shadow-sm">
                    2
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <h3 className="text-2xl font-black text-foreground tracking-tight drop-shadow-sm">
                    Secure Access
                  </h3>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed px-2 lg:px-4">
                    Configure permissions instantly by linking your existing
                    Active Directory groups. Zero friction, enterprise security.
                  </p>
                </div>

                {/* Mini Mockup Visual */}
                <div className="w-full bg-card rounded-[1.5rem] border border-border shadow-sm p-5 relative overflow-hidden text-left hover:shadow-md transition-shadow cursor-default mt-auto">
                  <div className="space-y-4 relative z-10">
                    <div className="relative bg-background rounded-xl border border-border p-3 shadow-inner group/item hover:border-primary/40 transition-colors">
                      <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-1.5 flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> User Access Group
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span className="text-xs font-black tracking-tight truncate">
                          ENSEMBLE-PTS-USERS
                        </span>
                      </div>
                    </div>
                    <div className="relative bg-background rounded-xl border border-border p-3 shadow-inner group/item hover:border-primary/40 transition-colors">
                      <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-1.5 flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-secondary" /> Admin
                        Access Group
                      </div>
                      <div className="flex items-center gap-2 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span className="text-xs font-black tracking-tight truncate">
                          ENSEMBLE-PTS-ADMINS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-card border-2 border-border shadow-xl flex items-center justify-center relative overflow-hidden group-hover:border-primary/40 transition-colors z-10">
                    <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
                    <Activity className="w-8 h-8 text-primary drop-shadow-sm" />
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-black text-sm border-[3px] border-background z-20 shadow-sm">
                    3
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <h3 className="text-2xl font-black text-foreground tracking-tight drop-shadow-sm">
                    Instant Launch
                  </h3>
                  <p className="text-muted-foreground font-medium text-sm leading-relaxed px-2 lg:px-4">
                    Hit submit and your robust suite is provisioned
                    automatically. Scorecards, Turnover logs, and more—ready
                    immediately.
                  </p>
                </div>

                {/* Mini Mockup Visual */}
                <div className="w-full bg-card rounded-[1.5rem] border border-border shadow-sm p-5 relative overflow-hidden text-left hover:shadow-md transition-shadow cursor-default mt-auto min-h-[160px] flex items-center justify-center">
                  <div className="absolute inset-0 bg-[url('/patterns/amex-1.png')] bg-cover opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex flex-col items-center justify-center relative z-10 space-y-4">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.8, type: 'spring' }}
                      className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center text-success relative border border-success/30 shadow-lg shadow-success/20"
                    >
                      <Check className="w-8 h-8 drop-shadow-sm relative z-10" />
                      <div className="absolute inset-0 rounded-full border-2 border-success animate-ping opacity-30" />
                    </motion.div>
                    <div className="text-center">
                      <div className="text-sm font-black drop-shadow-sm">
                        Workspace Automated!
                      </div>
                      <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1.5 py-1 px-3 rounded-md bg-muted/30 border border-border">
                        Tools Initialized
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="text-center mt-20">
            {!session && (
              <Link
                to="/teams/register"
                className="inline-flex px-10 py-4 rounded-full bg-primary text-primary-foreground text-lg font-bold items-center gap-2 hover:bg-primary/90 transition-colors shadow-md"
              >
                Start the Wizard <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* === PREMIUM CTA SECTION === */}
      <section className="relative w-full py-32 mt-20 bg-primary overflow-hidden">
        {/* Deep AmEx Blue Base with rich gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00175a] via-primary to-[#004e9a] opacity-90" />

        {/* Cinematic Pattern Background */}
        <div
          className="absolute inset-0 mix-blend-overlay opacity-50 transform-gpu rotate-[-2deg] scale-110"
          style={{
            backgroundImage: `url('/patterns/amex-1.png')`,
            backgroundSize: '800px',
            backgroundPosition: 'center',
            filter: 'contrast(1.5) brightness(0.8)',
          }}
        />

        {/* Dynamic Glow Intersections - Removed per user request */}

        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          viewport={{ once: true, margin: '-100px' }}
          className="container mx-auto px-4 relative z-10 max-w-5xl"
        >
          <div className="bg-black/20 rounded-[3rem] border border-white/20 p-12 md:p-20 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
            {/* Inner Pattern Accent */}
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 bg-[url('/patterns/amex-1.png')] bg-cover mix-blend-plus-lighter pointer-events-none" />

            {/* Left Content */}
            <div className="space-y-6 md:w-2/3 text-center md:text-left relative z-10">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white drop-shadow-md leading-[1.1]">
                Ready to modernize <br className="hidden md:block" /> your
                operations?
              </h2>
              <p className="text-xl md:text-2xl text-white/80 font-medium max-w-xl mx-auto md:mx-0 drop-shadow-sm leading-relaxed">
                Join the high-performance teams already using Ensemble to
                streamline their workflow.
              </p>
            </div>

            {/* Right Action */}
            <div className="md:w-1/3 flex justify-center md:justify-end relative z-10">
              <Link to="/teams/register" className="group">
                <div className="relative inline-flex h-20 px-10 rounded-full bg-white text-primary text-xl font-black items-center gap-4 transition-all duration-500 hover:scale-105 shadow-2xl hover:shadow-white/30 overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">Enroll Today</span>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center relative z-10 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Deep Dive Tool Showcase / Premium Suite Detail */}
      <section className="bg-background py-32 border-t border-border/10 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-muted/20 blur-[150px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 max-w-7xl space-y-32 md:space-y-40 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-sm mb-4">
              <span className="text-xs font-bold tracking-widest uppercase text-primary">
                Explore the Platform
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground drop-shadow-sm">
              Built for High Performance.
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">
              Every tool in Ensemble is purpose-built to eliminate friction.
              <br className="hidden md:block" />
              Discover the capabilities powering modern engineering teams.
            </p>
          </div>

          {/* Tool 1: Scorecard - High Fidelity Dashboard UI */}
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
            <div className="md:w-1/2 space-y-8">
              <div className="w-20 h-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-sm ring-1 ring-primary/20 relative overflow-hidden group mb-6">
                <LayoutDashboard className="w-10 h-10 relative z-10" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                  Scorecard.
                  <br />
                  <span className="text-muted-foreground font-medium md:text-4xl">
                    Know your health.
                  </span>
                </h3>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                  The Scorecard aggregates data from multiple monitoring sources
                  to provide a single, weighted health score for your
                  application. Eliminate ambiguity during leadership reviews.
                </p>
              </div>
              <ul className="space-y-4 pt-4">
                {[
                  {
                    title: 'Real-time Availability',
                    desc: 'Live integration with monitoring tools',
                  },
                  {
                    title: 'Weighted Health Scoring',
                    desc: 'Custom algorithms for business impact',
                  },
                  {
                    title: 'Trend Analysis',
                    desc: 'Historical tracking of performance',
                  },
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-sm">
                        {feat.title}
                      </span>
                      <p className="text-sm text-muted-foreground font-medium">
                        {feat.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:w-1/2 w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: '-100px' }}
                transition={{ duration: 0.8 }}
                className="rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group transform-gpu hover:shadow-primary/10 transition-shadow duration-500 h-[450px] flex flex-col"
              >
                {/* Subtle Pattern Background in App Window */}
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
                  style={{
                    backgroundImage: `url('/patterns/amex-1.png')`,
                    backgroundSize: 'cover',
                  }}
                />

                {/* Mock Browser Header */}
                <div className="bg-muted/30 border-b border-border p-3 flex items-center justify-between relative z-10">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                  </div>
                </div>

                {/* Dashboard Content matching Screenshot */}
                <div className="p-4 space-y-4 relative z-10 flex-1 flex flex-col justify-start overflow-hidden bg-background">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-lg text-foreground tracking-tight">
                        Performance Scorecard
                      </h4>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Activity className="w-3 h-3 text-primary/70" />{' '}
                        Tracking for{' '}
                        <span className="font-bold text-foreground">
                          enterprise-security
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {
                        val: '3',
                        label: 'APPLICATIONS',
                        icon: <Activity className="w-3 h-3 text-primary" />,
                        iconBg: 'bg-primary/10',
                      },
                      {
                        val: '6',
                        label: 'TRACKED TECH',
                        icon: (
                          <span className="text-secondary text-xs font-black">
                            #
                          </span>
                        ),
                        iconBg: 'bg-secondary/10',
                      },
                      {
                        val: '5',
                        label: 'AVAILABILITY',
                        icon: (
                          <span className="text-success text-xs font-black">
                            %
                          </span>
                        ),
                        iconBg: 'bg-success/10',
                      },
                      {
                        val: '0',
                        label: 'SLA BREACHES',
                        icon: (
                          <span className="text-destructive text-xs font-black">
                            !
                          </span>
                        ),
                        iconBg: 'bg-destructive/10',
                      },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        className="p-3 rounded-2xl bg-card border border-border shadow-sm flex flex-col hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${stat.iconBg}`}
                          >
                            {stat.icon}
                          </div>
                          <span className="text-xl font-black tracking-tighter text-foreground leading-none">
                            {stat.val}
                          </span>
                        </div>
                        <span className="text-[7.5px] font-bold text-muted-foreground tracking-wider uppercase">
                          {stat.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-full py-1.5 px-3 rounded-md border border-success/30 bg-success/5 flex items-center text-success text-[10px] font-bold"
                  >
                    <Activity className="w-3 h-3 mr-2" /> FULLY SYNCHRONIZED
                  </motion.div>

                  <div className="flex-1 rounded-2xl bg-card border border-border shadow-sm overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-border/50 bg-muted/20 flex flex-col">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Activity className="w-4 h-4 text-primary" />
                        <span className="text-sm font-black tracking-tight">
                          Application Health
                        </span>
                      </div>
                      <span className="text-[9px] text-muted-foreground mt-0.5">
                        Performance tracking and reliability metrics across your
                        portfolio.
                      </span>
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col p-3 space-y-2">
                      {[
                        {
                          name: 'Key Management Services',
                          tag: 'KMS',
                          comp: '3',
                          avail: '99.49%',
                          vol: '9023.1B',
                          ok: true,
                        },
                        {
                          name: 'Key Management Services',
                          tag: 'AIF',
                          comp: '0',
                          avail: '-',
                          vol: '0',
                          ok: true,
                        },
                        {
                          name: 'Token Services',
                          tag: 'TKS',
                          comp: '3',
                          avail: '96.50%',
                          vol: '558.9B',
                          ok: false,
                        },
                      ].map((app, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                          className="flex items-center justify-between p-2 rounded-xl border border-border hover:bg-muted/10 transition-colors bg-background"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border border-border bg-card flex items-center justify-center shadow-sm shrink-0">
                              <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black tracking-tight">
                                  {app.name}
                                </span>
                                <span className="text-[8px] px-1.5 py-0.5 rounded-md border border-primary/20 bg-primary/10 text-primary font-bold uppercase">
                                  {app.tag}
                                </span>
                              </div>
                              <div className="text-[8px] text-muted-foreground flex items-center gap-1 font-semibold">
                                # 200004789{' '}
                                <span className="opacity-50">•</span>{' '}
                                <Activity className="w-2 h-2" /> {app.comp}{' '}
                                COMPONENTS
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-right shrink-0">
                            {app.avail !== '-' && (
                              <div className="w-16">
                                <div className="text-[7.5px] text-muted-foreground font-bold tracking-widest uppercase mb-0.5">
                                  AVAILABILITY
                                </div>
                                <div
                                  className={`text-xs font-black flex items-center justify-end gap-1 ${app.ok ? 'text-success' : 'text-destructive'}`}
                                >
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full ${app.ok ? 'bg-success' : 'bg-destructive'}`}
                                  />{' '}
                                  {app.avail}
                                </div>
                              </div>
                            )}
                            <div className="w-16">
                              <div className="text-[7.5px] text-muted-foreground font-bold tracking-widest uppercase mb-0.5">
                                ANNUAL VOLUME
                              </div>
                              <div className="text-[11px] font-black text-primary tracking-tight">
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
          <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-24">
            <div className="md:w-1/2 space-y-8">
              <div className="w-20 h-20 rounded-[1.5rem] bg-card flex items-center justify-center text-foreground shadow-sm ring-1 ring-border relative overflow-hidden group mb-6">
                <RefreshCcw className="w-10 h-10 relative z-10" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                  Turnover.
                  <br />
                  <span className="text-muted-foreground font-medium md:text-4xl">
                    Zero dropped balls.
                  </span>
                </h3>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                  A structured shift handover process that forces acknowledgment
                  of critical issues. Never let a Sev-1 slip through the cracks
                  during a shift change.
                </p>
              </div>
              <ul className="space-y-4 pt-4">
                {[
                  {
                    title: 'Structured Handsets',
                    desc: 'Standardized templates for consistency',
                  },
                  {
                    title: 'Mandatory Acknowledgement',
                    desc: 'Ensure incoming engineers accept items',
                  },
                  {
                    title: 'Audit Trail',
                    desc: 'Full history of every shift transition',
                  },
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-foreground shrink-0 shadow-sm">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-sm">
                        {feat.title}
                      </span>
                      <p className="text-sm text-muted-foreground font-medium">
                        {feat.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:w-1/2 w-full">
              <motion.div
                initial={{ transform: 'scale(0.95)', opacity: 0 }}
                whileInView={{ transform: 'scale(1)', opacity: 1 }}
                viewport={{ margin: '-100px' }}
                transition={{ duration: 0.8 }}
                className="rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group h-[450px] flex flex-col"
              >
                {/* Subtle Pattern Background */}
                <div className="absolute inset-0 bg-[url('/patterns/amex-1.png')] bg-cover opacity-[0.03] pointer-events-none" />

                {/* Mock Browser Header */}
                <div className="bg-muted/30 border-b border-border p-3 flex items-center justify-between relative z-10">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                  </div>
                </div>

                {/* Dashboard Content matching Screenshot */}
                <div className="bg-background border-b border-border p-3 flex flex-col gap-2 relative z-10 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20">
                      <RefreshCcw className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black tracking-tight text-foreground leading-none mb-1">
                        KMS/TKS
                      </span>
                      <span className="text-[8.5px] font-bold text-muted-foreground tracking-wide">
                        Manage turnover entries for 2 grouped applications
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-[8px] font-bold text-muted-foreground tracking-widest uppercase">
                        KMS
                      </span>
                      <span className="text-[8px] font-bold text-muted-foreground tracking-widest uppercase">
                        TKS
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 relative z-10 flex-1 flex flex-col overflow-hidden bg-muted/10">
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-start gap-3 p-3 rounded-xl border border-warning/30 bg-warning/5 text-warning mb-4 shadow-sm"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="flex flex-col space-y-0.5">
                      <span className="text-xs font-black tracking-tight flex items-center gap-2">
                        Critical Turnover Items{' '}
                        <span className="px-1.5 py-0.5 rounded-md text-[8px] bg-warning text-warning-foreground">
                          1 items
                        </span>
                      </span>
                      <p className="text-[10px] text-warning/80 font-medium">
                        Action required: These items have been flagged for
                        immediate attention.
                      </p>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-3 flex-1 overflow-hidden">
                    {[
                      {
                        title: 'Request for Change',
                        subtitle: 'RFC',
                        count: 2,
                        entries: ['TEST', 'CHG34552662'],
                        color: 'text-primary',
                        bg: 'bg-primary',
                        icon: <Shield className="w-3 h-3 text-primary" />,
                      },
                      {
                        title: 'Incidents',
                        subtitle: 'INC',
                        count: 0,
                        entries: [],
                        color: 'text-destructive',
                        bg: 'bg-destructive',
                        icon: (
                          <AlertCircle className="w-3 h-3 text-destructive" />
                        ),
                      },
                      {
                        title: 'Alerts/Issues',
                        subtitle: 'Alerts',
                        count: 1,
                        entries: [
                          'Bridging the gap between engineering excellence... ',
                        ],
                        color: 'text-warning',
                        bg: 'bg-warning',
                        icon: <AlertCircle className="w-3 h-3 text-warning" />,
                      },
                      {
                        title: 'Major Incident Management',
                        subtitle: 'MIM',
                        count: 0,
                        entries: [],
                        color: 'text-secondary',
                        bg: 'bg-secondary',
                        icon: <Activity className="w-3 h-3 text-secondary" />,
                      },
                    ].map((section, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                        className="rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="p-3 border-b border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center border border-border bg-background shadow-sm`}
                            >
                              {section.icon}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black tracking-tight">
                                {section.title}
                              </span>
                              <span className="text-[8px] text-muted-foreground uppercase font-semibold">
                                {section.subtitle}{' '}
                                <span className="lowercase normal-case pl-1">
                                  {section.count} entries
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-[8px] font-bold shadow-sm flex items-center gap-1 cursor-pointer">
                            <div className="w-2 h-2 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                              +
                            </div>{' '}
                            Add Entry
                          </div>
                        </div>
                        <div className="flex-1 p-3 flex flex-col gap-2 overflow-hidden items-stretch">
                          {section.entries.length > 0 ? (
                            section.entries.map((ent, j) => (
                              <div
                                key={j}
                                className="p-2.5 rounded-xl border border-border bg-background shadow-sm hover:border-primary/40 transition-colors flex flex-col gap-1.5 items-start"
                              >
                                <div className="flex items-center gap-1.5 w-full">
                                  {ent.includes('CHG') && (
                                    <span className="text-warning text-[10px]">
                                      ★
                                    </span>
                                  )}
                                  <span className="text-[10px] font-black tracking-tight truncate flex-1">
                                    {ent}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[7.5px] font-bold px-1.5 py-0.5 text-muted-foreground rounded-md border border-border bg-muted/30">
                                    KMS
                                  </span>
                                  <div
                                    className={`flex items-center gap-1 text-[7.5px] px-1.5 py-0.5 rounded-md font-bold text-warning border border-warning/20 bg-warning/10`}
                                  >
                                    <div
                                      className={`w-1.5 h-1.5 rounded-full bg-warning`}
                                    />
                                    {ent.includes('CHG')
                                      ? 'In Progress'
                                      : 'Pending Approval'}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                              <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center mb-2">
                                <Shield className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <span className="text-[10px] font-black text-foreground">
                                No entries yet
                              </span>
                              <span className="text-[8px] font-medium text-muted-foreground mt-0.5">
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
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
            <div className="md:w-1/2 space-y-8">
              <div className="w-20 h-20 rounded-[1.5rem] bg-secondary/20 flex items-center justify-center text-secondary-foreground shadow-sm ring-1 ring-border relative overflow-hidden group mb-6">
                <Link2 className="w-10 h-10 relative z-10" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                  Link Manager.
                  <br />
                  <span className="text-muted-foreground font-medium md:text-4xl">
                    The team brain.
                  </span>
                </h3>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                  Stop asking "Where is the confluence page for that?". The Link
                  Manager centralizes every URL your team needs, categorized,
                  searchable, and shared.
                </p>
              </div>
              <ul className="space-y-4 pt-4">
                {[
                  {
                    title: 'Centralized Repository',
                    desc: 'One place for all team knowledge',
                  },
                  {
                    title: 'Smart Categorization',
                    desc: 'Tag and filter resources instantly',
                  },
                  {
                    title: 'One-Click Access',
                    desc: 'Launch tools directly from the dashboard',
                  },
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary-foreground shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-sm">
                        {feat.title}
                      </span>
                      <p className="text-sm text-muted-foreground font-medium">
                        {feat.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:w-1/2 w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: '-100px' }}
                transition={{ duration: 0.8 }}
                className="rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group h-[450px] flex flex-col"
              >
                {/* Subtle Pattern Background */}
                <div className="absolute inset-0 bg-[url('/patterns/amex-1.png')] bg-cover opacity-[0.03] pointer-events-none" />

                {/* Mock Browser Header */}
                <div className="bg-muted/30 border-b border-border p-3 flex items-center justify-between relative z-10">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                  </div>
                </div>

                <div className="p-5 relative z-10 flex flex-col h-full bg-muted/5 overflow-hidden">
                  <div className="flex flex-col mb-4 bg-background p-4 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center gap-2 text-[8px] font-bold text-muted-foreground tracking-widest uppercase mb-1">
                      <span className="text-primary">Link Manager</span> / ALL
                      RESOURCES
                    </div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-xl text-foreground tracking-tight">
                        Link Manager
                      </h4>
                      <div className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shadow-sm flex items-center gap-1 cursor-pointer">
                        + Add Link
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1">
                      Central team repository for bookmarks & tools
                    </p>
                  </div>

                  {/* Top Stats */}
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {[
                      {
                        val: '13',
                        label: 'Total Resources',
                        icon: <Layers className="w-4 h-4 text-primary" />,
                        iconBg: 'bg-primary/10',
                        border: 'border-primary/20',
                      },
                      {
                        val: '7',
                        label: 'Public Access',
                        icon: <Shield className="w-4 h-4 text-success" />,
                        iconBg: 'bg-success/10',
                        border: 'border-success/20',
                      },
                      {
                        val: '6',
                        label: 'Team Restricted',
                        icon: <Shield className="w-4 h-4 text-warning" />,
                        iconBg: 'bg-warning/10',
                        border: 'border-warning/20',
                      },
                      {
                        val: '1',
                        label: 'Total Insights',
                        icon: <Activity className="w-4 h-4 text-secondary" />,
                        iconBg: 'bg-secondary/10',
                        border: 'border-secondary/20',
                      },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: -5 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        className={`p-3 rounded-2xl border ${stat.border} bg-card shadow-sm flex items-center gap-3 relative overflow-hidden group`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${stat.iconBg}`}
                        >
                          {stat.icon}
                        </div>
                        <div className="flex flex-col">
                          <div className="text-lg font-black text-primary leading-none tracking-tight group-hover:scale-105 transition-transform origin-left">
                            {stat.val}
                          </div>
                          <div className="text-[7.5px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            {stat.label}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-2 gap-3 flex-1 overflow-hidden pr-1">
                    {[
                      {
                        title: 'Monitoring Dashboard',
                        type: 'Private',
                        tags: [],
                        global: true,
                      },
                      {
                        title: 'Internal Docs',
                        type: 'Private',
                        tags: [],
                        global: true,
                      },
                      {
                        title: 'Engineering Docs',
                        type: 'Public',
                        tags: ['#docs', '#eng'],
                        global: false,
                        app: 'KMS',
                      },
                      {
                        title: 'Grafana',
                        type: 'Public',
                        tags: [],
                        global: false,
                        app: 'KMS',
                      },
                    ].map((card, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                        className="rounded-2xl border border-border bg-card shadow-sm p-4 flex flex-col group hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
                      >
                        <div className="text-[8px] text-muted-foreground flex items-center gap-1 mb-2 font-bold tracking-wide">
                          <Layers className="w-3 h-3 text-primary" />{' '}
                          {card.global ? 'Global' : card.app}{' '}
                          <span className="opacity-50">•</span>{' '}
                          {card.global ? 'Uncategorized' : 'Documentation'}
                        </div>
                        <h5 className="font-black text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">
                          {card.title}
                        </h5>
                        <p className="text-[9px] text-muted-foreground/80 mt-1 mb-3 leading-relaxed font-medium">
                          Information resource shared by the team for
                          operational enablement.
                        </p>
                        <div className="flex gap-1.5 mb-auto">
                          <span
                            className={`text-[8px] px-2 py-0.5 rounded-md border font-bold flex items-center gap-1 ${card.type === 'Public' ? 'bg-success/10 border-success/20 text-success' : 'bg-warning/10 border-warning/20 text-warning'}`}
                          >
                            {card.type === 'Public' ? (
                              <Activity className="w-2 h-2" />
                            ) : (
                              <Shield className="w-2 h-2" />
                            )}{' '}
                            {card.type}
                          </span>
                          {card.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[8px] px-2 py-0.5 rounded-md border border-border bg-muted/20 font-bold text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                          <div className="text-[9px] font-bold text-muted-foreground flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-primary/70" /> 0
                            Insights
                          </div>
                          <span className="text-[9px] font-black border border-border px-2.5 py-1 rounded-lg shadow-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors flex items-center gap-1">
                            Open Resource <ArrowRight className="w-2.5 h-2.5" />
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
          <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-24">
            <div className="md:w-1/2 space-y-8">
              <div className="w-20 h-20 rounded-[1.5rem] bg-card flex items-center justify-center text-foreground shadow-sm ring-1 ring-border relative overflow-hidden group mb-6">
                <Layers className="w-10 h-10 relative z-10" />
              </div>
              <div className="space-y-4">
                <h3 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
                  EnvMatrix.
                  <br />
                  <span className="text-muted-foreground font-medium md:text-4xl">
                    Total Inventory.
                  </span>
                </h3>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
                  Maintain a precise matrix of every server, database, and
                  microservice across DEV, UAT, and PROD environments. Golden
                  source of truth.
                </p>
              </div>
              <ul className="space-y-4 pt-4">
                {[
                  {
                    title: 'Full-Stack Inventory',
                    desc: 'Databases, APIs, caching layers, and more',
                  },
                  {
                    title: 'Status Monitoring',
                    desc: 'Live health checks for each component',
                  },
                  {
                    title: 'Dependency Mapping',
                    desc: 'Visualize connections between services',
                  },
                ].map((feat, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center text-foreground shrink-0 shadow-sm">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-sm">
                        {feat.title}
                      </span>
                      <p className="text-sm text-muted-foreground font-medium">
                        {feat.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:w-1/2 w-full">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ margin: '-100px' }}
                transition={{ duration: 0.8 }}
                className="rounded-3xl bg-card border border-border shadow-2xl relative overflow-hidden group h-[450px] flex flex-col"
              >
                {/* Subtle Pattern Background */}
                <div className="absolute inset-0 bg-[url('/patterns/amex-1.png')] bg-cover opacity-[0.03] pointer-events-none" />

                <div className="bg-muted/30 border-b border-border p-4 flex gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground relative z-10">
                  <div className="flex-[2]">Service Name</div>
                  <div className="flex-1 text-center">Env</div>
                  <div className="flex-1 text-right">Status</div>
                </div>

                <div className="relative z-10 flex-1 overflow-hidden flex flex-col justify-center p-2">
                  {[
                    {
                      name: 'Auth Service API',
                      type: 'Microservice',
                      env: 'PROD',
                      status: 'Healthy',
                    },
                    {
                      name: 'Payment Gateway',
                      type: 'External API',
                      env: 'PROD',
                      status: 'Healthy',
                    },
                    {
                      name: 'Redis Cache',
                      type: 'Database',
                      env: 'PROD',
                      status: 'Degraded',
                    },
                    {
                      name: 'User Profile DB',
                      type: 'Postgres',
                      env: 'UAT',
                      status: 'Healthy',
                    },
                    {
                      name: 'Notification Svc',
                      type: 'Lambda',
                      env: 'DEV',
                      status: 'Offline',
                    },
                  ].map((svc, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                      className="p-4 border-b border-border/50 last:border-0 flex items-center justify-between gap-4 bg-background hover:bg-muted/10 transition-colors mx-2 rounded-xl my-1 shadow-sm border group"
                    >
                      <div className="flex-[2] min-w-0">
                        <div className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                          {svc.name}
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground mt-0.5">
                          {svc.type}
                        </div>
                      </div>
                      <div className="flex-1 flex justify-center">
                        <span className="px-2 py-1 rounded-md text-[9px] font-black bg-muted border border-border/50 shadow-sm">
                          {svc.env}
                        </span>
                      </div>
                      <div className="flex-1 flex justify-end">
                        <div
                          className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${svc.status === 'Healthy' ? 'text-success' : svc.status === 'Degraded' ? 'text-warning' : svc.status === 'Offline' ? 'text-destructive' : 'text-primary'}`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full shadow-sm ${svc.status === 'Healthy' ? 'bg-success shadow-success/50 animate-pulse' : svc.status === 'Degraded' ? 'bg-warning shadow-warning/50' : 'bg-destructive shadow-destructive/50'}`}
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
      <footer className="border-t border-border/20 py-12 bg-background relative z-10">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row justify-between items-center opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-xs text-muted-foreground w-full md:w-auto text-center md:text-left">
            &copy; {new Date().getFullYear()} American Express. <br />
            Built for internal excellence. Use responsibly.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <span className="text-xs font-medium cursor-pointer hover:text-primary">
              Policy
            </span>
            <span className="text-xs font-medium cursor-pointer hover:text-primary">
              Support
            </span>
            <span className="text-xs font-medium cursor-pointer hover:text-primary">
              Status
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
