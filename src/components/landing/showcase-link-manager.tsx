import { motion } from "framer-motion";
import { Activity, ArrowRight, Layers, Link2, Shield } from "lucide-react";
import { FeatureList } from "./feature-list";
import { MockBrowserFrame } from "./mock-browser-frame";

const LINK_MANAGER_FEATURES = [
  { title: "Centralized Repository", desc: "One place for all team knowledge" },
  { title: "Smart Categorization", desc: "Tag and filter resources instantly" },
  {
    title: "One-Click Access",
    desc: "Launch tools directly from the dashboard",
  },
];

const LINK_MANAGER_STATS = [
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
];

const LINK_MANAGER_CARDS = [
  {
    title: "Monitoring Dashboard",
    type: "Private",
    tags: [] as string[],
    global: true,
  },
  {
    title: "Internal Docs",
    type: "Private",
    tags: [] as string[],
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
    tags: [] as string[],
    global: false,
    app: "KMS",
  },
];

export function ShowcaseLinkManager() {
  return (
    <div className="flex flex-col items-center gap-12 md:flex-row md:gap-24">
      {/* Copy */}
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
        <FeatureList
          features={LINK_MANAGER_FEATURES}
          icon={<ArrowRight className="h-4 w-4" />}
          iconClassName="bg-secondary/10 text-secondary-foreground"
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
            <div className="relative z-10 flex h-full flex-col overflow-hidden bg-muted/5 p-5">
              {/* Header card */}
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
                  Central team repository for bookmarks &amp; tools
                </p>
              </div>

              {/* Stats row */}
              <div className="mb-5 grid grid-cols-4 gap-3">
                {LINK_MANAGER_STATS.map((stat, i) => (
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

              {/* Cards grid */}
              <div className="grid flex-1 grid-cols-2 gap-3 overflow-hidden pr-1">
                {LINK_MANAGER_CARDS.map((card, i) => (
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
                      Information resource shared by the team for operational
                      enablement.
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
          </MockBrowserFrame>
        </motion.div>
      </div>
    </div>
  );
}
