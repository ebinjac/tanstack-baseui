import { motion } from "framer-motion";
import { Activity, AlertCircle, RefreshCcw, Shield } from "lucide-react";
import { FeatureList } from "./feature-list";
import { MockBrowserFrame } from "./mock-browser-frame";

const TURNOVER_FEATURES = [
  {
    title: "Structured Handsets",
    desc: "Standardized templates for consistency",
  },
  {
    title: "Mandatory Acknowledgement",
    desc: "Ensure incoming engineers accept items",
  },
  { title: "Audit Trail", desc: "Full history of every shift transition" },
];

const TURNOVER_SECTIONS = [
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
    entries: [] as string[],
    color: "text-destructive",
    bg: "bg-destructive",
    icon: <AlertCircle className="h-3 w-3 text-destructive" />,
  },
  {
    title: "Alerts/Issues",
    subtitle: "Alerts",
    count: 1,
    entries: ["Bridging the gap between engineering excellence... "],
    color: "text-warning",
    bg: "bg-warning",
    icon: <AlertCircle className="h-3 w-3 text-warning" />,
  },
  {
    title: "Major Incident Management",
    subtitle: "MIM",
    count: 0,
    entries: [] as string[],
    color: "text-secondary",
    bg: "bg-secondary",
    icon: <Activity className="h-3 w-3 text-secondary" />,
  },
];

export function ShowcaseTurnover() {
  return (
    <div className="flex flex-col items-center gap-12 md:flex-row-reverse md:gap-24">
      {/* Copy */}
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
            A structured shift handover process that forces acknowledgment of
            critical issues. Never let a Sev-1 slip through the cracks during a
            shift change.
          </p>
        </div>
        <FeatureList
          features={TURNOVER_FEATURES}
          icon={<Shield className="h-4 w-4" />}
          iconClassName="border border-border bg-card text-foreground shadow-sm"
        />
      </div>

      {/* Mock UI */}
      <div className="w-full md:w-1/2">
        <motion.div
          initial={{ transform: "scale(0.95)", opacity: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ margin: "-100px" }}
          whileInView={{ transform: "scale(1)", opacity: 1 }}
        >
          <MockBrowserFrame className="h-[450px]">
            {/* Turnover header */}
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

            {/* Body */}
            <div className="relative z-10 flex flex-1 flex-col overflow-hidden bg-muted/10 p-4">
              {/* Critical alert banner */}
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
                    Action required: These items have been flagged for immediate
                    attention.
                  </p>
                </div>
              </motion.div>

              {/* Section cards grid */}
              <div className="grid flex-1 grid-cols-2 gap-3 overflow-hidden">
                {TURNOVER_SECTIONS.map((section, i) => (
                  <motion.div
                    className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                    initial={{ opacity: 0, scale: 0.95 }}
                    key={section.subtitle}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                  >
                    {/* Section header */}
                    <div className="flex items-center justify-between border-border/50 border-b p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm">
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

                    {/* Entries */}
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
                              <div className="flex items-center gap-1 rounded-md border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-bold text-[7.5px] text-warning">
                                <div className="h-1.5 w-1.5 rounded-full bg-warning" />
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
          </MockBrowserFrame>
        </motion.div>
      </div>
    </div>
  );
}
