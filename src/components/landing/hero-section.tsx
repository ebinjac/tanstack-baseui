import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  LayoutDashboard,
  Link2,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  linkManagerHref: string;
  scorecardHref: string;
  session: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
      adsId: string;
    };
  } | null;
  turnoverHref: string;
}

const ACTIVE_TAB_LIST = [
  { name: "Turnover", icon: RefreshCcw, color: "text-primary" },
  { name: "Scorecard", icon: LayoutDashboard, color: "text-primary" },
  { name: "Link Manager", icon: Link2, color: "text-primary" },
];

const TOOL_CONTENTS = [
  {
    // TURNOVER
    title: "Manage Shift Operations",
    subtitle: "Live Turnover Integration",
    badge: "Connected",
    badgeColor: "text-success",
    badgeBg: "bg-success/20",
    badgeRing: "ring-success/30",
    badgeDot: "bg-success",
    ui: (
      <div className="mt-8 space-y-4">
        <div className="flex w-full gap-4">
          <div className="flex h-20 flex-1 flex-col justify-between rounded-2xl border border-border bg-muted/50 p-4">
            <div className="h-2 w-1/2 rounded bg-muted-foreground/30" />
            <div className="h-2 w-3/4 rounded bg-muted-foreground/20" />
          </div>
          <div className="flex h-20 flex-1 flex-col justify-between rounded-2xl border border-border bg-muted/50 p-4">
            <div className="h-2 w-1/3 rounded bg-muted-foreground/30" />
            <div className="h-2 w-5/6 rounded bg-muted-foreground/20" />
          </div>
        </div>
        <div className="flex h-24 w-[80%] flex-col justify-between rounded-2xl border border-primary/20 border-l-4 border-l-primary bg-primary/5 p-4">
          <div className="h-3 w-1/4 rounded bg-primary/40" />
          <div className="h-2 w-full rounded bg-muted-foreground/20" />
          <div className="h-2 w-4/5 rounded bg-muted-foreground/20" />
        </div>
      </div>
    ),
    circleValue: "0",
    circleLabel: "Dropped\nIncidents",
  },
  {
    // SCORECARD
    title: "Real-time Telemetry & Health",
    subtitle: "System Reliability",
    badge: "Live Metrics",
    badgeColor: "text-primary",
    badgeBg: "bg-primary/20",
    badgeRing: "ring-primary/30",
    badgeDot: "bg-primary",
    ui: (
      <div className="relative mt-8 h-[180px] w-full">
        <div className="absolute inset-0 border-border/50 border-b border-l" />
        <div className="absolute bottom-0 left-[10%] h-[40%] w-[15%] rounded-t-lg bg-primary/20" />
        <div className="absolute bottom-0 left-[35%] h-[70%] w-[15%] rounded-t-lg bg-primary/40" />
        <div className="absolute bottom-0 left-[60%] h-[50%] w-[15%] rounded-t-lg bg-primary/30" />
        <div className="absolute bottom-0 left-[85%] h-[90%] w-[15%] rounded-t-lg border-primary border-t-2 bg-primary/60" />

        <svg
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 500 200"
        >
          <title>Reliability Metrics Graph</title>
          <path
            className="text-primary drop-shadow-md"
            d="M0,150 C100,150 150,80 250,90 C350,100 400,20 500,30"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />
          <circle className="fill-primary" cx="500" cy="30" r="6" />
        </svg>
      </div>
    ),
    circleValue: "99.9",
    circleSymbol: "%",
    circleLabel: "Overall\nUptime",
  },
  {
    // LINK MANAGER
    title: "Centralize Team Knowledge",
    subtitle: "Quick Access Links",
    badge: "Synced",
    badgeColor: "text-blue-500",
    badgeBg: "bg-blue-500/20",
    badgeRing: "ring-blue-500/30",
    badgeDot: "bg-blue-500",
    ui: (
      <div className="mt-8 grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            className="flex h-16 items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3"
            key={i}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-2 w-3/4 rounded bg-muted-foreground/40" />
              <div className="h-2 w-1/2 rounded bg-muted-foreground/20" />
            </div>
          </div>
        ))}
      </div>
    ),
    circleValue: "2K",
    circleSymbol: "+",
    circleLabel: "Managed\nLinks",
  },
];

export function HeroSection({
  session: _session,
  scorecardHref: _scorecardHref,
  turnoverHref: _turnoverHref,
  linkManagerHref: _linkManagerHref,
}: HeroSectionProps) {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % ACTIVE_TAB_LIST.length);
    }, 4000); // 4 seconds interval to comfortably read content
    return () => clearInterval(interval);
  }, []);

  const currentTool = TOOL_CONTENTS[activeTab];

  return (
    <div className="relative overflow-hidden bg-background font-sans">
      {/* Absolute background amex-1 pattern for overall container */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `url('/patterns/amex-1.png')`,
          backgroundSize: "1000px",
          backgroundPosition: "center",
          maskImage: "linear-gradient(to bottom, black 20%, transparent 80%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 20%, transparent 80%)",
        }}
      />

      {/* Main Container - Two column split layout */}
      <main className="container relative z-10 mx-auto w-full max-w-[1400px] px-4 py-6 pt-12 md:py-8 md:pt-16 lg:pt-20">
        <div className="grid h-full min-h-[600px] w-full grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT COLUMN: Visual/App Mockup uses shadcn/theme colors + AmEx Pattern */}
          <div className="relative flex h-full flex-col overflow-hidden rounded-[2.5rem] bg-primary shadow-sm ring-1 ring-border">
            {/* Amex Pattern embedded on the left card (Matches overlay of the 100% efficiency card) */}
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url('/patterns/amex-3.avif')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                mixBlendMode: "color-dodge",
              }}
            />

            <div className="relative z-10 flex h-full flex-col p-8 md:p-12">
              {/* Dynamic Tabs - App Tools */}
              <div className="relative z-20 mb-6 flex gap-3">
                {ACTIVE_TAB_LIST.map((tab, idx) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === idx;
                  return (
                    <button
                      className={`relative flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-sm shadow-sm transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-background focus:ring-offset-2 focus:ring-offset-primary ${
                        isActive
                          ? "scale-105 bg-background text-primary shadow-md"
                          : "border-transparent bg-primary-foreground/10 text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground"
                      }`}
                      key={tab.name}
                      onClick={() => setActiveTab(idx)}
                      type="button"
                    >
                      <Icon className="h-4 w-4" />
                      {tab.name}
                    </button>
                  );
                })}
              </div>

              {/* Massive overlapping App UI mockups */}
              <div className="relative mt-auto w-full flex-1 pt-4">
                {/* Back Mockup Frame */}
                <div className="absolute bottom-0 left-0 h-[450px] w-[115%] origin-bottom-left transform overflow-hidden rounded-t-[2.5rem] border-border border-t border-r border-l bg-background p-10 shadow-2xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      animate={{ y: 0, opacity: 1 }}
                      className="h-full w-full"
                      exit={{ y: -20, opacity: 0 }}
                      initial={{ y: 20, opacity: 0 }}
                      key={activeTab}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex w-full items-start justify-between">
                        <div>
                          <p className="mb-1 font-bold text-primary text-sm uppercase tracking-wider">
                            {currentTool.subtitle}
                          </p>
                          <h3 className="max-w-sm font-black text-3xl text-foreground leading-tight">
                            {currentTool.title}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <div
                            className={cn(
                              "flex items-center gap-1.5 rounded-full px-4 py-1.5 font-bold text-xs ring-1",
                              currentTool.badgeBg,
                              currentTool.badgeColor,
                              currentTool.badgeRing
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 animate-pulse rounded-full",
                                currentTool.badgeDot
                              )}
                            />{" "}
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
                    animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    className="absolute bottom-16 -left-6 z-30 flex h-44 w-44 flex-col items-center justify-center rounded-[2rem] border border-border bg-card p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] dark:shadow-black/60"
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      transition: { duration: 0.2 },
                    }}
                    initial={{ x: -20, y: 20, opacity: 0, scale: 0.9 }}
                    key={activeTab}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="relative h-24 w-24">
                      <svg
                        className="h-full w-full -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        <title>Tool efficiency progress</title>
                        <circle
                          className="text-muted"
                          cx="50"
                          cy="50"
                          fill="none"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="12"
                        />
                        <motion.circle
                          animate={{ strokeDashoffset: 25.12 }}
                          className="text-primary"
                          cx="50"
                          cy="50"
                          fill="none"
                          initial={{ strokeDashoffset: 251.2 }}
                          r="40"
                          stroke="currentColor"
                          strokeDasharray="251.2"
                          strokeLinecap="round"
                          strokeWidth="12" // ~90% filled roughly for effect across all
                          transition={{
                            duration: 1.5,
                            delay: 0.4,
                            ease: "easeOut",
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="flex items-baseline gap-[1px]">
                          <span className="font-black text-2xl text-primary">
                            {currentTool.circleValue}
                          </span>
                          {currentTool.circleSymbol && (
                            <span className="font-bold text-primary text-sm">
                              {currentTool.circleSymbol}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="mt-3 whitespace-pre-line text-center font-bold text-[10px] text-muted-foreground uppercase leading-tight">
                      {currentTool.circleLabel}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Content & Call to Action */}
          <div className="relative flex flex-col overflow-hidden rounded-[2.5rem] bg-card p-8 shadow-sm ring-1 ring-border md:p-14">
            {/* Wavy thin line decorative background - subtle stroke using pure theme colors */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.03] dark:opacity-[0.05]"
              preserveAspectRatio="none"
              viewBox="0 0 1000 1000"
            >
              <path
                className="text-foreground"
                d="M-100,800 C300,700 400,200 1100,100"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
              />
              <path
                className="text-foreground"
                d="M-100,900 C150,850 600,600 800,-100"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
              />
            </svg>

            <div className="relative z-10 flex flex-1 flex-col">
              {/* Headline */}
              <h1 className="mt-4 mb-8 font-medium text-5xl text-foreground leading-[1.05] tracking-tight md:text-7xl">
                Unlock a world of <br />
                <span className="relative font-bold">
                  seamless operations
                  <div className="absolute -bottom-2 left-0 h-2 w-full rounded-full bg-primary/20" />
                </span>
              </h1>

              <p className="mb-10 max-w-md font-medium text-lg text-muted-foreground leading-relaxed">
                Streamline incidents and experience the future of shift
                turnovers. Centralize metrics, eliminate handoff errors, and
                embrace reliability like never before.
              </p>

              {/* Actions */}
              <div className="mb-auto flex flex-wrap gap-4">
                <Link
                  className="group flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 font-bold text-lg text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-primary/30"
                  to="/teams/register"
                >
                  Join Now
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-secondary px-8 py-3.5 font-bold text-lg text-secondary-foreground transition-all hover:bg-secondary/80"
                  href="https://ensemble-docs.com"
                  rel="noreferrer"
                  target="_blank"
                >
                  <BookOpen className="h-5 w-5" />
                  Documentation
                </a>
              </div>

              {/* Bottom right metrics square (Tied to Ensemble Tools) */}
              <div className="group relative mt-12 flex aspect-square w-full max-w-[280px] flex-col justify-between self-end overflow-hidden rounded-[2rem] bg-primary p-8 text-primary-foreground shadow-[0_10px_30px_rgba(0,111,207,0.3)]">
                <div className="absolute inset-0 bg-white/5 transition-colors duration-500 group-hover:bg-transparent" />

                {/* Overlay pattern */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `url('/patterns/amex-1.png')`,
                    backgroundSize: "400px",
                    backgroundPosition: "bottom right",
                    mixBlendMode: "color-dodge",
                  }}
                />

                <div className="relative z-10">
                  <p className="max-w-[180px] font-bold text-lg leading-tight opacity-90">
                    Turnover Efficiency
                  </p>
                </div>
                <div className="relative z-10 mt-auto flex items-baseline gap-1">
                  <span className="font-black text-7xl tracking-tighter">
                    100
                  </span>
                  <span className="font-bold text-2xl opacity-80">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
