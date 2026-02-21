import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  LayoutDashboard,
  Link2,
  RefreshCcw,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface HeroSectionProps {
  session: { user: any } | null
  scorecardHref: string
  turnoverHref: string
  linkManagerHref: string
}

export function HeroSection({
  session: _session,
  scorecardHref,
  turnoverHref,
  linkManagerHref,
}: HeroSectionProps) {
  const activeTabList = [
    { name: 'Turnover', icon: RefreshCcw, color: 'text-primary' },
    { name: 'Scorecard', icon: LayoutDashboard, color: 'text-primary' },
    { name: 'Link Manager', icon: Link2, color: 'text-primary' },
  ]
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % activeTabList.length)
    }, 4000) // 4 seconds interval to comfortably read content
    return () => clearInterval(interval)
  }, [activeTabList.length])

  const toolContents = [
    {
      // TURNOVER
      title: 'Manage Shift Operations',
      subtitle: 'Live Turnover Integration',
      badge: 'Connected',
      badgeColor: 'text-success',
      badgeBg: 'bg-success/20',
      badgeRing: 'ring-success/30',
      badgeDot: 'bg-success',
      ui: (
        <div className="mt-8 space-y-4">
          <div className="w-full flex gap-4">
            <div className="flex-1 h-20 rounded-2xl bg-muted/50 border border-border p-4 flex flex-col justify-between">
              <div className="w-1/2 h-2 rounded bg-muted-foreground/30" />
              <div className="w-3/4 h-2 rounded bg-muted-foreground/20" />
            </div>
            <div className="flex-1 h-20 rounded-2xl bg-muted/50 border border-border p-4 flex flex-col justify-between">
              <div className="w-1/3 h-2 rounded bg-muted-foreground/30" />
              <div className="w-5/6 h-2 rounded bg-muted-foreground/20" />
            </div>
          </div>
          <div className="w-[80%] h-24 rounded-2xl bg-primary/5 border border-primary/20 p-4 border-l-4 border-l-primary flex flex-col justify-between">
            <div className="w-1/4 h-3 rounded bg-primary/40" />
            <div className="w-full h-2 rounded bg-muted-foreground/20" />
            <div className="w-4/5 h-2 rounded bg-muted-foreground/20" />
          </div>
        </div>
      ),
      circleValue: '0',
      circleLabel: 'Dropped\nIncidents',
    },
    {
      // SCORECARD
      title: 'Real-time Telemetry & Health',
      subtitle: 'System Reliability',
      badge: 'Live Metrics',
      badgeColor: 'text-primary',
      badgeBg: 'bg-primary/20',
      badgeRing: 'ring-primary/30',
      badgeDot: 'bg-primary',
      ui: (
        <div className="mt-8 h-[180px] w-full relative">
          <div className="absolute inset-0 border-b border-l border-border/50" />
          <div className="absolute bottom-0 left-[10%] w-[15%] h-[40%] bg-primary/20 rounded-t-lg" />
          <div className="absolute bottom-0 left-[35%] w-[15%] h-[70%] bg-primary/40 rounded-t-lg" />
          <div className="absolute bottom-0 left-[60%] w-[15%] h-[50%] bg-primary/30 rounded-t-lg" />
          <div className="absolute bottom-0 left-[85%] w-[15%] h-[90%] bg-primary/60 rounded-t-lg border-t-2 border-primary" />

          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 500 200"
            preserveAspectRatio="none"
          >
            <path
              d="M0,150 C100,150 150,80 250,90 C350,100 400,20 500,30"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-primary drop-shadow-md"
            />
            <circle cx="500" cy="30" r="6" className="fill-primary" />
          </svg>
        </div>
      ),
      circleValue: '99.9',
      circleSymbol: '%',
      circleLabel: 'Overall\nUptime',
    },
    {
      // LINK MANAGER
      title: 'Centralize Team Knowledge',
      subtitle: 'Quick Access Links',
      badge: 'Synced',
      badgeColor: 'text-blue-500',
      badgeBg: 'bg-blue-500/20',
      badgeRing: 'ring-blue-500/30',
      badgeDot: 'bg-blue-500',
      ui: (
        <div className="mt-8 grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-muted/30 border border-border p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-2 rounded bg-muted-foreground/40" />
                <div className="w-1/2 h-2 rounded bg-muted-foreground/20" />
              </div>
            </div>
          ))}
        </div>
      ),
      circleValue: '2K',
      circleSymbol: '+',
      circleLabel: 'Managed\nLinks',
    },
  ]

  const currentTool = toolContents[activeTab]

  return (
    <div className="relative bg-background font-sans overflow-hidden">
      {/* Absolute background amex-1 pattern for overall container */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `url('/patterns/amex-1.png')`,
          backgroundSize: '1000px',
          backgroundPosition: 'center',
          maskImage: 'linear-gradient(to bottom, black 20%, transparent 80%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, black 20%, transparent 80%)',
        }}
      />

      {/* Main Container - Two column split layout */}
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-[1400px] pt-12 md:pt-16 lg:pt-20 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full h-full min-h-[600px]">
          {/* LEFT COLUMN: Visual/App Mockup uses shadcn/theme colors + AmEx Pattern */}
          <div className="relative bg-primary rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col h-full ring-1 ring-border">
            {/* Amex Pattern embedded on the left card (Matches overlay of the 100% efficiency card) */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `url('/patterns/amex-1.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                mixBlendMode: 'color-dodge',
              }}
            />

            <div className="p-8 md:p-12 relative z-10 flex flex-col h-full">
              {/* Dynamic Tabs - App Tools */}
              <div className="flex gap-3 mb-6 relative z-20">
                {activeTabList.map((tab, idx) => {
                  const Icon = tab.icon
                  return (
                    <div
                      key={idx}
                      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-500 shadow-sm cursor-pointer flex items-center gap-2 relative ${
                        activeTab === idx
                          ? 'bg-background text-primary scale-105 shadow-md'
                          : 'bg-primary-foreground/10 text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground border-transparent'
                      }`}
                      onClick={() => setActiveTab(idx)}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.name}
                    </div>
                  )
                })}
              </div>

              {/* Massive overlapping App UI mockups */}
              <div className="relative flex-1 mt-auto w-full pt-4">
                {/* Back Mockup Frame */}
                <div className="absolute bottom-0 left-0 w-[115%] h-[450px] bg-background rounded-t-[2.5rem] shadow-2xl border-t border-l border-r border-border p-10 transform origin-bottom-left overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="w-full h-full"
                    >
                      <div className="flex justify-between items-start w-full">
                        <div>
                          <p className="text-primary text-sm font-bold mb-1 tracking-wider uppercase">
                            {currentTool.subtitle}
                          </p>
                          <h3 className="text-3xl font-black text-foreground max-w-sm leading-tight">
                            {currentTool.title}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <div
                            className={`px-4 py-1.5 rounded-full ${currentTool.badgeBg} ${currentTool.badgeColor} text-xs font-bold ring-1 ${currentTool.badgeRing} flex items-center gap-1.5`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${currentTool.badgeDot} animate-pulse`}
                            />{' '}
                            {currentTool.badge}
                          </div>
                        </div>
                      </div>

                      {currentTool.ui}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Floating Progress Chart Card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ x: -20, y: 20, opacity: 0, scale: 0.9 }}
                    animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      transition: { duration: 0.2 },
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="absolute -left-6 bottom-16 w-44 h-44 bg-card rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] dark:shadow-black/60 p-6 flex flex-col items-center justify-center border border-border z-30"
                  >
                    <div className="relative w-24 h-24">
                      <svg
                        className="w-full h-full -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="12"
                          className="text-muted"
                        />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="12"
                          className="text-primary"
                          strokeLinecap="round"
                          strokeDasharray="251.2"
                          initial={{ strokeDashoffset: 251.2 }}
                          animate={{ strokeDashoffset: 25.12 }} // ~90% filled roughly for effect across all
                          transition={{
                            duration: 1.5,
                            delay: 0.4,
                            ease: 'easeOut',
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="flex items-baseline gap-[1px]">
                          <span className="text-2xl font-black text-primary">
                            {currentTool.circleValue}
                          </span>
                          {currentTool.circleSymbol && (
                            <span className="text-sm font-bold text-primary">
                              {currentTool.circleSymbol}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground text-center mt-3 leading-tight uppercase whitespace-pre-line">
                      {currentTool.circleLabel}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Content & Call to Action */}
          <div className="relative bg-card rounded-[2.5rem] p-8 md:p-14 flex flex-col shadow-sm ring-1 ring-border overflow-hidden">
            {/* Wavy thin line decorative background - subtle stroke using pure theme colors */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
            >
              <path
                d="M-100,800 C300,700 400,200 1100,100"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-foreground"
              />
              <path
                d="M-100,900 C150,850 600,600 800,-100"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-foreground"
              />
            </svg>

            <div className="relative z-10 flex-1 flex flex-col">
              {/* Headline */}
              <h1 className="text-5xl md:text-7xl font-medium tracking-tight text-foreground leading-[1.05] mt-4 mb-8">
                Unlock a world of <br />
                <span className="font-bold relative">
                  seamless operations
                  <div className="absolute -bottom-2 left-0 w-full h-2 bg-primary/20 rounded-full" />
                </span>
              </h1>

              <p className="text-lg text-muted-foreground font-medium max-w-md mb-10 leading-relaxed">
                Streamline incidents and experience the future of shift
                turnovers. Centralize metrics, eliminate handoff errors, and
                embrace reliability like never before.
              </p>

              {/* Actions */}
              <div className="flex flex-wrap gap-4 mb-auto">
                <Link
                  to="/teams/register"
                  className="px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-bold text-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 flex items-center gap-2 group"
                >
                  Join Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="https://ensemble-docs.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-8 py-3.5 bg-secondary text-secondary-foreground rounded-full font-bold text-lg hover:bg-secondary/80 transition-all cursor-pointer flex items-center gap-2 border border-border"
                >
                  <BookOpen className="w-5 h-5" />
                  Documentation
                </a>
              </div>

              {/* Bottom right metrics square (Tied to Ensemble Tools) */}
              <div className="self-end mt-12 w-full max-w-[280px] aspect-square rounded-[2rem] bg-primary p-8 shadow-[0_10px_30px_rgba(0,111,207,0.3)] flex flex-col justify-between text-primary-foreground relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors duration-500" />

                {/* Overlay pattern */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `url('/patterns/amex-1.png')`,
                    backgroundSize: '400px',
                    backgroundPosition: 'bottom right',
                    mixBlendMode: 'color-dodge',
                  }}
                />

                <div className="relative z-10">
                  <p className="text-lg font-bold leading-tight opacity-90 max-w-[180px]">
                    Automated Turnover Efficiency
                  </p>
                </div>
                <div className="relative z-10 flex items-baseline gap-1 mt-auto">
                  <span className="text-7xl font-black tracking-tighter">
                    100
                  </span>
                  <span className="text-2xl font-bold opacity-80">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
