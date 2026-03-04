import { motion } from "framer-motion";
import { Activity, Layers } from "lucide-react";
import { FeatureList } from "./feature-list";
import { MockBrowserFrame } from "./mock-browser-frame";

const ENV_MATRIX_FEATURES = [
  {
    title: "Full-Stack Inventory",
    desc: "Databases, APIs, caching layers, and more",
  },
  { title: "Status Monitoring", desc: "Live health checks for each component" },
  {
    title: "Dependency Mapping",
    desc: "Visualize connections between services",
  },
];

type ServiceStatus = "Healthy" | "Degraded" | "Offline";

const SERVICES: {
  name: string;
  type: string;
  env: string;
  status: ServiceStatus;
}[] = [
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
  { name: "Redis Cache", type: "Database", env: "PROD", status: "Degraded" },
  { name: "User Profile DB", type: "Postgres", env: "UAT", status: "Healthy" },
  { name: "Notification Svc", type: "Lambda", env: "DEV", status: "Offline" },
];

function getStatusTextColor(status: ServiceStatus): string {
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
}

function getStatusDotClass(status: ServiceStatus): string {
  if (status === "Healthy") {
    return "animate-pulse bg-success shadow-success/50";
  }
  if (status === "Degraded") {
    return "bg-warning shadow-warning/50";
  }
  return "bg-destructive shadow-destructive/50";
}

export function ShowcaseEnvMatrix() {
  return (
    <div className="flex flex-col items-center gap-12 md:flex-row-reverse md:gap-24">
      {/* Copy */}
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
            microservice across DEV, UAT, and PROD environments. Golden source
            of truth.
          </p>
        </div>
        <FeatureList
          features={ENV_MATRIX_FEATURES}
          icon={<Activity className="h-4 w-4" />}
          iconClassName="border border-border bg-muted text-foreground shadow-sm"
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
            {/* Table header */}
            <div className="relative z-10 flex gap-4 border-border border-b bg-muted/30 p-4 font-black text-[10px] text-muted-foreground uppercase tracking-widest">
              <div className="flex-[2]">Service Name</div>
              <div className="flex-1 text-center">Env</div>
              <div className="flex-1 text-right">Status</div>
            </div>

            {/* Service rows */}
            <div className="relative z-10 flex flex-1 flex-col justify-center overflow-hidden p-2">
              {SERVICES.map((svc, i) => (
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
          </MockBrowserFrame>
        </motion.div>
      </div>
    </div>
  );
}
