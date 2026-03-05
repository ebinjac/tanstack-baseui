import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, LayoutDashboard, Link2, RefreshCcw } from "lucide-react";
import { SectionBadge } from "./section-badge";

interface ToolsBentoGridProps {
  linkManagerHref: string;
  scorecardHref: string;
  turnoverHref: string;
}

const CHART_HEIGHTS = [40, 70, 50, 90, 65, 85, 45, 60, 80];

const LINK_MANAGER_MOCK_LINKS = [
  { title: "Production AWS Console", cat: "Infrastructure" },
  { title: "Splunk Dashboard", cat: "Monitoring" },
  { title: "Service Repository", cat: "Source Code" },
];

export function ToolsBentoGrid({
  scorecardHref,
  turnoverHref,
  linkManagerHref,
}: ToolsBentoGridProps) {
  return (
    <section className="relative z-20 space-y-20 py-24">
      <motion.div
        className="relative space-y-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, margin: "-100px" }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <SectionBadge label="Core Capabilities" />
        <h2 className="font-black text-4xl text-foreground tracking-tight drop-shadow-sm md:text-6xl">
          Your Instrumental Toolkit
        </h2>
        <p className="mx-auto max-w-2xl font-medium text-muted-foreground text-xl md:text-2xl">
          Everything you need to keep operations in perfect harmony.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 lg:gap-8">
        {/* Scorecard — 7 cols */}
        <Link
          className="group col-span-1 block transform-gpu transition-all duration-300 hover:-translate-y-1 md:col-span-7"
          to={scorecardHref as string}
        >
          <div className="relative flex h-full min-h-[450px] flex-col justify-between overflow-hidden rounded-[2.5rem] bg-primary p-10 text-primary-foreground shadow-lg ring-1 ring-border">
            <div
              className="pointer-events-none absolute inset-0 opacity-20 mix-blend-color-dodge transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url('/patterns/amex-1.png')`,
                backgroundSize: "400px",
                backgroundPosition: "center right",
              }}
            />
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
            <div className="relative z-10 mt-12 h-[180px] w-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-colors duration-300 group-hover:bg-white/20">
              <div className="absolute top-10 right-0 bottom-0 left-0 flex items-end justify-between gap-2 px-6 opacity-80 transition-opacity group-hover:opacity-100">
                {CHART_HEIGHTS.map((h, i) => (
                  <div
                    className="relative h-full w-full overflow-hidden rounded-t-sm bg-white/20"
                    key={`bar-${String(h)}-${String(i)}`}
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

        {/* Turnover — 5 cols */}
        <Link
          className="group col-span-1 block transform-gpu transition-all duration-300 hover:-translate-y-1 md:col-span-5"
          to={turnoverHref as string}
        >
          <div className="relative flex h-full min-h-[450px] flex-col justify-between overflow-hidden rounded-[2.5rem] bg-card p-10 text-foreground shadow-lg ring-1 ring-border">
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

        {/* Link Manager — 12 cols */}
        <Link
          className="group relative col-span-1 block min-h-[350px] transform-gpu overflow-hidden rounded-[2.5rem] bg-card shadow-lg ring-1 ring-border transition-all duration-300 hover:-translate-y-1 md:col-span-12"
          to={linkManagerHref as string}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/5 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
          <div className="flex h-full flex-col lg:flex-row">
            {/* Text */}
            <div className="relative z-10 flex flex-col justify-center border-border/50 border-b bg-card p-10 lg:w-1/2 lg:border-r lg:border-b-0">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-secondary/20 text-secondary-foreground shadow-sm transition-colors duration-300 group-hover:bg-secondary">
                <Link2 className="h-7 w-7" />
              </div>
              <h3 className="mb-3 font-black text-3xl tracking-tight">
                Link Manager
              </h3>
              <p className="max-w-md font-medium text-lg text-muted-foreground leading-relaxed">
                Your team's central repository for documentation, dashboards,
                and critical URLs. Never lose a bookmark again with powerful
                categories and tags.
              </p>
            </div>
            {/* Mock */}
            <div className="relative flex min-h-[250px] items-center justify-center overflow-hidden bg-muted/10 p-10 lg:w-1/2">
              <div
                className="pointer-events-none absolute inset-0 transform-gpu opacity-[0.03] transition-all duration-1000 group-hover:scale-110 group-hover:opacity-[0.08] dark:opacity-[0.05]"
                style={{
                  backgroundImage: `url('/patterns/amex-1.png')`,
                  backgroundSize: "400px",
                  backgroundPosition: "center",
                }}
              />
              <div className="relative z-10 w-full max-w-sm space-y-4 transition-transform duration-500 group-hover:-translate-y-2">
                {LINK_MANAGER_MOCK_LINKS.map((item) => (
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
  );
}
