import { motion } from "framer-motion";
import { Activity, ArrowRight, LayoutDashboard } from "lucide-react";
import { FeatureList } from "./feature-list";
import { MockBrowserFrame } from "./mock-browser-frame";

const SCORECARD_FEATURES = [
  {
    title: "Real-time Availability",
    desc: "Live integration with monitoring tools",
  },
  {
    title: "Weighted Health Scoring",
    desc: "Custom algorithms for business impact",
  },
  { title: "Trend Analysis", desc: "Historical tracking of performance" },
];

const SCORECARD_STATS = [
  {
    val: "3",
    label: "APPLICATIONS",
    icon: <Activity className="h-3 w-3 text-primary" />,
    iconBg: "bg-primary/10",
  },
  {
    val: "6",
    label: "TRACKED TECH",
    icon: <span className="font-black text-secondary text-xs">#</span>,
    iconBg: "bg-secondary/10",
  },
  {
    val: "5",
    label: "AVAILABILITY",
    icon: <span className="font-black text-success text-xs">%</span>,
    iconBg: "bg-success/10",
  },
  {
    val: "0",
    label: "SLA BREACHES",
    icon: <span className="font-black text-destructive text-xs">!</span>,
    iconBg: "bg-destructive/10",
  },
];

const SCORECARD_APPS = [
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
];

export function ShowcaseScorecard() {
  return (
    <div className="flex flex-col items-center gap-12 md:flex-row md:gap-24">
      {/* Copy */}
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
            The Scorecard aggregates data from multiple monitoring sources to
            provide a single, weighted health score for your application.
            Eliminate ambiguity during leadership reviews.
          </p>
        </div>
        <FeatureList
          features={SCORECARD_FEATURES}
          icon={<Activity className="h-4 w-4" />}
          iconClassName="bg-primary/10 text-primary"
        />
      </div>

      {/* Mock UI */}
      <div className="w-full md:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          viewport={{ margin: "-100px" }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <MockBrowserFrame className="h-[450px]">
            <div className="relative z-10 flex flex-1 flex-col justify-start space-y-4 overflow-hidden bg-background p-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-foreground text-lg tracking-tight">
                    Performance Scorecard
                  </h4>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Activity className="h-3 w-3 text-primary/70" /> Tracking
                    for{" "}
                    <span className="font-bold text-foreground">
                      enterprise-security
                    </span>
                  </div>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-4 gap-2">
                {SCORECARD_STATS.map((stat, i) => (
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

              {/* App Health Table */}
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
                  {SCORECARD_APPS.map((app, i) => (
                    <motion.div
                      className="flex items-center justify-between rounded-xl border border-border bg-background p-2 transition-colors hover:bg-muted/10"
                      initial={{ opacity: 0, x: -10 }}
                      key={`${app.name}-${app.tag}`}
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
                            # 200004789 <span className="opacity-50">•</span>{" "}
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
          </MockBrowserFrame>
        </motion.div>
      </div>
    </div>
  );
}
